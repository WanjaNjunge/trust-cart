import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus, description: 'New status for the order' })
  @IsEnum(OrderStatus)
  @IsNotEmpty()
  status!: OrderStatus;

  @ApiProperty({ description: 'Reason for the status change (required for audit trail)' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
