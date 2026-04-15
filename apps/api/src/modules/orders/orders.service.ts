import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma';
import { CheckoutDto, PaymentMethodDto } from './dto';
import { DeliveryZone, OrderStatus, PaymentMethod, UserRole } from '@prisma/client';

// Delivery fee matrix in cents (KES)
const DELIVERY_FEES: Record<DeliveryZone, number> = {
  ZONE_1: 20000, // KES 200
  ZONE_2: 30000, // KES 300
  ZONE_3: 40000, // KES 400
  ZONE_4: 50000, // KES 500
};

// Default zone for MVP (will be calculated from address in future)
const DEFAULT_DELIVERY_ZONE = DeliveryZone.ZONE_1;

// Cancellable states for customers
const CUSTOMER_CANCELLABLE_STATES: OrderStatus[] = [
  OrderStatus.PENDING_PAYMENT,
  OrderStatus.PAYMENT_FAILED,
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
];

// Manager+ can cancel even after dispatch
const MANAGER_CANCELLABLE_STATES: OrderStatus[] = [
  ...CUSTOMER_CANCELLABLE_STATES,
  OrderStatus.READY_FOR_PICKUP,
  OrderStatus.DISPATCHED,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERY_FAILED,
];

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('notifications') private notificationQueue: Queue,
  ) { }

  /**
   * Generate unique order number in format TC-YYYY-NNNNNN
   */
  async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `TC-${year}-`;

    // Find highest order number this year
    const lastOrder = await this.prisma.order.findFirst({
      where: { orderNumber: { startsWith: prefix } },
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true },
    });

    const nextNumber = lastOrder ? parseInt(lastOrder.orderNumber.slice(-6), 10) + 1 : 1;

    return `${prefix}${nextNumber.toString().padStart(6, '0')}`;
  }

  /**
   * Calculate delivery fee based on zone
   * For MVP, zone is determined by county
   */
  calculateDeliveryFee(county: string): { zone: DeliveryZone; fee: number } {
    // Simple zone mapping for Nairobi counties
    const zoneMap: Record<string, DeliveryZone> = {
      nairobi: DeliveryZone.ZONE_1,
      westlands: DeliveryZone.ZONE_1,
      kiambu: DeliveryZone.ZONE_2,
      machakos: DeliveryZone.ZONE_3,
      kajiado: DeliveryZone.ZONE_3,
    };

    const normalizedCounty = county.toLowerCase().trim();
    const zone = zoneMap[normalizedCounty] || DEFAULT_DELIVERY_ZONE;

    return {
      zone,
      fee: DELIVERY_FEES[zone],
    };
  }

  /**
   * Create order from checkout
   * This is the main checkout flow
   */
  async createFromCheckout(
    userId: string | undefined,
    userEmail: string | undefined,
    sessionId: string | undefined,
    dto: CheckoutDto,
  ) {
    if (!userId && !sessionId) {
      throw new BadRequestException('User ID or Session ID is required');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Get user's cart with items
      const cartWhere = userId ? { userId } : { sessionId };
      const cart = await tx.cart.findFirst({
        where: cartWhere,
        include: {
          items: {
            include: {
              product: {
                include: {
                  inventoryRecord: true,
                },
              },
            },
          },
          promoCode: true,
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('Cart is empty');
      }

      // 2. Resolve Address
      let addressData: {
        recipientName: string;
        phone: string;
        line1: string;
        line2?: string | null;
        city: string;
        county: string;
      };

      if (dto.addressId === 'GUEST_ADDRESS') {
        if (!dto.guestAddress) {
          throw new BadRequestException('Guest address details required');
        }
        if (!userId && !dto.guestEmail) {
          throw new BadRequestException('Email is required for guest checkout');
        }
        addressData = dto.guestAddress;
      } else {
        if (!userId) {
          throw new BadRequestException('Login required to use saved addresses');
        }
        const savedAddress = await tx.address.findFirst({
          where: { id: dto.addressId, userId },
        });

        if (!savedAddress) {
          throw new NotFoundException('Address not found');
        }
        addressData = savedAddress;
      }

      // 3. Validate stock availability for all items
      for (const item of cart.items) {
        const inventory = item.product.inventoryRecord;
        if (!inventory) {
          throw new BadRequestException(`Product ${item.product.name} is out of stock`);
        }
        const availableStock = inventory.quantityOnHand - inventory.quantityReserved;
        if (item.quantity > availableStock) {
          throw new BadRequestException(`Insufficient stock for ${item.product.name}`);
        }
      }

      // 4. Get payment/contact details
      let contactEmail = userEmail;
      let contactPhone = addressData.phone;

      if (!userId) {
        // Guest user
        if (!dto.guestEmail) throw new BadRequestException('Guest email required');
        contactEmail = dto.guestEmail;
      } else {
        // Logged in user - ensure we have their phone if not in address
        // (Though we prioritize address phone for delivery)
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { phone: true },
        });
        if (user?.phone) {
          // We could use user phone, but delivery phone is usually preferred for the order itself
          // So we'll stick to address phone or fallback to user phone
        }
      }

      if (!contactEmail) {
        throw new BadRequestException('Contact email is required');
      }

      // 5. Generate order number
      const orderNumber = await this.generateOrderNumber();

      // 6. Calculate totals
      const subtotal = cart.items.reduce(
        (sum, item) => sum + item.quantity * item.product.price,
        0,
      );

      // Calculate discount from promo code
      let discount = 0;
      if (cart.promoCode) {
        if (cart.promoCode.discountType === 'PERCENT') {
          discount = Math.floor((subtotal * cart.promoCode.discountValue) / 100);
        } else if (cart.promoCode.discountType === 'FIXED') {
          discount = Math.min(cart.promoCode.discountValue, subtotal);
        }
      }

      // Calculate delivery fee
      const { fee: deliveryFee } = this.calculateDeliveryFee(addressData.county);

      // Calculate total
      const total = subtotal - discount + deliveryFee;

      // 7. Map payment method
      const paymentMethodMap: Record<PaymentMethodDto, PaymentMethod> = {
        [PaymentMethodDto.MPESA_STK]: PaymentMethod.MPESA_STK,
      };

      // 8. Create order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: userId || null, // Allow null for guests
          email: contactEmail,
          phone: contactPhone,
          status: OrderStatus.PENDING_PAYMENT,
          subtotal,
          deliveryFee,
          discount,
          total,
          paymentMethod: paymentMethodMap[dto.paymentMethod],
          promoCodeId: cart.promoCodeId,
          notes: dto.notes,
        },
      });

      // 9. Create order items (snapshot prices)
      for (const item of cart.items) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            productName: item.product.name,
            productSku: item.product.sku,
            quantity: item.quantity,
            unitPrice: item.product.price,
            lineTotal: item.quantity * item.product.price,
          },
        });
      }

      // 10. Create order address (snapshot)
      await tx.orderAddress.create({
        data: {
          orderId: order.id,
          recipientName: addressData.recipientName,
          phone: addressData.phone,
          line1: addressData.line1,
          line2: addressData.line2,
          city: addressData.city,
          county: addressData.county,
        },
      });

      // 11. Create initial order status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: null,
          toStatus: OrderStatus.PENDING_PAYMENT,
          changedByType: userId ? 'CUSTOMER' : 'CUSTOMER', // Distinct guest type? Or just CUSTOMER
          changedById: userId || null, // Guest has no ID
          reason: 'Order created via checkout',
        },
      });

      // 12. Convert cart reservations to order reservations
      await tx.reservation.updateMany({
        where: { cartId: cart.id, status: 'PENDING' },
        data: {
          orderId: order.id,
          cartId: null,
          status: 'CONFIRMED',
        },
      });

      // 13. Record promo usage if applicable
      if (cart.promoCode && userId) { // Only record usage for logged-in users? Or track by email?
        // Promo usage requires userId in schema (usually). Let's check schema.
        // Schema: userId String @map("user_id"). It is REQUIRED.
        // So guests cannot use promo codes that require tracking usage per user?
        // Or we just don't record the `PromoUsage` record for guests?
        // Let's skip PromoUsage creation for guests for now to avoid error.
        await tx.promoUsage.create({
          data: {
            promoCodeId: cart.promoCode.id,
            userId,
            orderId: order.id,
            discountApplied: discount,
          },
        });
      }

      // 14. Clear cart items
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      // 15. Remove promo code from cart
      await tx.cart.update({
        where: { id: cart.id },
        data: { promoCodeId: null },
      });

      // 16. Fetch complete order for response
      const completeOrder = await tx.order.findUnique({
        where: { id: order.id },
        include: {
          items: true,
          address: true,
          statusHistory: {
            orderBy: { createdAt: 'asc' },
          },
          promoCode: true,
        },
      });

      if (!completeOrder) {
        throw new Error('Order creation failed');
      }

      return this.formatOrderResponse(completeOrder);
    });
  }

  /**
   * Get order by ID (for owner or staff)
   */
  async findOne(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        address: true,
        statusHistory: {
          orderBy: { createdAt: 'asc' },
        },
        promoCode: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check ownership (staff check will be added later with role guards)
    if (order.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.formatOrderResponse(order);
  }

  /**
   * Get orders for a user
   */
  async findByUser(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        include: {
          items: true,
          address: true,
          statusHistory: {
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);

    return {
      data: orders.map((order) => this.formatOrderResponse(order)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Cancel an order
   * - Customers can cancel before DISPATCHED
   * - Manager+ can cancel even after DISPATCHED
   * - Releases inventory reservation or restores decremented stock
   */
  async cancelOrder(
    orderId: string,
    userId: string,
    userRole: UserRole,
    reason?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch order with items
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          user: { select: { email: true } },
        },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      // 2. Check ownership or staff permission
      const isOwner = order.userId === userId;
      const staffRoles: UserRole[] = [UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN];
      const managerRoles: UserRole[] = [UserRole.MANAGER, UserRole.ADMIN];
      const isStaff = staffRoles.includes(userRole);
      const isManager = managerRoles.includes(userRole);

      if (!isOwner && !isStaff) {
        throw new ForbiddenException('Access denied');
      }

      // 3. Check if order is cancellable based on role
      const allowedStates = isManager
        ? MANAGER_CANCELLABLE_STATES
        : CUSTOMER_CANCELLABLE_STATES;

      if (!allowedStates.includes(order.status)) {
        throw new BadRequestException(
          `Order in status '${order.status}' cannot be cancelled${!isManager ? '. Contact support for orders already dispatched.' : ''
          }`,
        );
      }

      // 4. Handle inventory based on previous status
      const previousStatus = order.status;

      for (const item of order.items) {
        const inventory = await tx.inventoryRecord.findUnique({
          where: { productId: item.productId },
        });

        if (inventory) {
          if (
            previousStatus === OrderStatus.PENDING_PAYMENT ||
            previousStatus === OrderStatus.PAYMENT_FAILED ||
            previousStatus === OrderStatus.CONFIRMED
          ) {
            // Release reservation
            await tx.inventoryRecord.update({
              where: { productId: item.productId },
              data: {
                quantityReserved: Math.max(
                  0,
                  inventory.quantityReserved - item.quantity,
                ),
              },
            });

            // Delete associated reservation record if exists
            await tx.reservation.deleteMany({
              where: {
                orderId: order.id,
                productId: item.productId,
              },
            });

            this.logger.log(
              `Released reservation: ${item.quantity} x ${item.productId}`,
            );
          } else if (previousStatus === OrderStatus.PROCESSING) {
            // Restore decremented stock (stock was decremented when entering PROCESSING)
            await tx.inventoryRecord.update({
              where: { productId: item.productId },
              data: {
                quantityOnHand: inventory.quantityOnHand + item.quantity,
              },
            });

            // Create stock adjustment record
            await tx.stockAdjustment.create({
              data: {
                productId: item.productId,
                type: 'RETURN',
                quantity: item.quantity,
                reason: `Order ${order.orderNumber} cancelled - stock restored`,
                adminId: userId,
              },
            });

            this.logger.log(
              `Restored stock: ${item.quantity} x ${item.productId}`,
            );
          } else {
            // For dispatched orders (Manager cancellation), restore stock
            await tx.inventoryRecord.update({
              where: { productId: item.productId },
              data: {
                quantityOnHand: inventory.quantityOnHand + item.quantity,
              },
            });

            await tx.stockAdjustment.create({
              data: {
                productId: item.productId,
                type: 'RETURN',
                quantity: item.quantity,
                reason: `Order ${order.orderNumber} cancelled by Manager - stock restored`,
                adminId: userId,
              },
            });

            this.logger.log(
              `Manager restored stock: ${item.quantity} x ${item.productId}`,
            );
          }
        }
      }

      // 5. Update order status
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });

      // 6. Create status history entry
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: previousStatus,
          toStatus: OrderStatus.CANCELLED,
          changedByType: isOwner ? 'CUSTOMER' : 'STAFF',
          changedById: userId,
          reason: reason || 'Order cancelled by user',
        },
      });

      this.logger.log(
        `Order ${order.orderNumber} cancelled: ${previousStatus} → CANCELLED`,
      );

      // 7. Queue notification
      await this.notificationQueue.add('order.status_changed', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        fromStatus: previousStatus,
        toStatus: OrderStatus.CANCELLED,
        userId: order.userId,
        userEmail: order.user?.email || order.email,
        reason,
      });

      // 8. Return updated order
      const updatedOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          address: true,
          statusHistory: {
            orderBy: { createdAt: 'asc' },
          },
          promoCode: true,
        },
      });

      if (!updatedOrder) {
        throw new Error('Order update failed');
      }

      return this.formatOrderResponse(updatedOrder);
    });
  }

  /**
   * Format order for API response
   */
  private formatOrderResponse(order: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    subtotal: number;
    deliveryFee: number;
    discount: number;
    total: number;
    paymentMethod: PaymentMethod;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    items: Array<{
      id: string;
      productId: string;
      productName: string;
      productSku: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }>;
    address: {
      recipientName: string;
      phone: string;
      line1: string;
      line2: string | null;
      city: string;
      county: string;
    } | null;
    statusHistory: Array<{
      fromStatus: OrderStatus | null;
      toStatus: OrderStatus;
      changedByType: string;
      reason: string | null;
      createdAt: Date;
    }>;
    promoCode?: { code: string } | null;
  }) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      })),
      address: order.address
        ? {
          recipientName: order.address.recipientName,
          phone: order.address.phone,
          line1: order.address.line1,
          line2: order.address.line2 || undefined,
          city: order.address.city,
          county: order.address.county,
        }
        : null,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      discount: order.discount,
      total: order.total,
      paymentMethod: order.paymentMethod,
      notes: order.notes || undefined,
      promoCode: order.promoCode?.code,
      statusHistory: order.statusHistory.map((h) => ({
        fromStatus: h.fromStatus || undefined,
        toStatus: h.toStatus,
        changedByType: h.changedByType,
        reason: h.reason || undefined,
        createdAt: h.createdAt.toISOString(),
      })),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }
}
