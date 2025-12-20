'use client';

/**
 * Página de Terceros (Clientes/Proveedores Unificados)
 * Lista con saldos + modal para crear/editar
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
    obtenerTerceros,
    crearTercero,
    actualizarTercero,
    calcularTotalesSaldos,
} from '@/services/terceros';
import type { Tercero, TipoTercero } from '@/types/contabilidad-simple';

export default function TercerosPage() {
    const { user } = useAuth();

    const [terceros, setTerceros] = useState<Tercero[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtroTipo, setFiltroTipo] = useState<TipoTercero | 'todos'>('todos');
    const [totales, setTotales] = useState({ totalCuentasCobrar: 0, totalCuentasPagar: 0 });

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editando, setEditando] = useState<Tercero | null>(null);
    const [formData, setFormData] = useState({
        nombre: '',
        tipo: 'ambos' as TipoTercero,
        cuit: '',
        direccion: '',
        localidad: '',
        provincia: '',
        telefono: '',
        email: '',
        notas: '',
    });
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        if (user?.organizationId) {
            cargarDatos();
        }
    }, [user, filtroTipo]);

    const cargarDatos = async () => {
        if (!user?.organizationId) return;

        try {
            setLoading(true);
            const [tercerosData, totalesData] = await Promise.all([
                obtenerTerceros(
                    user.organizationId,
                    filtroTipo === 'todos' ? undefined : filtroTipo
                ),
                calcularTotalesSaldos(user.organizationId),
            ]);
            setTerceros(tercerosData);
            setTotales(totalesData);
        } catch (error) {
            console.error('Error cargando terceros:', error);
        } finally {
            setLoading(false);
        }
    };

    const abrirModal = (tercero?: Tercero) => {
        if (tercero) {
            setEditando(tercero);
            setFormData({
                nombre: tercero.nombre,
                tipo: tercero.tipo,
                cuit: tercero.cuit || '',
                direccion: tercero.direccion || '',
                localidad: tercero.localidad || '',
                provincia: tercero.provincia || '',
                telefono: tercero.telefono || '',
                email: tercero.email || '',
                notas: tercero.notas || '',
            });
        } else {
            setEditando(null);
            setFormData({
                nombre: '',
                tipo: 'ambos',
                cuit: '',
                direccion: '',
                localidad: '',
                provincia: '',
                telefono: '',
                email: '',
                notas: '',
            });
        }
        setModalOpen(true);
    };

    const cerrarModal = () => {
        setModalOpen(false);
        setEditando(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.organizationId || !formData.nombre.trim()) return;

        setGuardando(true);
        try {
            if (editando) {
                await actualizarTercero(user.organizationId, editando.id, formData);
            } else {
                await crearTercero(user.organizationId, {
                    ...formData,
                    activo: true,
                });
            }
            cerrarModal();
            cargarDatos();
        } catch (error) {
            console.error('Error guardando tercero:', error);
        } finally {
            setGuardando(false);
        }
    };

    const getBadgeColor = (tipo: TipoTercero) => {
        switch (tipo) {
            case 'cliente':
                return 'bg-blue-100 text-blue-700';
            case 'proveedor':
                return 'bg-orange-100 text-orange-700';
            case 'ambos':
                return 'bg-purple-100 text-purple-700';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto mb-3"></div>
                    <p className="text-gray-500">Cargando terceros...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Terceros</h1>
                    <p className="text-gray-500">Clientes, Proveedores y Comerciales</p>
                </div>
                <button
                    onClick={() => abrirModal()}
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition"
                >
                    + Nuevo Tercero
                </button>
            </div>

            {/* Cards resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">💰</span>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Cuentas a Cobrar</p>
                            <p className="text-xl font-bold text-blue-600">
                                ${totales.totalCuentasCobrar.toLocaleString('es-AR')}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">📋</span>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Cuentas a Pagar</p>
                            <p className="text-xl font-bold text-orange-600">
                                ${totales.totalCuentasPagar.toLocaleString('es-AR')}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">👥</span>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Terceros</p>
                            <p className="text-xl font-bold text-gray-900">
                                {terceros.length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-700">Filtrar:</span>
                    {(['todos', 'cliente', 'proveedor', 'ambos'] as const).map((tipo) => (
                        <button
                            key={tipo}
                            onClick={() => setFiltroTipo(tipo)}
                            className={`px-3 py-1.5 text-sm rounded-lg transition ${filtroTipo === tipo
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {tipo === 'todos' ? 'Todos' : tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Lista */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                {terceros.length === 0 ? (
                    <div className="text-center py-12">
                        <span className="text-4xl">👤</span>
                        <p className="text-gray-500 mt-2">No hay terceros registrados</p>
                        <button
                            onClick={() => abrirModal()}
                            className="mt-4 text-emerald-600 hover:underline"
                        >
                            Crear el primero
                        </button>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Nombre
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Tipo
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    CUIT
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    Nos Debe
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    Le Debemos
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {terceros.map((tercero) => (
                                <tr key={tercero.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {tercero.nombre}
                                            </p>
                                            {tercero.localidad && (
                                                <p className="text-sm text-gray-500">
                                                    {tercero.localidad}
                                                    {tercero.provincia && `, ${tercero.provincia}`}
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${getBadgeColor(
                                                tercero.tipo
                                            )}`}
                                        >
                                            {tercero.tipo}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {tercero.cuit || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {tercero.saldoCliente > 0 ? (
                                            <span className="font-medium text-blue-600">
                                                ${tercero.saldoCliente.toLocaleString('es-AR')}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {tercero.saldoProveedor > 0 ? (
                                            <span className="font-medium text-orange-600">
                                                ${tercero.saldoProveedor.toLocaleString('es-AR')}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => abrirModal(tercero)}
                                            className="text-emerald-600 hover:text-emerald-800 text-sm"
                                        >
                                            Editar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editando ? 'Editar Tercero' : 'Nuevo Tercero'}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre *
                                </label>
                                <input
                                    type="text"
                                    value={formData.nombre}
                                    onChange={(e) =>
                                        setFormData({ ...formData, nombre: e.target.value })
                                    }
                                    required
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="Ej: Agro Servicios SRL"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo *
                                </label>
                                <select
                                    value={formData.tipo}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            tipo: e.target.value as TipoTercero,
                                        })
                                    }
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                    <option value="cliente">Cliente</option>
                                    <option value="proveedor">Proveedor</option>
                                    <option value="ambos">Ambos (Cliente y Proveedor)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    CUIT
                                </label>
                                <input
                                    type="text"
                                    value={formData.cuit}
                                    onChange={(e) =>
                                        setFormData({ ...formData, cuit: e.target.value })
                                    }
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="20-12345678-9"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Localidad
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.localidad}
                                        onChange={(e) =>
                                            setFormData({ ...formData, localidad: e.target.value })
                                        }
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Provincia
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.provincia}
                                        onChange={(e) =>
                                            setFormData({ ...formData, provincia: e.target.value })
                                        }
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Teléfono
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.telefono}
                                        onChange={(e) =>
                                            setFormData({ ...formData, telefono: e.target.value })
                                        }
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) =>
                                            setFormData({ ...formData, email: e.target.value })
                                        }
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notas
                                </label>
                                <textarea
                                    value={formData.notas}
                                    onChange={(e) =>
                                        setFormData({ ...formData, notas: e.target.value })
                                    }
                                    rows={2}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={cerrarModal}
                                    className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={guardando}
                                    className="flex-1 py-2 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                                >
                                    {guardando ? 'Guardando...' : editando ? 'Guardar' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
