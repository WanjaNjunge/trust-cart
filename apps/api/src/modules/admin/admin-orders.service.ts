import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { OrderStatus, RefundStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { InitiateRefundDto } from './dto/initiate-refund.dto';

// Valid forward transitions for admin staff. Cancellation is handled separately.
const VALID_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  [OrderStatus.PENDING_PAYMENT]: [
    OrderStatus.CONFIRMED,
    OrderStatus.PAYMENT_FAILED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.PAYMENT_FAILED]: [OrderStatus.PENDING_PAYMENT, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [
    OrderStatus.READY_FOR_PICKUP,
    OrderStatus.DISPATCHED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.READY_FOR_PICKUP]: [OrderStatus.DISPATCHED, OrderStatus.CANCELLED],
  [OrderStatus.DISPATCHED]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.DELIVERY_FAILED],
  [OrderStatus.DELIVERY_FAILED]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
  [OrderStatus.RETURN_REQUESTED]: [OrderStatus.RETURN_APPROVED, OrderStatus.RETURN_REJECTED],
  [OrderStatus.RETURN_APPROVED]: [OrderStatus.RETURN_RECEIVED],
  [OrderStatus.RETURN_RECEIVED]: [OrderStatus.REFUND_PENDING],
  [OrderStatus.REFUND_PENDING]: [OrderStatus.REFUNDED],
};

const REFUNDABLE_STATUSES: OrderStatus[] = [
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
  OrderStatus.DISPATCHED,
  OrderStatus.DELIVERED,
  OrderStatus.RETURN_RECEIVED,
];

@Injectable()
export class AdminOrdersService {
  private readonly logger = new Logger(AdminOrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('notifications') private notificationQueue: Queue,
  ) {}

  async findAll(params: { page?: number; limit?: number; status?: OrderStatus; search?: string }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: {
      status?: OrderStatus;
      orderNumber?: { contains: string; mode: 'insensitive' };
    } = {};

    if (params.status) {
      where.status = params.status;
    }
    if (params.search) {
      where.orderNumber = { contains: params.search, mode: 'insensitive' };
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          items: { select: { id: true, productName: true, quantity: true, unitPrice: true } },
          address: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customer: o.user
          ? { name: `${o.user.firstName} ${o.user.lastName}`, email: o.user.email }
          : { name: 'Guest', email: o.email },
        status: o.status,
        total: o.total,
        subtotal: o.subtotal,
        deliveryFee: o.deliveryFee,
        discount: o.discount,
        paymentMethod: o.paymentMethod,
        itemCount: o.items.length,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  async updateStatus(orderId: string, dto: UpdateOrderStatusDto, adminId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    const allowedNext = VALID_TRANSITIONS[order.status] ?? [];
    if (!allowedNext.includes(dto.status)) {
      throw new BadRequestException(
        `Invalid transition: ${order.status} → ${dto.status}. Allowed: [${allowedNext.join(', ')}]`,
      );
    }

    const previousStatus = order.status;

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: dto.status },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: previousStatus,
          toStatus: dto.status,
          changedByType: 'STAFF',
          changedById: adminId,
          reason: dto.reason,
        },
      });
    });

    await this.notificationQueue.add('order.status_changed', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      fromStatus: previousStatus,
      toStatus: dto.status,
      userId: order.userId,
      userEmail: order.email,
      reason: dto.reason,
    });

    this.logger.log(
      `Order ${order.orderNumber} status: ${previousStatus} → ${dto.status} by admin=${adminId}`,
    );

    return { orderId, orderNumber: order.orderNumber, previousStatus, newStatus: dto.status };
  }

  async initiateRefund(
    orderId: string,
    dto: InitiateRefundDto,
    adminId: string,
    adminRole: UserRole,
  ) {
    if (adminRole !== UserRole.ADMIN && adminRole !== UserRole.MANAGER) {
      throw new ForbiddenException('Only Manager+ can initiate refunds');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        transactions: {
          where: { status: 'CONFIRMED' },
          orderBy: { initiatedAt: 'desc' },
          take: 1,
        },
        refunds: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (!REFUNDABLE_STATUSES.includes(order.status)) {
      throw new BadRequestException(`Order cannot be refunded in status: ${order.status}`);
    }

    const confirmedTransaction = order.transactions[0];
    if (!confirmedTransaction) {
      throw new BadRequestException('No confirmed payment transaction found for this order');
    }

    const alreadyRefunded = order.refunds.reduce((sum, r) => sum + r.amount, 0);
    const maxRefundable = order.total - alreadyRefunded;

    if (dto.amount > maxRefundable) {
      throw new BadRequestException(
        `Refund amount (${dto.amount}) exceeds remaining refundable amount (${maxRefundable})`,
      );
    }

    const isFullRefund = dto.amount >= maxRefundable;
    const newStatus = isFullRefund ? OrderStatus.REFUNDED : OrderStatus.PARTIAL_REFUND;

    await this.prisma.$transaction(async (tx) => {
      await tx.refund.create({
        data: {
          orderId,
          transactionId: confirmedTransaction.id,
          amount: dto.amount,
          reason: dto.reason,
          status: RefundStatus.PENDING,
          approvedById: adminId,
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: { status: newStatus },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: newStatus,
          changedByType: 'STAFF',
          changedById: adminId,
          reason: `Refund initiated: ${dto.reason}`,
        },
      });
    });

    this.logger.log(
      `Refund initiated: order=${order.orderNumber} amount=${dto.amount} by admin=${adminId}`,
    );

    return {
      orderId,
      orderNumber: order.orderNumber,
      refundAmount: dto.amount,
      newStatus,
      message: 'Refund initiated successfully (PENDING stub mode)',
    };
  }
}
