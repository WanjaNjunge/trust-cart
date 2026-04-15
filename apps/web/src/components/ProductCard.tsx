'use client';

import { useState } from 'react';
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
  const [imgSrc, setImgSrc] = useState(product.primaryImage?.url || getPlaceholderImage(400, 500));

  const discountPercent = product.compareAtPrice
    ? getDiscountPercentage(product.price, product.compareAtPrice)
    : 0;

  return (
    <Link href={`/products/${product.slug}`} className="group relative block h-full">
      <motion.div
        whileHover={{ y: -5 }}
        className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-md transition-all duration-300 hover:border-amber-300/50 hover:shadow-xl hover:shadow-amber-900/5"
      >
        {/* Image Container */}
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-slate-100">
          <Image
            src={imgSrc}
            alt={product.primaryImage?.altText || product.name}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            onError={() => setImgSrc(getPlaceholderImage(400, 500))}
          />

          {/* Subtle Overlay on Hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* Tags Overlay */}
          <div className="absolute left-3 top-3 flex flex-col gap-2">
            {discountPercent > 0 && (
              <span className="inline-flex items-center rounded-full border border-red-100 bg-white/95 px-2.5 py-1 text-xs font-bold text-red-600 shadow-sm backdrop-blur-md">
                -{discountPercent}%
              </span>
            )}
            {!product.isInStock && (
              <span className="inline-flex items-center rounded-full bg-slate-900/90 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md">
                Out of Stock
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="mt-4 flex flex-1 flex-col gap-1">
          <div className="flex items-start justify-between gap-4">
            <h3 className="line-clamp-2 text-base font-semibold text-slate-800 transition-colors group-hover:text-blue-600">
              {product.name}
            </h3>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900">{formatPrice(product.price)}</span>
            {product.compareAtPrice && (
              <span className="text-sm text-slate-400 line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>

          <div className="mt-auto pt-3 flex items-center gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium">
              {getConditionLabel(product.condition)}
            </span>
            {product.category && <span className="text-slate-400">• {product.category.name}</span>}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
