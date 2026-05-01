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
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(178,247,70,0.16),transparent_18%),linear-gradient(180deg,#f8f9ff_0%,#eef4ff_44%,#f8f9ff_100%)] md:flex">
            <Sidebar />

            <div className="min-w-0 flex-1">
                <header className="sticky top-0 z-30 border-b border-[rgba(193,200,194,0.7)] bg-[rgba(248,249,255,0.92)] px-4 py-3 backdrop-blur-xl md:hidden">
                    <div className="flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={() => toggleMobileSidebar()}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm"
                            aria-label="Abrir menu lateral"
                        >
                            <Menu className="h-5 w-5" />
                        </button>

                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#446900]">SIG Agro</p>
                            <p className="truncate text-sm font-semibold text-[#0b1c30]">
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
