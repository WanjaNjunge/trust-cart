import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Order Item Response
export class OrderItemResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty()
  productName!: string;

  @ApiProperty()
  productSku!: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty({ description: 'Unit price in cents (KES)' })
  unitPrice!: number;

  @ApiProperty({ description: 'Line total in cents (KES)' })
  lineTotal!: number;
}

// Order Address Response
export class OrderAddressResponseDto {
  @ApiProperty()
  recipientName!: string;

  @ApiProperty()
  phone!: string;

  @ApiProperty()
  line1!: string;

  @ApiPropertyOptional()
  line2?: string;

  @ApiProperty()
  city!: string;

  @ApiProperty()
  county!: string;
}

// Order Status History Entry
export class OrderStatusHistoryDto {
  @ApiPropertyOptional()
  fromStatus?: string;

  @ApiProperty()
  toStatus!: string;

  @ApiProperty()
  changedByType!: string;

  @ApiPropertyOptional()
  reason?: string;

  @ApiProperty()
  createdAt!: string;
}

// Full Order Response
export class OrderResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ description: 'Order number in format TC-YYYY-NNNNNN' })
  orderNumber!: string;

  @ApiProperty({ description: 'Order status' })
  status!: string;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items!: OrderItemResponseDto[];

  @ApiProperty({ type: OrderAddressResponseDto })
  address!: OrderAddressResponseDto;

  @ApiProperty({ description: 'Subtotal in cents (KES)' })
  subtotal!: number;

  @ApiProperty({ description: 'Delivery fee in cents (KES)' })
  deliveryFee!: number;

  @ApiProperty({ description: 'Discount amount in cents (KES)' })
  discount!: number;

  @ApiProperty({ description: 'Total in cents (KES)' })
  total!: number;

  @ApiProperty()
  paymentMethod!: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiPropertyOptional()
  promoCode?: string;

  @ApiProperty({ type: [OrderStatusHistoryDto] })
  statusHistory!: OrderStatusHistoryDto[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

// Checkout Response (minimal for payment initiation)
export class CheckoutResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ description: 'Order number in format TC-YYYY-NNNNNN' })
  orderNumber!: string;

  @ApiProperty({ description: 'Order status (PENDING_PAYMENT)' })
  status!: string;

  @ApiProperty({ description: 'Total amount to pay in cents (KES)' })
  total!: number;

  @ApiProperty()
  paymentMethod!: string;

  @ApiProperty({ description: 'Message for next steps' })
  message!: string;
}
