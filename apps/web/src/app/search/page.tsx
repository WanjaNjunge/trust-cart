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
      <div className="mx-auto max-w-7xl px-4 pt-24 pb-16 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'Search' }]} />

        <div className="flex min-h-[500px] flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white/50 backdrop-blur-sm">
          <div className="text-center max-w-md px-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-500 mb-6">
              <svg
                className="h-10 w-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Search TrustCart</h1>
            <p className="mt-3 text-slate-500">Enter a keyword, brand, or product name to explore our premium collection.</p>
            <div className="mt-8">
              <Link href="/products" className="inline-flex items-center justify-center rounded-full bg-slate-900 px-8 py-3 text-sm font-bold text-white transition-transform hover:scale-105 hover:bg-slate-800">
                Browse All Products
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { data: products, pagination } = await searchProducts(query, 12);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-24 pb-16 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: 'Search' }]} />

      <div className="mb-8 border-b border-slate-100 pb-6">
        <h1 className="text-3xl font-extrabold text-slate-900">Search Results</h1>
        <p className="mt-2 text-slate-500 font-medium">
          Found <span className="text-blue-600">{pagination.totalItems}</span> matching products for "<span className="text-slate-900">{query}</span>"
        </p>
      </div>

      {products.length > 0 ? (
        <>
          <div className="min-h-[400px]">
            <ProductGrid products={products} />
          </div>

          <div className="mt-12 border-t border-slate-100 pt-8">
            <Pagination
              currentPage={page}
              totalPages={pagination.totalPages}
              baseUrl="/search"
              queryParams={{ q: query }}
            />
          </div>
        </>
      ) : (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/50">
          <div className="text-center max-w-md px-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-slate-500 mb-4">
              <svg
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900">No matches found</h2>
            <p className="mt-2 text-slate-500">
              We couldn't find any products matching "{query}". Try checking for typos or using broader keywords.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/products" className="rounded-full bg-slate-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-slate-800 transition-colors">
                Browse Catalog
              </Link>
              <Link href="/" className="rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                Return Home
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
