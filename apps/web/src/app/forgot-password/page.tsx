'use client';

import { useState } from 'react';
import Link from 'next/link';
import { forgotPassword } from '@/lib/api';
import { ArrowLeft, ArrowRight, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await forgotPassword(email.trim());
      // Always show the same message regardless of whether email exists
      setSubmitted(true);
    } catch {
      // Still show success — don't reveal whether an account exists
      setSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4 py-20">
      <div className="w-full max-w-[440px]">
        <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white/90 p-8 shadow-xl backdrop-blur-xl transition-all duration-500 hover:shadow-stone-200/50">
          {/* Top accent */}
          <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-red-900 via-amber-600 to-amber-400 opacity-80" />

          {submitted ? (
            /* Success state */
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Check your email</h1>
              <p className="mt-3 text-sm text-slate-500">
                If an account exists for <span className="font-medium text-slate-700">{email}</span>,
                we&apos;ve sent a password reset link. Check your inbox and spam folder.
              </p>
              <p className="mt-2 text-xs text-slate-400">The link expires in 1 hour.</p>
              <Link
                href="/login"
                className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-red-800 hover:text-red-900 hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </div>
          ) : (
            /* Form state */
            <>
              <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold text-slate-900">Reset Password</h1>
                <p className="mt-2 text-sm text-slate-500">
                  Enter your email and we&apos;ll send a reset link.
                </p>
              </div>

              {error && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800 shadow-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="ml-1 block text-xs font-semibold text-slate-700">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/10"
                    placeholder="you@example.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 py-3 text-sm font-bold text-slate-900 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] hover:shadow-amber-500/40 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                    {!isLoading && (
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    )}
                  </span>
                  <span className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-red-800 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
