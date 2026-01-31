import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { BrandsService } from './brands.service';
import { BrandResponseDto, BrandListResponseDto } from './dto';

@ApiTags('Brands')
@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  @ApiOperation({
    summary: 'List all brands',
    description: 'Get all active brands with product counts',
  })
  @ApiResponse({
    status: 200,
    description: 'Brands retrieved successfully',
    type: BrandListResponseDto,
  })
  async findAll(): Promise<BrandListResponseDto> {
    return this.brandsService.findAll();
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Get brand by slug',
    description: 'Get brand details by URL-friendly slug',
  })
  @ApiParam({ name: 'slug', description: 'Brand slug' })
  @ApiResponse({
    status: 200,
    description: 'Brand found',
    type: BrandResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  async findBySlug(@Param('slug') slug: string): Promise<BrandResponseDto> {
    const brand = await this.brandsService.findBySlug(slug);
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
    return brand;
  }
}
