import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductCondition } from '@prisma/client';
export class CreateProductImageDto {
    @ApiProperty()
    @IsString()
    url!: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    altText?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isPrimary?: boolean;
}

export class CreateProductAttributeDto {
    @ApiProperty()
    @IsString()
    name!: string;

    @ApiProperty()
    @IsString()
    value!: string;
}

export class CreateProductDto {
    @ApiProperty()
    @IsString()
    name!: string;

    @ApiProperty()
    @IsString()
    description!: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    shortDescription?: string;

    @ApiProperty()
    @IsNumber()
    @Min(0)
    price!: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Min(0)
    compareAtPrice?: number;

    @ApiProperty({ enum: ProductCondition })
    @IsEnum(ProductCondition)
    condition!: ProductCondition;

    @ApiProperty()
    @IsString()
    categoryId!: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    brandId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Min(0)
    quantityOnHand?: number;

    @ApiPropertyOptional({ type: [CreateProductImageDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateProductImageDto)
    images?: CreateProductImageDto[];

    @ApiPropertyOptional({ type: [CreateProductAttributeDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateProductAttributeDto)
    attributes?: CreateProductAttributeDto[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean;
}
