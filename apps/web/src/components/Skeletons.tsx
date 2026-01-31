export function ProductCardSkeleton() {
  return (
    <div className="card animate-pulse overflow-hidden p-0">
      {/* Image skeleton */}
      <div className="aspect-square bg-secondary-200" />

      {/* Content skeleton */}
      <div className="p-4">
        {/* Category */}
        <div className="mb-2 h-3 w-16 rounded bg-secondary-200" />

        {/* Title */}
        <div className="mb-2 h-4 w-full rounded bg-secondary-200" />
        <div className="mb-3 h-4 w-3/4 rounded bg-secondary-200" />

        {/* Badge */}
        <div className="mb-3 h-5 w-20 rounded-full bg-secondary-200" />

        {/* Price */}
        <div className="h-6 w-24 rounded bg-secondary-200" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CategoryCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl">
      <div className="aspect-[4/3] bg-secondary-200" />
    </div>
  );
}
