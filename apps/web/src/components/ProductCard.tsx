'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { Product } from '@/lib/types';
import {
  formatPrice,
  getConditionLabel,
  getDiscountPercentage,
  getPlaceholderImage,
} from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const discountPercent = product.compareAtPrice
    ? getDiscountPercentage(product.price, product.compareAtPrice)
    : 0;

  return (
    <Link href={`/products/${product.slug}`} className="group relative block h-full">
      <motion.div whileHover={{ y: -5 }} className="flex h-full flex-col gap-4">
        {/* Image Container */}
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-secondary-100">
          <Image
            src={product.primaryImage?.url || getPlaceholderImage(400, 500)}
            alt={product.primaryImage?.altText || product.name}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />

          {/* Tags Overlay */}
          <div className="absolute left-3 top-3 flex flex-col gap-2">
            {discountPercent > 0 && (
              <span className="inline-flex items-center rounded-full bg-destructive px-2.5 py-1 text-xs font-medium text-destructive-foreground backdrop-blur-md">
                -{discountPercent}%
              </span>
            )}
            {!product.isInStock && (
              <span className="inline-flex items-center rounded-full bg-black/80 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md">
                Out of Stock
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-1">
          <div className="flex items-start justify-between gap-4">
            <h3 className="line-clamp-2 text-base font-semibold text-foreground group-hover:text-primary transition-colors">
              {product.name}
            </h3>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-foreground">{formatPrice(product.price)}</span>
            {product.compareAtPrice && (
              <span className="text-sm text-muted-foreground line-through decoration-muted-foreground/50">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center rounded-md border border-border px-1.5 py-0.5 font-medium">
              {getConditionLabel(product.condition)}
            </span>
            {product.category && <span>{product.category.name}</span>}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
