/**
 * Tipos para Sistema SIG Agro - Fase 2
 * Colecciones agrícolas core: fields, plots, crops
 * 
 * IMPORTANTE: Estas son colecciones separadas bajo organizations/{orgId}/
 * NO subcolecciones anidadas
 */

// ============================================
// TIPO BASE GeoJSON
// ============================================

export interface GeoJSONPolygon {
    type: 'Polygon';
    coordinates: number[][][]; // [[[lng, lat], [lng, lat], ...]]
}

export interface GeoJSONPoint {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
}

// ============================================
// FIELDS (Campos/Establecimientos)
// ============================================

/**
 * Campo o establecimiento productivo
 * Colección: /organizations/{orgId}/fields/{fieldId}
 */
export interface Field {
    id: string;
    organizationId: string;

    // Identificación
    nombre: string;
    codigo?: string;

    // Ubicación administrativa
    provincia: string;
    departamento: string;
    localidad?: string;
    direccion?: string;

    // Superficie
    superficieTotal: number;        // Hectáreas totales
    superficieCultivable?: number;  // Hectáreas útiles

    // GIS
    centroide?: GeoJSONPoint;       // Centro del campo
    perimetro?: string;             // GeoJSON serializado como string

    // Propiedad
    propietario?: string;
    arrendamiento: boolean;
    contratoVencimiento?: Date;

    // Documentación
    matricula?: string;             // Título de propiedad
    partidaInmobiliaria?: string;

    // Estado
    activo: boolean;

    // Metadatos
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
}

// ============================================
// PLOTS (Lotes)
// ============================================

export type TipoSuelo =
    | 'arcilloso'
    | 'arenoso'
    | 'franco'
    | 'franco_arcilloso'
    | 'franco_arenoso'
    | 'limoso'
    | 'humifero'
    | 'mixto';

export type EstadoLote =
    | 'barbecho'
    | 'preparado'
    | 'sembrado'
    | 'emergencia'
    | 'desarrollo'
    | 'floracion'
    | 'llenado'
    | 'madurez'
    | 'cosecha'
    | 'descanso';

/**
 * Lote dentro de un campo
 * Colección: /organizations/{orgId}/plots/{plotId}
 */
export interface Plot {
    id: string;
    organizationId: string;
    fieldId: string;                // Referencia al campo

    // Identificación
    nombre: string;
    codigo?: string;

    // Superficie
    superficie: number;             // Hectáreas

    // GIS
    poligono: string;               // GeoJSON serializado como string
    centroide?: GeoJSONPoint;

    // Características del suelo
    tipoSuelo?: TipoSuelo;
    ph?: number;
    materiaOrganica?: number;       // Porcentaje
    capacidadUso?: string;          // Clase de capacidad de uso (I-VIII)
    aptitudAgricola?: 'alta' | 'media' | 'baja';

    // Estado actual
    estado: EstadoLote;
    cultivoActualId?: string;       // Referencia al crop activo

    // Historial (para acceso rápido)
    ultimaCosecha?: Date;
    ultimoRendimiento?: number;     // kg/ha
    ultimoCultivo?: string;

    // Estado
    activo: boolean;

    // Metadatos
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
}

// ============================================
// CROPS (Cultivos por Campaña)
// ============================================

export type TipoCultivo =
    | 'soja'
    | 'maiz'
    | 'trigo'
    | 'girasol'
    | 'algodon'
    | 'sorgo'
    | 'cebada'
    | 'avena'
    | 'poroto'
    | 'garbanzo'
    | 'maní'
    | 'arroz'
    | 'pastura'
    | 'otro';

export type EstadoCultivo =
    | 'planificado'
    | 'sembrado'
    | 'en_desarrollo'
    | 'en_cosecha'
    | 'finalizado'
    | 'cancelado';

/**
 * Cultivo por campaña (registro histórico)
 * Colección: /organizations/{orgId}/crops/{cropId}
 */
export interface Crop {
    id: string;
    organizationId: string;
    fieldId: string;                // Referencia al campo
    plotId: string;                 // Referencia al lote

    // Campaña
    campania: string;               // "2024/2025"
    nombreCampania?: string;        // Nombre descriptivo

    // Cultivo
    cultivo: TipoCultivo;
    variedad?: string;              // Híbrido/Variedad específica
    tecnologia?: string;            // "RR", "Bt", "Convencional", etc.
    ciclo?: string;                 // "Corto", "Medio", "Largo"

    // Siembra
    fechaSiembra?: Date;
    fechaSiembraFin?: Date;
    densidadSiembra?: number;       // semillas/ha o plantas/ha
    distanciaEntresurco?: number;   // cm
    profundidadSiembra?: number;    // cm
    tratamientoSemilla?: string;

    // Cosecha
    fechaCosecha?: Date;
    fechaCosechaFin?: Date;
    rendimientoEstimado?: number;   // kg/ha
    rendimientoReal?: number;       // kg/ha
    humedad?: number;               // % al momento de cosecha
    granosVerdes?: number;          // %
    granosPartidos?: number;        // %

    // Economía
    costoInsumos?: number;          // $
    costoLabores?: number;          // $
    costoCosecha?: number;          // $
    costoTotal?: number;            // $
    precioVenta?: number;           // $/kg o $/tn
    ingresoTotal?: number;          // $
    margenBruto?: number;           // $

    // Estado
    estado: EstadoCultivo;

    // Metadatos
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
}

// ============================================
// CONFIGURACIÓN DE CULTIVOS
// ============================================

export const CULTIVOS_CONFIG: Record<TipoCultivo, {
    label: string;
    icon: string;
    color: string;
    densidadMin?: number;
    densidadMax?: number;
    cicloPromedioDias?: number;
}> = {
    soja: {
        label: 'Soja',
        icon: '🫘',
        color: 'bg-green-100 text-green-700',
        densidadMin: 280000,
        densidadMax: 400000,
        cicloPromedioDias: 130
    },
    maiz: {
        label: 'Maíz',
        icon: '🌽',
        color: 'bg-yellow-100 text-yellow-700',
        densidadMin: 60000,
        densidadMax: 90000,
        cicloPromedioDias: 140
    },
    trigo: {
        label: 'Trigo',
        icon: '🌾',
        color: 'bg-amber-100 text-amber-700',
        densidadMin: 100,    // kg/ha
        densidadMax: 150,
        cicloPromedioDias: 120
    },
    girasol: {
        label: 'Girasol',
        icon: '🌻',
        color: 'bg-orange-100 text-orange-700',
        densidadMin: 45000,
        densidadMax: 65000,
        cicloPromedioDias: 120
    },
    algodon: {
        label: 'Algodón',
        icon: '☁️',
        color: 'bg-sky-100 text-sky-700',
        densidadMin: 80000,
        densidadMax: 120000,
        cicloPromedioDias: 180
    },
    sorgo: {
        label: 'Sorgo',
        icon: '🌿',
        color: 'bg-red-100 text-red-700',
        densidadMin: 120000,
        densidadMax: 180000,
        cicloPromedioDias: 110
    },
    cebada: {
        label: 'Cebada',
        icon: '🌾',
        color: 'bg-lime-100 text-lime-700'
    },
    avena: {
        label: 'Avena',
        icon: '🌾',
        color: 'bg-emerald-100 text-emerald-700'
    },
    poroto: {
        label: 'Poroto',
        icon: '🫘',
        color: 'bg-rose-100 text-rose-700'
    },
    garbanzo: {
        label: 'Garbanzo',
        icon: '🫘',
        color: 'bg-stone-100 text-stone-700'
    },
    maní: {
        label: 'Maní',
        icon: '🥜',
        color: 'bg-amber-100 text-amber-700'
    },
    arroz: {
        label: 'Arroz',
        icon: '🍚',
        color: 'bg-cyan-100 text-cyan-700'
    },
    pastura: {
        label: 'Pastura',
        icon: '🌱',
        color: 'bg-teal-100 text-teal-700'
    },
    otro: {
        label: 'Otro',
        icon: '🌿',
        color: 'bg-gray-100 text-gray-700'
    }
};

// ============================================
// ESTADOS DE LOTE CONFIG
// ============================================

export const ESTADOS_LOTE_CONFIG: Record<EstadoLote, {
    label: string;
    color: string;
    orden: number;
}> = {
    barbecho: { label: 'Barbecho', color: 'bg-stone-100 text-stone-700', orden: 1 },
    preparado: { label: 'Preparado', color: 'bg-amber-100 text-amber-700', orden: 2 },
    sembrado: { label: 'Sembrado', color: 'bg-lime-100 text-lime-700', orden: 3 },
    emergencia: { label: 'Emergencia', color: 'bg-green-100 text-green-700', orden: 4 },
    desarrollo: { label: 'En Desarrollo', color: 'bg-emerald-100 text-emerald-700', orden: 5 },
    floracion: { label: 'Floración', color: 'bg-pink-100 text-pink-700', orden: 6 },
    llenado: { label: 'Llenado', color: 'bg-yellow-100 text-yellow-700', orden: 7 },
    madurez: { label: 'Madurez', color: 'bg-orange-100 text-orange-700', orden: 8 },
    cosecha: { label: 'Cosecha', color: 'bg-red-100 text-red-700', orden: 9 },
    descanso: { label: 'Descanso', color: 'bg-gray-100 text-gray-700', orden: 10 }
};
