'use client';

/**
 * Página para registrar un nuevo asiento contable
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { obtenerCuentas, crearAsiento } from '@/services/contabilidad';
import type { CuentaContable, LineaAsiento } from '@/types';

export default function NuevoAsientoPage() {
    const router = useRouter();
    const { user } = useAuth();

    const [loading, setLoading] = useState(false);
    const [cuentas, setCuentas] = useState<CuentaContable[]>([]);
    const [loadingCuentas, setLoadingCuentas] = useState(true);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        fecha: new Date().toISOString().split('T')[0],
        concepto: '',
        descripcion: '',
        tipo: 'operativo' as const,
    });

    const [lineas, setLineas] = useState<Array<{
        cuentaId: string;
        debe: string;
        haber: string;
        descripcion?: string;
    }>>([
        { cuentaId: '', debe: '', haber: '' },
        { cuentaId: '', debe: '', haber: '' },
    ]);

    useEffect(() => {
        if (!user) return;

        const cargarCuentas = async () => {
            try {
                const data = await obtenerCuentas(user.uid);
                // Solo cuentas que admiten movimientos
                setCuentas(data.filter(c => c.admiteMovimientos));
            } catch (err) {
                console.error('Error al cargar cuentas:', err);
            } finally {
                setLoadingCuentas(false);
            }
        };

        cargarCuentas();
    }, [user]);

    const agregarLinea = () => {
        setLineas([...lineas, { cuentaId: '', debe: '', haber: '' }]);
    };

    const eliminarLinea = (index: number) => {
        if (lineas.length <= 2) return;
        setLineas(lineas.filter((_, i) => i !== index));
    };

    const actualizarLinea = (index: number, campo: string, valor: string) => {
        const nuevasLineas = [...lineas];
        nuevasLineas[index] = { ...nuevasLineas[index], [campo]: valor };

        // Si ingresa debe, limpiar haber y viceversa
        if (campo === 'debe' && valor) {
            nuevasLineas[index].haber = '';
        } else if (campo === 'haber' && valor) {
            nuevasLineas[index].debe = '';
        }

        setLineas(nuevasLineas);
    };

    const calcularTotales = () => {
        const totalDebe = lineas.reduce((acc, l) => acc + (parseFloat(l.debe) || 0), 0);
        const totalHaber = lineas.reduce((acc, l) => acc + (parseFloat(l.haber) || 0), 0);
        return { totalDebe, totalHaber, balanceado: Math.abs(totalDebe - totalHaber) < 0.01 };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) return;

        const { balanceado } = calcularTotales();
        if (!balanceado) {
            setError('El asiento no está balanceado. Debe = Haber');
            return;
        }

        if (!formData.concepto) {
            setError('Ingresa un concepto para el asiento');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Construir líneas del asiento
            const lineasAsiento: LineaAsiento[] = lineas
                .filter(l => l.cuentaId && (parseFloat(l.debe) > 0 || parseFloat(l.haber) > 0))
                .map(l => {
                    const cuenta = cuentas.find(c => c.id === l.cuentaId);
                    return {
                        cuentaId: l.cuentaId,
                        cuentaCodigo: cuenta?.codigo || '',
                        cuentaNombre: cuenta?.nombre || '',
                        debe: parseFloat(l.debe) || 0,
                        haber: parseFloat(l.haber) || 0,
                        moneda: 'ARS' as const,
                        descripcion: l.descripcion,
                    };
                });

            await crearAsiento(user.uid, {
                fecha: new Date(formData.fecha),
                concepto: formData.concepto,
                descripcion: formData.descripcion || undefined,
                tipo: formData.tipo,
                lineas: lineasAsiento,
                estado: 'borrador',
                createdBy: user.uid,
            });

            router.push('/contabilidad');
        } catch (err: unknown) {
            console.error('Error al crear asiento:', err);
            setError(err instanceof Error ? err.message : 'Error al crear el asiento');
        } finally {
            setLoading(false);
        }
    };

    const { totalDebe, totalHaber, balanceado } = calcularTotales();

    if (loadingCuentas) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
                <p className="text-gray-600">Cargando cuentas...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
            <header className="bg-white shadow-sm border-b border-green-200">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="/contabilidad" className="text-gray-500 hover:text-gray-700">
                            ← Volver
                        </Link>
                        <h1 className="text-xl font-bold text-gray-900">Nuevo Asiento Contable</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-6">
                <div className="bg-white rounded-xl shadow-md p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Cabecera del asiento */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Fecha *
                                </label>
                                <input
                                    type="date"
                                    value={formData.fecha}
                                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Concepto *
                                </label>
                                <input
                                    type="text"
                                    value={formData.concepto}
                                    onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                                    placeholder="Ej: Compra de semillas, Pago a proveedor..."
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Líneas del asiento */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-medium text-gray-700">
                                    Líneas del Asiento
                                </label>
                                <button
                                    type="button"
                                    onClick={agregarLinea}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                    + Agregar Línea
                                </button>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                {/* Header */}
                                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 pb-2 border-b">
                                    <div className="col-span-6">Cuenta</div>
                                    <div className="col-span-2 text-right">Debe</div>
                                    <div className="col-span-2 text-right">Haber</div>
                                    <div className="col-span-2"></div>
                                </div>

                                {lineas.map((linea, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                        <div className="col-span-6">
                                            <select
                                                value={linea.cuentaId}
                                                onChange={(e) => actualizarLinea(index, 'cuentaId', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Seleccionar cuenta...</option>
                                                {cuentas.map((cuenta) => (
                                                    <option key={cuenta.id} value={cuenta.id}>
                                                        {cuenta.codigo} - {cuenta.nombre}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <input
                                                type="number"
                                                value={linea.debe}
                                                onChange={(e) => actualizarLinea(index, 'debe', e.target.value)}
                                                placeholder="0.00"
                                                min="0"
                                                step="0.01"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <input
                                                type="number"
                                                value={linea.haber}
                                                onChange={(e) => actualizarLinea(index, 'haber', e.target.value)}
                                                placeholder="0.00"
                                                min="0"
                                                step="0.01"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="col-span-2 text-center">
                                            {lineas.length > 2 && (
                                                <button
                                                    type="button"
                                                    onClick={() => eliminarLinea(index)}
                                                    className="text-red-500 hover:text-red-700 text-sm"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* Totales */}
                                <div className="grid grid-cols-12 gap-2 pt-3 border-t">
                                    <div className="col-span-6 text-right font-medium text-gray-700">
                                        TOTALES
                                    </div>
                                    <div className="col-span-2">
                                        <div className={`text-right font-bold ${balanceado ? 'text-green-600' : 'text-red-600'}`}>
                                            ${totalDebe.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <div className={`text-right font-bold ${balanceado ? 'text-green-600' : 'text-red-600'}`}>
                                            ${totalHaber.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                    <div className="col-span-2 text-center">
                                        {balanceado ? (
                                            <span className="text-green-600 text-sm">✓</span>
                                        ) : (
                                            <span className="text-red-600 text-xs">No balancea</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Botones */}
                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={loading || !balanceado}
                                className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition disabled:opacity-50"
                            >
                                {loading ? 'Guardando...' : '✓ Guardar como Borrador'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
