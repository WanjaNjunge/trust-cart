'use client';

import { Bell, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getStoredUser } from '@/lib/auth';
import type { User as UserType } from '@/lib/types';

export function AdminHeader() {
    const [user, setUser] = useState<UserType | null>(null);

    useEffect(() => {
        setUser(getStoredUser());
    }, []);

    return (
        <header className="sticky top-0 z-10 flex h-16 items-center gap-x-4 border-b bg-white px-6 shadow-sm">
            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                {/* Search removed - implemented per-page */}
                <div className="flex flex-1"></div>
                <div className="flex items-center gap-x-4 lg:gap-x-6">
                    <button className="-m-2.5 p-2.5 text-slate-400 hover:text-slate-500">
                        <span className="sr-only">View notifications</span>
                        <Bell className="h-6 w-6" aria-hidden="true" />
                    </button>

                    <div className="h-6 w-px bg-slate-200" aria-hidden="true" />

                    <div className="flex items-center gap-x-4 lg:flex-1">
                        <span className="sr-only">Your profile</span>
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                                <User className="h-5 w-5" />
                            </div>
                            <span className="hidden lg:flex lg:items-center">
                                <span className="text-sm font-semibold leading-6 text-slate-900" aria-hidden="true">
                                    {user ? `${user.firstName} ${user.lastName}` : 'Admin User'}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
