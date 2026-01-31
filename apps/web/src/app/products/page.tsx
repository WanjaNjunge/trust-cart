import type { Metadata } from 'next';
import { ProductGrid, Breadcrumbs, Pagination } from '@/components';
import { getProducts, getCategories, getBrands } from '@/lib/api';
import { ProductCondition } from '@/lib/types';
import { FilterSidebar } from './FilterSidebar';
import { SortSelect } from './SortSelect';

export const metadata: Metadata = {
  title: 'All Products',
  description:
    'Browse our complete collection of quality electronics including laptops, phones, tablets, and accessories.',
};

interface ProductsPageProps {
  searchParams: {
    page?: string;
    categoryId?: string;
    brandId?: string;
    condition?: string;
    priceMin?: string;
    priceMax?: string;
    sort?: string;
  };
}

export const dynamic = 'force-dynamic';

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps): Promise<JSX.Element> {
  const page = Number(searchParams.page) || 1;

  // Fetch products, categories, and brands in parallel
  const [productsResponse, categoriesResponse, brandsResponse] = await Promise.all([
    getProducts({
      page,
      limit: 12,
      categoryId: searchParams.categoryId,
      brandId: searchParams.brandId,
      condition: searchParams.condition as ProductCondition,
      priceMin: searchParams.priceMin ? Number(searchParams.priceMin) : undefined,
      priceMax: searchParams.priceMax ? Number(searchParams.priceMax) : undefined,
      sort: searchParams.sort,
    }),
    getCategories().catch(() => ({ data: [] })),
    getBrands().catch(() => ({ data: [] })),
  ]);

  const { data: products, pagination } = productsResponse;
  const categories = categoriesResponse.data;
  const brands = brandsResponse.data;

  // Build query params for pagination
  const queryParams: Record<string, string> = {};
  if (searchParams.categoryId) queryParams.categoryId = searchParams.categoryId;
  if (searchParams.brandId) queryParams.brandId = searchParams.brandId;
  if (searchParams.condition) queryParams.condition = searchParams.condition;
  if (searchParams.priceMin) queryParams.priceMin = searchParams.priceMin;
  if (searchParams.priceMax) queryParams.priceMax = searchParams.priceMax;
  if (searchParams.sort) queryParams.sort = searchParams.sort;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: 'Products' }]} />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900">All Products</h1>
        <p className="mt-2 text-secondary-600">{pagination.totalItems} products found</p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full lg:w-64 lg:flex-shrink-0">
          <FilterSidebar
            categories={categories}
            brands={brands}
            currentFilters={{
              categoryId: searchParams.categoryId,
              brandId: searchParams.brandId,
              condition: searchParams.condition,
              priceMin: searchParams.priceMin,
              priceMax: searchParams.priceMax,
            }}
          />
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Sort dropdown */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-secondary-500">
              Showing {(page - 1) * pagination.limit + 1}–
              {Math.min(page * pagination.limit, pagination.totalItems)} of {pagination.totalItems}
            </p>
            <form className="flex items-center gap-2">
              <label htmlFor="sort" className="text-sm text-secondary-600">
                Sort by:
              </label>
              <SortSelect currentSort={searchParams.sort} />
            </form>
          </div>

          {/* Product Grid */}
          <ProductGrid
            products={products}
            emptyMessage="No products match your filters. Try adjusting your selection."
          />

          {/* Pagination */}
          <div className="mt-8">
            <Pagination
              currentPage={page}
              totalPages={pagination.totalPages}
              baseUrl="/products"
              queryParams={queryParams}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
