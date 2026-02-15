'use client';

import { Building2, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toggleMobileSidebar } from './Sidebar';
import { LanguageSelector } from '@/components/i18n/LanguageSelector';

export function DashboardHeader() {
    const { organization } = useAuth();

    return (
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between md:hidden">
            <button onClick={toggleMobileSidebar} className="p-2 rounded-lg hover:bg-slate-100 transition" aria-label="Abrir menu">
                <Menu className="w-5 h-5 text-slate-700" />
            </button>

            <div className="text-center flex-1 flex items-center justify-center gap-2 min-w-0 px-3">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span className="font-medium text-slate-900 truncate">{organization?.name || 'SIG Agro'}</span>
            </div>

            <LanguageSelector />
        </header>
    );
}

