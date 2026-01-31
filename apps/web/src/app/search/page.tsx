import type { Metadata } from 'next';
import Link from 'next/link';
import { ProductGrid, Breadcrumbs, Pagination } from '@/components';
import { searchProducts } from '@/lib/api';

interface SearchPageProps {
  searchParams: {
    q?: string;
    page?: string;
  };
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  return {
    title: searchParams.q ? `Search: ${searchParams.q}` : 'Search',
    description: searchParams.q
      ? `Search results for "${searchParams.q}" at TrustCart Kenya.`
      : 'Search for electronics at TrustCart Kenya.',
  };
}

export const dynamic = 'force-dynamic';

export default async function SearchPage({ searchParams }: SearchPageProps): Promise<JSX.Element> {
  const query = searchParams.q || '';
  const page = Number(searchParams.page) || 1;

  // If no query, show empty state
  if (!query.trim()) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'Search' }]} />

        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <svg
              className="mx-auto h-16 w-16 text-secondary-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h1 className="mt-4 text-xl font-semibold text-secondary-900">Search Products</h1>
            <p className="mt-2 text-secondary-500">Enter a search term to find products</p>
            <Link href="/products" className="btn-primary mt-6">
              Browse All Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { data: products, pagination } = await searchProducts(query, 12);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: 'Search' }]} />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900">Search Results</h1>
        <p className="mt-2 text-secondary-600">
          {pagination.totalItems} results for "{query}"
        </p>
      </div>

      {products.length > 0 ? (
        <>
          <ProductGrid products={products} />

          <div className="mt-8">
            <Pagination
              currentPage={page}
              totalPages={pagination.totalPages}
              baseUrl="/search"
              queryParams={{ q: query }}
            />
          </div>
        </>
      ) : (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-secondary-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="mt-4 text-lg font-semibold text-secondary-900">No results found</h2>
            <p className="mt-2 text-secondary-500">
              We couldn't find any products matching "{query}"
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link href="/products" className="btn-primary">
                Browse All Products
              </Link>
              <Link href="/" className="btn-outline">
                Go Home
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
