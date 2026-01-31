'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createAddress } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';

export default function NewAddressPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    label: '',
    recipientName: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    county: '',
    isDefault: false,
  });

  if (typeof window !== 'undefined' && !isAuthenticated()) {
    router.push('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await createAddress({
        label: formData.label,
        recipientName: formData.recipientName,
        phone: formData.phone,
        line1: formData.line1,
        line2: formData.line2 || undefined,
        city: formData.city,
        county: formData.county,
        isDefault: formData.isDefault,
      });
      router.push('/account');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create address');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/account" className="text-sm text-secondary-600 hover:text-primary-600">
          ← Back to Account
        </Link>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h1 className="mb-6 text-xl font-semibold text-secondary-900">Add New Address</h1>

        {error && <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700">
              Address Label <span className="text-secondary-400">(e.g., Home, Work)</span>
            </label>
            <input
              type="text"
              name="label"
              value={formData.label}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-lg border border-secondary-300 px-4 py-2 focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700">Recipient Name</label>
            <input
              type="text"
              name="recipientName"
              value={formData.recipientName}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-lg border border-secondary-300 px-4 py-2 focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="254700000000"
              required
              className="mt-1 block w-full rounded-lg border border-secondary-300 px-4 py-2 focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700">Address Line 1</label>
            <input
              type="text"
              name="line1"
              value={formData.line1}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-lg border border-secondary-300 px-4 py-2 focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700">
              Address Line 2 <span className="text-secondary-400">(optional)</span>
            </label>
            <input
              type="text"
              name="line2"
              value={formData.line2}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-secondary-300 px-4 py-2 focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-secondary-700">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-lg border border-secondary-300 px-4 py-2 focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700">County</label>
              <input
                type="text"
                name="county"
                value={formData.county}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-lg border border-secondary-300 px-4 py-2 focus:border-primary-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              name="isDefault"
              checked={formData.isDefault}
              onChange={handleChange}
              className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="isDefault" className="text-sm text-secondary-700">
              Set as default address
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary px-6 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Address'}
            </button>
            <Link
              href="/account"
              className="rounded-lg border border-secondary-300 px-6 py-2 text-secondary-700 hover:bg-secondary-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
