import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  imageUrl?: string;

  @ApiProperty()
  sortOrder!: number;

  @ApiProperty()
  isActive!: boolean;

  @ApiPropertyOptional()
  parentId?: string;

  @ApiPropertyOptional()
  parent?: {
    id: string;
    name: string;
    slug: string;
  };

  @ApiPropertyOptional({ type: [CategoryResponseDto] })
  children?: CategoryResponseDto[];

  @ApiProperty()
  productCount!: number;
}

export class CategoryTreeResponseDto {
  @ApiProperty({ type: [CategoryResponseDto] })
  data!: CategoryResponseDto[];
}
