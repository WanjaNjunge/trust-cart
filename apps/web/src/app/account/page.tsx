'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getProfile,
  updateProfile,
  getAddresses,
  deleteAddress,
  setDefaultAddress,
} from '@/lib/api';
import { isAuthenticated, clearToken, setStoredUser } from '@/lib/auth';
import { ConfirmModal } from '@/components/ConfirmModal';
import type { User, Address } from '@/lib/types';

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; addressId: string | null }>({
    isOpen: false,
    addressId: null,
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [profileData, addressData] = await Promise.all([getProfile(), getAddresses()]);
        setUser(profileData);
        setAddresses(addressData);
        setEditForm({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          phone: profileData.phone || '',
        });
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        if (err instanceof Error && err.message.includes('Unauthorized')) {
          clearToken();
          router.push('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = () => {
    clearToken();
    router.push('/');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const updatedUser = await updateProfile({
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        phone: editForm.phone || undefined,
      });
      setUser(updatedUser);
      setStoredUser(updatedUser);
      setIsEditing(false);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    setDeleteModal({ isOpen: true, addressId });
  };

  const confirmDeleteAddress = async () => {
    if (!deleteModal.addressId) return;

    try {
      await deleteAddress(deleteModal.addressId);
      setAddresses((prev) => prev.filter((a) => a.id !== deleteModal.addressId));
    } catch (err) {
      console.error('Failed to delete address:', err);
    } finally {
      setDeleteModal({ isOpen: false, addressId: null });
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      await setDefaultAddress(addressId);
      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          isDefault: a.id === addressId,
        })),
      );
    } catch (err) {
      console.error('Failed to set default address:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pt-24 pb-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-end justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">My Account</h1>
          <p className="mt-2 text-slate-500">Manage your profile, orders, and addresses</p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-100"
        >
          Sign Out
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Section */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur-xl transition-all hover:shadow-md">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-900">Profile Information</h2>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Edit Profile
                </button>
              )}
            </div>

            {error && (
              <div className="mb-6 rounded-lg border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            {isEditing ? (
              <form onSubmit={handleEditSubmit} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">First Name</label>
                    <input
                      type="text"
                      value={editForm.firstName}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, firstName: e.target.value }))
                      }
                      className="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-2.5 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Last Name</label>
                    <input
                      type="text"
                      value={editForm.lastName}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, lastName: e.target.value }))
                      }
                      className="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-2.5 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Phone Number</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-2.5 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 px-6 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition-transform hover:scale-[1.02]"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <dl className="space-y-4">
                <div className="grid grid-cols-1 gap-1 sm:grid-cols-3 sm:gap-4">
                  <dt className="font-medium text-slate-500">Full Name</dt>
                  <dd className="text-slate-900 sm:col-span-2 font-semibold">
                    {user.firstName} {user.lastName}
                  </dd>
                </div>
                <div className="grid grid-cols-1 gap-1 sm:grid-cols-3 sm:gap-4 border-t border-slate-100 pt-4">
                  <dt className="font-medium text-slate-500">Email Address</dt>
                  <dd className="text-slate-900 sm:col-span-2 font-mono text-sm">{user.email}</dd>
                </div>
                <div className="grid grid-cols-1 gap-1 sm:grid-cols-3 sm:gap-4 border-t border-slate-100 pt-4">
                  <dt className="font-medium text-slate-500">Phone Number</dt>
                  <dd className="text-slate-900 sm:col-span-2">
                    {user.phone || <span className="text-slate-400 italic">Not provided</span>}
                  </dd>
                </div>
                <div className="grid grid-cols-1 gap-1 sm:grid-cols-3 sm:gap-4 border-t border-slate-100 pt-4">
                  <dt className="font-medium text-slate-500">Account Type</dt>
                  <dd className="sm:col-span-2">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-inset ring-blue-700/10">
                      {user.role}
                    </span>
                  </dd>
                </div>
              </dl>
            )}
          </div>

          {/* Addresses Section */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur-xl">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                </div>
                <h2 className="text-xl font-bold text-slate-900">Saved Addresses</h2>
              </div>
              <Link
                href="/account/addresses/new"
                className="flex items-center gap-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
              >
                <span className="text-lg leading-none">+</span> Add New
              </Link>
            </div>

            {addresses.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center bg-slate-50/50">
                <p className="text-slate-500">No saved addresses yet.</p>
                <p className="text-sm text-slate-400 mt-1">Add an address to speed up checkout.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className={`group relative rounded-xl border p-5 transition-all hover:shadow-md ${address.isDefault
                      ? 'border-blue-200 bg-blue-50/30'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{address.label}</span>
                        {address.isDefault && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <Link
                          href={`/account/addresses/${address.id}`}
                          className="p-1 text-slate-400 hover:text-blue-600"
                        >
                          <span className="sr-only">Edit</span>
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDeleteAddress(address.id)}
                          className="p-1 text-slate-400 hover:text-red-600"
                        >
                          <span className="sr-only">Delete</span>
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1 text-sm text-slate-600">
                      <p className="font-medium text-slate-900">{address.recipientName}</p>
                      <p>{address.line1}</p>
                      {address.line2 && <p>{address.line2}</p>}
                      <p>
                        {address.city}, {address.county}
                      </p>
                      <p className="pt-2 flex items-center gap-2 text-xs text-slate-500">
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        {address.phone}
                      </p>
                    </div>

                    {!address.isDefault && (
                      <button
                        onClick={() => handleSetDefault(address.id)}
                        className="mt-4 w-full rounded-lg border border-slate-200 bg-white py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200"
                      >
                        Set as Default
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar / Stats (Future Placeholder) */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-lg">
            <h3 className="text-lg font-bold">TrustCart Rewards</h3>
            <p className="mt-2 text-sm text-slate-300">Earn points on every purchase.</p>
            <div className="mt-6">
              <div className="text-3xl font-extrabold text-amber-400">0</div>
              <div className="text-xs font-medium text-slate-400 uppercase tracking-widest">
                Points Balance
              </div>
            </div>
            <button className="mt-6 w-full rounded-xl bg-white/10 py-2 text-sm font-semibold backdrop-blur-sm hover:bg-white/20 transition-colors">
              View History (Coming Soon)
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Address"
        message="Are you sure you want to delete this address? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDeleteAddress}
        onCancel={() => setDeleteModal({ isOpen: false, addressId: null })}
      />
    </div>
  );
}

