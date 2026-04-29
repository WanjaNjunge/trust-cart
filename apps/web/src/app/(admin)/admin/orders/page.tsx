'use client';

import { useCallback, useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { authenticatedFetchApi, authenticatedRequest } from '@/lib/api';
import { getStoredUser } from '@/lib/auth';

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus =
  | 'CREATED'
  | 'PENDING_PAYMENT'
  | 'PAYMENT_FAILED'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'READY_FOR_PICKUP'
  | 'DISPATCHED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'DELIVERY_FAILED'
  | 'RETURN_REQUESTED'
  | 'RETURN_APPROVED'
  | 'RETURN_REJECTED'
  | 'RETURN_RECEIVED'
  | 'REFUND_PENDING'
  | 'REFUNDED'
  | 'PARTIAL_REFUND'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';

interface AdminOrder {
  id: string;
  orderNumber: string;
  customer: { name: string; email: string };
  status: OrderStatus;
  total: number;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  paymentMethod: string;
  itemCount: number;
  createdAt: string;
}

interface AdminOrdersResponse {
  data: AdminOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Valid next statuses per current status (mirrors backend VALID_TRANSITIONS)
const VALID_NEXT: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PENDING_PAYMENT: ['CONFIRMED', 'PAYMENT_FAILED', 'CANCELLED'],
  PAYMENT_FAILED: ['PENDING_PAYMENT', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['READY_FOR_PICKUP', 'DISPATCHED', 'CANCELLED'],
  READY_FOR_PICKUP: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'DELIVERY_FAILED'],
  DELIVERY_FAILED: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  RETURN_REQUESTED: ['RETURN_APPROVED', 'RETURN_REJECTED'],
  RETURN_APPROVED: ['RETURN_RECEIVED'],
  RETURN_RECEIVED: ['REFUND_PENDING'],
  REFUND_PENDING: ['REFUNDED'],
};

const REFUNDABLE_STATUSES: OrderStatus[] = [
  'CONFIRMED',
  'PROCESSING',
  'DISPATCHED',
  'DELIVERED',
  'RETURN_RECEIVED',
];

const STATUS_COLOURS: Partial<Record<OrderStatus, string>> = {
  PENDING_PAYMENT: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-indigo-100 text-indigo-800',
  DISPATCHED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-slate-100 text-slate-700',
  REFUNDED: 'bg-orange-100 text-orange-800',
  PARTIAL_REFUND: 'bg-orange-100 text-orange-800',
  PAYMENT_FAILED: 'bg-red-100 text-red-800',
};

const ALL_STATUSES: OrderStatus[] = [
  'CREATED',
  'PENDING_PAYMENT',
  'PAYMENT_FAILED',
  'CONFIRMED',
  'PROCESSING',
  'READY_FOR_PICKUP',
  'DISPATCHED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'DELIVERY_FAILED',
  'RETURN_REQUESTED',
  'RETURN_APPROVED',
  'RETURN_REJECTED',
  'RETURN_RECEIVED',
  'REFUND_PENDING',
  'REFUNDED',
  'PARTIAL_REFUND',
  'COMPLETED',
  'CANCELLED',
  'EXPIRED',
];

function StatusBadge({ status }: { status: OrderStatus }) {
  const colour = STATUS_COLOURS[status] ?? 'bg-slate-100 text-slate-700';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colour}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

// ─── Status Update Modal ───────────────────────────────────────────────────────

interface StatusModalProps {
  order: AdminOrder;
  onClose: () => void;
  onSuccess: () => void;
}

function StatusModal({ order, onClose, onSuccess }: StatusModalProps) {
  const nextStatuses = VALID_NEXT[order.status] ?? [];
  const [newStatus, setNewStatus] = useState<OrderStatus>(nextStatuses[0] ?? order.status);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) { setError('Reason is required'); return; }
    setSubmitting(true);
    setError('');
    try {
      await authenticatedRequest(`/admin/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus, reason: reason.trim() }),
      });
      onSuccess();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  if (nextStatuses.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
          <h2 className="mb-2 text-lg font-semibold text-slate-900">No Transitions Available</h2>
          <p className="mb-4 text-sm text-slate-500">
            Order <strong>{order.orderNumber}</strong> in status <strong>{order.status}</strong> has
            no valid next states.
          </p>
          <div className="flex justify-end">
            <button onClick={onClose} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Update Order Status</h2>
            <p className="text-sm text-slate-500">{order.orderNumber}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">New Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {nextStatuses.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Reason <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Payment confirmed by finance team"
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60">
              {submitting ? 'Saving…' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Refund Modal ─────────────────────────────────────────────────────────────

interface RefundModalProps {
  order: AdminOrder;
  onClose: () => void;
  onSuccess: () => void;
}

function RefundModal({ order, onClose, onSuccess }: RefundModalProps) {
  const [amount, setAmount] = useState(String(order.total));
  const [reason, setReason] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) { setError('Reason is required'); return; }
    const amt = parseInt(amount, 10);
    if (isNaN(amt) || amt <= 0) { setError('Amount must be a positive integer'); return; }
    if (amt > order.total) { setError(`Amount cannot exceed order total (${order.total})`); return; }
    setError('');
    setConfirming(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      await authenticatedRequest(`/admin/orders/${order.id}/refund`, {
        method: 'POST',
        body: JSON.stringify({ amount: parseInt(amount, 10), reason: reason.trim() }),
      });
      onSuccess();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Failed to initiate refund');
      setConfirming(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Initiate Refund</h2>
            <p className="text-sm text-slate-500">{order.orderNumber} — Order total: KES {order.total.toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!confirming ? (
          <form onSubmit={handleConfirm} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Refund Amount (KES)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={1}
                max={order.total}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Reason <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Customer returned damaged item"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>

            {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500">Review Refund</button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">Confirm Refund</p>
              <p className="mt-1 text-sm text-red-700">
                Refund <strong>KES {parseInt(amount, 10).toLocaleString()}</strong> for order{' '}
                <strong>{order.orderNumber}</strong>?
              </p>
              <p className="mt-1 text-xs text-red-600">Reason: {reason}</p>
            </div>

            {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirming(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Back</button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-60"
              >
                {submitting ? 'Processing…' : 'Confirm Refund'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const user = getStoredUser();
  const canRefund = user?.role === 'MANAGER' || user?.role === 'ADMIN';

  const [data, setData] = useState<AdminOrdersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [statusOrder, setStatusOrder] = useState<AdminOrder | null>(null);
  const [refundOrder, setRefundOrder] = useState<AdminOrder | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchOrders = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({ page: String(page), limit: '20' });
        if (debouncedSearch) qs.set('search', debouncedSearch);
        if (statusFilter !== 'all') qs.set('status', statusFilter);
        const res = await authenticatedFetchApi<AdminOrdersResponse>(
          `/admin/orders?${qs.toString()}`,
        );
        setData(res);
      } catch (err) {
        console.error('Failed to fetch orders', err);
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, statusFilter],
  );

  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-900">Orders</h1>
        <p className="text-slate-500">Manage and update order statuses.</p>
      </div>

      {toast && (
        <div className="rounded-md bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          {toast}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by order number…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full rounded-md border-slate-300 pl-10 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
            className="rounded-md border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          {(search || statusFilter !== 'all') && (
            <button
              onClick={() => { setSearch(''); setStatusFilter('all'); }}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <X className="h-4 w-4" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {['Order', 'Customer', 'Date', 'Status', 'Total', 'Actions'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
                    </div>
                  </td>
                </tr>
              ) : !data || data.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                data.data.map((order) => {
                  const hasNextStatuses = (VALID_NEXT[order.status] ?? []).length > 0;
                  const canRefundThis = canRefund && REFUNDABLE_STATUSES.includes(order.status);
                  return (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900">{order.orderNumber}</div>
                        <div className="text-xs text-slate-400">{order.itemCount} item{order.itemCount !== 1 ? 's' : ''}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900">{order.customer.name}</div>
                        <div className="text-xs text-slate-400">{order.customer.email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(order.createdAt).toLocaleDateString('en-KE', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        KES {order.total.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {hasNextStatuses && (
                            <button
                              onClick={() => setStatusOrder(order)}
                              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-indigo-400 hover:text-indigo-700"
                            >
                              Update
                            </button>
                          )}
                          {canRefundThis && (
                            <button
                              onClick={() => setRefundOrder(order)}
                              className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                            >
                              Refund
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
            <p className="text-sm text-slate-700">
              Page <span className="font-medium">{data.pagination.page}</span> of{' '}
              <span className="font-medium">{data.pagination.totalPages}</span>
            </p>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
              <button
                disabled={!data.pagination.hasPrevPage}
                onClick={() => fetchOrders(data.pagination.page - 1)}
                className="relative inline-flex items-center rounded-l-md px-3 py-2 text-sm text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={!data.pagination.hasNextPage}
                onClick={() => fetchOrders(data.pagination.page + 1)}
                className="relative inline-flex items-center rounded-r-md px-3 py-2 text-sm text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Modals */}
      {statusOrder && (
        <StatusModal
          order={statusOrder}
          onClose={() => setStatusOrder(null)}
          onSuccess={() => {
            setStatusOrder(null);
            showToast(`Order status updated`);
            fetchOrders(data?.pagination.page ?? 1);
          }}
        />
      )}
      {refundOrder && (
        <RefundModal
          order={refundOrder}
          onClose={() => setRefundOrder(null)}
          onSuccess={() => {
            setRefundOrder(null);
            showToast('Refund initiated successfully');
            fetchOrders(data?.pagination.page ?? 1);
          }}
        />
      )}
    </div>
  );
}
