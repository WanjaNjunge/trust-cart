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
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
