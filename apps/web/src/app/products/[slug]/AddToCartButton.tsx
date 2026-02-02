'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addToCart } from '@/lib/api';
import { ConfirmModal } from '@/components/ConfirmModal';
// import { ShoppingCart, ExternalLink, Heart } from 'lucide-react'; // Removing unused

interface ProductActionsProps {
  productId: string;
  productName: string;
  productPrice: number;
  slug: string; // Needed for WhatsApp link (semantically, though currently unused in function body)
  isInStock: boolean;
  maxQuantity?: number;
}

export function ProductActions({
  productId,
  productName,
  productPrice,
  slug: _slug, // Prefix with underscore to silence unused warning
  isInStock,
  maxQuantity,
}: ProductActionsProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleAddToCart = async (redirectArgs?: { redirect?: boolean }) => {
    setError('');
    setIsLoading(true);

    try {
      await addToCart({ productId, quantity });

      if (redirectArgs?.redirect) {
        router.push('/cart');
      } else {
        setShowSuccess(true);
        // Trigger header cart count update
        window.dispatchEvent(new Event('cart-updated'));
      }
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

  const getWhatsAppLink = () => {
    // Generate a message for WhatsApp
    const message = `Hi TrustCart, I'm interested in the ${productName} (Qty: ${quantity}). Price: KES ${productPrice.toLocaleString()}. Is it available?`;
    return `https://wa.me/254700000000?text=${encodeURIComponent(message)}`;
  };

  if (!isInStock) {
    return (
      <div className="space-y-4">
        <button
          disabled
          className="w-full rounded-full bg-slate-100 py-4 text-lg font-bold text-slate-400 cursor-not-allowed border border-slate-200"
        >
          Out of Stock
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quantity & Actions Row */}
      <div className="flex flex-col gap-4">
        {/* Quantity Selector */}
        <div className="flex items-center gap-4">
          <div className="flex items-center rounded-lg border border-slate-200 bg-white shadow-sm w-fit">
            <button
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
              className="flex h-12 w-12 items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 transition-colors"
            >
              −
            </button>
            <span className="flex h-12 w-12 items-center justify-center text-lg font-bold text-slate-900 border-x border-slate-100 px-2 min-w-[3rem]">
              {quantity}
            </span>
            <button
              onClick={() => handleQuantityChange(1)}
              disabled={maxQuantity ? quantity >= maxQuantity : false}
              className="flex h-12 w-12 items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 transition-colors"
            >
              +
            </button>
          </div>
          <span className="text-sm font-medium text-slate-500">
            {quantity > 1 ? `${quantity} items selected` : 'Quantity'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          {/* Add to Cart */}
          <button
            onClick={() => handleAddToCart()}
            disabled={isLoading}
            className="flex-1 rounded-full bg-emerald-600 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-700 hover:shadow-emerald-500/30 disabled:opacity-70 disabled:cursor-not-allowed active:scale-95"
          >
            {isLoading ? 'Adding...' : 'Add to cart'}
          </button>

          {/* Buy Now (Checkout) */}
          <button
            onClick={() => handleAddToCart({ redirect: true })}
            disabled={isLoading}
            className="flex-1 rounded-full border-2 border-slate-900 bg-transparent px-8 py-3.5 text-base font-bold text-slate-900 transition-all hover:bg-slate-900 hover:text-white disabled:opacity-70 active:scale-95"
          >
            Buy Now
          </button>
        </div>

        {/* Secondary Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* WhatsApp */}
          <a
            href={getWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-green-200 bg-green-50 px-6 py-3 text-base font-semibold text-green-700 transition-all hover:bg-green-100 hover:border-green-300 active:scale-95"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            Order via WhatsApp
          </a>

          {/* Wishlist Placeholder */}
          {/* <button className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                <Heart className="h-5 w-5" />
            </button> */}
        </div>
      </div>

      {error && (
        <p className="text-center text-sm font-medium text-red-600 bg-red-50 py-2 rounded-lg border border-red-100">
          {error}
        </p>
      )}

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
