import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components';
import { getProductBySlug } from '@/lib/api';
import {
  formatPrice,
  getConditionLabel,
  getConditionColor,
  getDiscountPercentage,
} from '@/lib/utils';
import { ImageGallery } from './ImageGallery';
import { AddToCartButton } from './AddToCartButton';

interface ProductPageProps {
  params: {
    slug: string;
  };
}

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        {/* Image Gallery */}
        <div>
          <ImageGallery images={product.images || []} productName={product.name} />
        </div>

        {/* Product Info */}
        <div>
          {/* Brand & Category */}
          <div className="mb-2 flex items-center gap-2 text-sm text-secondary-500">
            {product.brand && <span>{product.brand.name}</span>}
            {product.brand && product.category && <span>•</span>}
            {product.category && <span>{product.category.name}</span>}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-secondary-900 sm:text-3xl">{product.name}</h1>

          {/* SKU */}
          <p className="mt-1 text-sm text-secondary-400">SKU: {product.sku}</p>

          {/* Condition Badge */}
          <div className="mt-4">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getConditionColor(product.condition)}`}
            >
              {getConditionLabel(product.condition)}
            </span>
          </div>

          {/* Price */}
          <div className="mt-6">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-secondary-900">
                {formatPrice(product.price)}
              </span>
              {product.compareAtPrice && (
                <>
                  <span className="text-xl text-secondary-400 line-through">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-sm font-semibold text-red-700">
                    Save {discountPercent}%
                  </span>
                </>
              )}
            </div>
            <p className="mt-1 text-sm text-secondary-500">VAT inclusive</p>
          </div>

          {/* Stock Status */}
          <div className="mt-6">
            {product.isInStock ? (
              <div className="flex items-center gap-2 text-green-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="font-medium">In Stock</span>
                {product.availableQuantity && product.availableQuantity <= 5 && (
                  <span className="text-sm text-secondary-500">
                    (Only {product.availableQuantity} left)
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-500">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <span className="font-medium">Out of Stock</span>
              </div>
            )}
          </div>

          {/* Add to Cart Button */}
          <div className="mt-8">
            <AddToCartButton
              productId={product.id}
              productName={product.name}
              isInStock={product.isInStock}
              maxQuantity={product.availableQuantity}
            />
            <p className="mt-2 text-center text-xs text-secondary-500">
              Free delivery on orders over KES 10,000
            </p>
          </div>

          {/* Warranty */}
          {product.warrantyMonths > 0 && (
            <div className="mt-6 flex items-center gap-3 rounded-lg bg-primary-50 p-4">
              <svg
                className="h-8 w-8 text-primary-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <div>
                <p className="font-semibold text-primary-900">
                  {product.warrantyMonths} Month Warranty
                </p>
                <p className="text-sm text-primary-700">Covered by TrustCart guarantee</p>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-secondary-900">Description</h2>
            <p className="mt-3 text-secondary-600 leading-relaxed">{product.description}</p>
          </div>

          {/* Specifications */}
          {product.attributes && product.attributes.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-secondary-900">Specifications</h2>
              <dl className="mt-4 divide-y divide-secondary-200">
                {product.attributes.map((attr, index) => (
                  <div key={index} className="flex py-3">
                    <dt className="w-1/3 text-sm font-medium text-secondary-500">{attr.name}</dt>
                    <dd className="w-2/3 text-sm text-secondary-900">{attr.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
