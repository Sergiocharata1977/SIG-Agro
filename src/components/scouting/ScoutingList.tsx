'use client';

import { useState, useEffect } from 'react';
import { MapPin, Camera, AlertTriangle, Clock, CheckCircle, Eye } from 'lucide-react';
import {
    ScoutingObservation,
    TIPOS_OBSERVACION_CONFIG,
    SEVERIDAD_CONFIG,
    ESTADO_OBSERVACION_CONFIG
} from '@/types/scouting';
import { obtenerObservaciones } from '@/services/scouting';

interface ScoutingListProps {
    orgId: string;
    plotId?: string;
    onSelectObservation?: (obs: ScoutingObservation) => void;
    maxItems?: number;
}

export default function ScoutingList({
    orgId,
    plotId,
    onSelectObservation,
    maxItems = 20
}: ScoutingListProps) {
    const [observaciones, setObservaciones] = useState<ScoutingObservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const cargar = async () => {
            try {
                setLoading(true);
                const data = await obtenerObservaciones(orgId, {
                    plotId,
                    limite: maxItems
                });
                setObservaciones(data);
            } catch (err) {
                console.error('Error al cargar observaciones:', err);
                setError('Error al cargar las observaciones');
            } finally {
                setLoading(false);
            }
        };

        cargar();
    }, [orgId, plotId, maxItems]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8 text-red-500">
                {error}
            </div>
        );
    }

    if (observaciones.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No hay observaciones registradas</p>
                <p className="text-sm mt-1">Agrega tu primera observación de campo</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {observaciones.map((obs) => {
                const tipoConfig = TIPOS_OBSERVACION_CONFIG[obs.tipo];
                const severidadConfig = obs.severidad ? SEVERIDAD_CONFIG[obs.severidad] : null;
                const estadoConfig = ESTADO_OBSERVACION_CONFIG[obs.estado];

                return (
                    <div
                        key={obs.id}
                        onClick={() => onSelectObservation?.(obs)}
                        className={`p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow ${obs.urgente ? 'border-orange-300 bg-orange-50/50' : 'border-gray-200'
                            }`}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className={`${tipoConfig.colorBg} ${tipoConfig.color} px-2 py-1 rounded-full text-sm flex items-center gap-1`}>
                                    <span>{tipoConfig.icon}</span>
                                    <span>{tipoConfig.label}</span>
                                </span>

                                {obs.urgente && (
                                    <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3" />
                                        Urgente
                                    </span>
                                )}
                            </div>

                            <span className={`${estadoConfig.colorBg} ${estadoConfig.color} px-2 py-1 rounded-full text-xs`}>
                                {estadoConfig.label}
                            </span>
                        </div>

                        {/* Título y descripción */}
                        <h3 className="font-medium text-gray-900 mb-1">{obs.titulo}</h3>
                        {obs.descripcion && (
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">{obs.descripcion}</p>
                        )}

                        {/* Footer */}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                            {/* Severidad */}
                            {severidadConfig && (
                                <span className={severidadConfig.color}>
                                    {severidadConfig.label}
                                </span>
                            )}

                            {/* Fotos */}
                            {obs.fotos && obs.fotos.length > 0 && (
                                <span className="flex items-center gap-1">
                                    <Camera className="h-3 w-3" />
                                    {obs.fotos.length}
                                </span>
                            )}

                            {/* Ubicación */}
                            <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {obs.latitude.toFixed(4)}, {obs.longitude.toFixed(4)}
                            </span>

                            {/* Fecha */}
                            <span className="flex items-center gap-1 ml-auto">
                                <Clock className="h-3 w-3" />
                                {new Date(obs.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
