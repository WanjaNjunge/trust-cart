'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Shield,
  Truck,
  Headphones,
  Award,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { CategoryRail } from '@/components/CategoryRail';

const IMAGEKIT_BASE = 'https://ik.imagekit.io/nr5uqiflj/trustcart';

// --- Theme Constants (Local for stability) ---
const THEME_DAWN = {
  bg: 'bg-transparent', // Handled by Layout
  surface: 'bg-white',
  textPrimary: 'text-slate-900',
  textSecondary: 'text-slate-500',
  accentGold: 'from-amber-400 via-yellow-400 to-amber-500',
  sunlight: 'from-orange-50/50 via-amber-50/30 to-blue-50/10',
};

// Data
const FEATURED_PRODUCTS = [
  {
    id: 'macbook',
    name: 'MacBook Air M2',
    tagline: 'Supercharged by Apple Silicon',
    price: 'KES 149,990',
    image: `${IMAGEKIT_BASE}/products/macbook-air-m2.png?v=2`,
    specs: ['M2 Chip', '8GB RAM', '256GB SSD'],
    href: '/products/macbook-air-m2',
  },
  {
    id: 'iphone',
    name: 'iPhone 15',
    tagline: 'Dynamic Island Design',
    price: 'KES 134,990',
    image: `${IMAGEKIT_BASE}/products/iphone-15.png?v=3`,
    specs: ['A16 Bionic', '48MP Main', 'USB-C'],
    href: '/products/iphone-15-128gb',
  },
  {
    id: 'samsung',
    name: 'Galaxy S24 Ultra',
    tagline: 'Galaxy AI is Here',
    price: 'KES 179,990',
    image: `${IMAGEKIT_BASE}/products/samsung-s24-ultra.png?v=3`,
    specs: ['Snapdragon 8', '200MP', 'S-Pen'],
    href: '/products/samsung-galaxy-s24-ultra',
  },
  {
    id: 'dell-ultrasharp-27',
    name: 'Dell UltraSharp 27',
    tagline: '4K USB-C Hub Monitor',
    price: 'KES 85,000',
    image: `${IMAGEKIT_BASE}/products/dell-ultrasharp-27.png?updatedAt=1769749809669`,
    specs: ['4K UHD', 'IPS Black', 'USB-C Hub'],
    href: '/products/dell-u2722d',
  },
];

const CATEGORIES_GRID = [
  {
    name: 'Laptops',
    image:
      'https://ik.imagekit.io/nr5uqiflj/trustcart/banners/collections-laptops.png?updatedAt=1769918312349',
    href: '/categories/laptops',
    count: '24+ Models',
  },
  {
    name: 'Mobile Phones & Tablets',
    image:
      'https://ik.imagekit.io/nr5uqiflj/trustcart/banners/collections-mobile-phones-tablets.png?updatedAt=1769918311093',
    href: '/categories/mobile', // Reverting to match demo request
    count: '30+ Models',
  },
  {
    name: 'Audio',
    image:
      'https://ik.imagekit.io/nr5uqiflj/trustcart/banners/collections-audio.png?updatedAt=1769918312889',
    href: '/categories/audio', // Reverting to match demo request
    count: '15+ Models',
  },
  {
    name: 'Accessories',
    image:
      'https://ik.imagekit.io/nr5uqiflj/trustcart/banners/collections-accessories.png?updatedAt=1769918313147',
    href: '/categories/accessories',
    count: '50+ Items',
  },
];

// Animation Variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

// --- Components ---

function HeroSection() {
  const [activeProduct, setActiveProduct] = useState(0);

  // Auto-rotate logic from Dawn Theme
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveProduct((prev) => (prev + 1) % FEATURED_PRODUCTS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const product = FEATURED_PRODUCTS[activeProduct];

  if (!product) return null;

  return (
    <section className="relative flex min-h-[90vh] flex-col justify-center overflow-hidden pt-20">
      {/* Navigation Rail */}
      <div className="relative z-30 w-full mb-2">
        <CategoryRail />
      </div>

      <div className="container relative z-10 mx-auto grow px-4">
        <div className="grid h-full items-center gap-16 pb-20 lg:grid-cols-2">
          {/* Left Content */}
          <motion.div
            key={product.id}
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center lg:text-left"
          >
            {/* Trust Pill Badge */}
            <motion.div
              variants={fadeInUp}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-3 py-1.5 backdrop-blur-sm shadow-sm"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500"></span>
              </span>
              <span className="text-xs font-bold tracking-wide text-slate-700 uppercase">
                Official Retailer
              </span>
              <CheckCircle2 className="h-3.5 w-3.5 text-amber-500 ml-1" />
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="mb-6 text-5xl font-bold tracking-tight text-slate-900 md:text-7xl lg:text-8xl"
            >
              <span className="bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent">
                {product.name}
              </span>
            </motion.h1>

            <motion.div
              variants={fadeInUp}
              className="mt-8 max-w-lg text-lg text-slate-600 mx-auto lg:mx-0"
            >
              <p className="font-medium text-slate-800 mb-4 text-xl">{product.tagline}</p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                {product.specs.map((spec) => (
                  <span
                    key={spec}
                    className="inline-flex items-center rounded-md bg-white px-3 py-1.5 text-sm font-medium text-slate-600 border border-slate-200 shadow-sm ring-1 ring-slate-900/5"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:justify-start"
            >
              {/* Golden Action Button */}
              <Link
                href={product.href}
                className={`group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-gradient-to-r ${THEME_DAWN.accentGold} px-10 py-4 text-lg font-bold text-slate-900 shadow-xl shadow-amber-500/20 transition-all hover:scale-105 hover:shadow-amber-500/40`}
              >
                <span>Buy Now</span>
                <span className="block h-5 w-px bg-slate-900/10" />
                <span>{product.price}</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>

              {/* Order via WhatsApp [RESTORED] */}
              <button className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-8 py-4 text-lg font-medium text-slate-600 transition-all hover:border-green-500 hover:text-green-600 hover:shadow-lg hover:shadow-green-500/10">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
                </span>
                Order via WhatsApp
              </button>
            </motion.div>

            {/* Carousel Indicators [RESTORED PILL STYLE] */}
            <div className="mt-12 flex justify-center gap-3 lg:justify-start">
              {FEATURED_PRODUCTS.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setActiveProduct(i)}
                  className={`h-2 rounded-full transition-all ${i === activeProduct ? 'w-8 bg-blue-600' : 'w-2 bg-slate-300 hover:bg-blue-400'
                    }`}
                />
              ))}
            </div>
          </motion.div>

          {/* Right Visual */}
          <div className="relative flex items-center justify-center">
            {/* Background Decoration (Light Gradient Blob) [RESTORED] */}
            <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-blue-100 to-purple-100 opacity-70 blur-3xl" />

            <AnimatePresence mode="wait">
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                transition={{ duration: 0.5 }}
                className="relative w-full max-w-[500px]"
              >
                <Image
                  src={product.image}
                  alt={product.name}
                  width={600}
                  height={600}
                  priority
                  className="object-contain drop-shadow-2xl"
                />

                {/* Floating Metric Card - Light Glass [RESTORED] */}
                <div className="absolute -bottom-6 -right-6 hidden sm:block">
                  <div className="rounded-2xl border border-white/50 bg-white/60 p-4 backdrop-blur-xl shadow-xl shadow-slate-200/50">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Best Price
                    </p>
                    <p
                      className={`text-xl font-bold bg-gradient-to-r ${THEME_DAWN.accentGold} bg-clip-text text-transparent`}
                    >
                      {product.price}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoriesSection() {
  return (
    <section className={`relative py-24 border-t border-slate-100 bg-white/50`}>
      {/* Background pattern for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(at_top_right,rgba(255,255,255,1),transparent)]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="mb-16 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">Executive Collections</h2>
            <p className={`mt-2 ${THEME_DAWN.textSecondary}`}>Curated for the professional.</p>
          </div>
          <Link
            href="/products"
            className="group flex items-center gap-2 text-blue-600 transition-colors hover:text-blue-700"
          >
            View All{' '}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES_GRID.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="group relative block aspect-[3/4] overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:border-blue-400 hover:shadow-xl hover:shadow-blue-100"
            >
              <div className="absolute inset-0">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover opacity-90 transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
              </div>

              <div className="absolute bottom-0 left-0 w-full p-6">
                <h3 className="text-xl font-bold text-white">{category.name}</h3>
                <p className="mt-1 text-sm text-slate-200">{category.count}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

const getWhatsAppLink = (product: { name: string; price: string }) => {
  const message = `Hi TrustCart, I'm interested in the ${product.name} priced at ${product.price}. Is it available?`;
  return `https://wa.me/254700000000?text=${encodeURIComponent(message)}`;
};
const FALLBACK_IMAGE = 'https://ik.imagekit.io/nr5uqiflj/trustcart/products/macbook-air-m2.png?v=2';

function PopularCard({ product }: { product: (typeof FEATURED_PRODUCTS)[0] }) {
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
      {/* Light Glass Container with "Crisp Glass" Effect */}
      <div className="relative h-full overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm ring-1 ring-slate-900/5 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-amber-200/50 group-hover:shadow-xl group-hover:shadow-amber-900/5">
        {/* Spotlight Gradient (Warm Golden Glow) */}
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100"
          style={{
            background: useMotionTemplate`
                radial-gradient(
                  650px circle at ${mouseX}px ${mouseY}px,
                  rgba(251, 191, 36, 0.05),
                  transparent 80%
                )
              `,
          }}
        />

        {/* Trending Badge */}
        <div className="absolute left-5 top-5 z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
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
            {/* Light Blob Background */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-purple-100 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-contain"
              onError={(e) => {
                e.currentTarget.src = FALLBACK_IMAGE;
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-3">
          <div className="text-xs font-medium uppercase tracking-wider text-slate-400">
            TrustCart Selection
          </div>

          <Link href={product.href} className="block">
            <h3 className="line-clamp-1 text-lg font-bold text-slate-900 transition-colors group-hover:text-blue-600">
              {product.name}
            </h3>
          </Link>

          {/* Quick Specs */}
          <div className="flex flex-wrap gap-2">
            {product.specs.slice(0, 3).map((spec: string) => (
              <span
                key={spec}
                className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 border border-slate-200"
              >
                {spec}
              </span>
            ))}
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 line-through">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                KES {Math.round(parseInt(product.price.replace(/\D/g, '')) * 1.1).toLocaleString()}
              </span>
              <span
                className={`text-lg font-bold bg-gradient-to-r ${THEME_DAWN.accentGold} bg-clip-text text-transparent`}
              >
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
              <button className="group/btn relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 transition-all hover:w-24 hover:bg-blue-600">
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

function PopularSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = direction === 'left' ? -340 : 340;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="bg-slate-50 py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="mb-12 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">Popular Right Now</h2>
            <p className="mt-2 text-slate-500">High-demand items flying off the shelves.</p>
          </div>

          {/* Controls */}
          <div className="hidden gap-2 md:flex">
            <button
              onClick={() => scroll('left')}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-900 shadow-sm"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-900 shadow-sm"
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
          {[...FEATURED_PRODUCTS, ...FEATURED_PRODUCTS].map((product, idx) => (
            <PopularCard key={`${product.id}-${idx}`} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section className="relative bg-white py-24 border-t border-slate-100">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Award,
              title: 'Genuine Products',
              desc: 'Authorized dealer. 100% authentic products with full warranty.',
            },
            {
              icon: Truck,
              title: 'Express Delivery',
              desc: 'Same-day delivery in Nairobi. Next-day countrywide.',
            },
            {
              icon: Headphones,
              title: 'Expert Support',
              desc: 'Professional setup and dedicated after-sales support.',
            },
            {
              icon: Shield,
              title: 'Warranty Coverage',
              desc: 'Official manufacturer warranty on all devices.',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-6 transition-all hover:border-blue-100 hover:bg-blue-50/30 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <feature.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LocationSection() {
  return (
    <section className="relative bg-slate-50 pb-24 border-t border-slate-200">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">
            Visit Our Experience Center
          </h2>
          <p className="mt-2 text-slate-500">Silicon Savannah Technologies, Nairobi</p>
        </div>

        {/* Map Container - Light Theme Style (White border, soft shadow) */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.819917806043!2d36.81520447496564!3d-1.282924598704944!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f10d227976e19%3A0x4688c7b7972df253!2sSilicon%20Savannah%20Technologies!5e0!3m2!1sen!2ske!4v1706780000000!5m2!1sen!2ske"
            width="100%"
            height="450"
            style={{ border: 0, opacity: 1 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full"
          ></iframe>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            Biashara Street, After 40 Plaza • Open Mon-Sat 8AM - 6PM
          </p>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <CategoriesSection />
      <PopularSection />
      <FeaturesSection />
      <LocationSection />
    </main>
  );
}
