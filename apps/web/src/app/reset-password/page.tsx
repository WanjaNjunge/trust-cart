'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPassword } from '@/lib/api';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Reset link is missing or invalid. Please request a new one.');
    }
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(token, formData.password);
      setSuccess(true);
      // Redirect after a short delay so user sees the success message
      setTimeout(() => router.push('/login'), 2500);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Reset link may have expired. Please request a new one.');
      }
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

          {success ? (
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Password updated!</h1>
              <p className="mt-3 text-sm text-slate-500">
                Your password has been reset. Redirecting you to sign in…
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold text-slate-900">Set New Password</h1>
                <p className="mt-2 text-sm text-slate-500">
                  Choose a strong password for your account.
                </p>
              </div>

              {error && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800 shadow-sm">
                  {error}{' '}
                  {(error.includes('expired') || error.includes('invalid') || error.includes('missing')) && (
                    <Link href="/forgot-password" className="underline">
                      Request new link
                    </Link>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label htmlFor="password" className="ml-1 block text-xs font-semibold text-slate-700">
                    New Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoFocus
                    value={formData.password}
                    onChange={handleChange}
                    disabled={!token}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/10 disabled:opacity-60"
                  />
                  <p className="ml-1 text-[10px] text-slate-500">Minimum 8 characters</p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="ml-1 block text-xs font-semibold text-slate-700">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={!token}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/10 disabled:opacity-60"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !token}
                  className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 py-3 text-sm font-bold text-slate-900 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] hover:shadow-amber-500/40 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isLoading ? 'Updating...' : 'Update Password'}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
