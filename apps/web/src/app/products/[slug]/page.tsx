import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components';
import { getProductBySlug } from '@/lib/api';
import { formatPrice, getConditionLabel, getDiscountPercentage } from '@/lib/utils';
import { ImageGallery } from './ImageGallery';
import { ProductActions } from './AddToCartButton';
import { Check, Shield, Truck, RotateCcw } from 'lucide-react';

interface ProductPageProps {
  params: {
    slug: string;
  };
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  try {
    const product = await getProductBySlug(params.slug);
    return {
      title: product.name,
      description: product.shortDescription || product.description.slice(0, 160),
    };
  } catch {
    return {
      title: 'Product Not Found',
    };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  let product;

  try {
    product = await getProductBySlug(params.slug);
  } catch {
    notFound();
  }

  if (!product) {
    notFound();
  }

  const discountPercent = product.compareAtPrice
    ? getDiscountPercentage(product.price, product.compareAtPrice)
    : 0;

  const breadcrumbItems: Array<{ label: string; href?: string }> = [
    { label: 'Products', href: '/products' },
  ];

  if (product.category) {
    breadcrumbItems.push({
      label: product.category.name,
      href: `/categories/${product.category.slug}`,
    });
  }

  breadcrumbItems.push({ label: product.name });

  // Generate Key Features (mock if none exist)
  const keyFeatures = (product.attributes || []).slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-28 pb-16 sm:px-6 lg:px-8">
      <Breadcrumbs items={breadcrumbItems} />

      {/* Main Grid: Gallery & Buying Options */}
      <div className="mt-8 grid gap-12 lg:grid-cols-12">
        {/* Image Gallery (Left - 7 cols) */}
        <div className="lg:col-span-6">
          <ImageGallery images={product.images || []} productName={product.name} />
        </div>

        {/* Product Actions (Right - 6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {/* Header Section */}
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
              {product.brand && (
                <span className="uppercase tracking-wider text-slate-700">
                  {product.brand.name}
                </span>
              )}
              {product.brand && product.category && <span className="text-slate-300">•</span>}
              {product.category && <span className="text-blue-600">{product.category.name}</span>}
            </div>

            <h1 className="text-3xl font-bold text-slate-900 leading-tight">{product.name}</h1>

            <div className="mt-3 flex items-center gap-4">
              <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 border border-slate-200">
                {getConditionLabel(product.condition)}
              </span>
              <span className="text-xs text-slate-400 font-mono">SKU: {product.sku}</span>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="border-b border-slate-100 pb-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-slate-900">
                {formatPrice(product.price)}
              </span>
              {product.compareAtPrice && (
                <>
                  <span className="text-lg text-slate-400 line-through">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                  <span className="ml-2 rounded bg-red-50 px-2 py-1 text-xs font-bold text-red-600 border border-red-100">
                    -{discountPercent}%
                  </span>
                </>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">Price inclusive of VAT</p>

            <div className="mt-4">
              {product.isInStock ? (
                <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Available in stock
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-500 text-sm font-medium">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  Out of stock
                </div>
              )}
            </div>
          </div>

          {/* Key Features (Quick Summary) */}
          {keyFeatures.length > 0 && (
            <div className="py-2">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Key Features</h3>
              <ul className="grid gap-2">
                {keyFeatures.map((attr, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                    <span>
                      <span className="font-medium text-slate-800">{attr.name}:</span> {attr.value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Area */}
          <div className="pt-2">
            <ProductActions
              productId={product.id}
              productName={product.name}
              productPrice={product.price}
              slug={params.slug}
              isInStock={product.isInStock}
              maxQuantity={product.availableQuantity}
            />
          </div>

          {/* Assurance Icons */}
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">
                  {product.warrantyMonths} Month Warranty
                </p>
                <p className="text-[10px] text-slate-500">Official Coverage</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Express Delivery</p>
                <p className="text-[10px] text-slate-500">Within Nairobi</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-600">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Genuine Products</p>
                <p className="text-[10px] text-slate-500">100% Original</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Easy Returns</p>
                <p className="text-[10px] text-slate-500">7 Day Policy</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Info Section (Full Width) */}
      <div className="mt-16 sm:mt-24">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Description */}
          <div className="lg:col-span-7">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Product Description</h2>
            <div className="prose prose-slate prose-lg text-slate-600 leading-relaxed max-w-none">
              <p>{product.description}</p>
              {/* Placeholder for future rich text */}
              <br />
              <p>
                Experience the power and elegance of the {product.name}. Designed for professionals
                and creatives alike, this device delivers exceptional performance in a sleek,
                portable form factor.
              </p>
            </div>
          </div>

          {/* Tech Specs */}
          <div className="lg:col-span-5">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Technical Specifications</h2>
            {product.attributes && product.attributes.length > 0 ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 overflow-hidden">
                <dl className="divide-y divide-slate-200/50">
                  {product.attributes.map((attr, index) => (
                    <div key={index} className="grid grid-cols-3 gap-4 px-6 py-4">
                      <dt className="text-sm font-medium text-slate-900">{attr.name}</dt>
                      <dd className="col-span-2 text-sm text-slate-600">{attr.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : (
              <p className="text-slate-500 italic">No detailed specifications available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
