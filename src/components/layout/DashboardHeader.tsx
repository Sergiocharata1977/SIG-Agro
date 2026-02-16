'use client';

import { useEffect, useRef, useState } from 'react';
import { Building2, LogOut, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toggleMobileSidebar } from './Sidebar';
import { LanguageSelector } from '@/components/i18n/LanguageSelector';

export function DashboardHeader() {
    const { organization, user, signOut } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (!menuRef.current) return;
            if (!menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    return (
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
            <button onClick={toggleMobileSidebar} className="p-2 rounded-lg hover:bg-slate-100 transition" aria-label="Abrir menu">
                <Menu className="w-5 h-5 text-slate-700" />
            </button>

            <div className="text-center flex-1 flex items-center justify-center gap-2 min-w-0 px-3">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span className="font-medium text-slate-900 truncate">{organization?.name || 'SIG Agro'}</span>
            </div>

            <div ref={menuRef} className="relative">
                <button
                    onClick={() => setMenuOpen((prev) => !prev)}
                    className="w-9 h-9 bg-emerald-600 hover:bg-emerald-700 rounded-full text-white text-sm font-semibold grid place-items-center"
                    title={user?.email || ''}
                >
                    {(user?.email || 'U').charAt(0).toUpperCase()}
                </button>

                {menuOpen && (
                    <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-200 bg-white shadow-xl p-3 z-50">
                        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white grid place-items-center font-semibold">
                                {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-900 truncate">{user?.displayName || 'Usuario'}</p>
                                <p className="text-xs text-slate-500 truncate">{user?.email || ''}</p>
                            </div>
                        </div>

                        <div className="py-3 flex justify-center border-b border-slate-100">
                            <LanguageSelector />
                        </div>

                        <button
                            onClick={async () => {
                                setMenuOpen(false);
                                await signOut();
                            }}
                            className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
                        >
                            <LogOut className="w-4 h-4" />
                            Cerrar sesion
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}
