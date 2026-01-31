import { IsString, IsOptional, IsBoolean, MinLength } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  lastName?: string;

  @ApiPropertyOptional({ example: '254700000000' })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class CreateAddressDto {
  @ApiProperty({ example: 'Home' })
  @IsString()
  @MinLength(1)
  label!: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(1)
  recipientName!: string;

  @ApiProperty({ example: '254700000000' })
  @IsString()
  phone!: string;

  @ApiProperty({ example: '123 Kimathi Street' })
  @IsString()
  @MinLength(1)
  line1!: string;

  @ApiPropertyOptional({ example: 'Apt 5B' })
  @IsOptional()
  @IsString()
  line2?: string;

  @ApiProperty({ example: 'Nairobi' })
  @IsString()
  @MinLength(1)
  city!: string;

  @ApiProperty({ example: 'Nairobi' })
  @IsString()
  @MinLength(1)
  county!: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateAddressDto {
  @ApiPropertyOptional({ example: 'Work' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  label?: string;

  @ApiPropertyOptional({ example: 'Jane Doe' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  recipientName?: string;

  @ApiPropertyOptional({ example: '254700000000' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '456 Moi Avenue' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  line1?: string;

  @ApiPropertyOptional({ example: 'Floor 3' })
  @IsOptional()
  @IsString()
  line2?: string;

  @ApiPropertyOptional({ example: 'Nairobi' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  city?: string;

  @ApiPropertyOptional({ example: 'Nairobi' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  county?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
