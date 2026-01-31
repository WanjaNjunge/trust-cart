import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-secondary-200 bg-secondary-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="text-xl font-bold text-primary-600">
              TrustCart Kenya
            </Link>
            <p className="mt-4 text-sm text-secondary-600">
              Electronics you can trust. Authentic products, secure payments, and reliable delivery
              across Kenya.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-semibold text-secondary-900">Shop</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/categories/laptops"
                  className="text-sm text-secondary-600 hover:text-primary-600"
                >
                  Laptops
                </Link>
              </li>
              <li>
                <Link
                  href="/categories/phones"
                  className="text-sm text-secondary-600 hover:text-primary-600"
                >
                  Phones
                </Link>
              </li>
              <li>
                <Link
                  href="/categories/tablets"
                  className="text-sm text-secondary-600 hover:text-primary-600"
                >
                  Tablets
                </Link>
              </li>
              <li>
                <Link
                  href="/categories/accessories"
                  className="text-sm text-secondary-600 hover:text-primary-600"
                >
                  Accessories
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-secondary-900">Company</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/about" className="text-sm text-secondary-600 hover:text-primary-600">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-secondary-600 hover:text-primary-600">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-secondary-600 hover:text-primary-600">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-secondary-600 hover:text-primary-600">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-secondary-900">Contact</h3>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center gap-2 text-sm text-secondary-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                +254 700 000 000
              </li>
              <li className="flex items-center gap-2 text-sm text-secondary-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                support@trustcart.co.ke
              </li>
              <li className="flex items-center gap-2 text-sm text-secondary-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Nairobi, Kenya
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 border-t border-secondary-200 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-secondary-500">
              © {new Date().getFullYear()} TrustCart Kenya. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-secondary-400">Secure payments with</span>
              <span className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                M-PESA
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
