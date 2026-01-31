import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { BrandResponseDto, BrandListResponseDto } from './dto';

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<BrandListResponseDto> {
    const brands = await this.prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
    });

    const data: BrandResponseDto[] = brands.map((brand) => ({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      logoUrl: brand.logoUrl || undefined,
      isActive: brand.isActive,
      productCount: brand._count.products,
    }));

    return { data };
  }

  async findBySlug(slug: string): Promise<BrandResponseDto | null> {
    const brand = await this.prisma.brand.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
    });

    if (!brand || !brand.isActive) return null;

    return {
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      logoUrl: brand.logoUrl || undefined,
      isActive: brand.isActive,
      productCount: brand._count.products,
    };
  }
}
