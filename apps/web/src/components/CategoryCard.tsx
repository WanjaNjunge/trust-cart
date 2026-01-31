import Link from 'next/link';
import Image from 'next/image';
import type { Category } from '@/lib/types';
import { getPlaceholderImage } from '@/lib/utils';

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group relative overflow-hidden rounded-xl bg-secondary-100"
    >
      <div className="aspect-[4/3]">
        <Image
          src={category.imageUrl || getPlaceholderImage(400, 300)}
          alt={category.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-110"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <h3 className="text-lg font-semibold">{category.name}</h3>
        <p className="text-sm text-white/80">{category.productCount} products</p>
      </div>
    </Link>
  );
}
