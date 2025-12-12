'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Sidebar() {
    const pathname = usePathname();
    const { firebaseUser, user, organization, signOut, hasModuleAccess } = useAuth();
    const [collapsed, setCollapsed] = useState(false);

    // Definición de ítems con requerimientos de acceso
    const menuItems = [
        {
            icon: '📊',
            label: 'Dashboard',
            href: '/metricas',
            active: pathname === '/metricas',
            feature: 'metricas',
            module: 'metricas'
        },
        {
            icon: '🗺️',
            label: 'Mapa GIS',
            href: '/dashboard',
            active: pathname === '/dashboard',
            feature: 'mapa_gis',
            module: 'mapa_gis'
        },
        {
            icon: '📍',
            label: 'Mis Campos',
            href: '/campos',
            active: pathname?.startsWith('/campos'),
            feature: 'mapa_gis',
            module: 'campos'
        },
        {
            icon: '🌾',
            label: 'Campañas',
            href: '/campanias',
            active: pathname?.startsWith('/campanias'),
            feature: 'campanias',
            module: 'campanias'
        },
        {
            icon: '📋',
            label: 'Contabilidad',
            href: '/contabilidad',
            active: pathname?.startsWith('/contabilidad'),
            feature: 'contabilidad',
            module: 'contabilidad'
        },
        {
            icon: '🤖',
            label: 'Análisis IA',
            href: '/analisis',
            active: pathname === '/analisis',
            feature: 'analisis_ia',
            module: 'analisis_ia'
        },
        {
            icon: '📄',
            label: 'Documentos',
            href: '/documentos',
            active: pathname === '/documentos',
            feature: 'documentos',
            module: 'documentos'
        },
    ];

    // Filtrar ítems según permisos
    const filteredItems = menuItems.filter(item => {
        // 1. Verificar Feature de Organización (si existe org)
        if (organization && !organization.features[item.feature as keyof typeof organization.features]) {
            return false;
        }

        // 2. Verificar Permiso de Usuario
        if (!hasModuleAccess(item.module)) {
            return false;
        }

        return true;
    });

    // Obtener email y nombre del usuario
    const userEmail = user?.email || firebaseUser?.email || '';
    const userName = user?.displayName || firebaseUser?.displayName || userEmail.split('@')[0] || 'Usuario';
    const userInitial = userName.charAt(0).toUpperCase();

    return (
        <aside className={`h-screen bg-gray-900 text-white flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'
            }`}>
            {/* Logo y Organización */}
            <div className="p-4 border-b border-gray-800 relative">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">🌾</span>
                    </div>
                    {!collapsed && (
                        <div>
                            <div className="font-semibold text-white">Don Cándido IA</div>
                            <div className="text-xs text-gray-400">SIG Agro</div>
                        </div>
                    )}
                </div>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute top-1/2 -translate-y-1/2 -right-3 w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:text-white border border-gray-700 z-10"
                >
                    {collapsed ? '→' : '←'}
                </button>
            </div>

            {/* Organización actual */}
            {!collapsed && organization && (
                <div className="px-4 py-3 bg-gray-800/50 border-b border-gray-800">
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Organización</div>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-emerald-600 rounded flex items-center justify-center text-white text-xs font-bold">
                            {organization.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">{organization.name}</div>
                            <div className="text-xs text-gray-500">{organization.province}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Menú */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {filteredItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${item.active
                            ? 'bg-green-600 text-white'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            }`}
                    >
                        <span className="text-lg">{item.icon}</span>
                        {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                    </Link>
                ))}
            </nav>

            {/* Usuario y Cerrar Sesión */}
            <div className="p-3 border-t border-gray-800">
                <div className={`flex items-center gap-3 p-2 rounded-lg bg-gray-800 ${collapsed ? 'justify-center' : ''}`}>
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium">{userInitial}</span>
                    </div>
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">{userName}</div>
                            <div className="text-xs text-gray-500 truncate">{userEmail}</div>
                        </div>
                    )}
                </div>

                {/* Botón de Cerrar Sesión - SIEMPRE VISIBLE */}
                <button
                    onClick={signOut}
                    className={`w-full mt-2 px-3 py-2.5 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition flex items-center justify-center gap-2 ${collapsed ? 'px-2' : ''}`}
                >
                    <span>🚪</span>
                    {!collapsed && <span className="text-sm font-medium">Cerrar Sesión</span>}
                </button>
            </div>
        </aside>
    );
}
