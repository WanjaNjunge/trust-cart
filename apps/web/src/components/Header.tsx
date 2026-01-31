'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { isAuthenticated, getStoredUser, clearToken } from '@/lib/auth';
import { getCart } from '@/lib/api';
import type { User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { MagneticButton } from './ui/MagneticButton';

export function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // Scroll effect detection
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchCartCount = useCallback(async () => {
    try {
      const cart = await getCart();
      setCartCount(cart.itemCount);
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    if (isAuthenticated()) {
      setUser(getStoredUser());
    } else {
      setUser(null);
    }
    fetchCartCount();
  }, [pathname, fetchCartCount]);

  useEffect(() => {
    const handleCartUpdate = () => fetchCartCount();
    window.addEventListener('cart-updated', handleCartUpdate);
    return () => window.removeEventListener('cart-updated', handleCartUpdate);
  }, [fetchCartCount]);

  const handleLogout = () => {
    clearToken();
    setUser(null);
    window.location.href = '/';
  };

  if (!mounted) return null;

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'fixed left-0 right-0 top-4 z-50 mx-auto flex w-[95%] max-w-7xl items-center justify-between rounded-2xl px-6 py-3 transition-all duration-300',
        scrolled
          ? 'glass shadow-md bg-white/80 dark:bg-black/80'
          : 'bg-transparent backdrop-blur-sm border border-transparent',
      )}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <span className="font-display text-xl font-bold tracking-tight text-primary">
          TrustCart
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
            className={cn(
              'text-sm font-medium transition-colors hover:text-primary',
              pathname === item.href ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            {item.name}
          </Link>
        ))}
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Search Trigger (Mobile/Desktop) - Simplified for now */}
        <button className="text-muted-foreground hover:text-primary">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>

        {/* Cart */}
        <MagneticButton>
          <Link
            href="/cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 text-secondary transition-colors hover:bg-secondary/20"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            {cartCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-sm"
              >
                {cartCount > 99 ? '99+' : cartCount}
              </motion.span>
            )}
          </Link>
        </MagneticButton>

        {/* Auth */}
        <div className="hidden md:flex md:items-center md:gap-3">
          {user ? (
            <>
              <Link
                href="/account"
                className="text-sm font-medium text-foreground hover:text-primary"
              >
                {user.firstName}
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-muted-foreground hover:text-primary"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="btn-primary rounded-full px-5 py-2 text-sm shadow-lg shadow-primary/20 transition-transform hover:scale-105"
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-foreground" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
            />
          </svg>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute right-0 top-16 w-64 origin-top-right rounded-xl glass p-4 shadow-xl md:hidden bg-white/95 dark:bg-black/95"
          >
            <div className="flex flex-col gap-4">
              <Link
                href="/products"
                className="text-sm font-medium text-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                Products
              </Link>
              <Link
                href="/categories/laptops"
                className="text-sm font-medium text-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                Laptops
              </Link>
              <Link
                href="/categories/phones"
                className="text-sm font-medium text-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                Phones
              </Link>
              <hr className="border-border" />
              {user ? (
                <>
                  <Link
                    href="/account"
                    className="text-sm font-medium text-foreground"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Account
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-left text-sm font-medium text-muted-foreground"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="btn-primary text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
