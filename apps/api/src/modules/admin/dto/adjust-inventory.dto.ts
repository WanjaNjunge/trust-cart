import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StockAdjustmentType } from '@prisma/client';

export class AdjustInventoryDto {
  @ApiProperty({
    description: 'Quantity delta — positive to add, negative to remove',
    example: 10,
  })
  @IsInt()
  @IsNotEmpty()
  quantity!: number;

  @ApiProperty({
    enum: StockAdjustmentType,
    description:
      'Reason category for the adjustment — schema values: PURCHASE, SALE, RETURN, DAMAGE, CORRECTION',
    example: StockAdjustmentType.CORRECTION,
  })
  @IsEnum(StockAdjustmentType)
  @IsNotEmpty()
  adjustmentType!: StockAdjustmentType;

  @ApiProperty({
    description: 'Human-readable explanation for this adjustment',
    example: 'Stock count corrected after physical audit',
  })
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiPropertyOptional({
    description: 'Reference identifier — PO number, return ID, etc.',
    example: 'PO-2026-001',
  })
  @IsString()
  @IsOptional()
  reference?: string;
}
