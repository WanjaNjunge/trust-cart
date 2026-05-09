import { IsString, IsNotEmpty, IsEnum, IsOptional, MaxLength, IsEmail, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PaymentMethodDto {
  MPESA_STK = 'MPESA_STK',
  POD_CASH = 'POD_CASH',
}

export class GuestAddressDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  recipientName!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  line1!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  line2?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  county!: string;
}

export class CheckoutDto {
  @ApiProperty({ description: 'ID of the delivery address to use, or "GUEST_ADDRESS" for guest checkout' })
  @IsString()
  @IsNotEmpty()
  addressId!: string;

  @ApiProperty({
    description: 'Payment method to use',
    enum: PaymentMethodDto,
    example: PaymentMethodDto.MPESA_STK,
  })
  @IsEnum(PaymentMethodDto)
  paymentMethod!: PaymentMethodDto;

  @ApiPropertyOptional({ description: 'Additional order notes', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ description: 'Email for guest checkout' })
  @IsOptional()
  @IsEmail()
  guestEmail?: string;

  @ApiPropertyOptional({ description: 'Address details for guest checkout' })
  @IsOptional()
  @ValidateNested()
  @Type(() => GuestAddressDto)
  guestAddress?: GuestAddressDto;
}
