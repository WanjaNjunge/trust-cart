import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Prisma cannot compare two columns in where; use raw for low-stock count
    const lowStockResult = await this.prisma.$queryRaw<[{ count: bigint }]>(
      Prisma.sql`SELECT COUNT(*)::int AS count FROM inventory_records WHERE quantity_on_hand <= reorder_threshold`,
    );
    const lowStockCount = Number(lowStockResult[0]?.count ?? 0);

    const [
      totalOrderCount,
      allTimeRevenue,
      pendingOrderCount,
      totalProductCount,
      totalCustomerCount,
      newCustomerCount,
      recentOrders,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { notIn: ['CANCELLED', 'PAYMENT_FAILED', 'EXPIRED'] } },
      }),
      this.prisma.order.count({
        where: { status: 'PENDING_PAYMENT' },
      }),
      this.prisma.product.count({
        where: { isActive: true },
      }),
      this.prisma.user.count({
        where: { role: 'CUSTOMER' },
      }),
      this.prisma.user.count({
        where: { role: 'CUSTOMER', createdAt: { gte: todayStart } },
      }),
      this.prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);

    return {
      revenue: {
        total: allTimeRevenue._sum.total ?? 0,
        trend: 0,
      },
      orders: {
        total: totalOrderCount,
        pending: pendingOrderCount,
        trend: 0,
      },
      products: {
        total: totalProductCount,
        lowStock: lowStockCount,
      },
      customers: {
        total: totalCustomerCount,
        new: newCustomerCount,
      },
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.user ? `${o.user.firstName} ${o.user.lastName}` : 'Guest',
        status: o.status,
        total: o.total,
        createdAt: o.createdAt,
      })),
    };
  }
}
