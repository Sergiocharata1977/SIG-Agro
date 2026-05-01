'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
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
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(178,247,70,0.16),transparent_18%),linear-gradient(180deg,#f8f9ff_0%,#eef4ff_44%,#f8f9ff_100%)]">
            <DashboardHeader />
            <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    );
}
