'use client';

/**
 * Componente para mostrar la lista de labores de un lote
 */

import { useState, useEffect, useCallback } from 'react';
import { TIPOS_LABOR, obtenerEventosLote } from '@/services/labores';
import type { EventoLote, TipoEvento } from '@/types';

interface ListaLaboresProps {
    orgId: string;
    campoId: string;
    loteId: string;
    onNuevaLabor?: () => void;
}

export default function ListaLabores({
    orgId,
    campoId,
    loteId,
    onNuevaLabor
}: ListaLaboresProps) {
    const [eventos, setEventos] = useState<EventoLote[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filtroTipo, setFiltroTipo] = useState<TipoEvento | ''>('');

    const cargarEventos = useCallback(async () => {
        try {
            setLoading(true);
            const data = await obtenerEventosLote(orgId, campoId, loteId, {
                tipo: filtroTipo || undefined
            });
            setEventos(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    }, [orgId, campoId, loteId, filtroTipo]);

    useEffect(() => {
        if (orgId && campoId && loteId) {
            cargarEventos();
        }
    }, [orgId, campoId, loteId, filtroTipo, cargarEventos]);

    const formatearFecha = (fecha: Date | string) => {
        const d = new Date(fecha);
        return d.toLocaleDateString('es-AR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-600 bg-red-50 p-4 rounded-lg">
                Error: {error}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header con filtro y botón */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">Historial de Labores</h3>
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
                        {eventos.length}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={filtroTipo}
                        onChange={(e) => setFiltroTipo(e.target.value as TipoEvento | '')}
                        className="text-sm border rounded-lg px-3 py-1.5"
                    >
                        <option value="">Todos</option>
                        {Object.entries(TIPOS_LABOR).map(([key, config]) => (
                            <option key={key} value={key}>
                                {config.icon} {config.label}
                            </option>
                        ))}
                    </select>

                    {onNuevaLabor && (
                        <button
                            onClick={onNuevaLabor}
                            className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-green-700 flex items-center gap-2"
                        >
                            <span>+</span>
                            Nueva Labor
                        </button>
                    )}
                </div>
            </div>

            {/* Lista vacía */}
            {eventos.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <span className="text-4xl">📋</span>
                    <p className="text-gray-500 mt-2">No hay labores registradas</p>
                    {onNuevaLabor && (
                        <button
                            onClick={onNuevaLabor}
                            className="mt-4 text-green-600 hover:underline"
                        >
                            Registrar primera labor
                        </button>
                    )}
                </div>
            )}

            {/* Lista de eventos */}
            <div className="space-y-3">
                {eventos.map((evento) => {
                    const tipoConfig = TIPOS_LABOR[evento.tipo];
                    return (
                        <div
                            key={evento.id}
                            className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                    {/* Ícono */}
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${tipoConfig.color}`}>
                                        {tipoConfig.icon}
                                    </div>

                                    {/* Info */}
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900">
                                                {tipoConfig.label}
                                            </span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${tipoConfig.color}`}>
                                                {tipoConfig.label}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-0.5">
                                            {evento.descripcion}
                                        </p>

                                        {/* Productos aplicados */}
                                        {evento.productos && evento.productos.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {evento.productos.map((p, i) => (
                                                    <span
                                                        key={i}
                                                        className="text-xs bg-gray-100 px-2 py-1 rounded"
                                                    >
                                                        {p.nombre}: {p.dosis} {p.unidad}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Observaciones */}
                                        {evento.observaciones && (
                                            <p className="text-xs text-gray-500 mt-2 italic">
                                                &ldquo;{evento.observaciones}&rdquo;
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Fecha y superficie */}
                                <div className="text-right">
                                    <div className="text-sm font-medium text-gray-900">
                                        {formatearFecha(evento.fecha)}
                                    </div>
                                    {evento.superficieAplicada && (
                                        <div className="text-xs text-gray-500">
                                            {evento.superficieAplicada} ha
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
