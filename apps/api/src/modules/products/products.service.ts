import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma';
import { ProductListQueryDto, ProductResponseDto, ProductListResponseDto } from './dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) { }

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
    const where: Prisma.ProductWhereInput = {};

    // Default to active only unless explicitly requested (e.g. by admin)
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    } else if (!query.includeInactive) {
      where.isActive = true;
    }

    if (query.inStock !== undefined) {
      // Simple stock check based on quantityOnHand. 
      // Note: Does not account for reservations in DB query yet.
      const operator = query.inStock ? 'gt' : 'lte';
      where.inventoryRecord = {
        quantityOnHand: { [operator]: 0 }
      };
    }

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

    return this.mapToResponse(product);
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

    return this.mapToResponse(product);
  }

  async create(data: import('./dto').CreateProductDto): Promise<ProductResponseDto> {
    const {
      images,
      attributes,
      quantityOnHand,
      categoryId,
      brandId,
      ...productData
    } = data;

    // Generate slug from name if not provided (simple version)
    const slug = productData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Ensure slug uniqueness (basic append)
    let uniqueSlug = slug;
    let counter = 1;
    while (await this.prisma.product.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    const product = await this.prisma.product.create({
      data: {
        ...productData,
        slug: uniqueSlug,
        sku: `${productData.name.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`, // Temporary SKU gen
        category: { connect: { id: categoryId } },
        brand: brandId ? { connect: { id: brandId } } : undefined,
        images: {
          create: images?.map((img, idx) => ({
            url: img.url,
            altText: img.altText,
            isPrimary: img.isPrimary || idx === 0,
            sortOrder: idx,
          })),
        },
        attributes: {
          create: attributes?.map((attr) => ({
            name: attr.name,
            value: attr.value,
          })),
        },
        inventoryRecord: {
          create: {
            quantityOnHand: quantityOnHand || 0,
            reorderThreshold: 5,
          },
        },
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        attributes: true,
        inventoryRecord: true,
      },
    });

    return this.mapToResponse(product);
  }

  async update(id: string, data: import('./dto').UpdateProductDto): Promise<ProductResponseDto> {
    const {
      images,
      attributes,
      quantityOnHand,
      categoryId,
      brandId,
      ...productData
    } = data;

    const updateData: Prisma.ProductUpdateInput = {
      ...productData,
    };

    if (categoryId) updateData.category = { connect: { id: categoryId } };
    if (brandId) updateData.brand = { connect: { id: brandId } };

    if (images) {
      await this.prisma.productImage.deleteMany({ where: { productId: id } });
      updateData.images = {
        create: images.map((img, idx) => ({
          url: img.url,
          altText: img.altText,
          isPrimary: img.isPrimary || idx === 0,
          sortOrder: idx,
        })),
      };
    }

    if (attributes) {
      await this.prisma.productAttribute.deleteMany({ where: { productId: id } });
      updateData.attributes = {
        create: attributes.map((attr) => ({
          name: attr.name,
          value: attr.value,
        })),
      };
    }

    if (quantityOnHand !== undefined) {
      updateData.inventoryRecord = {
        upsert: {
          create: { quantityOnHand },
          update: { quantityOnHand },
        },
      };
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        attributes: true,
        inventoryRecord: true,
      },
    });

    return this.mapToResponse(product);
  }

  async remove(id: string): Promise<void> {
    await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private mapToResponse(product: any): ProductResponseDto {
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
      primaryImage: product.images?.[0]
        ? { url: product.images[0].url, altText: product.images[0].altText || '' }
        : undefined,
      images: product.images?.map((img: any) => ({
        id: img.id,
        url: img.url,
        altText: img.altText || undefined,
        sortOrder: img.sortOrder,
        isPrimary: img.isPrimary,
      })) || [],
      attributes: product.attributes?.map((attr: any) => ({
        name: attr.name,
        value: attr.value,
      })) || [],
      isInStock: availableQuantity > 0,
      availableQuantity,
    };
  }
}
