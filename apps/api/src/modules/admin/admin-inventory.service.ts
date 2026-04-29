import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';

@Injectable()
export class AdminInventoryService {
  private readonly logger = new Logger(AdminInventoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async adjustInventory(productId: string, dto: AdjustInventoryDto, adminId: string) {
    const { quantity, adjustmentType, reason, reference } = dto;

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { inventoryRecord: true },
    });

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }
    if (!product.isActive) {
      throw new BadRequestException('Cannot adjust inventory for an inactive product');
    }
    if (!product.inventoryRecord) {
      throw new NotFoundException(`Inventory record not found for product ${productId}`);
    }

    const currentQty = product.inventoryRecord.quantityOnHand;
    const newQty = currentQty + quantity;

    if (newQty < 0) {
      throw new BadRequestException(
        `Adjustment would result in negative stock (current: ${currentQty}, delta: ${quantity})`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedInventory = await tx.inventoryRecord.update({
        where: { productId },
        data: { quantityOnHand: newQty },
      });

      await tx.stockAdjustment.create({
        data: {
          productId,
          type: adjustmentType,
          quantity,
          reason,
          referenceId: reference ?? null,
          adminId,
        },
      });

      this.logger.log(
        `Inventory adjusted: product=${productId} ${currentQty} → ${newQty} (${adjustmentType}) by admin=${adminId}`,
      );

      return {
        productId,
        productName: product.name,
        previousQuantity: currentQty,
        newQuantity: updatedInventory.quantityOnHand,
        adjustmentType,
        reason,
        reference: reference ?? null,
      };
    });
  }

  async getInventoryList(params: { page?: number; limit?: number; search?: string }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = params.search
      ? {
          isActive: true,
          OR: [
            { name: { contains: params.search, mode: 'insensitive' as const } },
            { sku: { contains: params.search, mode: 'insensitive' as const } },
          ],
        }
      : { isActive: true };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          inventoryRecord: true,
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products.map((p) => ({
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        quantityOnHand: p.inventoryRecord?.quantityOnHand ?? 0,
        quantityReserved: p.inventoryRecord?.quantityReserved ?? 0,
        quantityAvailable:
          (p.inventoryRecord?.quantityOnHand ?? 0) - (p.inventoryRecord?.quantityReserved ?? 0),
        reorderThreshold: p.inventoryRecord?.reorderThreshold ?? 5,
        isLowStock:
          (p.inventoryRecord?.quantityOnHand ?? 0) <= (p.inventoryRecord?.reorderThreshold ?? 5),
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
}
