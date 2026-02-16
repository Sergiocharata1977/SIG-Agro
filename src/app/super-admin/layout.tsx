'use client';

/**
 * Layout para el Panel de Super Admin
 * Incluye sidebar exclusivo para gestión global
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import SuperAdminSidebar from '@/components/super-admin/SuperAdminSidebar';
import { isSuperAdminEmail } from '@/lib/auth-utils';

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, firebaseUser, loading } = useAuth();
    const router = useRouter();
    const isSuperAdmin = user?.role === 'super_admin' || isSuperAdminEmail(firebaseUser?.email);

    useEffect(() => {
        if (loading) return;

        // Si no hay usuario, redirigir al login
        if (!firebaseUser) {
            router.replace('/auth/login');
            return;
        }

        // Si no es super_admin, redirigir al dashboard normal
        if (!isSuperAdmin) {
            router.replace('/dashboard');
            return;
        }
    }, [isSuperAdmin, firebaseUser, loading, router]);

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Verificando acceso Super Admin...</p>
                </div>
            </div>
        );
    }

    // No renderizar si no es super_admin
    if (!isSuperAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Redirigiendo...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-100">
            <SuperAdminSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
