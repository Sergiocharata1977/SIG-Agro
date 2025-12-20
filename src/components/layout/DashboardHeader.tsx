'use client';

import { useAuth } from '@/contexts/AuthContext';
import { toggleMobileSidebar } from './Sidebar';

export function DashboardHeader() {
    const { organization } = useAuth();

    return (
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between md:hidden">
            {/* Botón hamburguesa en móvil */}
            <button
                onClick={toggleMobileSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 transition"
            >
                <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {/* Organización */}
            <div className="text-center flex-1">
                <span className="font-medium text-gray-900">
                    {organization?.name || 'SIG Agro'}
                </span>
            </div>

            {/* Spacer para centrar el nombre */}
            <div className="w-10"></div>
        </header>
    );
}
