import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
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
        <html lang="en" className={inter.variable}>
            <body className="min-h-screen font-sans">{children}</body>
        </html>
    );
}
