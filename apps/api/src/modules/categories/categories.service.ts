import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CategoryResponseDto, CategoryTreeResponseDto } from './dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<CategoryTreeResponseDto> {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
    });

    // Build tree structure - get root categories first
    const rootCategories = categories.filter((c) => !c.parentId);
    const childCategories = categories.filter((c) => c.parentId);

    const data: CategoryResponseDto[] = rootCategories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description || undefined,
      imageUrl: cat.imageUrl || undefined,
      sortOrder: cat.sortOrder,
      isActive: cat.isActive,
      parentId: cat.parentId || undefined,
      productCount: cat._count.products,
      children: childCategories
        .filter((child) => child.parentId === cat.id)
        .map((child) => ({
          id: child.id,
          name: child.name,
          slug: child.slug,
          description: child.description || undefined,
          imageUrl: child.imageUrl || undefined,
          sortOrder: child.sortOrder,
          isActive: child.isActive,
          parentId: child.parentId || undefined,
          productCount: child._count.products,
        })),
    }));

    return { data };
  }

  async findBySlug(slug: string): Promise<CategoryResponseDto | null> {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
    });

    if (!category || !category.isActive) return null;

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description || undefined,
      imageUrl: category.imageUrl || undefined,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      parentId: category.parentId || undefined,
      parent: category.parent
        ? {
            id: category.parent.id,
            name: category.parent.name,
            slug: category.parent.slug,
          }
        : undefined,
      children: category.children.map((child) => ({
        id: child.id,
        name: child.name,
        slug: child.slug,
        description: child.description || undefined,
        imageUrl: child.imageUrl || undefined,
        sortOrder: child.sortOrder,
        isActive: child.isActive,
        parentId: child.parentId || undefined,
        productCount: 0, // Not needed for children in detail view
      })),
      productCount: category._count.products,
    };
  }

  async findById(id: string): Promise<CategoryResponseDto | null> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
    });

    if (!category || !category.isActive) return null;

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description || undefined,
      imageUrl: category.imageUrl || undefined,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      parentId: category.parentId || undefined,
      parent: category.parent
        ? {
            id: category.parent.id,
            name: category.parent.name,
            slug: category.parent.slug,
          }
        : undefined,
      productCount: category._count.products,
    };
  }
}
