'use client';

import Link from 'next/link';

interface LoginPromptProps {
    /** The page title to display */
    title?: string;
    /** Subtitle/description text */
    subtitle?: string;
    /** The redirect path after login (without /login prefix) */
    redirectPath?: string;
}

/**
 * Login prompt component for unauthenticated users trying to access protected pages.
 * Displays a friendly prompt to sign in or create an account.
 * 
 * Used on /orders pages when user is not authenticated (Amendment 2026-02-08).
 * 
 * Design patterns used (matching site standards):
 * - pt-28 for fixed header clearance
 * - slate color palette (not gray)
 * - glass-morphism cards with backdrop-blur
 * - amber accents for primary CTAs
 */
export function LoginPrompt({
    title = 'Your Orders',
    subtitle = 'Track and manage your orders',
    redirectPath = '/orders'
}: LoginPromptProps) {
    const loginUrl = `/login?redirect=${encodeURIComponent(redirectPath)}`;
    const registerUrl = `/register?redirect=${encodeURIComponent(redirectPath)}`;

    return (
        <div className="mx-auto max-w-4xl px-4 pt-28 pb-16 sm:px-6 lg:px-8">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
                <p className="mt-2 text-slate-600">{subtitle}</p>
            </div>

            {/* Login Prompt Card - Glass morphism style */}
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-lg backdrop-blur-xl">
                <div className="text-center max-w-md mx-auto">
                    {/* User Icon */}
                    <div className="mx-auto w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 ring-4 ring-amber-100/50">
                        <svg
                            className="w-10 h-10 text-amber-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                        </svg>
                    </div>

                    {/* Heading */}
                    <h2 className="text-xl font-bold text-slate-900 mb-2">
                        Sign in to view your orders
                    </h2>

                    {/* Subtext */}
                    <p className="text-slate-600 mb-8">
                        Track your orders, view order history, and manage deliveries by signing in to your account.
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
                        <Link
                            href={loginUrl}
                            className="inline-flex items-center justify-center px-6 py-3 text-base font-bold text-slate-900 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-xl shadow-lg shadow-amber-500/20 transition-transform hover:scale-[1.02] hover:shadow-xl"
                        >
                            Sign In
                        </Link>
                        <Link
                            href={registerUrl}
                            className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-slate-700 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 transition-colors"
                        >
                            Create Account
                        </Link>
                    </div>

                    {/* Divider */}
                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-3 bg-white/80 text-slate-500">or</span>
                        </div>
                    </div>

                    {/* Guest Note - Teal accent matching secondary color */}
                    <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <svg
                                className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                            </svg>
                            <div className="text-left">
                                <p className="text-sm font-medium text-teal-900">
                                    Checked out as a guest?
                                </p>
                                <p className="text-sm text-teal-700 mt-1">
                                    Your order confirmation was sent to your email.
                                    Check your inbox for order details and tracking information.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Continue Shopping Link */}
            <div className="mt-6 text-center">
                <Link
                    href="/products"
                    className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
                >
                    ← Continue Shopping
                </Link>
            </div>
        </div>
    );
}
