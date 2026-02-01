'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, Menu, X } from 'lucide-react';

export function DawnHeader() {
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
          ? 'bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm'
          : 'bg-white/60 backdrop-blur-sm border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/demo-dawn" className="flex shrink-0 items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Trust<span className="text-blue-600">Cart</span>
          </span>
        </Link>

        {/* Desktop Search Bar (Centered & Wide) */}
        <div className="hidden flex-1 items-center justify-center md:flex">
          <div className="relative w-full max-w-2xl">
            <input
              type="text"
              placeholder="Search for laptops, phones, or accessories..."
              className="w-full rounded-full border border-slate-200 bg-slate-100 py-3 pl-12 pr-4 text-sm text-slate-900 placeholder-slate-500 transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-6">
          {/* Mobile Search Trigger */}
          <button className="text-slate-500 hover:text-blue-600 md:hidden">
            <Search className="h-6 w-6" />
          </button>

          {/* Account */}
          <Link
            href="/login"
            className="flex flex-col items-center gap-1 text-slate-500 transition-colors hover:text-blue-600"
          >
            <div className="h-6 w-6 rounded-full border border-current p-0.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-full w-full"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <span className="hidden text-[10px] uppercase tracking-wider font-semibold lg:block">
              Sign In
            </span>
          </Link>

          {/* Cart */}
          <Link
            href="/cart"
            className="group flex flex-col items-center gap-1 text-slate-500 transition-colors hover:text-blue-600"
          >
            <div className="relative">
              <ShoppingBag className="h-6 w-6" />
              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                2
              </span>
            </div>
            <span className="hidden text-[10px] uppercase tracking-wider font-semibold lg:block">
              Cart
            </span>
          </Link>

          {/* Mobile Menu Button */}
          <button className="text-slate-900 md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
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
            className="absolute left-0 right-0 top-20 border-b border-slate-200 bg-white px-4 py-4 md:hidden shadow-xl"
          >
            {/* Mobile Search Input */}
            <div className="mb-6 relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
              />
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            </div>

            <div className="flex flex-col gap-4">
              <Link
                href="/products"
                className="text-base font-medium text-slate-600 hover:text-blue-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Products
              </Link>
              <Link
                href="/categories/laptops"
                className="text-base font-medium text-slate-600 hover:text-blue-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Laptops
              </Link>
              <Link
                href="/categories/phones"
                className="text-base font-medium text-slate-600 hover:text-blue-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Phones
              </Link>
              <hr className="border-slate-100" />
              <Link
                href="/login"
                className="flex w-full items-center justify-center rounded-full bg-blue-600 py-3 text-sm font-medium text-white shadow-lg shadow-blue-200"
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
