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
    <div className="mx-auto max-w-7xl px-4 pt-24 pb-16 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: 'Products', href: '/products' }, { label: category.name }]} />

      {/* Category Header */}
      <div className="mb-10 rounded-3xl border border-slate-200 bg-white/60 p-8 shadow-sm backdrop-blur-md">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">{category.name}</h1>
        {category.description && <p className="mt-3 text-lg text-slate-600 max-w-2xl">{category.description}</p>}

        <div className="mt-6 flex items-center gap-4 border-t border-slate-100 pt-4">
          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
            {pagination.totalItems} Products
          </span>
          <span className="text-sm text-slate-400">
            Sorted by Relevance
          </span>
        </div>
      </div>

      {/* Subcategories */}
      {category.children && category.children.length > 0 && (
        <div className="mb-10">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">Related Subcategories</h2>
          <div className="flex flex-wrap gap-3">
            {category.children.map((child) => (
              <Link
                key={child.id}
                href={`/categories/${child.slug}`}
                className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all shadow-sm"
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
