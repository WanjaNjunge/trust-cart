'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle, ShoppingBag, MapPin, Smartphone, Truck } from 'lucide-react';
import { getOrderById, type Order } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';
import { formatPrice } from '@/lib/utils';

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: 'Pending Payment',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  DISPATCHED: 'Dispatched',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export default function OrderConfirmationPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push(`/login?redirect=/order-confirmation/${id}`);
      return;
    }

    getOrderById(id)
      .then(setOrder)
      .catch((err: unknown) => {
        const apiErr = err as { message?: string };
        setError(apiErr.message || 'Order not found.');
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 pt-20 text-center">
        <ShoppingBag className="mb-4 h-12 w-12 text-slate-300" />
        <h1 className="text-xl font-semibold text-slate-800">Order not found</h1>
        <p className="mt-2 text-sm text-slate-500">{error || 'We could not find this order.'}</p>
        <Link
          href="/orders"
          className="mt-6 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          View All Orders
        </Link>
      </div>
    );
  }

  const isMpesa = order.paymentMethod === 'MPESA_STK';
  const isPod = order.paymentMethod === 'POD_CASH';
  const statusLabel = STATUS_LABEL[order.status] ?? order.status.replace(/_/g, ' ');

  return (
    <div className="min-h-screen bg-gray-50 pb-16 pt-24">
      <div className="mx-auto max-w-2xl px-4">

        {/* Success header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Order Placed Successfully!</h1>
          <p className="mt-2 text-gray-500">
            Thank you for your order. We&apos;ll keep you updated on its progress.
          </p>
        </div>

        {/* Order summary card */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

          {/* Order meta */}
          <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div>
                <p className="text-gray-500">Order Number</p>
                <p className="mt-0.5 font-semibold text-gray-900">{order.orderNumber}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <p className="mt-0.5 font-semibold text-yellow-600">{statusLabel}</p>
              </div>
              <div>
                <p className="text-gray-500">Payment</p>
                <p className="mt-0.5 font-semibold text-gray-900">
                  {isMpesa ? 'MPesa STK' : 'Pay on Delivery'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Total</p>
                <p className="mt-0.5 font-semibold text-gray-900">{formatPrice(order.total)}</p>
              </div>
            </div>
          </div>

          {/* Payment instruction */}
          <div className="border-b border-gray-100 bg-indigo-50 px-6 py-4">
            {isMpesa ? (
              <div className="flex items-start gap-3">
                <Smartphone className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-600" />
                <div>
                  <p className="text-sm font-medium text-indigo-800">Check your phone for an MPesa prompt</p>
                  <p className="mt-0.5 text-xs text-indigo-600">Enter your MPesa PIN to complete payment. The prompt auto-confirms in stub mode.</p>
                </div>
              </div>
            ) : isPod ? (
              <div className="flex items-start gap-3">
                <Truck className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-600" />
                <div>
                  <p className="text-sm font-medium text-indigo-800">Pay on Delivery confirmed</p>
                  <p className="mt-0.5 text-xs text-indigo-600">
                    Please have <strong>{formatPrice(order.total)}</strong> in cash ready when your order arrives.
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          {/* Items */}
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">Items Ordered</h2>
            <ul className="space-y-3">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-gray-900">{item.productName}</span>
                    <span className="ml-2 text-gray-500">× {item.quantity}</span>
                  </div>
                  <span className="font-medium text-gray-900">{formatPrice(item.lineTotal)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 space-y-1.5 border-t border-gray-100 pt-4 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>−{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500">
                <span>Delivery</span>
                <span>{formatPrice(order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-2 font-semibold text-gray-900">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Delivery address */}
          {order.address && (
            <div className="px-6 py-4">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{order.address.recipientName}</p>
                  <p className="text-gray-500">{order.address.line1}</p>
                  {order.address.line2 && <p className="text-gray-500">{order.address.line2}</p>}
                  <p className="text-gray-500">{order.address.city}, {order.address.county}</p>
                  <p className="text-gray-500">{order.address.phone}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/orders/${order.id}`}
            className="flex-1 rounded-xl border border-slate-300 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            View Order Details
          </Link>
          <Link
            href="/"
            className="flex-1 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 py-3 text-center text-sm font-bold text-slate-900 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
