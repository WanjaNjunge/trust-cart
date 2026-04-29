'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Package, Search, X } from 'lucide-react';
import { authenticatedFetchApi, authenticatedRequest } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface InventoryItem {
  productId: string;
  productName: string;
  sku: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  reorderThreshold: number;
  isLowStock: boolean;
}

interface InventoryListResponse {
  data: InventoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

interface AdjustInventoryPayload {
  quantity: number;
  adjustmentType: StockAdjustmentType;
  reason: string;
  reference?: string;
}

type StockAdjustmentType = 'PURCHASE' | 'SALE' | 'RETURN' | 'DAMAGE' | 'CORRECTION';

const ADJUSTMENT_TYPE_LABELS: Record<StockAdjustmentType, string> = {
  PURCHASE: 'Purchase / Stock In',
  SALE: 'Sale / Stock Out',
  RETURN: 'Return',
  DAMAGE: 'Damaged / Written Off',
  CORRECTION: 'Recount / Correction',
};

// ─── Adjust Stock Modal ───────────────────────────────────────────────────────

interface AdjustModalProps {
  item: InventoryItem;
  onClose: () => void;
  onSuccess: () => void;
}

function AdjustModal({ item, onClose, onSuccess }: AdjustModalProps) {
  const [quantity, setQuantity] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<StockAdjustmentType>('CORRECTION');
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty === 0) {
      setError('Quantity must be a non-zero integer');
      return;
    }
    if (!reason.trim()) {
      setError('Reason is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload: AdjustInventoryPayload = {
        quantity: qty,
        adjustmentType,
        reason: reason.trim(),
      };
      if (reference.trim()) payload.reference = reference.trim();

      await authenticatedRequest(`/admin/inventory/${item.productId}/adjust`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      onSuccess();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Failed to adjust inventory');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Adjust Stock</h2>
            <p className="text-sm text-slate-500">{item.productName}</p>
            <p className="text-xs text-slate-400">
              SKU: {item.sku} &bull; Current stock: {item.quantityOnHand}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Quantity Change
              <span className="ml-1 text-xs font-normal text-slate-400">(positive = add, negative = remove)</span>
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 10 or -3"
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Adjustment Type</label>
            <select
              value={adjustmentType}
              onChange={(e) => setAdjustmentType(e.target.value as StockAdjustmentType)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {Object.entries(ADJUSTMENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
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
              placeholder="e.g. Physical audit corrected count"
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Reference
              <span className="ml-1 text-xs font-normal text-slate-400">(optional — PO number, return ID, etc.)</span>
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. PO-2026-001"
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {submitting ? 'Saving…' : 'Save Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminInventoryPage() {
  const [data, setData] = useState<InventoryListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchInventory = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({ page: String(page), limit: '20' });
        if (debouncedSearch) qs.set('search', debouncedSearch);
        const res = await authenticatedFetchApi<InventoryListResponse>(
          `/admin/inventory?${qs.toString()}`,
        );
        setData(res);
      } catch (err) {
        console.error('Failed to fetch inventory', err);
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch],
  );

  useEffect(() => {
    fetchInventory(1);
  }, [fetchInventory]);

  const handleAdjustSuccess = () => {
    setAdjustingItem(null);
    setToast('Stock adjusted successfully');
    fetchInventory(data?.pagination.page ?? 1);
    setTimeout(() => setToast(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-900">Inventory</h1>
        <p className="text-slate-500">Monitor stock levels and log adjustments.</p>
      </div>

      {/* Toast */}
      {toast && (
        <div className="rounded-md bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          {toast}
        </div>
      )}

      {/* Search */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product name or SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-md border-slate-300 pl-10 text-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {['Product', 'SKU', 'On Hand', 'Reserved', 'Available', 'Reorder At', ''].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
                    </div>
                  </td>
                </tr>
              ) : !data || data.data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                    <Package className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    No products found.
                  </td>
                </tr>
              ) : (
                data.data.map((item) => (
                  <tr
                    key={item.productId}
                    className={`transition-colors ${item.isLowStock ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-slate-50'}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {item.isLowStock && (
                          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-500" />
                        )}
                        <span className="text-sm font-medium text-slate-900">
                          {item.productName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{item.sku}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-sm font-semibold ${item.isLowStock ? 'text-red-600' : 'text-slate-900'}`}
                      >
                        {item.quantityOnHand}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{item.quantityReserved}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{item.quantityAvailable}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{item.reorderThreshold}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setAdjustingItem(item)}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-indigo-400 hover:text-indigo-700"
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
            <p className="text-sm text-slate-700">
              Page{' '}
              <span className="font-medium">{data.pagination.page}</span> of{' '}
              <span className="font-medium">{data.pagination.totalPages}</span>
            </p>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
              <button
                disabled={!data.pagination.hasPrevPage}
                onClick={() => fetchInventory(data.pagination.page - 1)}
                className="relative inline-flex items-center rounded-l-md px-3 py-2 text-sm text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={!data.pagination.hasNextPage}
                onClick={() => fetchInventory(data.pagination.page + 1)}
                className="relative inline-flex items-center rounded-r-md px-3 py-2 text-sm text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Adjust Modal */}
      {adjustingItem && (
        <AdjustModal
          item={adjustingItem}
          onClose={() => setAdjustingItem(null)}
          onSuccess={handleAdjustSuccess}
        />
      )}
    </div>
  );
}
