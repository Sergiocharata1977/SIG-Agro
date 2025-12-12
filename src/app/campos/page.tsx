'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import type { Campo } from '@/types/agro';
import { obtenerCampos, eliminarCampo } from '@/services/campos';

export default function CamposPage() {
    const { user, organization, loading: authLoading } = useAuth();
    const [campos, setCampos] = useState<Campo[]>([]);
    const [loading, setLoading] = useState(true);

    const loadCampos = async () => {
        if (!user?.organizationId) return;
        try {
            setLoading(true);
            const data = await obtenerCampos(user.organizationId);
            setCampos(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && user?.organizationId) {
            loadCampos();
        }
    }, [authLoading, user?.organizationId]);

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este campo?') || !user?.organizationId) return;
        try {
            await eliminarCampo(user.organizationId, id);
            setCampos(campos => campos.filter(c => c.id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-gray-500">Cargando...</div>
            </div>
        );
    }

    if (!organization) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500">No tienes una organización activa.</p>
                    <Link href="/dashboard" className="text-green-600 hover:underline mt-2 inline-block">
                        Volver al inicio
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">🏞️ Mis Campos</h1>
                    <p className="text-gray-500">Gestión de establecimientos agrícolas</p>
                </div>
                <Link
                    href="/campos/nuevo"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition"
                >
                    + Nuevo Campo
                </Link>
            </div>

            {/* Contenido */}
            <div className="bg-white rounded-xl shadow-sm border">
                <div className="p-4 border-b">
                    <h2 className="font-semibold text-gray-900">Listado de Campos</h2>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">
                        Cargando campos...
                    </div>
                ) : campos.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <span className="text-4xl block mb-2">🌾</span>
                        No hay campos registrados. ¡Creá el primero!
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left p-4 font-medium text-gray-600">Nombre</th>
                                    <th className="text-left p-4 font-medium text-gray-600">Ubicación</th>
                                    <th className="text-left p-4 font-medium text-gray-600">Superficie</th>
                                    <th className="text-left p-4 font-medium text-gray-600">Estado</th>
                                    <th className="text-left p-4 font-medium text-gray-600">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {campos.map((campo) => (
                                    <tr key={campo.id} className="hover:bg-gray-50">
                                        <td className="p-4">
                                            <div className="font-medium text-gray-900">{campo.nombre}</div>
                                        </td>
                                        <td className="p-4 text-gray-600">
                                            {campo.departamento}, {campo.provincia}
                                        </td>
                                        <td className="p-4 text-gray-600">
                                            {campo.superficieTotal} ha
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${campo.activo
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {campo.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                <Link
                                                    href={`/campos/${campo.id}`}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                                    title="Ver detalle"
                                                >
                                                    👁️
                                                </Link>
                                                <Link
                                                    href={`/dashboard?campoId=${campo.id}`}
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded"
                                                    title="Ver en mapa"
                                                >
                                                    📍
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(campo.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                                                    title="Eliminar"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Resumen */}
            {campos.length > 0 && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm border">
                        <div className="text-3xl font-bold text-green-600">{campos.length}</div>
                        <div className="text-gray-600">Campos totales</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border">
                        <div className="text-3xl font-bold text-blue-600">
                            {campos.reduce((acc, c) => acc + (c.superficieTotal || 0), 0).toLocaleString()}
                        </div>
                        <div className="text-gray-600">Hectáreas totales</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border">
                        <div className="text-3xl font-bold text-amber-600">
                            {campos.filter(c => c.activo).length}
                        </div>
                        <div className="text-gray-600">Campos activos</div>
                    </div>
                </div>
            )}
        </div>
    );
}
