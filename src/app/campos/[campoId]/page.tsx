'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import type { Campo, Lote } from '@/types/agro';
import { obtenerCampo, obtenerLotes } from '@/services/campos';

export default function CampoDetallePage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const campoId = params.campoId as string;

    const [campo, setCampo] = useState<Campo | null>(null);
    const [lotes, setLotes] = useState<Lote[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!user?.organizationId || !campoId) return;

            try {
                setLoading(true);
                const [campoData, lotesData] = await Promise.all([
                    obtenerCampo(user.organizationId, campoId),
                    obtenerLotes(user.organizationId, campoId)
                ]);
                setCampo(campoData);
                setLotes(lotesData);
            } catch (error) {
                console.error('Error cargando campo:', error);
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading && user?.organizationId) {
            loadData();
        }
    }, [authLoading, user?.organizationId, campoId]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-gray-500">Cargando campo...</div>
            </div>
        );
    }

    if (!campo) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500 mb-4">Campo no encontrado</p>
                    <Link href="/campos" className="text-green-600 hover:underline">
                        ← Volver a campos
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            {/* Breadcrumb */}
            <div className="mb-6">
                <Link href="/campos" className="text-green-600 hover:underline">
                    ← Mis Campos
                </Link>
            </div>

            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{campo.nombre}</h1>
                        <p className="text-gray-500 mt-1">
                            📍 {campo.departamento}, {campo.provincia}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-green-600">
                            {campo.superficieTotal} ha
                        </div>
                        <div className="text-sm text-gray-500">Superficie total</div>
                    </div>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 shadow-sm border border-l-4 border-l-green-500">
                    <div className="text-2xl font-bold">{lotes.length}</div>
                    <div className="text-gray-600 text-sm">Lotes</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-l-4 border-l-blue-500">
                    <div className="text-2xl font-bold">
                        {lotes.reduce((acc, l) => acc + (l.superficie || 0), 0)} ha
                    </div>
                    <div className="text-gray-600 text-sm">En lotes</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-l-4 border-l-amber-500">
                    <div className="text-2xl font-bold">
                        {lotes.filter(l => l.estado === 'sembrado').length}
                    </div>
                    <div className="text-gray-600 text-sm">Sembrados</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-l-4 border-l-purple-500">
                    <div className="text-2xl font-bold">
                        {lotes.filter(l => l.cultivoActual).length}
                    </div>
                    <div className="text-gray-600 text-sm">Con cultivo</div>
                </div>
            </div>

            {/* Lotes */}
            <div className="bg-white rounded-xl shadow-sm border">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="font-semibold text-gray-900">Lotes del Campo</h2>
                    <Link
                        href={`/campos/${campoId}/lotes/nuevo`}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm"
                    >
                        + Nuevo Lote
                    </Link>
                </div>

                {lotes.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <span className="text-4xl block mb-2">📍</span>
                        No hay lotes registrados en este campo
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                        {lotes.map(lote => (
                            <Link
                                key={lote.id}
                                href={`/campos/${campoId}/lotes/${lote.id}`}
                                className="block bg-gray-50 hover:bg-gray-100 rounded-lg p-4 border transition"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-medium text-gray-900">{lote.nombre}</h3>
                                    <span className={`px-2 py-0.5 rounded text-xs ${lote.estado === 'sembrado'
                                            ? 'bg-green-100 text-green-700'
                                            : lote.estado === 'barbecho'
                                                ? 'bg-amber-100 text-amber-700'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {lote.estado}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <div>📐 {lote.superficie} ha</div>
                                    {lote.cultivoActual && (
                                        <div>🌱 {lote.cultivoActual}</div>
                                    )}
                                    {lote.campaniaActual && (
                                        <div>📅 {lote.campaniaActual}</div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Botón ver en mapa */}
            <div className="mt-6 text-center">
                <Link
                    href={`/dashboard?campoId=${campoId}`}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition"
                >
                    🗺️ Ver en Mapa GIS
                </Link>
            </div>
        </div>
    );
}
