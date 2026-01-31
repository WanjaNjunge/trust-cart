'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { Category, Brand } from '@/lib/types';
import { getConditionLabel } from '@/lib/utils';

interface FilterSidebarProps {
  categories: Category[];
  brands: Brand[];
  currentFilters: {
    categoryId?: string;
    brandId?: string;
    condition?: string;
    priceMin?: string;
    priceMax?: string;
  };
}

const CONDITIONS = ['BRAND_NEW', 'OPEN_BOX', 'CERTIFIED_REFURBISHED', 'EX_UK', 'EX_USA'] as const;

export function FilterSidebar({ categories, brands, currentFilters }: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    // Reset to page 1 when filtering
    params.delete('page');

    router.push(`/products?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/products');
  };

  const hasActiveFilters = Object.values(currentFilters).some(Boolean);

  return (
    <div className="space-y-6">
      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="w-full rounded-lg border border-secondary-300 px-4 py-2 text-sm font-medium text-secondary-700 hover:bg-secondary-50"
        >
          Clear All Filters
        </button>
      )}

      {/* Categories */}
      <div>
        <h3 className="mb-3 font-semibold text-secondary-900">Category</h3>
        <div className="space-y-2">
          <button
            onClick={() => updateFilter('categoryId', undefined)}
            className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
              !currentFilters.categoryId
                ? 'bg-primary-50 font-medium text-primary-700'
                : 'text-secondary-600 hover:bg-secondary-50'
            }`}
          >
            All Categories
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => updateFilter('categoryId', category.id)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                currentFilters.categoryId === category.id
                  ? 'bg-primary-50 font-medium text-primary-700'
                  : 'text-secondary-600 hover:bg-secondary-50'
              }`}
            >
              {category.name}
              <span className="ml-1 text-secondary-400">({category.productCount})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div>
        <h3 className="mb-3 font-semibold text-secondary-900">Brand</h3>
        <div className="space-y-2">
          <button
            onClick={() => updateFilter('brandId', undefined)}
            className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
              !currentFilters.brandId
                ? 'bg-primary-50 font-medium text-primary-700'
                : 'text-secondary-600 hover:bg-secondary-50'
            }`}
          >
            All Brands
          </button>
          {brands.map((brand) => (
            <button
              key={brand.id}
              onClick={() => updateFilter('brandId', brand.id)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                currentFilters.brandId === brand.id
                  ? 'bg-primary-50 font-medium text-primary-700'
                  : 'text-secondary-600 hover:bg-secondary-50'
              }`}
            >
              {brand.name}
              <span className="ml-1 text-secondary-400">({brand.productCount})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Condition */}
      <div>
        <h3 className="mb-3 font-semibold text-secondary-900">Condition</h3>
        <div className="space-y-2">
          <button
            onClick={() => updateFilter('condition', undefined)}
            className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
              !currentFilters.condition
                ? 'bg-primary-50 font-medium text-primary-700'
                : 'text-secondary-600 hover:bg-secondary-50'
            }`}
          >
            Any Condition
          </button>
          {CONDITIONS.map((condition) => (
            <button
              key={condition}
              onClick={() => updateFilter('condition', condition)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                currentFilters.condition === condition
                  ? 'bg-primary-50 font-medium text-primary-700'
                  : 'text-secondary-600 hover:bg-secondary-50'
              }`}
            >
              {getConditionLabel(condition)}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="mb-3 font-semibold text-secondary-900">Price Range</h3>
        <div className="space-y-3">
          <div>
            <label htmlFor="priceMin" className="text-xs text-secondary-500">
              Min (KES)
            </label>
            <input
              type="number"
              id="priceMin"
              placeholder="0"
              defaultValue={currentFilters.priceMin}
              className="input mt-1 text-sm"
              onBlur={(e) => updateFilter('priceMin', e.target.value || undefined)}
            />
          </div>
          <div>
            <label htmlFor="priceMax" className="text-xs text-secondary-500">
              Max (KES)
            </label>
            <input
              type="number"
              id="priceMax"
              placeholder="Any"
              defaultValue={currentFilters.priceMax}
              className="input mt-1 text-sm"
              onBlur={(e) => updateFilter('priceMax', e.target.value || undefined)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
