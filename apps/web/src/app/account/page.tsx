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
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">My Account</h1>
          <p className="mt-1 text-secondary-500">Manage your profile and addresses</p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-secondary-300 px-4 py-2 text-sm font-medium text-secondary-700 hover:bg-secondary-50"
        >
          Sign Out
        </button>
      </div>

      {/* Profile Section */}
      <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-secondary-900">Profile Information</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              Edit
            </button>
          )}
        </div>

        {error && <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        {isEditing ? (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-secondary-700">First Name</label>
                <input
                  type="text"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, firstName: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-secondary-300 px-4 py-2 focus:border-primary-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700">Last Name</label>
                <input
                  type="text"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, lastName: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-secondary-300 px-4 py-2 focus:border-primary-500 focus:outline-none"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700">Phone</label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                className="mt-1 block w-full rounded-lg border border-secondary-300 px-4 py-2 focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary px-4 py-2">
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-lg border border-secondary-300 px-4 py-2 text-secondary-700 hover:bg-secondary-50"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-secondary-500">Name</dt>
              <dd className="mt-1 font-medium text-secondary-900">
                {user.firstName} {user.lastName}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-secondary-500">Email</dt>
              <dd className="mt-1 font-medium text-secondary-900">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm text-secondary-500">Phone</dt>
              <dd className="mt-1 font-medium text-secondary-900">{user.phone || 'Not set'}</dd>
            </div>
            <div>
              <dt className="text-sm text-secondary-500">Role</dt>
              <dd className="mt-1">
                <span className="inline-flex rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800">
                  {user.role}
                </span>
              </dd>
            </div>
          </dl>
        )}
      </div>

      {/* Addresses Section */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-secondary-900">Saved Addresses</h2>
          <Link
            href="/account/addresses/new"
            className="text-sm font-medium text-primary-600 hover:text-primary-500"
          >
            Add Address
          </Link>
        </div>

        {addresses.length === 0 ? (
          <p className="text-secondary-500">No saved addresses yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`rounded-lg border p-4 ${
                  address.isDefault ? 'border-primary-500 bg-primary-50' : 'border-secondary-200'
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium text-secondary-900">{address.label}</span>
                  {address.isDefault && (
                    <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-sm text-secondary-600">{address.recipientName}</p>
                <p className="text-sm text-secondary-600">{address.line1}</p>
                {address.line2 && <p className="text-sm text-secondary-600">{address.line2}</p>}
                <p className="text-sm text-secondary-600">
                  {address.city}, {address.county}
                </p>
                <p className="text-sm text-secondary-600">{address.phone}</p>
                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/account/addresses/${address.id}`}
                    className="text-xs text-primary-600 hover:text-primary-500"
                  >
                    Edit
                  </Link>
                  {!address.isDefault && (
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      className="text-xs text-primary-600 hover:text-primary-500"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteAddress(address.id)}
                    className="text-xs text-red-600 hover:text-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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
