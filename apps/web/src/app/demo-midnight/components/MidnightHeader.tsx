'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, Menu, X } from 'lucide-react';

export function MidnightHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Scroll effect detection
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#020617]/90 backdrop-blur-md border-b border-slate-800'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/demo-midnight" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-white">
            Trust<span className="text-blue-500">Cart</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {[
            { name: 'Products', href: '/products' },
            { name: 'Laptops', href: '/categories/laptops' },
            { name: 'Phones', href: '/categories/phones' },
          ].map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <button className="text-slate-400 hover:text-white transition-colors">
            <Search className="h-5 w-5" />
          </button>

          {/* Cart */}
          <Link
            href="/cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 bg-slate-900/50 text-slate-300 transition-all hover:bg-slate-800 hover:text-white hover:border-blue-900/50"
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-black shadow-sm">
              2
            </span>
          </Link>

          {/* Auth Button - "Ghost" Style with Blue Hover */}
          <Link
            href="/login"
            className="hidden rounded-full border border-slate-700 bg-transparent px-5 py-2 text-sm font-medium text-slate-300 transition-all hover:border-blue-500 hover:text-blue-400 md:inline-flex"
          >
            Login
          </Link>

          {/* Mobile Menu Button */}
          <button className="text-slate-300 md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="absolute left-0 right-0 top-20 border-b border-slate-800 bg-[#020617] px-4 py-4 md:hidden"
          >
            <div className="flex flex-col gap-4">
              <Link
                href="/products"
                className="text-base font-medium text-slate-300 hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Products
              </Link>
              <Link
                href="/categories/laptops"
                className="text-base font-medium text-slate-300 hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Laptops
              </Link>
              <Link
                href="/categories/phones"
                className="text-base font-medium text-slate-300 hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Phones
              </Link>
              <hr className="border-slate-800" />
              <Link
                href="/login"
                className="flex w-full items-center justify-center rounded-full bg-slate-800 py-3 text-sm font-medium text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
