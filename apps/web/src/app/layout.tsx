import type { Metadata } from 'next';
import { Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import { Header, Footer } from '@/components';
import { cn } from '@/lib/utils';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'TrustCart Kenya - Electronics You Can Trust',
    template: '%s | TrustCart Kenya',
  },
  description:
    'Shop electronics with confidence. Authentic products, secure MPesa payments, and reliable delivery across Kenya.',
  keywords: ['electronics', 'Kenya', 'online shopping', 'laptops', 'phones', 'MPesa'],
  authors: [{ name: 'TrustCart Kenya' }],
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    siteName: 'TrustCart Kenya',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="en" className={cn(outfit.variable, jakarta.variable)}>
      <body className="flex min-h-screen flex-col font-sans antialiased bg-slate-50 relative selection:bg-amber-100 selection:text-amber-900">
        {/* Global Atmosphere (Golden Hour) */}
        <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
          {/* 1. Sunlight Blob (Top Right) */}
          <div className="absolute top-0 right-0 h-[800px] w-[800px] bg-gradient-to-bl from-orange-50/40 via-amber-50/10 to-transparent blur-3xl opacity-60" />
          {/* 2. Soft Ambient Mesh */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50/30 via-amber-50/20 to-blue-50/5 opacity-50" />
          {/* 3. Micro Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.01)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
        </div>

        <Header />
        <main className="flex-1 relative z-10">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
