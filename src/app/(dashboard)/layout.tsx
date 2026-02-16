'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { isSuperAdminEmail } from '@/lib/auth-utils';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { firebaseUser, user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const isSuperAdmin = user?.role === 'super_admin' || isSuperAdminEmail(firebaseUser?.email);

    useEffect(() => {
        if (!loading && !firebaseUser) {
            router.replace('/auth/login');
            return;
        }
        if (!loading && isSuperAdmin) {
            router.replace('/super-admin/productores');
            return;
        }
        if (!loading && firebaseUser && !isSuperAdmin && !user?.organizationId && pathname !== '/organizaciones') {
            router.replace('/organizaciones');
        }
    }, [firebaseUser, isSuperAdmin, loading, pathname, router, user?.organizationId]);

    // Show loading state while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Verificando autenticación...</p>
                </div>
            </div>
        );
    }

    // Don't render dashboard content if not authenticated
    if (!firebaseUser || isSuperAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Redirigiendo al login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <DashboardHeader />
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
