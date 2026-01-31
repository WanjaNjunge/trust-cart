import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ProductGrid, Breadcrumbs, Pagination } from '@/components';
import { getProducts, getCategoryBySlug, getBrands } from '@/lib/api';
import { ProductCondition } from '@/lib/types';
import { CategoryFilters } from './CategoryFilters';

interface CategoryPageProps {
  params: {
    slug: string;
  };
  searchParams: {
    page?: string;
    brandId?: string;
    condition?: string;
    priceMin?: string;
    priceMax?: string;
    sort?: string;
  };
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  try {
    const category = await getCategoryBySlug(params.slug);
    return {
      title: category.name,
      description:
        category.description ||
        `Shop ${category.name} at TrustCart Kenya. Quality electronics with secure payments.`,
    };
  } catch {
    return {
      title: 'Category Not Found',
    };
  }
}

export const dynamic = 'force-dynamic';

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps): Promise<JSX.Element> {
  let category;

  try {
    category = await getCategoryBySlug(params.slug);
  } catch {
    notFound();
  }

  if (!category) {
    notFound();
  }

  const page = Number(searchParams.page) || 1;

  // Fetch products and brands
  const [productsResponse, brandsResponse] = await Promise.all([
    getProducts({
      page,
      limit: 12,
      categoryId: category.id,
      brandId: searchParams.brandId,
      condition: searchParams.condition as ProductCondition,
      priceMin: searchParams.priceMin ? Number(searchParams.priceMin) : undefined,
      priceMax: searchParams.priceMax ? Number(searchParams.priceMax) : undefined,
      sort: searchParams.sort,
    }),
    getBrands().catch(() => ({ data: [] })),
  ]);

  const { data: products, pagination } = productsResponse;
  const brands = brandsResponse.data;

  // Build query params for pagination
  const queryParams: Record<string, string> = {};
  if (searchParams.brandId) queryParams.brandId = searchParams.brandId;
  if (searchParams.condition) queryParams.condition = searchParams.condition;
  if (searchParams.priceMin) queryParams.priceMin = searchParams.priceMin;
  if (searchParams.priceMax) queryParams.priceMax = searchParams.priceMax;
  if (searchParams.sort) queryParams.sort = searchParams.sort;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: 'Products', href: '/products' }, { label: category.name }]} />

      {/* Category Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900">{category.name}</h1>
        {category.description && <p className="mt-2 text-secondary-600">{category.description}</p>}
        <p className="mt-1 text-sm text-secondary-500">{pagination.totalItems} products</p>
      </div>

      {/* Subcategories */}
      {category.children && category.children.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 font-semibold text-secondary-900">Subcategories</h2>
          <div className="flex flex-wrap gap-2">
            {category.children.map((child) => (
              <Link
                key={child.id}
                href={`/categories/${child.slug}`}
                className="rounded-full bg-secondary-100 px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-200"
              >
                {child.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <CategoryFilters
          brands={brands}
          currentBrandId={searchParams.brandId}
          currentCondition={searchParams.condition}
          currentSort={searchParams.sort}
        />

        {/* Clear Filters */}
        {(searchParams.brandId ||
          searchParams.condition ||
          searchParams.priceMin ||
          searchParams.priceMax) && (
          <Link
            href={`/categories/${params.slug}`}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Clear Filters
          </Link>
        )}
      </div>

      {/* Product Grid */}
      <ProductGrid
        products={products}
        emptyMessage={`No products found in ${category.name}. Try adjusting your filters.`}
      />

      {/* Pagination */}
      <div className="mt-8">
        <Pagination
          currentPage={page}
          totalPages={pagination.totalPages}
          baseUrl={`/categories/${params.slug}`}
          queryParams={queryParams}
        />
      </div>
    </div>
  );
}
