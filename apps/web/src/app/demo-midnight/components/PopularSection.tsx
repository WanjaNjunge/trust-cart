'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useMotionValue, useMotionTemplate } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

// Reuse types from page.tsx (or approximate them if not exported)
interface Product {
  id: string;
  name: string;
  tagline: string;
  price: string;
  image: string;
  specs: string[];
  href: string;
}

// Cold Start Data (Reusing Hero Products)
const POPULAR_PRODUCTS: Product[] = [
  {
    id: 'macbook',
    name: 'MacBook Air M2',
    tagline: 'Apple Silicon Powerhouse',
    price: 'KES 149,990',
    image: 'https://ik.imagekit.io/nr5uqiflj/trustcart/products/macbook-air-m2.png?v=2',
    specs: ['M2 Chip', '8GB RAM', '256GB SSD'],
    href: '/products/macbook-air-m2',
  },
  {
    id: 'iphone',
    name: 'iPhone 15',
    tagline: 'Dynamic Island Design',
    price: 'KES 134,990',
    image: 'https://ik.imagekit.io/nr5uqiflj/trustcart/products/iphone-15.png?v=3',
    specs: ['A16 Bionic', '48MP Main', 'USB-C'],
    href: '/products/iphone-15-128gb',
  },
  {
    id: 'samsung',
    name: 'Galaxy S24 Ultra',
    tagline: 'Galaxy AI is Here',
    price: 'KES 179,990',
    image: 'https://ik.imagekit.io/nr5uqiflj/trustcart/products/samsung-s24-ultra.png?v=3',
    specs: ['Snapdragon 8', '200MP', 'S-Pen'],
    href: '/products/samsung-galaxy-s24-ultra',
  },
  // duplicating for carousel effect
  {
    id: 'dell-ultrasharp-27',
    name: 'Dell UltraSharp 27',
    tagline: '4K USB-C Hub Monitor',
    price: 'KES 85,000',
    image:
      'https://ik.imagekit.io/nr5uqiflj/trustcart/products/dell-ultrasharp-27.png?updatedAt=1769749809669',
    specs: ['4K UHD', 'IPS Black', 'USB-C Hub'],
    href: '/products/dell-ultrasharp-27',
  },
];

// Fallback image for the 4th item if it fails (using one of the others)
const FALLBACK_IMAGE = 'https://ik.imagekit.io/nr5uqiflj/trustcart/products/macbook-air-m2.png?v=2';

// WhatsApp Link Utility
const getWhatsAppLink = (product: Product) => {
  const message = `Hi TrustCart, I'm interested in the ${product.name} priced at ${product.price}. Is it available?`;
  return `https://wa.me/254700000000?text=${encodeURIComponent(message)}`;
};

function PopularCard({ product }: { product: Product }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      className="group relative flex-shrink-0 w-[280px] sm:w-[320px] snap-start"
      onMouseMove={onMouseMove}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {/* Glass Container */}
      <div className="relative h-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:border-slate-700 group-hover:shadow-2xl group-hover:shadow-blue-900/20">
        {/* Spotlight Gradient */}
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100"
          style={{
            background: useMotionTemplate`
              radial-gradient(
                650px circle at ${mouseX}px ${mouseY}px,
                rgba(59, 130, 246, 0.1),
                transparent 80%
              )
            `,
          }}
        />

        {/* Trending Badge */}
        <div className="absolute left-5 top-5 z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
            </span>
            Trending
          </span>
        </div>

        {/* Product Image */}
        <div className="relative mb-6 mt-8 flex aspect-square items-center justify-center">
          <div className="relative h-48 w-48 transition-transform duration-500 group-hover:scale-110">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-contain"
              onError={(e) => {
                // Simple fallback logic for demo
                e.currentTarget.src = FALLBACK_IMAGE;
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-3">
          <Link href={product.href} className="block">
            <h3 className="line-clamp-1 text-lg font-bold text-white transition-colors group-hover:text-blue-400">
              {product.name}
            </h3>
          </Link>

          {/* Quick Specs */}
          <div className="flex flex-wrap gap-2">
            {product.specs.slice(0, 3).map((spec) => (
              <span
                key={spec}
                className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 border border-slate-700/50"
              >
                {spec}
              </span>
            ))}
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 line-through">
                KES {Math.round(parseInt(product.price.replace(/\D/g, '')) * 1.1).toLocaleString()}
              </span>
              <span className="text-lg font-bold text-white bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent">
                {product.price}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* WhatsApp Button */}
              <a
                href={getWhatsAppLink(product)}
                target="_blank"
                rel="noopener noreferrer"
                className="group/wa flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366]/10 border border-[#25D366]/20 transition-all hover:bg-[#25D366]/20 hover:border-[#25D366]/50"
                title="Order on WhatsApp"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-[#25D366]">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </a>

              {/* Add Button */}
              <button className="group/btn relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 transition-all hover:w-24 hover:bg-blue-600">
                <Plus className="h-5 w-5 text-white transition-transform group-hover/btn:rotate-90 group-hover/btn:hidden" />
                <span className="hidden text-sm font-bold text-white group-hover/btn:inline-block">
                  Add
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function PopularSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = direction === 'left' ? -340 : 340;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="bg-[#020617] py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="mb-12 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white md:text-4xl">Popular Right Now</h2>
            <p className="mt-2 text-slate-400">High-demand items flying off the shelves.</p>
          </div>

          {/* Controls */}
          <div className="hidden gap-2 md:flex">
            <button
              onClick={() => scroll('left')}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-400 transition-colors hover:border-slate-700 hover:text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-400 transition-colors hover:border-slate-700 hover:text-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-8 pt-4 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Add products twice to create enough scrollable content for demo */}
          {[...POPULAR_PRODUCTS, ...POPULAR_PRODUCTS].map((product, idx) => (
            <PopularCard key={`${product.id}-${idx}`} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
