import { IsString, IsInt, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({ example: 'clxyz123abc' })
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class UpdateCartItemDto {
  @ApiProperty({ example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class ApplyPromoCodeDto {
  @ApiProperty({ example: 'WELCOME10' })
  @IsString()
  @IsNotEmpty()
  code!: string;
}

// Response types
export interface CartItemResponse {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    primaryImage?: {
      url: string;
      altText: string;
    };
  };
  quantity: number;
  priceAtAdd: number;
  lineTotal: number;
}

export interface CartResponse {
  id: string;
  items: CartItemResponse[];
  promoCode?: {
    code: string;
    discountType: string;
    discountValue: number;
  };
  subtotal: number;
  discount: number;
  total: number;
  itemCount: number;
  expiresAt?: string;
}
