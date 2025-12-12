'use client';

/**
 * Página de Métricas / Dashboard
 * Estadísticas y resumen del productor
 */

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

// Sidebar compartido (TODO: mover a componente)
function Sidebar() {
    const pathname = usePathname();
    const { firebaseUser, signOut } = useAuth();

    const menuItems = [
        { icon: '📊', label: 'Dashboard', href: '/metricas', active: pathname === '/metricas' },
        { icon: '🗺️', label: 'Mapa GIS', href: '/dashboard', active: pathname === '/dashboard' },
        { icon: '📍', label: 'Mis Campos', href: '/campos', active: pathname?.startsWith('/campos') },
        { icon: '🌾', label: 'Campañas', href: '/campanias', active: pathname?.startsWith('/campanias') },
        { icon: '📋', label: 'Contabilidad', href: '/contabilidad', active: pathname?.startsWith('/contabilidad') },
        { icon: '🤖', label: 'Análisis IA', href: '/analisis', active: pathname === '/analisis' },
        { icon: '📄', label: 'Documentos', href: '/documentos', active: pathname === '/documentos' },
    ];

    return (
        <aside className="w-64 h-screen bg-gray-900 text-white flex flex-col">
            {/* Logo */}
            <div className="p-4 border-b border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                        <span className="text-lg">🌾</span>
                    </div>
                    <div>
                        <div className="font-semibold text-white">Don Cándido IA</div>
                        <div className="text-xs text-gray-400">SIG Agro</div>
                    </div>
                </div>
            </div>

            {/* Menú */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {menuItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${item.active
                            ? 'bg-green-600 text-white'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            }`}
                    >
                        <span className="text-lg">{item.icon}</span>
                        <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                ))}
            </nav>

            {/* Usuario */}
            <div className="p-3 border-t border-gray-800">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-800">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">
                            {firebaseUser?.email?.charAt(0).toUpperCase() || 'U'}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">
                            {firebaseUser?.displayName || firebaseUser?.email?.split('@')[0] || 'Usuario'}
                        </div>
                        <div className="text-xs text-gray-500 truncate">{firebaseUser?.email}</div>
                    </div>
                </div>
                <button
                    onClick={signOut}
                    className="w-full mt-2 px-3 py-2 text-sm text-red-400 hover:bg-gray-800 rounded-lg transition"
                >
                    Cerrar sesión
                </button>
            </div>
        </aside>
    );
}

// Tarjeta de métrica
function MetricCard({ icon, label, value, change, positive }: {
    icon: string;
    label: string;
    value: string | number;
    change?: string;
    positive?: boolean;
}) {
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <span className="text-2xl">{icon}</span>
                {change && (
                    <span className={`text-sm font-medium ${positive ? 'text-green-600' : 'text-red-600'}`}>
                        {positive ? '↑' : '↓'} {change}
                    </span>
                )}
            </div>
            <div className="text-3xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500 mt-1">{label}</div>
        </div>
    );
}

// Acceso directo
function QuickAccessCard({ icon, title, description, href }: {
    icon: string;
    title: string;
    description: string;
    href: string;
}) {
    return (
        <Link
            href={href}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-green-300 hover:shadow-md transition group"
        >
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-100 transition">
                <span className="text-2xl">{icon}</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
        </Link>
    );
}

export default function MetricasPage() {
    const { firebaseUser, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !firebaseUser) {
            router.push('/auth/login');
        }
    }, [firebaseUser, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center animate-pulse">
                    <span className="text-2xl">🌾</span>
                </div>
            </div>
        );
    }

    if (!firebaseUser) return null;

    return (
        <div className="h-screen flex overflow-hidden bg-gray-50">
            <Sidebar />

            <div className="flex-1 overflow-y-auto">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-8 py-6">
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard General</h1>
                    <p className="text-gray-500">Resumen de tu operación agrícola</p>
                </header>

                <div className="p-8">
                    {/* Métricas principales */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <MetricCard icon="📍" label="Campos" value={1} change="+1" positive />
                        <MetricCard icon="🗺️" label="Lotes" value={2} />
                        <MetricCard icon="🌾" label="Ha Totales" value="200" change="+50" positive />
                        <MetricCard icon="📊" label="Campaña Activa" value="2024/25" />
                    </div>

                    {/* Accesos directos */}
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Accesos Directos</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <QuickAccessCard
                            icon="🗺️"
                            title="Mapa GIS"
                            description="Visualizá tus campos y lotes en el mapa interactivo."
                            href="/dashboard"
                        />
                        <QuickAccessCard
                            icon="📍"
                            title="Agregar Campo"
                            description="Registrá un nuevo campo con polígonos en el mapa."
                            href="/campos/nuevo"
                        />
                        <QuickAccessCard
                            icon="🌾"
                            title="Campañas"
                            description="Gestioná tus campañas agrícolas activas."
                            href="/campanias"
                        />
                        <QuickAccessCard
                            icon="📋"
                            title="Contabilidad"
                            description="Asientos contables y balance de comprobación."
                            href="/contabilidad"
                        />
                        <QuickAccessCard
                            icon="🤖"
                            title="Análisis IA"
                            description="Consultá a Don Cándido sobre tus cultivos."
                            href="/analisis"
                        />
                        <QuickAccessCard
                            icon="📄"
                            title="Documentos"
                            description="Reportes, informes y documentación."
                            href="/documentos"
                        />
                    </div>

                    {/* Última actividad */}
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h2>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                        {[
                            { icon: '📍', text: 'Nuevo campo registrado: Campo Los Algarrobos', time: 'Hace 2 horas' },
                            { icon: '🗺️', text: 'Lote Norte agregado al mapa', time: 'Hace 2 horas' },
                            { icon: '🌾', text: 'Campaña 2024/25 iniciada', time: 'Hace 1 día' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4 p-4">
                                <span className="text-xl">{item.icon}</span>
                                <div className="flex-1">
                                    <div className="text-sm text-gray-900">{item.text}</div>
                                    <div className="text-xs text-gray-500">{item.time}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
