'use client';

interface SortSelectProps {
  currentSort?: string;
}

export function SortSelect({ currentSort }: SortSelectProps): JSX.Element {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const url = new URL(window.location.href);
    if (e.target.value) {
      url.searchParams.set('sort', e.target.value);
    } else {
      url.searchParams.delete('sort');
    }
    url.searchParams.delete('page');
    window.location.href = url.toString();
  };

  return (
    <select
      id="sort"
      name="sort"
      defaultValue={currentSort || ''}
      className="rounded-md border-slate-300 py-1.5 text-sm text-slate-700 shadow-sm focus:border-amber-500 focus:ring-amber-500"
      onChange={handleChange}
    >
      <option value="">Newest</option>
      <option value="price">Price: Low to High</option>
      <option value="-price">Price: High to Low</option>
      <option value="name">Name: A to Z</option>
    </select>
  );
}
