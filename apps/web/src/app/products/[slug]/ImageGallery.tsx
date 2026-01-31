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

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square overflow-hidden rounded-xl bg-secondary-100">
        <Image
          src={selectedImage.url}
          alt={selectedImage.altText || productName}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
      </div>

      {/* Thumbnails */}
      {displayImages.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {displayImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={`relative aspect-square overflow-hidden rounded-lg ${
                index === selectedIndex
                  ? 'ring-2 ring-primary-500 ring-offset-2'
                  : 'hover:opacity-80'
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
