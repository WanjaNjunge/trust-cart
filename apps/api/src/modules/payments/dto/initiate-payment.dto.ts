import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitiatePaymentDto {
    @ApiProperty({ description: 'ID of the order to pay for' })
    @IsString()
    @IsNotEmpty()
    orderId!: string;

    @ApiProperty({ description: 'Phone number for MPesa payment (optional, defaults to order phone)' })
    @IsOptional()
    @IsString()
    phoneNumber?: string;
}
