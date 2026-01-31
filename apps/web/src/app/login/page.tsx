'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { login } from '@/lib/api';
import { setToken, setStoredUser, isAuthenticated } from '@/lib/auth';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/account');
    }
    if (searchParams.get('registered') === 'true') {
      setSuccessMessage('Account created successfully! Please sign in.');
    }
  }, [router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const response = await login({
        email: formData.email,
        password: formData.password,
      });
      setToken(response.accessToken);
      setStoredUser(response.user);
      router.push('/account');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-secondary-50 to-secondary-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <div className="mb-8 text-center">
            <Link href="/" className="text-2xl font-bold text-primary-600">
              TrustCart
            </Link>
            <h1 className="mt-4 text-2xl font-bold text-secondary-900">Welcome Back</h1>
            <p className="mt-2 text-secondary-500">Sign in to your account</p>
          </div>

          {successMessage && (
            <div className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-700">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-secondary-300 px-4 py-2.5 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-secondary-700">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-primary-600 hover:text-primary-500"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-secondary-300 px-4 py-2.5 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 text-base disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-secondary-600">
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Create one
              </Link>
            </p>
          </div>

          <div className="mt-6 border-t border-secondary-200 pt-6">
            <p className="text-center text-xs text-secondary-500">
              Test credentials:{' '}
              <code className="bg-secondary-100 px-1 py-0.5 rounded">admin@trustcart.co.ke</code> /{' '}
              <code className="bg-secondary-100 px-1 py-0.5 rounded">Test123!</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}
    >
      <LoginForm />
    </Suspense>
  );
}
