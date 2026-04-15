'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit, Trash2, Filter, X } from 'lucide-react';
import { authenticatedFetchApi, authenticatedRequest } from '@/lib/api';
import { ProductListResponseDto } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function AdminProductsPage() {
    const router = useRouter();
    const [data, setData] = useState<ProductListResponseDto | null>(null);
    const [loading, setLoading] = useState(true);

    // Filter States
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft'>('all');
    const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');

    // Debounce search
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchProducts = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const qs = new URLSearchParams();
            qs.set('page', page.toString());
            qs.set('limit', '10');

            if (debouncedSearch) qs.set('q', debouncedSearch);

            // Accessing the new Admin endpoint which supports these filters
            // Status Logic
            if (statusFilter === 'active') {
                qs.set('isActive', 'true');
            } else if (statusFilter === 'draft') {
                qs.set('isActive', 'false');
            } else {
                // 'all'
                qs.set('includeInactive', 'true');
            }

            // Stock Logic
            if (stockFilter === 'in_stock') {
                qs.set('inStock', 'true');
            } else if (stockFilter === 'out_of_stock') {
                qs.set('inStock', 'false');
            }

            const res = await authenticatedFetchApi<ProductListResponseDto>(`/admin/products?${qs.toString()}`);
            setData(res);
        } catch (error) {
            console.error('Failed to fetch products', error);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, statusFilter, stockFilter]);

    useEffect(() => {
        fetchProducts(1);
    }, [fetchProducts]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to deactivate this product?')) return;
        try {
            await authenticatedRequest(`/admin/products/${id}`, { method: 'DELETE' });
            fetchProducts(data?.pagination.page || 1);
        } catch (error) {
            alert('Failed to delete product');
        }
    };

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setStockFilter('all');
    };

    const hasActiveFilters = search || statusFilter !== 'all' || stockFilter !== 'all';

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-display text-slate-900">Products</h1>
                    <p className="text-slate-500">Manage your product catalog.</p>
                </div>
                <Link
                    href="/admin/products/new"
                    className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
                >
                    <Plus className="-ml-1 mr-2 h-5 w-5" />
                    Add Product
                </Link>
            </div>

            {/* Filter Bar */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">

                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="block w-full rounded-md border-slate-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Filters Group */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="rounded-md border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="draft">Draft</option>
                        </select>

                        <select
                            value={stockFilter}
                            onChange={(e) => setStockFilter(e.target.value as any)}
                            className="rounded-md border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="all">All Stock</option>
                            <option value="in_stock">In Stock</option>
                            <option value="out_of_stock">Out of Stock</option>
                        </select>

                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            >
                                <X className="h-4 w-4" />
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                                    Product
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                                    Price
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                                    Stock
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                                    Status
                                </th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex justify-center">
                                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : !data || data.data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                                        No products found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                data.data.map((product) => (
                                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0 bg-slate-100 rounded-md overflow-hidden border border-slate-200">
                                                    {product.primaryImage ? (
                                                        <img className="h-full w-full object-cover" src={product.primaryImage.url} alt="" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center text-slate-400">
                                                            <ImageIcon className="h-5 w-5" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-slate-900 truncate max-w-[200px]" title={product.name}>{product.name}</div>
                                                    <div className="text-sm text-slate-500">{product.sku}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-900">KSh {product.price.toLocaleString()}</div>
                                            {product.compareAtPrice && (
                                                <div className="text-xs text-slate-500 line-through">KSh {product.compareAtPrice.toLocaleString()}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${product.isInStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {product.isInStock ? (
                                                    // Since we don't have accurate QOH in listing for now, just show status
                                                    `In Stock (${product.availableQuantity || 'Yes'})`
                                                ) : 'Out of Stock'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {product.isActive ? (
                                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                                                    Draft
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                <Link href={`/admin/products/${product.id}`} className="p-1 text-slate-400 hover:text-indigo-600 transition-colors">
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                                <button onClick={() => handleDelete(product.id)} className="p-1 text-slate-400 hover:text-red-600 transition-colors">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
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
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-slate-700">
                                    Showing page <span className="font-medium">{data.pagination.page}</span> of <span className="font-medium">{data.pagination.totalPages}</span>
                                </p>
                            </div>
                            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                <button
                                    disabled={!data.pagination.hasPrevPage}
                                    onClick={() => fetchProducts(data.pagination.page - 1)}
                                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    disabled={!data.pagination.hasNextPage}
                                    onClick={() => fetchProducts(data.pagination.page + 1)}
                                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </nav>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper icon
function ImageIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    )
}
