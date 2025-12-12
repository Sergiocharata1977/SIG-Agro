'use client';

/**
 * Página de Contabilidad
 * Dashboard contable con acceso a plan de cuentas, asientos y reportes
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
    obtenerCuentas,
    obtenerAsientos,
    inicializarPlanCuentas,
    tienePlanCuentas,
    obtenerBalanceComprobacion
} from '@/services/contabilidad';
import type { CuentaContable, AsientoContable } from '@/types';

export default function ContabilidadPage() {
    const router = useRouter();
    const { firebaseUser, loading: authLoading } = useAuth();

    const [cuentas, setCuentas] = useState<CuentaContable[]>([]);
    const [asientos, setAsientos] = useState<AsientoContable[]>([]);
    const [balance, setBalance] = useState<Array<{ cuentaCodigo: string; cuentaNombre: string; debe: number; haber: number; saldo: number }>>([]);
    const [loading, setLoading] = useState(true);
    const [inicializando, setInicializando] = useState(false);
    const [tienePlan, setTienePlan] = useState(false);

    useEffect(() => {
        if (!authLoading && !firebaseUser) {
            router.push('/auth/login');
            return;
        }

        if (firebaseUser) {
            cargarDatos();
        }
    }, [firebaseUser, authLoading, router]);

    const cargarDatos = async () => {
        if (!firebaseUser) return;

        try {
            setLoading(true);

            const tiene = await tienePlanCuentas(firebaseUser.uid);
            setTienePlan(tiene);

            if (tiene) {
                const [cuentasData, asientosData, balanceData] = await Promise.all([
                    obtenerCuentas(firebaseUser.uid),
                    obtenerAsientos(firebaseUser.uid),
                    obtenerBalanceComprobacion(firebaseUser.uid),
                ]);
                setCuentas(cuentasData);
                setAsientos(asientosData);
                setBalance(balanceData);
            }
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInicializar = async () => {
        if (!firebaseUser) return;

        setInicializando(true);
        try {
            await inicializarPlanCuentas(firebaseUser.uid);
            await cargarDatos();
        } catch (error) {
            console.error('Error al inicializar:', error);
        } finally {
            setInicializando(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <span className="text-3xl">📊</span>
                    </div>
                    <p className="text-gray-600">Cargando contabilidad...</p>
                </div>
            </div>
        );
    }

    // Si no tiene plan de cuentas, mostrar opción de inicializar
    if (!tienePlan) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
                <header className="bg-white shadow-sm border-b border-green-200">
                    <div className="max-w-6xl mx-auto px-4 py-4">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                                ← Volver
                            </Link>
                            <h1 className="text-xl font-bold text-gray-900">Contabilidad</h1>
                        </div>
                    </div>
                </header>

                <main className="max-w-2xl mx-auto px-4 py-12">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl">📊</span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            Sistema Contable
                        </h2>
                        <p className="text-gray-600 mb-8">
                            Aún no tienes un plan de cuentas configurado.
                            Inicializa el sistema con un plan de cuentas base para agricultura.
                        </p>

                        <div className="bg-blue-50 rounded-xl p-4 mb-8 text-left">
                            <h3 className="font-semibold text-blue-900 mb-2">El plan incluye:</h3>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>✓ Cuentas de Activo (Caja, Bancos, Stock)</li>
                                <li>✓ Cuentas de Pasivo (Proveedores)</li>
                                <li>✓ Patrimonio Neto (Capital, Resultados)</li>
                                <li>✓ Ingresos (Venta de Granos)</li>
                                <li>✓ Gastos (Semillas, Fertilizantes, Labores, etc.)</li>
                            </ul>
                        </div>

                        <button
                            onClick={handleInicializar}
                            disabled={inicializando}
                            className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition disabled:opacity-50"
                        >
                            {inicializando ? 'Inicializando...' : '🚀 Inicializar Plan de Cuentas'}
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    // Dashboard contable
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
            <header className="bg-white shadow-sm border-b border-green-200">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                                ← Volver
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Contabilidad</h1>
                                <p className="text-sm text-gray-500">{cuentas.length} cuentas • {asientos.length} asientos</p>
                            </div>
                        </div>
                        <Link
                            href="/contabilidad/asiento"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition"
                        >
                            + Nuevo Asiento
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-6">
                {/* Accesos rápidos */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { href: '/contabilidad/cuentas', icon: '📋', title: 'Plan de Cuentas', desc: `${cuentas.length} cuentas` },
                        { href: '/contabilidad/asientos', icon: '📝', title: 'Libro Diario', desc: `${asientos.length} asientos` },
                        { href: '/contabilidad/mayor', icon: '📖', title: 'Libro Mayor', desc: 'Por cuenta' },
                        { href: '/contabilidad/balance', icon: '📊', title: 'Balance', desc: 'Comprobación' },
                    ].map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition group"
                        >
                            <div className="text-3xl mb-3">{item.icon}</div>
                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">{item.title}</h3>
                            <p className="text-sm text-gray-500">{item.desc}</p>
                        </Link>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Últimos asientos */}
                    <div className="bg-white rounded-xl shadow-md p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">📝 Últimos Asientos</h2>
                            <Link href="/contabilidad/asientos" className="text-sm text-blue-600 hover:underline">
                                Ver todos →
                            </Link>
                        </div>

                        {asientos.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500">Sin asientos registrados</p>
                                <Link href="/contabilidad/asiento" className="text-blue-600 hover:underline text-sm">
                                    Crear primer asiento
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {asientos.slice(0, 5).map((asiento) => (
                                    <div key={asiento.id} className="p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="font-medium text-gray-900">#{asiento.numero}</span>
                                                <span className="text-gray-500 ml-2">{asiento.concepto}</span>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-full text-xs ${asiento.estado === 'contabilizado' ? 'bg-green-100 text-green-700' :
                                                asiento.estado === 'borrador' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                {asiento.estado}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between mt-1 text-sm text-gray-500">
                                            <span>{asiento.fecha.toLocaleDateString('es-AR')}</span>
                                            <span className="font-medium text-gray-700">
                                                ${asiento.totalDebe.toLocaleString('es-AR')}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Balance de comprobación resumido */}
                    <div className="bg-white rounded-xl shadow-md p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">📊 Balance de Comprobación</h2>
                            <Link href="/contabilidad/balance" className="text-sm text-blue-600 hover:underline">
                                Ver completo →
                            </Link>
                        </div>

                        {balance.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500">Sin movimientos contabilizados</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="grid grid-cols-4 gap-2 text-xs font-medium text-gray-500 pb-2 border-b">
                                    <span>Cuenta</span>
                                    <span className="text-right">Debe</span>
                                    <span className="text-right">Haber</span>
                                    <span className="text-right">Saldo</span>
                                </div>
                                {balance.slice(0, 8).map((item) => (
                                    <div key={item.cuentaCodigo} className="grid grid-cols-4 gap-2 text-sm py-1">
                                        <span className="text-gray-700 truncate" title={item.cuentaNombre}>
                                            {item.cuentaCodigo}
                                        </span>
                                        <span className="text-right text-gray-600">
                                            {item.debe > 0 ? `$${item.debe.toLocaleString('es-AR')}` : '-'}
                                        </span>
                                        <span className="text-right text-gray-600">
                                            {item.haber > 0 ? `$${item.haber.toLocaleString('es-AR')}` : '-'}
                                        </span>
                                        <span className={`text-right font-medium ${item.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            ${Math.abs(item.saldo).toLocaleString('es-AR')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
