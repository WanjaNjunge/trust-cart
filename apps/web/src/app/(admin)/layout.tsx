'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { isAuthenticated, getStoredUser, isAdminOrStaff } from '@/lib/auth';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        // 1. Check if logged in
        if (!isAuthenticated()) {
            router.push('/login?redirect=/admin');
            return;
        }

        // 2. Check role
        const user = getStoredUser();
        if (!user || !isAdminOrStaff(user)) {
            // Redirect to home if logged in but not staff
            router.push('/');
            return;
        }

        // 3. Authorize
        setIsAuthorized(true);
    }, [router]);

    if (!isAuthorized) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 bg-slate-200 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-slate-200 rounded mb-2"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-50">
            <AdminSidebar />
            <div className="flex flex-1 flex-col transition-all duration-300 ease-in-out">
                <AdminHeader />
                <main className="flex-1 p-6 md:p-8 overflow-y-auto h-[calc(100vh-64px)]">
                    <div className="mx-auto max-w-7xl animate-fade-in">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
