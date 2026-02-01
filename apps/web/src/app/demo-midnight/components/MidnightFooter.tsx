'use client';

import Link from 'next/link';

export function MidnightFooter() {
  return (
    <footer className="border-t border-slate-800 bg-[#020617] py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <h3 className="text-xl font-bold text-white">TrustCart Kenya</h3>
            <p className="mt-4 text-sm leading-relaxed text-slate-500">
              Premium electronics with authentic products, secure payments, and reliable delivery
              across Kenya.
            </p>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Shop
            </h4>
            <ul className="space-y-3">
              {['Laptops', 'Phones', 'Tablets', 'Accessories'].map((item) => (
                <li key={item}>
                  <Link
                    href={`/categories/${item.toLowerCase()}`}
                    className="text-sm text-slate-500 transition-colors hover:text-blue-400"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Company
            </h4>
            <ul className="space-y-3">
              {['About Us', 'Contact', 'Terms of Service', 'Privacy Policy'].map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="text-sm text-slate-500 transition-colors hover:text-blue-400"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Contact
            </h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li>+254 700 000 000</li>
              <li>support@trustcart.co.ke</li>
              <li>Nairobi, Kenya</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between border-t border-slate-800 pt-8 md:flex-row">
          <p className="text-sm text-slate-600">
            © {new Date().getFullYear()} TrustCart Kenya. All rights reserved.
          </p>
          <div className="mt-4 flex items-center gap-2 md:mt-0">
            <span className="text-xs text-slate-500">Secure payments via</span>
            <span className="rounded border border-green-900/30 bg-green-950/30 px-2 py-1 text-xs font-bold text-green-500">
              M-PESA
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
