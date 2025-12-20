'use client';

/**
 * Página de Operaciones Contables
 * Formularios estándar que generan asientos automáticos
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { obtenerTerceros } from '@/services/terceros';
import { generarAsientoAutomatico } from '@/services/asientos-auto';
import type { Tercero, TipoInsumo, MedioPago } from '@/types/contabilidad-simple';

type OperacionActiva = 'compra' | 'cobro' | 'pago' | null;

export default function OperacionesPage() {
    const { user } = useAuth();

    const [terceros, setTerceros] = useState<Tercero[]>([]);
    const [loading, setLoading] = useState(true);
    const [operacionActiva, setOperacionActiva] = useState<OperacionActiva>(null);
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

    // Form data para cada tipo
    const [formCompra, setFormCompra] = useState({
        terceroId: '',
        tipoInsumo: 'fertilizante' as TipoInsumo,
        productoNombre: '',
        cantidad: '',
        precioUnitario: '',
        fecha: new Date().toISOString().split('T')[0],
        observaciones: '',
    });

    const [formCobro, setFormCobro] = useState({
        terceroId: '',
        monto: '',
        medioPago: 'transferencia' as MedioPago,
        fecha: new Date().toISOString().split('T')[0],
        observaciones: '',
    });

    const [formPago, setFormPago] = useState({
        terceroId: '',
        monto: '',
        medioPago: 'transferencia' as MedioPago,
        fecha: new Date().toISOString().split('T')[0],
        observaciones: '',
    });

    useEffect(() => {
        if (user?.organizationId) {
            cargarTerceros();
        }
    }, [user]);

    const cargarTerceros = async () => {
        if (!user?.organizationId) return;
        try {
            setLoading(true);
            const data = await obtenerTerceros(user.organizationId);
            setTerceros(data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const mostrarMensaje = (tipo: 'success' | 'error', texto: string) => {
        setMensaje({ tipo, texto });
        setTimeout(() => setMensaje(null), 4000);
    };

    // ========== COMPRA DE INSUMOS ==========
    const handleCompra = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.organizationId) return;

        setGuardando(true);
        try {
            const operacionId = `compra_${Date.now()}`;
            await generarAsientoAutomatico(
                user.organizationId,
                'compra_insumo',
                {
                    terceroId: formCompra.terceroId,
                    tipoInsumo: formCompra.tipoInsumo,
                    productoNombre: formCompra.productoNombre,
                    cantidad: parseFloat(formCompra.cantidad),
                    precioUnitario: parseFloat(formCompra.precioUnitario),
                    fecha: new Date(formCompra.fecha),
                    observaciones: formCompra.observaciones,
                },
                operacionId
            );

            mostrarMensaje('success', '✓ Compra registrada correctamente');
            setOperacionActiva(null);
            setFormCompra({
                terceroId: '',
                tipoInsumo: 'fertilizante',
                productoNombre: '',
                cantidad: '',
                precioUnitario: '',
                fecha: new Date().toISOString().split('T')[0],
                observaciones: '',
            });
        } catch (error) {
            console.error('Error:', error);
            mostrarMensaje('error', 'Error al registrar la compra');
        } finally {
            setGuardando(false);
        }
    };

    // ========== COBRO A CLIENTE ==========
    const handleCobro = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.organizationId) return;

        setGuardando(true);
        try {
            const operacionId = `cobro_${Date.now()}`;
            await generarAsientoAutomatico(
                user.organizationId,
                'cobro',
                {
                    terceroId: formCobro.terceroId,
                    monto: parseFloat(formCobro.monto),
                    medioPago: formCobro.medioPago,
                    fecha: new Date(formCobro.fecha),
                    observaciones: formCobro.observaciones,
                },
                operacionId
            );

            mostrarMensaje('success', '✓ Cobro registrado correctamente');
            setOperacionActiva(null);
            setFormCobro({
                terceroId: '',
                monto: '',
                medioPago: 'transferencia',
                fecha: new Date().toISOString().split('T')[0],
                observaciones: '',
            });
        } catch (error) {
            console.error('Error:', error);
            mostrarMensaje('error', 'Error al registrar el cobro');
        } finally {
            setGuardando(false);
        }
    };

    // ========== PAGO A PROVEEDOR ==========
    const handlePago = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.organizationId) return;

        setGuardando(true);
        try {
            const operacionId = `pago_${Date.now()}`;
            await generarAsientoAutomatico(
                user.organizationId,
                'pago',
                {
                    terceroId: formPago.terceroId,
                    monto: parseFloat(formPago.monto),
                    medioPago: formPago.medioPago,
                    fecha: new Date(formPago.fecha),
                    observaciones: formPago.observaciones,
                },
                operacionId
            );

            mostrarMensaje('success', '✓ Pago registrado correctamente');
            setOperacionActiva(null);
            setFormPago({
                terceroId: '',
                monto: '',
                medioPago: 'transferencia',
                fecha: new Date().toISOString().split('T')[0],
                observaciones: '',
            });
        } catch (error) {
            console.error('Error:', error);
            mostrarMensaje('error', 'Error al registrar el pago');
        } finally {
            setGuardando(false);
        }
    };

    const proveedores = terceros.filter(t => t.tipo === 'proveedor' || t.tipo === 'ambos');
    const clientes = terceros.filter(t => t.tipo === 'cliente' || t.tipo === 'ambos');

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto mb-3"></div>
                    <p className="text-gray-500">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Operaciones</h1>
                <p className="text-gray-500">Registrar compras, cobros y pagos</p>
            </div>

            {/* Mensaje */}
            {mensaje && (
                <div className={`p-4 rounded-lg ${mensaje.tipo === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                    {mensaje.texto}
                </div>
            )}

            {/* Botones de operaciones */}
            {!operacionActiva && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => setOperacionActiva('compra')}
                        className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition text-left group"
                    >
                        <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                            <span className="text-3xl">🛒</span>
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg">Compra de Insumos</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Registrar compra a proveedor
                        </p>
                    </button>

                    <button
                        onClick={() => setOperacionActiva('cobro')}
                        className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition text-left group"
                    >
                        <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                            <span className="text-3xl">💰</span>
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg">Cobro a Cliente</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Registrar cobro recibido
                        </p>
                    </button>

                    <button
                        onClick={() => setOperacionActiva('pago')}
                        className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition text-left group"
                    >
                        <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                            <span className="text-3xl">💸</span>
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg">Pago a Proveedor</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Registrar pago realizado
                        </p>
                    </button>
                </div>
            )}

            {/* Formulario de Compra */}
            {operacionActiva === 'compra' && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">🛒</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Compra de Insumos</h2>
                            <p className="text-sm text-gray-500">Genera: Debe Insumos / Haber Proveedores</p>
                        </div>
                    </div>

                    <form onSubmit={handleCompra} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Proveedor *
                                </label>
                                <select
                                    value={formCompra.terceroId}
                                    onChange={(e) => setFormCompra({ ...formCompra, terceroId: e.target.value })}
                                    required
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                >
                                    <option value="">Seleccionar...</option>
                                    {proveedores.map((t) => (
                                        <option key={t.id} value={t.id}>{t.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo de Insumo *
                                </label>
                                <select
                                    value={formCompra.tipoInsumo}
                                    onChange={(e) => setFormCompra({ ...formCompra, tipoInsumo: e.target.value as TipoInsumo })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                >
                                    <option value="semilla">Semilla</option>
                                    <option value="fertilizante">Fertilizante</option>
                                    <option value="agroquimico">Agroquímico</option>
                                    <option value="combustible">Combustible</option>
                                    <option value="otro">Otro</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Producto *
                            </label>
                            <input
                                type="text"
                                value={formCompra.productoNombre}
                                onChange={(e) => setFormCompra({ ...formCompra, productoNombre: e.target.value })}
                                required
                                placeholder="Ej: Urea granulada 50kg"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cantidad *
                                </label>
                                <input
                                    type="number"
                                    value={formCompra.cantidad}
                                    onChange={(e) => setFormCompra({ ...formCompra, cantidad: e.target.value })}
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Precio Unitario *
                                </label>
                                <input
                                    type="number"
                                    value={formCompra.precioUnitario}
                                    onChange={(e) => setFormCompra({ ...formCompra, precioUnitario: e.target.value })}
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Total
                                </label>
                                <div className="px-4 py-2 bg-gray-100 rounded-lg font-bold text-gray-900">
                                    ${((parseFloat(formCompra.cantidad) || 0) * (parseFloat(formCompra.precioUnitario) || 0)).toLocaleString('es-AR')}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fecha *
                            </label>
                            <input
                                type="date"
                                value={formCompra.fecha}
                                onChange={(e) => setFormCompra({ ...formCompra, fecha: e.target.value })}
                                required
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setOperacionActiva(null)}
                                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={guardando}
                                className="flex-1 py-2 px-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
                            >
                                {guardando ? 'Guardando...' : 'Registrar Compra'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Formulario de Cobro */}
            {operacionActiva === 'cobro' && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">💰</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Cobro a Cliente</h2>
                            <p className="text-sm text-gray-500">Genera: Debe Caja/Banco / Haber Clientes</p>
                        </div>
                    </div>

                    <form onSubmit={handleCobro} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cliente *
                            </label>
                            <select
                                value={formCobro.terceroId}
                                onChange={(e) => setFormCobro({ ...formCobro, terceroId: e.target.value })}
                                required
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Seleccionar...</option>
                                {clientes.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.nombre} {t.saldoCliente > 0 ? `(Saldo: $${t.saldoCliente.toLocaleString('es-AR')})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Monto *
                                </label>
                                <input
                                    type="number"
                                    value={formCobro.monto}
                                    onChange={(e) => setFormCobro({ ...formCobro, monto: e.target.value })}
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Medio de Pago *
                                </label>
                                <select
                                    value={formCobro.medioPago}
                                    onChange={(e) => setFormCobro({ ...formCobro, medioPago: e.target.value as MedioPago })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="efectivo">Efectivo</option>
                                    <option value="transferencia">Transferencia</option>
                                    <option value="cheque">Cheque</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fecha *
                            </label>
                            <input
                                type="date"
                                value={formCobro.fecha}
                                onChange={(e) => setFormCobro({ ...formCobro, fecha: e.target.value })}
                                required
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setOperacionActiva(null)}
                                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={guardando}
                                className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                            >
                                {guardando ? 'Guardando...' : 'Registrar Cobro'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Formulario de Pago */}
            {operacionActiva === 'pago' && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">💸</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Pago a Proveedor</h2>
                            <p className="text-sm text-gray-500">Genera: Debe Proveedores / Haber Caja/Banco</p>
                        </div>
                    </div>

                    <form onSubmit={handlePago} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Proveedor *
                            </label>
                            <select
                                value={formPago.terceroId}
                                onChange={(e) => setFormPago({ ...formPago, terceroId: e.target.value })}
                                required
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            >
                                <option value="">Seleccionar...</option>
                                {proveedores.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.nombre} {t.saldoProveedor > 0 ? `(Deuda: $${t.saldoProveedor.toLocaleString('es-AR')})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Monto *
                                </label>
                                <input
                                    type="number"
                                    value={formPago.monto}
                                    onChange={(e) => setFormPago({ ...formPago, monto: e.target.value })}
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Medio de Pago *
                                </label>
                                <select
                                    value={formPago.medioPago}
                                    onChange={(e) => setFormPago({ ...formPago, medioPago: e.target.value as MedioPago })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                >
                                    <option value="efectivo">Efectivo</option>
                                    <option value="transferencia">Transferencia</option>
                                    <option value="cheque">Cheque</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fecha *
                            </label>
                            <input
                                type="date"
                                value={formPago.fecha}
                                onChange={(e) => setFormPago({ ...formPago, fecha: e.target.value })}
                                required
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setOperacionActiva(null)}
                                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={guardando}
                                className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                            >
                                {guardando ? 'Guardando...' : 'Registrar Pago'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
