'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  getCart,
  updateCartItem,
  removeCartItem,
  applyCartPromoCode,
  removeCartPromoCode,
} from '@/lib/api';
import { ConfirmModal } from '@/components/ConfirmModal';
import type { Cart } from '@/lib/types';

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; itemId: string | null }>({
    isOpen: false,
    itemId: null,
  });

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const data = await getCart();
      setCart(data);
    } catch (err) {
      console.error('Failed to fetch cart:', err);
      setError('Failed to load cart');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const updatedCart = await updateCartItem(itemId, newQuantity);
      setCart(updatedCart);
    } catch (err) {
      if (err instanceof Error && err.message.includes('INSUFFICIENT_STOCK')) {
        setError('Not enough stock available');
      }
      console.error('Failed to update quantity:', err);
    }
  };

  const handleRemoveItem = async () => {
    if (!deleteModal.itemId) return;

    try {
      const updatedCart = await removeCartItem(deleteModal.itemId);
      setCart(updatedCart);
    } catch (err) {
      console.error('Failed to remove item:', err);
    } finally {
      setDeleteModal({ isOpen: false, itemId: null });
    }
  };

  const handleApplyPromoCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;

    setPromoError('');
    setPromoSuccess('');

    try {
      const updatedCart = await applyCartPromoCode(promoCode.trim());
      setCart(updatedCart);
      setPromoSuccess('Promo code applied!');
      setPromoCode('');
    } catch (err) {
      if (err instanceof Error) {
        setPromoError(err.message);
      }
    }
  };

  const handleRemovePromoCode = async () => {
    try {
      const updatedCart = await removeCartPromoCode();
      setCart(updatedCart);
      setPromoSuccess('');
    } catch (err) {
      console.error('Failed to remove promo code:', err);
    }
  };

  const formatPrice = (cents: number) => {
    return `KES ${(cents / 100).toLocaleString()}`;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error && !cart) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-red-600">{error}</p>
        <button onClick={fetchCart} className="btn-primary mt-4">
          Try Again
        </button>
      </div>
    );
  }

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-2xl font-bold text-secondary-900">Shopping Cart</h1>

      {isEmpty ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <svg
            className="mx-auto h-16 w-16 text-secondary-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h2 className="mt-4 text-lg font-medium text-secondary-900">Your cart is empty</h2>
          <p className="mt-2 text-secondary-500">Start shopping to add items to your cart</p>
          <Link href="/products" className="btn-primary mt-6 inline-block">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="rounded-xl bg-white shadow-sm">
              {cart.items.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex gap-4 p-4 ${index > 0 ? 'border-t border-secondary-100' : ''}`}
                >
                  {/* Product Image */}
                  <Link href={`/products/${item.product.slug}`} className="flex-shrink-0">
                    <div className="relative h-24 w-24 overflow-hidden rounded-lg bg-secondary-100">
                      {item.product.primaryImage ? (
                        <Image
                          src={item.product.primaryImage.url}
                          alt={item.product.primaryImage.altText}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-secondary-400">
                          No image
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Product Details */}
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between">
                      <Link
                        href={`/products/${item.product.slug}`}
                        className="font-medium text-secondary-900 hover:text-primary-600"
                      >
                        {item.product.name}
                      </Link>
                      <p className="font-medium text-secondary-900">
                        {formatPrice(item.lineTotal)}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-secondary-500">
                      {formatPrice(item.priceAtAdd)} each
                    </p>

                    {/* Quantity Controls */}
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-secondary-300 text-secondary-600 hover:bg-secondary-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-secondary-300 text-secondary-600 hover:bg-secondary-50"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => setDeleteModal({ isOpen: true, itemId: item.id })}
                        className="text-sm text-red-600 hover:text-red-500"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-secondary-900">Order Summary</h2>

              <div className="mt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-secondary-600">Subtotal ({cart.itemCount} items)</span>
                  <span className="font-medium">{formatPrice(cart.subtotal)}</span>
                </div>

                {cart.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(cart.discount)}</span>
                  </div>
                )}

                <div className="border-t border-secondary-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-secondary-900">Total</span>
                    <span className="text-lg font-bold text-primary-600">
                      {formatPrice(cart.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Promo Code */}
              <div className="mt-6">
                {cart.promoCode ? (
                  <div className="flex items-center justify-between rounded-lg bg-green-50 p-3">
                    <div>
                      <span className="font-medium text-green-800">{cart.promoCode.code}</span>
                      <p className="text-xs text-green-600">
                        {cart.promoCode.discountType === 'PERCENT'
                          ? `${cart.promoCode.discountValue}% off`
                          : `KES ${cart.promoCode.discountValue / 100} off`}
                      </p>
                    </div>
                    <button
                      onClick={handleRemovePromoCode}
                      className="text-sm text-green-700 hover:text-green-800"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyPromoCode}>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Promo code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        className="flex-1 rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                      />
                      <button type="submit" className="btn-primary px-4 py-2 text-sm">
                        Apply
                      </button>
                    </div>
                    {promoError && <p className="mt-2 text-xs text-red-600">{promoError}</p>}
                    {promoSuccess && <p className="mt-2 text-xs text-green-600">{promoSuccess}</p>}
                  </form>
                )}
              </div>

              {/* Checkout Button */}
              <button
                disabled
                className="mt-6 w-full rounded-lg bg-primary-600 py-3 font-medium text-white opacity-50 cursor-not-allowed"
              >
                Proceed to Checkout (Coming Soon)
              </button>

              <Link
                href="/products"
                className="mt-4 block text-center text-sm text-primary-600 hover:text-primary-500"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Remove Item"
        message="Are you sure you want to remove this item from your cart?"
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleRemoveItem}
        onCancel={() => setDeleteModal({ isOpen: false, itemId: null })}
      />
    </div>
  );
}
