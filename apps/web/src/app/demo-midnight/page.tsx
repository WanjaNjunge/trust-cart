'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle2, Shield, Truck } from 'lucide-react';
import { MidnightHeader } from './components/MidnightHeader';
import { MidnightFooter } from './components/MidnightFooter';
import { PopularSection } from './components/PopularSection';
import { CategoryRail } from './components/CategoryRail';

const IMAGEKIT_BASE = 'https://ik.imagekit.io/nr5uqiflj/trustcart';

// --- Theme Constants ---
// Midnight Executive Palette
const THEME = {
  bg: 'bg-[#020617]', // Midnight Blue
  surface: 'bg-[#0f172a]', // Slate 900
  surfaceHighlight: 'bg-[#1e293b]', // Slate 800
  textPrimary: 'text-white',
  textSecondary: 'text-slate-400',
  accentGold: 'from-amber-600 via-amber-500 to-yellow-400', // Metallic Gold Gradient
  accentBlue: 'text-blue-500', // Trust Blue
  border: 'border-slate-800',
};

interface FeaturedProduct {
  id: string;
  name: string;
  tagline: string;
  price: string;
  image: string;
  specs: string[];
  href: string;
}

const FEATURED_PRODUCTS: FeaturedProduct[] = [
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
    tagline: 'Dynamic Island. All new design.',
    price: 'KES 134,990',
    image: `${IMAGEKIT_BASE}/products/iphone-15.png?v=3`,
    specs: ['A16 Bionic', '48MP Camera', 'USB-C'],
    href: '/products/iphone-15-128gb',
  },
  {
    id: 'samsung',
    name: 'Galaxy S24 Ultra',
    tagline: 'The ultimate Galaxy experience',
    price: 'KES 179,990',
    image: `${IMAGEKIT_BASE}/products/samsung-s24-ultra.png?v=3`,
    specs: ['Snapdragon 8 Gen 3', '200MP Camera', 'S-Pen'],
    href: '/products/samsung-galaxy-s24-ultra',
  },
];

const CATEGORIES = [
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
    href: '/categories/mobile',
    count: '30+ Models',
  },
  {
    name: 'Audio',
    image:
      'https://ik.imagekit.io/nr5uqiflj/trustcart/banners/collections-audio.png?updatedAt=1769918312889',
    href: '/categories/audio',
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

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
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

function HeroSection() {
  const [activeProduct, setActiveProduct] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveProduct((prev) => (prev + 1) % FEATURED_PRODUCTS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const product = FEATURED_PRODUCTS[activeProduct];

  if (!product) return null;

  return (
    <section
      className={`relative flex min-h-screen flex-col justify-center overflow-hidden ${THEME.bg} pt-20`}
    >
      {/* Background Ambient Glow (Deep Royal Blue) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(30,58,138,0.15),transparent_70%)]" />

      {/* Subtle Grid */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />

      {/* Navigation Rail (Top) */}
      <div className="relative z-30 w-full">
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
            <motion.div variants={fadeInUp} className="mb-6 inline-flex">
              <span
                className={`inline-flex items-center gap-2 rounded-full border border-blue-900 bg-blue-950/30 px-4 py-2 text-sm text-blue-200 backdrop-blur-sm`}
              >
                <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                Featured Product
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-5xl font-bold leading-[1.1] tracking-tight text-white md:text-6xl lg:text-7xl"
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={product.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="block"
                >
                  {product.name}
                </motion.span>
              </AnimatePresence>
            </motion.h1>

            <motion.div variants={fadeInUp} className="mt-6 max-w-lg text-lg text-slate-400">
              <p className="font-medium text-white mb-2">{product.tagline}</p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                {product.specs.map((spec) => (
                  <span
                    key={spec}
                    className="inline-flex items-center rounded bg-slate-800/50 px-2.5 py-0.5 text-sm text-slate-300 border border-slate-700"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="mt-10 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start"
            >
              <Link
                href={product.href}
                className={`group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r ${THEME.accentGold} px-8 py-4 text-lg font-bold text-black shadow-[0_0_20px_rgba(217,119,6,0.2)] transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(250,204,21,0.4)]`}
              >
                Buy Now - {product.price}
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>

              <button className="inline-flex items-center justify-center gap-2 rounded-full border border-green-900/50 bg-green-900/10 px-8 py-4 text-lg font-medium text-green-400 transition-all hover:border-green-500 hover:bg-green-900/20 hover:text-green-300">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
                </span>
                Order on WhatsApp
              </button>
            </motion.div>

            {/* Trust Indicators (Blue) */}
            <motion.div
              variants={fadeInUp}
              className="mt-12 flex items-center justify-center gap-8 text-sm text-slate-500 lg:justify-start"
            >
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                <span>2 Year Warranty</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
                <span>Verified Authentic</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Visual - The Product Stage */}
          <div className="relative flex items-center justify-center">
            {/* The "Stage" Light */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-blue-900/20 blur-[100px]" />

            {/* Rotating Rings (Subtle Technical Feel) */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
              className="absolute h-[550px] w-[550px] rounded-full border border-dashed border-slate-800 opacity-50"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
              className="absolute h-[450px] w-[450px] rounded-full border border-slate-800 opacity-80"
            />

            {/* Product Image Container */}
            <div className="relative h-[380px] w-[380px] md:h-[480px] md:w-[480px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="relative h-full w-full"
                >
                  <motion.div
                    animate={{ y: [-10, 10, -10] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    className="relative h-full w-full"
                  >
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 380px, 480px"
                      className="object-contain drop-shadow-[0_25px_50px_rgba(0,0,0,0.5)]"
                      priority
                    />
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Floating Info Card (Glass) */}
            <AnimatePresence mode="wait">
              <motion.div
                key={product.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute -right-4 bottom-10 hidden lg:block"
              >
                <div className="w-64 rounded-xl border border-slate-800 bg-slate-950/80 p-5 backdrop-blur-md">
                  <h3 className="text-lg font-bold text-white">{product.name}</h3>
                  <div className="mt-3 space-y-2">
                    {product.specs.map((spec) => (
                      <div key={spec} className="flex items-center gap-2 text-sm text-slate-400">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        {spec}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 border-t border-slate-800 pt-3">
                    <p className="text-sm text-slate-500">Price</p>
                    <p
                      className={`text-xl font-bold bg-gradient-to-r ${THEME.accentGold} bg-clip-text text-transparent`}
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
    <section className={`relative ${THEME.bg} py-24`}>
      <div className="container mx-auto px-4">
        <div className="mb-16 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white md:text-4xl">Executive Collections</h2>
            <p className={`mt-2 ${THEME.textSecondary}`}>Curated for the professional.</p>
          </div>
          <Link
            href="/products"
            className="group flex items-center gap-2 text-blue-400 transition-colors hover:text-blue-300"
          >
            View All{' '}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="group relative block aspect-[3/4] overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 transition-all hover:border-blue-800"
            >
              <div className="absolute inset-0">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover opacity-60 transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              </div>

              <div className="absolute bottom-0 left-0 w-full p-6">
                <h3 className="text-xl font-bold text-white">{category.name}</h3>
                <p className="mt-1 text-sm text-slate-400">{category.count}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section className="relative bg-slate-950 py-24 border-t border-slate-900">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {[
            {
              icon: Shield,
              title: 'Authorized Warranty',
              desc: '12-24 Months official manufacturer warranty on all devices.',
            },
            {
              icon: Truck,
              title: 'Secure Logistics',
              desc: 'Insured shipping across Kenya with trusted courier partners.',
            },
            {
              icon: CheckCircle2,
              title: 'Verified Authentic',
              desc: 'Triple-checked supply chain. No grey imports, ever.',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="flex gap-4 rounded-2xl border border-slate-900 bg-slate-900/30 p-6"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-950/50 text-blue-500">
                <feature.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MidnightThemePage() {
  // Hide global layout elements for this POC using aggressive CSS
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      #global-trustcart-header, 
      #global-trustcart-footer,
      body > header,
      body > footer { 
        display: none !important; 
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <main className={`min-h-screen ${THEME.bg}`}>
      <MidnightHeader />
      <HeroSection />
      <CategoriesSection />
      <PopularSection />
      <FeaturesSection />
      <MidnightFooter />
    </main>
  );
}

export default MidnightThemePage;
