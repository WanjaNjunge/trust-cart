import Link from 'next/link';
import { ProductGrid } from '@/components';
import { getProducts, getCategories } from '@/lib/api';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { BentoGrid, BentoGridItem } from '@/components/ui/BentoGrid';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function HomePage(): Promise<JSX.Element> {
  const [productsResponse, categoriesResponse] = await Promise.all([
    getProducts({ isFeatured: true, limit: 8 }).catch(() => ({
      data: [],
      pagination: {
        page: 1,
        limit: 8,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    })),
    getCategories().catch(() => ({ data: [] })),
  ]);

  const featuredProducts = productsResponse.data;
  const categories = categoriesResponse.data;

  return (
    <div className="flex flex-col gap-16 pb-20">
      {/* Immersive Hero Section */}
      <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden bg-background pt-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-secondary/20 blur-[120px]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        </div>

        <div className="container-fluid relative z-10 flex flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary backdrop-blur-sm">
            <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-primary"></span>
            New Collection 2026
          </div>

          <h1 className="max-w-4xl text-5xl font-bold tracking-tight text-foreground sm:text-7xl lg:text-8xl">
            Electronics <br />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Reimagined.
            </span>
          </h1>

          <p className="mt-8 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Experience the future of shopping. Premium devices, secure payments, and lightning-fast
            delivery across Kenya.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <MagneticButton strength={0.2}>
              <Link
                href="/products"
                className="btn-primary h-14 rounded-full px-8 text-lg font-medium shadow-lg shadow-primary/25 transition-transform hover:scale-105"
              >
                Start Exploring
              </Link>
            </MagneticButton>
            <MagneticButton strength={0.1}>
              <Link
                href="/categories/laptops"
                className="inline-flex h-14 items-center justify-center rounded-full border border-input bg-background/50 px-8 text-lg font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-muted/50"
              >
                View Laptops
              </Link>
            </MagneticButton>
          </div>

          {/* Floating Product Preview (Decorative) */}
          <div className="mt-16 w-full max-w-5xl md:mt-20">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-white/20 bg-white/5 p-4 shadow-2xl backdrop-blur-md dark:bg-black/40">
              <div className="h-full w-full rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  [Immersive Product Banner / Video Placeholder]
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Categories */}
      {categories.length > 0 && (
        <section className="container-fluid py-12">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Curated Categories</h2>
              <p className="mt-2 text-muted-foreground">Explore our premium selection.</p>
            </div>
            <Link
              href="/products"
              className="hidden text-sm font-medium text-primary hover:underline sm:block"
            >
              View all categories →
            </Link>
          </div>

          <BentoGrid>
            {categories.map((category, i) => (
              <Link
                key={category.id}
                href={`/products?categoryId=${category.id}`}
                className={cn(i === 0 || i === 3 ? 'md:col-span-2' : '')}
              >
                <BentoGridItem
                  title={category.name}
                  description={category.description || 'Explore collection'}
                  header={
                    <div className="flex h-full min-h-[6rem] w-full flex-1 overflow-hidden rounded-xl bg-gradient-to-br from-neutral-200 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
                      {/* Ideally use category.image here */}
                      <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-muted-foreground/20">
                        {category.name[0]}
                      </div>
                    </div>
                  }
                  className={i === 0 || i === 3 ? 'md:col-span-2' : ''}
                />
              </Link>
            ))}
          </BentoGrid>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="container-fluid py-12">
          <div className="mb-12 flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">Trending Now</h2>
            <Link href="/products" className="text-sm font-medium text-primary hover:underline">
              View all →
            </Link>
          </div>
          <ProductGrid products={featuredProducts} />
        </section>
      )}

      {/* Trust Indicators (Redesigned) */}
      <section className="container-fluid py-12">
        <div className="rounded-3xl border border-border bg-card p-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            {[
              {
                title: 'Authentic',
                desc: '100% Original Products',
                icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
              },
              {
                title: 'Secure',
                desc: 'Protected Payments',
                icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
              },
              { title: 'Fast', desc: 'Delivery across Kenya', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
              {
                title: 'Support',
                desc: '24/7 Dedicated Support',
                icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z',
              },
            ].map((item) => (
              <div key={item.title} className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={item.icon}
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
