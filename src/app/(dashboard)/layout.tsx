'use client';

import { useEffect } from 'react';
import { Menu } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar, { toggleMobileSidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { isSuperAdminEmail } from '@/lib/auth-utils';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { firebaseUser, user, loading, organization } = useAuth();
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Verificando autenticacion...</p>
                </div>
            </div>
        );
    }

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
        <div
            className="min-h-screen md:flex"
            style={{
                background:
                    'radial-gradient(circle at top left, var(--dashboard-bg-accent), transparent 18%), linear-gradient(180deg, var(--dashboard-bg) 0%, color-mix(in srgb, var(--dashboard-bg) 72%, white 28%) 44%, var(--dashboard-bg) 100%)',
            }}
        >
            <Sidebar />

            <div className="min-w-0 flex-1">
                <header
                    className="sticky top-0 z-30 px-4 py-3 backdrop-blur-xl md:hidden"
                    style={{
                        borderBottom: '1px solid var(--dashboard-border)',
                        background: 'var(--dashboard-surface)',
                    }}
                >
                    <div className="flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={() => toggleMobileSidebar()}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm"
                            style={{
                                border: '1px solid var(--dashboard-sidebar-border)',
                                background: 'var(--dashboard-sidebar-panel)',
                                color: 'var(--dashboard-sidebar-text)',
                            }}
                            aria-label="Abrir menu lateral"
                        >
                            <Menu className="h-5 w-5" />
                        </button>

                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: 'var(--dashboard-accent)' }}>SIG Agro</p>
                            <p className="truncate text-sm font-semibold" style={{ color: 'var(--dashboard-text)' }}>
                                {organization?.name || user?.displayName || getMobileTitle(user?.organizationId)}
                            </p>
                        </div>
                    </div>
                </header>

                <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

function getMobileTitle(organizationId?: string | null) {
    return organizationId ? 'Organizacion activa' : 'Panel de gestion';
}
