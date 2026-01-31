'use client';

interface Brand {
  id: string;
  name: string;
}

interface CategoryFiltersProps {
  brands: Brand[];
  currentBrandId?: string;
  currentCondition?: string;
  currentSort?: string;
}

export function CategoryFilters({
  brands,
  currentBrandId,
  currentCondition,
  currentSort,
}: CategoryFiltersProps): JSX.Element {
  const updateFilter = (key: string, value: string): void => {
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set(key, value);
    } else {
      url.searchParams.delete(key);
    }
    url.searchParams.delete('page');
    window.location.href = url.toString();
  };

  return (
    <>
      {/* Brand Filter */}
      <select
        defaultValue={currentBrandId || ''}
        onChange={(e) => updateFilter('brandId', e.target.value)}
        className="input w-auto py-1.5 text-sm"
      >
        <option value="">All Brands</option>
        {brands.map((brand) => (
          <option key={brand.id} value={brand.id}>
            {brand.name}
          </option>
        ))}
      </select>

      {/* Condition Filter */}
      <select
        defaultValue={currentCondition || ''}
        onChange={(e) => updateFilter('condition', e.target.value)}
        className="input w-auto py-1.5 text-sm"
      >
        <option value="">Any Condition</option>
        <option value="BRAND_NEW">Brand New</option>
        <option value="OPEN_BOX">Open Box</option>
        <option value="CERTIFIED_REFURBISHED">Certified Refurbished</option>
        <option value="EX_UK">Ex-UK</option>
        <option value="EX_USA">Ex-USA</option>
      </select>

      {/* Sort */}
      <select
        defaultValue={currentSort || ''}
        onChange={(e) => updateFilter('sort', e.target.value)}
        className="input w-auto py-1.5 text-sm"
      >
        <option value="">Newest</option>
        <option value="price">Price: Low to High</option>
        <option value="-price">Price: High to Low</option>
        <option value="name">Name: A to Z</option>
      </select>
    </>
  );
}
