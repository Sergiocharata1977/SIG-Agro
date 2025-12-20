'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// Export mobile toggle para usar desde otros componentes
let mobileToggleFn: (() => void) | null = null;
let mobileCloseFn: (() => void) | null = null;

export function toggleMobileSidebar() {
    if (mobileToggleFn) mobileToggleFn();
}

export function closeMobileSidebar() {
    if (mobileCloseFn) mobileCloseFn();
}

interface MenuItem {
    icon: string;
    label: string;
    href: string;
    active: boolean;
    feature: string;
    module: string;
    subItems?: { icon: string; label: string; href: string }[];
}

export default function Sidebar() {
    const pathname = usePathname();
    const { firebaseUser, user, organization, signOut, hasModuleAccess } = useAuth();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [contabilidadOpen, setContabilidadOpen] = useState(false);

    // Abrir automáticamente el submenú si estamos en contabilidad
    useEffect(() => {
        if (pathname?.startsWith('/contabilidad') || pathname?.startsWith('/terceros') || pathname?.startsWith('/operaciones')) {
            setContabilidadOpen(true);
        }
    }, [pathname]);

    // Registrar toggle y close functions
    useEffect(() => {
        mobileToggleFn = () => setMobileOpen(prev => !prev);
        mobileCloseFn = () => setMobileOpen(false);
        return () => {
            mobileToggleFn = null;
            mobileCloseFn = null;
        };
    }, []);

    // Definición de ítems con requerimientos de acceso
    const menuItems: MenuItem[] = [
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
            active: pathname?.startsWith('/campos') || false,
            feature: 'mapa_gis',
            module: 'campos'
        },
        {
            icon: '🌾',
            label: 'Campañas',
            href: '/campanias',
            active: pathname?.startsWith('/campanias') || false,
            feature: 'campanias',
            module: 'campanias'
        },
        {
            icon: '💰',
            label: 'Contabilidad',
            href: '/contabilidad',
            active: pathname?.startsWith('/contabilidad') || pathname?.startsWith('/terceros') || pathname?.startsWith('/operaciones') || false,
            feature: 'contabilidad',
            module: 'contabilidad',
            subItems: [
                { icon: '👥', label: 'Terceros', href: '/terceros' },
                { icon: '💹', label: 'Operaciones', href: '/operaciones' },
                { icon: '📊', label: 'Saldos', href: '/contabilidad' },
            ]
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

    const isSubItemActive = (href: string) => pathname === href;

    return (
        <>
            {/* Overlay móvil */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <aside className={`
                fixed md:relative z-50 h-screen bg-gray-900 text-white flex flex-col transition-all duration-300
                ${collapsed ? 'md:w-16' : 'md:w-64'}
                w-64
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                {/* Logo y Organización */}
                <div className="p-4 border-b border-gray-800 relative">
                    <div className="flex items-center gap-3">
                        <Image
                            src="/logo-sig-agro.png"
                            alt="SIG Agro"
                            width={40}
                            height={40}
                            className="flex-shrink-0 rounded-lg"
                        />
                        {!collapsed && (
                            <div>
                                <div className="font-semibold text-white">Don Cándido IA</div>
                                <div className="text-xs text-gray-400">SIG Agro</div>
                            </div>
                        )}
                    </div>
                    {/* Botón cerrar en móvil */}
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white md:hidden"
                    >
                        ✕
                    </button>
                    {/* Botón colapsar en desktop */}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="hidden md:flex absolute top-1/2 -translate-y-1/2 -right-3 w-6 h-6 bg-gray-800 rounded-full items-center justify-center text-gray-400 hover:text-white border border-gray-700 z-10"
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
                        <div key={item.href}>
                            {/* Si tiene subItems, es un menú desplegable */}
                            {item.subItems ? (
                                <>
                                    <button
                                        onClick={() => setContabilidadOpen(!contabilidadOpen)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${item.active
                                            ? 'bg-green-600/20 text-green-400'
                                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                            }`}
                                    >
                                        <span className="text-lg">{item.icon}</span>
                                        {!collapsed && (
                                            <>
                                                <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                                                <span className={`text-xs transition-transform ${contabilidadOpen ? 'rotate-180' : ''}`}>
                                                    ▼
                                                </span>
                                            </>
                                        )}
                                    </button>
                                    {/* Submenú */}
                                    {contabilidadOpen && !collapsed && (
                                        <div className="ml-4 mt-1 space-y-1 border-l border-gray-700 pl-3">
                                            {item.subItems.map((sub) => (
                                                <Link
                                                    key={sub.href}
                                                    href={sub.href}
                                                    onClick={() => setMobileOpen(false)}
                                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition text-sm ${isSubItemActive(sub.href)
                                                            ? 'bg-green-600 text-white'
                                                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                                        }`}
                                                >
                                                    <span>{sub.icon}</span>
                                                    <span>{sub.label}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <Link
                                    href={item.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${item.active
                                        ? 'bg-green-600 text-white'
                                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                        }`}
                                >
                                    <span className="text-lg">{item.icon}</span>
                                    {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                                </Link>
                            )}
                        </div>
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
        </>
    );
}

