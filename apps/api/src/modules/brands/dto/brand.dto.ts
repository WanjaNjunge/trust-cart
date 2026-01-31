import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BrandResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional()
  logoUrl?: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  productCount!: number;
}

export class BrandListResponseDto {
  @ApiProperty({ type: [BrandResponseDto] })
  data!: BrandResponseDto[];
}
