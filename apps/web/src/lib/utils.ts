import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ProductCondition } from './types';

/**
 * Merge Tailwind classes handling conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format price in Kenyan Shillings
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Get human-readable condition label
 */
export function getConditionLabel(condition: ProductCondition): string {
  const labels: Record<ProductCondition, string> = {
    BRAND_NEW: 'Brand New',
    OPEN_BOX: 'Open Box',
    CERTIFIED_REFURBISHED: 'Certified Refurbished',
    EX_UK: 'Ex-UK',
    EX_USA: 'Ex-USA',
  };
  return labels[condition] || condition;
}

/**
 * Get condition badge color classes
 */
export function getConditionColor(condition: ProductCondition): string {
  const colors: Record<ProductCondition, string> = {
    BRAND_NEW: 'bg-green-100 text-green-800',
    OPEN_BOX: 'bg-yellow-100 text-yellow-800',
    CERTIFIED_REFURBISHED: 'bg-blue-100 text-blue-800',
    EX_UK: 'bg-purple-100 text-purple-800',
    EX_USA: 'bg-indigo-100 text-indigo-800',
  };
  return colors[condition] || 'bg-gray-100 text-gray-800';
}

/**
 * Calculate discount percentage
 */
export function getDiscountPercentage(price: number, compareAtPrice: number): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Generate placeholder image URL
 */
export function getPlaceholderImage(width = 400, height = 400): string {
  return `https://placehold.co/${width}x${height}/e2e8f0/64748b?text=No+Image`;
}

/**
 * Build URL with query parameters
 */
export function buildUrl(
  basePath: string,
  params: Record<string, string | number | boolean | undefined>,
): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}
