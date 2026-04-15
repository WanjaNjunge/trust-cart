'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { ProductImage } from '@/lib/types';
import { getPlaceholderImage } from '@/lib/utils';

interface ImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Use placeholder if no images
  const displayImages: ProductImage[] =
    images.length > 0
      ? images
      : [
        {
          id: 'placeholder',
          url: getPlaceholderImage(600, 600),
          altText: productName,
          sortOrder: 0,
          isPrimary: true,
        },
      ];

  // Safely get selected image with fallback
  const selectedImage = displayImages[selectedIndex] ?? displayImages[0];

  // Guard clause for TypeScript
  if (!selectedImage) {
    return null;
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = getPlaceholderImage(600, 600);
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <Image
          src={selectedImage.url}
          alt={selectedImage.altText || productName}
          fill
          className="object-contain p-4"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
          onError={handleImageError}
        />
      </div>

      {/* Thumbnails */}
      {displayImages.length > 1 && (
        <div className="grid grid-cols-5 gap-3">
          {displayImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={`relative aspect-square overflow-hidden rounded-xl bg-white border ${index === selectedIndex
                  ? 'border-amber-500 ring-2 ring-amber-200 ring-offset-2'
                  : 'border-slate-200 hover:border-amber-300'
                }`}
            >
              <Image
                src={image.url}
                alt={image.altText || `${productName} - Image ${index + 1}`}
                fill
                className="object-cover"
                sizes="100px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
