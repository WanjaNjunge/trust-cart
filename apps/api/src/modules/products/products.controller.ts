import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { ProductListQueryDto, ProductResponseDto, ProductListResponseDto } from './dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({
    summary: 'List all products',
    description: 'Get paginated list of products with filtering and search',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (1-indexed)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (max 100)',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: String,
    description: 'Filter by category ID',
  })
  @ApiQuery({ name: 'brandId', required: false, type: String, description: 'Filter by brand ID' })
  @ApiQuery({
    name: 'condition',
    required: false,
    enum: ['BRAND_NEW', 'OPEN_BOX', 'CERTIFIED_REFURBISHED', 'EX_UK', 'EX_USA'],
    description: 'Filter by product condition',
  })
  @ApiQuery({
    name: 'priceMin',
    required: false,
    type: Number,
    description: 'Minimum price in KES',
  })
  @ApiQuery({
    name: 'priceMax',
    required: false,
    type: Number,
    description: 'Maximum price in KES',
  })
  @ApiQuery({ name: 'q', required: false, type: String, description: 'Search query' })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: String,
    description: 'Sort field (use - prefix for descending)',
  })
  @ApiQuery({
    name: 'isFeatured',
    required: false,
    type: Boolean,
    description: 'Filter featured products only',
  })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
    type: ProductListResponseDto,
  })
  async findAll(@Query() query: ProductListQueryDto): Promise<ProductListResponseDto> {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get product by ID',
    description: 'Get detailed product information by ID',
  })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product found', type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(@Param('id') id: string): Promise<ProductResponseDto> {
    const product = await this.productsService.findOne(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get product by slug', description: 'Get product by URL-friendly slug' })
  @ApiParam({ name: 'slug', description: 'Product slug' })
  @ApiResponse({ status: 200, description: 'Product found', type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findBySlug(@Param('slug') slug: string): Promise<ProductResponseDto> {
    const product = await this.productsService.findBySlug(slug);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }
}
