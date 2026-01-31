import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CategoryResponseDto, CategoryTreeResponseDto } from './dto';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({
    summary: 'List all categories',
    description: 'Get hierarchical tree of all active categories with product counts',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
    type: CategoryTreeResponseDto,
  })
  async findAll(): Promise<CategoryTreeResponseDto> {
    return this.categoriesService.findAll();
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Get category by slug',
    description: 'Get category details including parent and children',
  })
  @ApiParam({ name: 'slug', description: 'Category slug' })
  @ApiResponse({
    status: 200,
    description: 'Category found',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findBySlug(@Param('slug') slug: string): Promise<CategoryResponseDto> {
    const category = await this.categoriesService.findBySlug(slug);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }
}
