import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma';
import { ProductListQueryDto, ProductResponseDto, ProductListResponseDto } from './dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ProductListQueryDto): Promise<ProductListResponseDto> {
    const {
      page = 1,
      limit = 20,
      categoryId,
      brandId,
      condition,
      priceMin,
      priceMax,
      q,
      isFeatured,
      sort,
    } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ProductWhereInput = {
      isActive: true,
    };

    if (categoryId) where.categoryId = categoryId;
    if (brandId) where.brandId = brandId;
    if (condition) where.condition = condition;
    if (isFeatured !== undefined) where.isFeatured = isFeatured;
    if (priceMin !== undefined || priceMax !== undefined) {
      where.price = {};
      if (priceMin !== undefined) where.price.gte = priceMin;
      if (priceMax !== undefined) where.price.lte = priceMax;
    }
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Build orderBy
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    if (sort) {
      const desc = sort.startsWith('-');
      const field = desc ? sort.slice(1) : sort;
      orderBy = { [field]: desc ? 'desc' : 'asc' };
    }

    // Execute queries
    const [products, totalItems] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true } },
          images: { where: { isPrimary: true }, take: 1 },
          inventoryRecord: { select: { quantityOnHand: true, quantityReserved: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    const data: ProductResponseDto[] = products.map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      slug: p.slug,
      description: p.description,
      shortDescription: p.shortDescription || undefined,
      price: p.price,
      compareAtPrice: p.compareAtPrice || undefined,
      condition: p.condition,
      warrantyMonths: p.warrantyMonths,
      isActive: p.isActive,
      isFeatured: p.isFeatured,
      category: p.category
        ? { id: p.category.id, name: p.category.name, slug: p.category.slug }
        : undefined,
      brand: p.brand ? { id: p.brand.id, name: p.brand.name } : undefined,
      primaryImage: p.images[0]
        ? { url: p.images[0].url, altText: p.images[0].altText || '' }
        : undefined,
      isInStock: p.inventoryRecord
        ? p.inventoryRecord.quantityOnHand - p.inventoryRecord.quantityReserved > 0
        : false,
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async findOne(id: string): Promise<ProductResponseDto | null> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        attributes: true,
        inventoryRecord: { select: { quantityOnHand: true, quantityReserved: true } },
      },
    });

    if (!product) return null;

    const availableQuantity = product.inventoryRecord
      ? product.inventoryRecord.quantityOnHand - product.inventoryRecord.quantityReserved
      : 0;

    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      slug: product.slug,
      description: product.description,
      shortDescription: product.shortDescription || undefined,
      price: product.price,
      compareAtPrice: product.compareAtPrice || undefined,
      condition: product.condition,
      warrantyMonths: product.warrantyMonths,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      category: product.category
        ? { id: product.category.id, name: product.category.name, slug: product.category.slug }
        : undefined,
      brand: product.brand ? { id: product.brand.id, name: product.brand.name } : undefined,
      primaryImage: product.images[0]
        ? { url: product.images[0].url, altText: product.images[0].altText || '' }
        : undefined,
      images: product.images.map((img) => ({
        id: img.id,
        url: img.url,
        altText: img.altText || undefined,
        sortOrder: img.sortOrder,
        isPrimary: img.isPrimary,
      })),
      attributes: product.attributes.map((attr) => ({
        name: attr.name,
        value: attr.value,
      })),
      isInStock: availableQuantity > 0,
      availableQuantity,
    };
  }

  async findBySlug(slug: string): Promise<ProductResponseDto | null> {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        attributes: true,
        inventoryRecord: { select: { quantityOnHand: true, quantityReserved: true } },
      },
    });

    if (!product) return null;

    const availableQuantity = product.inventoryRecord
      ? product.inventoryRecord.quantityOnHand - product.inventoryRecord.quantityReserved
      : 0;

    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      slug: product.slug,
      description: product.description,
      shortDescription: product.shortDescription || undefined,
      price: product.price,
      compareAtPrice: product.compareAtPrice || undefined,
      condition: product.condition,
      warrantyMonths: product.warrantyMonths,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      category: product.category
        ? { id: product.category.id, name: product.category.name, slug: product.category.slug }
        : undefined,
      brand: product.brand ? { id: product.brand.id, name: product.brand.name } : undefined,
      primaryImage: product.images[0]
        ? { url: product.images[0].url, altText: product.images[0].altText || '' }
        : undefined,
      images: product.images.map((img) => ({
        id: img.id,
        url: img.url,
        altText: img.altText || undefined,
        sortOrder: img.sortOrder,
        isPrimary: img.isPrimary,
      })),
      attributes: product.attributes.map((attr) => ({
        name: attr.name,
        value: attr.value,
      })),
      isInStock: availableQuantity > 0,
      availableQuantity,
    };
  }
}
