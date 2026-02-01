'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Truck,
  Shield,
  Headphones,
  ChevronRight,
  Star,
  Zap,
  ArrowRight,
} from 'lucide-react';

const IMAGEKIT_BASE = 'https://ik.imagekit.io/nr5uqiflj/trustcart';

interface FeaturedProduct {
  id: string;
  name: string;
  tagline: string;
  price: string;
  image: string;
  gradient: string;
  glow: string;
  href: string;
}

const FEATURED_PRODUCTS: FeaturedProduct[] = [
  {
    id: 'macbook',
    name: 'MacBook Air M2',
    tagline: 'Supercharged by Apple Silicon',
    price: 'KES 149,990',
    image: `${IMAGEKIT_BASE}/products/macbook-air-m2.png?v=2`,
    gradient: 'from-blue-600 to-indigo-900',
    glow: 'rgba(59, 130, 246, 0.4)',
    href: '/products/macbook-air-m2',
  },
  {
    id: 'iphone',
    name: 'iPhone 15',
    tagline: 'Dynamic Island. All new design.',
    price: 'KES 134,990',
    image: `${IMAGEKIT_BASE}/products/iphone-15.png?v=3`,
    gradient: 'from-purple-600 to-pink-900',
    glow: 'rgba(168, 85, 247, 0.4)',
    href: '/products/iphone-15-128gb',
  },
  {
    id: 'samsung',
    name: 'Galaxy S24 Ultra',
    tagline: 'The ultimate Galaxy experience',
    price: 'KES 179,990',
    image: `${IMAGEKIT_BASE}/products/samsung-s24-ultra.png?v=3`,
    gradient: 'from-emerald-600 to-teal-900',
    glow: 'rgba(16, 185, 129, 0.4)',
    href: '/products/samsung-galaxy-s24-ultra',
  },
];

interface Category {
  name: string;
  image: string;
  href: string;
  count: string;
}

const CATEGORIES: Category[] = [
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

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

function HeroSection() {
  const [activeProduct, setActiveProduct] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveProduct((prev) => (prev + 1) % FEATURED_PRODUCTS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const product = FEATURED_PRODUCTS[activeProduct];

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black pt-20">
      <AnimatePresence mode="wait">
        <motion.div
          key={product.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="pointer-events-none absolute inset-0"
        >
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 30% 50%, ${product.glow}, transparent 50%)`,
            }}
          />
        </motion.div>
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="container relative z-10 mx-auto px-4">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center lg:text-left"
          >
            <motion.div variants={fadeInUp} className="mb-6 inline-flex">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-400 backdrop-blur-sm">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                New Arrivals 2026
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-5xl font-bold leading-[1.1] tracking-tight text-white md:text-6xl lg:text-7xl"
            >
              Premium Tech
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
                Delivered Fast.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="mx-auto mt-6 max-w-lg text-lg text-zinc-400 lg:mx-0"
            >
              Experience the future of tech shopping. Authentic devices, secure M-Pesa payments, and
              same-day delivery across Nairobi.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="mt-8 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start"
            >
              <Link
                href="/products"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-semibold text-black transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]"
              >
                Shop Now
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/categories/laptops"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-8 py-4 text-lg font-medium text-white transition-all hover:border-white/40 hover:bg-white/5"
              >
                Explore Laptops
              </Link>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="mt-12 flex items-center justify-center gap-8 text-sm text-zinc-500 lg:justify-start"
            >
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Genuine Products</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                <span>Fast Delivery</span>
              </div>
            </motion.div>
          </motion.div>

          <div className="relative flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
              className="absolute h-[400px] w-[400px] rounded-full border border-dashed border-white/10 md:h-[500px] md:w-[500px]"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
              className="absolute h-[320px] w-[320px] rounded-full border border-white/5 md:h-[400px] md:w-[400px]"
            />

            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className={`absolute h-[300px] w-[300px] rounded-full bg-gradient-to-br ${product.gradient} opacity-30 blur-3xl md:h-[380px] md:w-[380px]`}
            />

            {/* Circular Product Container */}
            <div className="relative h-[320px] w-[320px] md:h-[420px] md:w-[420px]">
              {/* Outer glow ring */}
              <div
                className={`absolute inset-0 rounded-full bg-gradient-to-br ${product.gradient} opacity-20 blur-xl`}
              />

              {/* Main circular container */}
              <div className="absolute inset-4 overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-zinc-900/80 to-black/60 backdrop-blur-sm">
                {/* Inner gradient overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/5" />

                {/* Product Image */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="relative h-full w-full"
                  >
                    <motion.div
                      animate={{ y: [-8, 8, -8] }}
                      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                      className="relative flex h-full w-full items-center justify-center p-8"
                    >
                      <div className="relative h-full w-full">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 280px, 380px"
                          className="object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                          priority
                        />
                      </div>
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute -bottom-4 left-1/2 min-w-[280px] -translate-x-1/2 rounded-2xl border border-white/10 bg-zinc-900/80 px-6 py-4 backdrop-blur-xl"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">{product.name}</h3>
                    <p className="text-sm text-zinc-500">{product.tagline}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-400">{product.price}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="absolute -bottom-16 left-1/2 flex -translate-x-1/2 gap-3">
              {FEATURED_PRODUCTS.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setActiveProduct(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === activeProduct ? 'w-8 bg-white' : 'w-2 bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoriesSection() {
  return (
    <section className="relative bg-black py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={staggerContainer}
          className="mb-16 text-center"
        >
          <motion.h2 variants={fadeInUp} className="text-4xl font-bold text-white md:text-5xl">
            Shop by Category
          </motion.h2>
          <motion.p variants={fadeInUp} className="mt-4 text-lg text-zinc-400">
            Explore our curated selection of premium tech
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={staggerContainer}
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          {CATEGORIES.map((category) => (
            <motion.div key={category.name} variants={scaleIn}>
              <Link
                href={category.href}
                className="group relative block aspect-[4/5] overflow-hidden rounded-3xl border border-white/5 bg-zinc-900 transition-all hover:border-white/20 hover:shadow-2xl"
              >
                <div className="absolute inset-0">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover opacity-60 transition-all duration-500 group-hover:scale-105 group-hover:opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                </div>

                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  <h3 className="text-2xl font-bold text-white">{category.name}</h3>
                  <p className="mt-1 text-sm text-zinc-400">{category.count}</p>
                  <div className="mt-4 flex items-center gap-2 text-white/70 transition-colors group-hover:text-white">
                    <span className="text-sm font-medium">Explore</span>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Shield,
      title: '100% Authentic',
      description: 'Every product verified genuine with manufacturer warranty',
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      icon: Truck,
      title: 'Fast Delivery',
      description: 'Same-day delivery in Nairobi, next-day countrywide',
      gradient: 'from-emerald-500 to-emerald-600',
    },
    {
      icon: Zap,
      title: 'Secure Payments',
      description: 'Pay securely via M-Pesa STK Push or Pay on Delivery',
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      icon: Headphones,
      title: '24/7 Support',
      description: 'Expert support team ready to help anytime',
      gradient: 'from-purple-500 to-purple-600',
    },
  ];

  return (
    <section className="relative bg-zinc-950 py-24">
      <div className="absolute inset-0 bg-gradient-to-b from-black to-zinc-950" />

      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={staggerContainer}
          className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={fadeInUp}
              className="group relative rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all hover:border-white/10"
            >
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} transition-transform group-hover:scale-110`}
              >
                <feature.icon className="h-6 w-6 text-white" />
              </div>

              <h3 className="mb-2 text-lg font-semibold text-white">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-zinc-500">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="relative overflow-hidden bg-black py-24">
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2">
          <Image
            src={`${IMAGEKIT_BASE}/backgrounds/bg-orb-blue.png`}
            alt=""
            fill
            sizes="600px"
            className="object-contain opacity-30 blur-2xl"
          />
        </div>
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="mx-auto max-w-3xl text-center"
        >
          <motion.h2 variants={fadeInUp} className="text-4xl font-bold text-white md:text-5xl">
            Ready to upgrade your tech?
          </motion.h2>
          <motion.p variants={fadeInUp} className="mt-6 text-xl text-zinc-400">
            Join thousands of satisfied customers across Kenya. Shop premium electronics with
            confidence.
          </motion.p>
          <motion.div
            variants={fadeInUp}
            className="mt-10 flex flex-col justify-center gap-4 sm:flex-row"
          >
            <Link
              href="/products"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 px-8 py-4 text-lg font-semibold text-white transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(59,130,246,0.3)]"
            >
              <ShoppingBag className="h-5 w-5" />
              Start Shopping
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-4 text-lg font-medium text-white transition-all hover:bg-white/5"
            >
              Create Account
            </Link>
          </motion.div>

          <motion.div variants={fadeInUp} className="mt-16 grid grid-cols-3 gap-8">
            {[
              { value: '10K+', label: 'Happy Customers' },
              { value: '500+', label: 'Products' },
              { value: '4.9', label: 'Average Rating', hasIcon: true },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-3xl font-bold text-white md:text-4xl">{stat.value}</span>
                  {stat.hasIcon && <Star className="h-5 w-5 fill-amber-400 text-amber-400" />}
                </div>
                <p className="mt-1 text-sm text-zinc-500">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function DemoFooter() {
  return (
    <footer className="border-t border-white/5 bg-black py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <h3 className="text-xl font-bold text-white">TrustCart Kenya</h3>
            <p className="mt-4 text-sm leading-relaxed text-zinc-500">
              Premium electronics with authentic products, secure payments, and reliable delivery
              across Kenya.
            </p>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Shop
            </h4>
            <ul className="space-y-3">
              {['Laptops', 'Phones', 'Tablets', 'Accessories'].map((item) => (
                <li key={item}>
                  <Link
                    href={`/categories/${item.toLowerCase()}`}
                    className="text-sm text-zinc-500 transition-colors hover:text-white"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Company
            </h4>
            <ul className="space-y-3">
              {['About Us', 'Contact', 'Terms of Service', 'Privacy Policy'].map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="text-sm text-zinc-500 transition-colors hover:text-white"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Contact
            </h4>
            <ul className="space-y-3 text-sm text-zinc-500">
              <li>+254 700 000 000</li>
              <li>support@trustcart.co.ke</li>
              <li>Nairobi, Kenya</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between border-t border-white/5 pt-8 md:flex-row">
          <p className="text-sm text-zinc-600">
            © {new Date().getFullYear()} TrustCart Kenya. All rights reserved.
          </p>
          <div className="mt-4 flex items-center gap-2 md:mt-0">
            <span className="text-xs text-zinc-600">Secure payments via</span>
            <span className="rounded bg-emerald-500/20 px-2 py-1 text-xs font-medium text-emerald-400">
              M-PESA
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function DemoHomePage() {
  // Hide the global footer when this page is mounted
  useEffect(() => {
    const globalFooter = document.querySelector('body > footer');
    if (globalFooter) {
      (globalFooter as HTMLElement).style.display = 'none';
    }
    return () => {
      // Restore footer when leaving the page
      if (globalFooter) {
        (globalFooter as HTMLElement).style.display = '';
      }
    };
  }, []);

  return (
    <main className="min-h-screen bg-black">
      <HeroSection />
      <CategoriesSection />
      <FeaturesSection />
      <CTASection />
      <DemoFooter />
    </main>
  );
}
