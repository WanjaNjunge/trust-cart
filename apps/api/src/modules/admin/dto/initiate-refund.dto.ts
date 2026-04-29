import { IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitiateRefundDto {
  @ApiProperty({ description: 'Refund amount in KES (integer, no decimals)', example: 5000 })
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  amount!: number;

  @ApiProperty({ description: 'Reason for the refund' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
