'use client';

import { useEffect, useState } from 'react';
import { BarChart3, ShoppingBag, Users, AlertTriangle } from 'lucide-react';
import { authenticatedFetchApi } from '@/lib/api';

interface DashboardStats {
    revenue: { total: number; trend: number };
    orders: { total: number; pending: number; trend: number };
    products: { total: number; lowStock: number };
    customers: { total: number; new: number };
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await authenticatedFetchApi<DashboardStats>('/admin/stats');
                setStats(data);
            } catch (error) {
                console.error('Failed to fetch admin stats', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return <div>Loading stats...</div>;
    }

    if (!stats) {
        return <div>Failed to load dashboard.</div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold font-display text-slate-900">Dashboard</h1>
                <p className="text-slate-500">Overview of your store performance.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Revenue"
                    value={`KSh ${stats.revenue.total.toLocaleString()}`}
                    trend={stats.revenue.trend}
                    icon={BarChart3}
                    trendLabel="vs last month"
                />
                <StatCard
                    title="Total Orders"
                    value={stats.orders.total.toString()}
                    trend={stats.orders.trend}
                    icon={ShoppingBag}
                    trendLabel="vs last month"
                />
                <StatCard
                    title="Low Stock Items"
                    value={stats.products.lowStock.toString()}
                    trend={0}
                    icon={AlertTriangle}
                    trendLabel="Attention needed"
                    warning
                />
                <StatCard
                    title="Total Customers"
                    value={stats.customers.total.toString()}
                    trend={12}
                    icon={Users}
                    trendLabel="active users"
                />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold text-slate-900">Recent Activity</h2>
                    <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-slate-400">
                        Chart Placeholder
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold text-slate-900">Pending Orders</h2>
                    <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-slate-400">
                        Order List Placeholder
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({
    title,
    value,
    trend,
    icon: Icon,
    trendLabel,
    warning = false
}: {
    title: string;
    value: string;
    trend: number;
    icon: any;
    trendLabel: string;
    warning?: boolean;
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
                </div>
                <div className={`rounded-full p-3 ${warning ? 'bg-amber-100 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
                {trend !== 0 && (
                    <span className={`font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trend > 0 ? '+' : ''}{trend}%
                    </span>
                )}
                <span className="ml-2 text-slate-500">{trendLabel}</span>
            </div>
        </div>
    );
}
