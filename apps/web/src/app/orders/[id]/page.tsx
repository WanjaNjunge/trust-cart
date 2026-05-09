'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getOrderById, cancelOrder, type Order } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { isAuthenticated } from '@/lib/auth';
import { LoginPrompt } from '@/components/LoginPrompt';

// Status badge configuration
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    PENDING_PAYMENT: { label: 'Pending Payment', color: 'text-yellow-700', bg: 'bg-yellow-100', icon: '⏳' },
    PAYMENT_FAILED: { label: 'Payment Failed', color: 'text-red-700', bg: 'bg-red-100', icon: '❌' },
    CONFIRMED: { label: 'Confirmed', color: 'text-blue-700', bg: 'bg-blue-100', icon: '✓' },
    PROCESSING: { label: 'Processing', color: 'text-blue-700', bg: 'bg-blue-100', icon: '⚙️' },
    READY_FOR_PICKUP: { label: 'Ready for Pickup', color: 'text-purple-700', bg: 'bg-purple-100', icon: '📦' },
    DISPATCHED: { label: 'Dispatched', color: 'text-purple-700', bg: 'bg-purple-100', icon: '🚚' },
    OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'text-purple-700', bg: 'bg-purple-100', icon: '🏃' },
    DELIVERED: { label: 'Delivered', color: 'text-green-700', bg: 'bg-green-100', icon: '✅' },
    COMPLETED: { label: 'Completed', color: 'text-green-700', bg: 'bg-green-100', icon: '🎉' },
    CANCELLED: { label: 'Cancelled', color: 'text-gray-700', bg: 'bg-gray-100', icon: '🚫' },
    REFUNDED: { label: 'Refunded', color: 'text-gray-700', bg: 'bg-gray-100', icon: '💰' },
};

const CANCELLABLE_STATUSES = ['PENDING_PAYMENT', 'CONFIRMED', 'PROCESSING', 'PAYMENT_FAILED'];

function StatusBadge({ status }: { status: string }) {
    const config = STATUS_CONFIG[status] || { label: status, color: 'text-gray-700', bg: 'bg-gray-100', icon: '•' };
    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color} ${config.bg}`}>
            <span className="mr-1.5">{config.icon}</span>
            {config.label}
        </span>
    );
}

function OrderStatusTimeline({ history }: { history: Order['statusHistory'] }) {
    return (
        <div className="flow-root">
            <ul className="-mb-8">
                {history.map((event, idx) => {
                    const config = STATUS_CONFIG[event.toStatus] || { label: event.toStatus, color: 'text-gray-700', bg: 'bg-gray-200', icon: '•' };
                    const isLast = idx === history.length - 1;
                    const date = new Date(event.createdAt);

                    return (
                        <li key={idx}>
                            <div className="relative pb-8">
                                {!isLast && (
                                    <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                                )}
                                <div className="relative flex space-x-3">
                                    <div>
                                        <span className={`h-8 w-8 rounded-full ${config.bg} flex items-center justify-center ring-8 ring-white`}>
                                            <span className="text-sm">{config.icon}</span>
                                        </span>
                                    </div>
                                    <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                        <div>
                                            <p className={`text-sm font-medium ${config.color}`}>{config.label}</p>
                                            {event.reason && (
                                                <p className="mt-0.5 text-xs text-gray-500">{event.reason}</p>
                                            )}
                                        </div>
                                        <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                            <time dateTime={event.createdAt}>
                                                {date.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}
                                                <br />
                                                <span className="text-xs">{date.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </time>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

function CancelOrderModal({
    isOpen,
    onClose,
    onConfirm,
    isLoading
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    isLoading: boolean;
}) {
    const [reason, setReason] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

                <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                    <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
                                <h3 className="text-lg font-semibold leading-6 text-gray-900">Cancel Order</h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">
                                        Are you sure you want to cancel this order? This action cannot be undone.
                                    </p>
                                    <div className="mt-4">
                                        <label htmlFor="cancel-reason" className="block text-sm font-medium text-gray-700">
                                            Reason (optional)
                                        </label>
                                        <textarea
                                            id="cancel-reason"
                                            rows={3}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                                            placeholder="Why are you cancelling this order?"
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                        <button
                            type="button"
                            onClick={() => onConfirm(reason)}
                            disabled={isLoading}
                            className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50 sm:ml-3 sm:w-auto"
                        >
                            {isLoading ? 'Cancelling...' : 'Yes, Cancel Order'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                        >
                            Keep Order
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [authenticated, setAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        // Check authentication on client-side mount
        const authStatus = isAuthenticated();
        setAuthenticated(authStatus);

        if (!authStatus) {
            setLoading(false);
            return;
        }

        async function loadOrder() {
            try {
                setLoading(true);
                const data = await getOrderById(params.id);
                setOrder(data);
            } catch (err) {
                console.error('Failed to load order:', err);
                setError('Failed to load order. Please try again.');
            } finally {
                setLoading(false);
            }
        }

        loadOrder();
    }, [params.id]);

    const handleCancelOrder = async (reason: string) => {
        if (!order) return;

        try {
            setCancelling(true);
            const updatedOrder = await cancelOrder(order.id, reason);
            setOrder(updatedOrder);
            setShowCancelModal(false);
        } catch (err) {
            console.error('Failed to cancel order:', err);
            setError('Failed to cancel order. Please try again.');
        } finally {
            setCancelling(false);
        }
    };

    const canCancel = order && CANCELLABLE_STATUSES.includes(order.status);

    // Show loading during initial hydration
    if (authenticated === null) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    // Show login prompt for unauthenticated users
    if (!authenticated) {
        return (
            <LoginPrompt
                title="Order Details"
                subtitle="View your order information"
                redirectPath={`/orders/${params.id}`}
            />
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error || 'Order not found'}</p>
                    <Link href="/orders" className="text-orange-600 hover:underline">
                        ← Back to Orders
                    </Link>
                </div>
            </div>
        );
    }

    const orderDate = new Date(order.createdAt).toLocaleDateString('en-KE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back link */}
                <Link href="/orders" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Orders
                </Link>

                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{order.orderNumber}</h1>
                            <p className="text-gray-500 mt-1">{orderDate}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <StatusBadge status={order.status} />
                            {canCancel && (
                                <button
                                    onClick={() => setShowCancelModal(true)}
                                    className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-md hover:bg-red-50"
                                >
                                    Cancel Order
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left column - Order details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Order Items */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
                            <div className="space-y-4">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">{item.productName}</p>
                                            <p className="text-sm text-gray-500">SKU: {item.productSku}</p>
                                            <p className="text-sm text-gray-500">Qty: {item.quantity} × {formatPrice(item.unitPrice)}</p>
                                        </div>
                                        <p className="font-medium text-gray-900">{formatPrice(item.lineTotal)}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Order Summary */}
                            <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span className="text-gray-900">{formatPrice(order.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Delivery Fee</span>
                                    <span className="text-gray-900">{formatPrice(order.deliveryFee)}</span>
                                </div>
                                {order.discount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Discount</span>
                                        <span className="text-green-600">-{formatPrice(order.discount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-200">
                                    <span>Total</span>
                                    <span className="text-orange-600">{formatPrice(order.total)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Delivery Address */}
                        {order.address && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Address</h2>
                                <div className="text-gray-600">
                                    <p className="font-medium text-gray-900">{order.address.recipientName}</p>
                                    <p>{order.address.phone}</p>
                                    <p>{order.address.line1}</p>
                                    {order.address.line2 && <p>{order.address.line2}</p>}
                                    <p>{order.address.city}, {order.address.county}</p>
                                </div>
                            </div>
                        )}

                        {/* Payment Info */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment</h2>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                    <span className="text-lg">💳</span>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{order.paymentMethod.replace(/_/g, ' ')}</p>
                                    {order.promoCode && (
                                        <p className="text-sm text-gray-500">Promo: {order.promoCode}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right column - Status Timeline */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Timeline</h2>
                            <OrderStatusTimeline history={order.statusHistory} />
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {order.notes && (
                    <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h3 className="font-medium text-yellow-800">Order Notes</h3>
                        <p className="text-yellow-700 mt-1">{order.notes}</p>
                    </div>
                )}
            </div>

            {/* Cancel Modal */}
            <CancelOrderModal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={handleCancelOrder}
                isLoading={cancelling}
            />
        </div>
    );
}
