'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getOrders, type Order } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { isAuthenticated } from '@/lib/auth';
import { LoginPrompt } from '@/components/LoginPrompt';

// Status badge configuration
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    PENDING_PAYMENT: { label: 'Pending Payment', color: 'text-yellow-700', bg: 'bg-yellow-100' },
    PAYMENT_FAILED: { label: 'Payment Failed', color: 'text-red-700', bg: 'bg-red-100' },
    CONFIRMED: { label: 'Confirmed', color: 'text-blue-700', bg: 'bg-blue-100' },
    PROCESSING: { label: 'Processing', color: 'text-blue-700', bg: 'bg-blue-100' },
    READY_FOR_PICKUP: { label: 'Ready for Pickup', color: 'text-purple-700', bg: 'bg-purple-100' },
    DISPATCHED: { label: 'Dispatched', color: 'text-purple-700', bg: 'bg-purple-100' },
    OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'text-purple-700', bg: 'bg-purple-100' },
    DELIVERED: { label: 'Delivered', color: 'text-green-700', bg: 'bg-green-100' },
    COMPLETED: { label: 'Completed', color: 'text-green-700', bg: 'bg-green-100' },
    CANCELLED: { label: 'Cancelled', color: 'text-gray-700', bg: 'bg-gray-100' },
    REFUNDED: { label: 'Refunded', color: 'text-gray-700', bg: 'bg-gray-100' },
};

function StatusBadge({ status }: { status: string }) {
    const config = STATUS_CONFIG[status] || { label: status, color: 'text-gray-700', bg: 'bg-gray-100' };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color} ${config.bg}`}>
            {config.label}
        </span>
    );
}

function OrderCard({ order }: { order: Order }) {
    const orderDate = new Date(order.createdAt).toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    return (
        <Link href={`/orders/${order.id}`} className="block">
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{order.orderNumber}</h3>
                            <StatusBadge status={order.status} />
                        </div>
                        <p className="text-sm text-gray-500">
                            {orderDate} • {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">{formatPrice(order.total)}</p>
                        <p className="text-sm text-gray-500">{order.paymentMethod.replace(/_/g, ' ')}</p>
                    </div>
                </div>

                {/* Order items preview */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex flex-wrap gap-2">
                        {order.items.slice(0, 3).map((item) => (
                            <span key={item.id} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                                {item.productName} × {item.quantity}
                            </span>
                        ))}
                        {order.items.length > 3 && (
                            <span className="text-xs text-gray-500">+{order.items.length - 3} more</span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}

function EmptyOrders() {
    return (
        <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-500 mb-6">When you place orders, they&apos;ll appear here.</p>
            <Link
                href="/products"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
            >
                Start Shopping
            </Link>
        </div>
    );
}

function LoadingState() {
    return (
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
                            <div className="h-4 w-24 bg-gray-200 rounded" />
                        </div>
                        <div className="text-right">
                            <div className="h-6 w-20 bg-gray-200 rounded mb-2" />
                            <div className="h-4 w-16 bg-gray-200 rounded" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [authenticated, setAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        // Check authentication on client-side mount
        const authStatus = isAuthenticated();
        setAuthenticated(authStatus);

        if (!authStatus) {
            setLoading(false);
            return;
        }

        async function loadOrders() {
            try {
                setLoading(true);
                const response = await getOrders(page, 10);
                setOrders(response.data);
                setTotalPages(response.meta.totalPages);
            } catch (err) {
                console.error('Failed to load orders:', err);
                setError('Failed to load orders. Please try again.');
            } finally {
                setLoading(false);
            }
        }

        loadOrders();
    }, [page]);

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
        return <LoginPrompt redirectPath="/orders" />;
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-24">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Your Orders</h1>
                    <p className="mt-2 text-gray-600">Track and manage your orders</p>
                </div>

                {/* Content */}
                {loading ? (
                    <LoadingState />
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                        {error}
                    </div>
                ) : orders.length === 0 ? (
                    <EmptyOrders />
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <OrderCard key={order.id} order={order} />
                        ))}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center gap-2 mt-8">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <span className="px-4 py-2 text-sm text-gray-600">
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
