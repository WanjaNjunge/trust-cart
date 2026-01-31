'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addToCart } from '@/lib/api';
import { ConfirmModal } from '@/components/ConfirmModal';

interface AddToCartButtonProps {
  productId: string;
  productName: string;
  isInStock: boolean;
  maxQuantity?: number;
}

export function AddToCartButton({
  productId,
  productName,
  isInStock,
  maxQuantity,
}: AddToCartButtonProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleAddToCart = async () => {
    setError('');
    setIsLoading(true);

    try {
      await addToCart({ productId, quantity });
      setShowSuccess(true);
      // Trigger header cart count update
      window.dispatchEvent(new Event('cart-updated'));
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('INSUFFICIENT_STOCK')) {
          setError('Not enough stock available');
        } else {
          setError(err.message);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuantityChange = (delta: number) => {
    const newQty = quantity + delta;
    if (newQty < 1) return;
    if (maxQuantity && newQty > maxQuantity) return;
    setQuantity(newQty);
  };

  if (!isInStock) {
    return (
      <button
        disabled
        className="btn-primary w-full py-4 text-lg disabled:cursor-not-allowed disabled:opacity-50"
      >
        Out of Stock
      </button>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      <div className="flex items-center justify-center gap-4">
        <span className="text-sm font-medium text-secondary-700">Quantity:</span>
        <div className="flex items-center rounded-lg border border-secondary-300">
          <button
            onClick={() => handleQuantityChange(-1)}
            disabled={quantity <= 1}
            className="flex h-10 w-10 items-center justify-center text-secondary-600 hover:bg-secondary-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            −
          </button>
          <span className="w-12 text-center font-medium">{quantity}</span>
          <button
            onClick={() => handleQuantityChange(1)}
            disabled={maxQuantity ? quantity >= maxQuantity : false}
            className="flex h-10 w-10 items-center justify-center text-secondary-600 hover:bg-secondary-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            +
          </button>
        </div>
      </div>

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={isLoading}
        className="btn-primary w-full py-4 text-lg disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? 'Adding...' : 'Add to Cart'}
      </button>

      {error && <p className="text-center text-sm text-red-600">{error}</p>}

      {/* Success Modal */}
      <ConfirmModal
        isOpen={showSuccess}
        title="Added to Cart"
        message={`${productName} has been added to your cart.`}
        confirmLabel="View Cart"
        cancelLabel="Continue Shopping"
        variant="default"
        onConfirm={() => {
          setShowSuccess(false);
          router.push('/cart');
        }}
        onCancel={() => {
          setShowSuccess(false);
          setQuantity(1);
        }}
      />
    </div>
  );
}
