/**
 * Tipos para Scouting (Recorridas de Campo)
 * Observaciones georreferenciadas con fotos
 */

// Tipo de observación
export type TipoObservacion =
    | 'plaga'
    | 'enfermedad'
    | 'maleza'
    | 'deficiencia_nutricional'
    | 'estres_hidrico'
    | 'daño_climatico'
    | 'estado_general'
    | 'otro';

// Severidad del problema detectado
export type SeveridadProblema = 'leve' | 'moderado' | 'severo' | 'critico';

// Estado de la observación
export type EstadoObservacion = 'pendiente' | 'en_seguimiento' | 'resuelta' | 'descartada';

/**
 * Foto de scouting
 */
export interface ScoutingPhoto {
    id: string;
    url: string;                        // URL de Firebase Storage
    thumbnailUrl?: string;              // Miniatura para lista
    timestamp: Date;                    // Momento de captura

    // Geolocalización de la foto
    latitude: number;
    longitude: number;
    accuracy?: number;                  // Precisión GPS en metros
    altitude?: number;                  // Altitud si está disponible
}

/**
 * Observación de Scouting
 * Colección: /organizations/{orgId}/scouting_observations/{obsId}
 */
export interface ScoutingObservation {
    id: string;
    organizationId: string;

    // Ubicación
    fieldId?: string;                   // Campo asociado
    plotId?: string;                    // Lote asociado (calculado por proximidad)
    cropId?: string;                    // Cultivo/campaña asociada

    // Geolocalización principal
    latitude: number;
    longitude: number;
    accuracy?: number;

    // Clasificación
    tipo: TipoObservacion;
    severidad?: SeveridadProblema;

    // Contenido
    titulo: string;
    descripcion: string;
    fotos: ScoutingPhoto[];             // Array de fotos adjuntas

    // Identificación específica
    especie?: string;                   // Ej: "Chinche verde", "Roya asiática"
    nombreCientifico?: string;          // Nombre científico si se conoce

    // Estado y seguimiento
    estado: EstadoObservacion;
    fechaResolucion?: Date;
    notasResolucion?: string;

    // Recomendación de acción
    accionRecomendada?: string;
    urgente: boolean;

    // Metadatos
    createdAt: Date;
    createdBy: string;
    updatedAt: Date;
}

/**
 * Recorrida (Sesión de Scouting)
 * Agrupa varias observaciones de una misma salida a campo
 */
export interface ScoutingSession {
    id: string;
    organizationId: string;

    // Identificación
    titulo: string;
    fecha: Date;

    // Ámbito
    fieldId?: string;                   // Campo recorrido
    plotIds?: string[];                 // Lotes visitados

    // Observaciones de esta sesión
    observationIds: string[];

    // Ruta recorrida (opcional)
    rutaCoordinadas?: { lat: number; lng: number; timestamp: Date }[];

    // Resumen
    duracionMinutos?: number;
    distanciaKm?: number;
    observacionesTotales: number;
    observacionesCriticas: number;

    // Metadatos
    createdAt: Date;
    createdBy: string;
    completada: boolean;
}

// ============================================
// CONFIGURACIONES
// ============================================

export const TIPOS_OBSERVACION_CONFIG: Record<TipoObservacion, {
    label: string;
    icon: string;
    color: string;
    colorBg: string;
}> = {
    plaga: {
        label: 'Plaga',
        icon: '🐛',
        color: 'text-red-700',
        colorBg: 'bg-red-100'
    },
    enfermedad: {
        label: 'Enfermedad',
        icon: '🦠',
        color: 'text-purple-700',
        colorBg: 'bg-purple-100'
    },
    maleza: {
        label: 'Maleza',
        icon: '🌿',
        color: 'text-green-700',
        colorBg: 'bg-green-100'
    },
    deficiencia_nutricional: {
        label: 'Deficiencia Nutricional',
        icon: '🧪',
        color: 'text-yellow-700',
        colorBg: 'bg-yellow-100'
    },
    estres_hidrico: {
        label: 'Estrés Hídrico',
        icon: '💧',
        color: 'text-orange-700',
        colorBg: 'bg-orange-100'
    },
    daño_climatico: {
        label: 'Daño Climático',
        icon: '⛈️',
        color: 'text-blue-700',
        colorBg: 'bg-blue-100'
    },
    estado_general: {
        label: 'Estado General',
        icon: '📋',
        color: 'text-gray-700',
        colorBg: 'bg-gray-100'
    },
    otro: {
        label: 'Otro',
        icon: '📌',
        color: 'text-slate-700',
        colorBg: 'bg-slate-100'
    },
};

export const SEVERIDAD_CONFIG: Record<SeveridadProblema, {
    label: string;
    color: string;
    colorBg: string;
    prioridad: number;
}> = {
    leve: {
        label: 'Leve',
        color: 'text-green-600',
        colorBg: 'bg-green-50',
        prioridad: 1
    },
    moderado: {
        label: 'Moderado',
        color: 'text-yellow-600',
        colorBg: 'bg-yellow-50',
        prioridad: 2
    },
    severo: {
        label: 'Severo',
        color: 'text-orange-600',
        colorBg: 'bg-orange-50',
        prioridad: 3
    },
    critico: {
        label: 'Crítico',
        color: 'text-red-600',
        colorBg: 'bg-red-50',
        prioridad: 4
    },
};

export const ESTADO_OBSERVACION_CONFIG: Record<EstadoObservacion, {
    label: string;
    color: string;
    colorBg: string;
}> = {
    pendiente: {
        label: 'Pendiente',
        color: 'text-blue-600',
        colorBg: 'bg-blue-50'
    },
    en_seguimiento: {
        label: 'En Seguimiento',
        color: 'text-amber-600',
        colorBg: 'bg-amber-50'
    },
    resuelta: {
        label: 'Resuelta',
        color: 'text-green-600',
        colorBg: 'bg-green-50'
    },
    descartada: {
        label: 'Descartada',
        color: 'text-gray-500',
        colorBg: 'bg-gray-50'
    },
};
