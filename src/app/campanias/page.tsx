'use client';

/**
 * Página de Campañas Agrícolas
 * Lista y gestión de campañas del productor
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { obtenerCampanias } from '@/services/campanias';
import type { Campania } from '@/types';

export default function CampaniasPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [campanias, setCampanias] = useState<Campania[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState<'todas' | 'en_curso' | 'finalizadas'>('todas');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth/login');
            return;
        }

        if (user) {
            cargarCampanias();
        }
    }, [user, authLoading, router]);

    const cargarCampanias = async () => {
        if (!user) return;

        try {
            setLoading(true);
            const data = await obtenerCampanias(user.uid);
            setCampanias(data);
        } catch (error) {
            console.error('Error al cargar campañas:', error);
        } finally {
            setLoading(false);
        }
    };

    const campaniasFiltradas = campanias.filter((c) => {
        if (filtro === 'todas') return true;
        if (filtro === 'en_curso') return c.estado === 'en_curso' || c.estado === 'planificada';
        if (filtro === 'finalizadas') return c.estado === 'finalizada';
        return true;
    });

    const getEstadoColor = (estado: string) => {
        switch (estado) {
            case 'planificada': return 'bg-blue-100 text-blue-800';
            case 'en_curso': return 'bg-green-100 text-green-800';
            case 'finalizada': return 'bg-gray-100 text-gray-800';
            case 'cancelada': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getEstadoLabel = (estado: string) => {
        switch (estado) {
            case 'planificada': return 'Planificada';
            case 'en_curso': return 'En Curso';
            case 'finalizada': return 'Finalizada';
            case 'cancelada': return 'Cancelada';
            default: return estado;
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <span className="text-3xl">🌾</span>
                    </div>
                    <p className="text-gray-600">Cargando campañas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-green-200">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                                ← Volver
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Campañas Agrícolas</h1>
                                <p className="text-sm text-gray-500">{campanias.length} campañas registradas</p>
                            </div>
                        </div>
                        <Link
                            href="/campanias/nueva"
                            className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition"
                        >
                            + Nueva Campaña
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-6">
                {/* Filtros */}
                <div className="bg-white rounded-xl shadow-md p-4 mb-6">
                    <div className="flex gap-2">
                        {(['todas', 'en_curso', 'finalizadas'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFiltro(f)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filtro === f
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {f === 'todas' ? 'Todas' : f === 'en_curso' ? 'En Curso' : 'Finalizadas'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Lista de campañas */}
                {campaniasFiltradas.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center">
                        <span className="text-6xl mb-4 block">🌱</span>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            No hay campañas registradas
                        </h3>
                        <p className="text-gray-500 mb-4">
                            Comienza creando tu primera campaña agrícola
                        </p>
                        <Link
                            href="/campanias/nueva"
                            className="inline-block px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                        >
                            + Crear Campaña
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {campaniasFiltradas.map((campania) => (
                            <Link
                                key={campania.id}
                                href={`/campanias/${campania.id}`}
                                className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition cursor-pointer"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{campania.nombre}</h3>
                                        <p className="text-sm text-gray-500">{campania.cultivo}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(campania.estado)}`}>
                                        {getEstadoLabel(campania.estado)}
                                    </span>
                                </div>

                                <div className="space-y-2 text-sm">
                                    {campania.variedad && (
                                        <p className="text-gray-600">
                                            <span className="font-medium">Variedad:</span> {campania.variedad}
                                        </p>
                                    )}

                                    {campania.superficieSembrada && (
                                        <p className="text-gray-600">
                                            <span className="font-medium">Superficie:</span> {campania.superficieSembrada} ha
                                        </p>
                                    )}

                                    {campania.rendimiento && (
                                        <p className="text-green-600 font-medium">
                                            Rendimiento: {campania.rendimiento} kg/ha
                                        </p>
                                    )}

                                    <p className="text-gray-500 text-xs mt-2">
                                        Inicio: {campania.fechaInicio.toLocaleDateString('es-AR')}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
