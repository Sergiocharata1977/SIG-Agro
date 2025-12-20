/**
 * Tipos para VRA (Variable Rate Application)
 * Zonificación y prescripciones de aplicación variable
 */

// Tipo de prescripción
export type TipoPrescripcion =
    | 'fertilizacion'
    | 'semilla'
    | 'fitosanitario'
    | 'riego';

// Formato de exportación
export type FormatoExportacion = 'shp' | 'isoxml' | 'geojson' | 'kml';

/**
 * Zona de manejo (resultado del clustering)
 */
export interface ZonaManejo {
    id: string;
    nombre: string;                     // "Zona Alta", "Zona Media", "Zona Baja"
    color: string;                      // Color para visualización

    // Estadísticas del índice
    indicePromedio: number;             // NDVI promedio de la zona
    indiceMin: number;
    indiceMax: number;

    // Área
    areaHa: number;                     // Hectáreas de la zona
    porcentajeLote: number;             // % del lote que ocupa

    // Geometría
    poligonos: {
        type: 'Polygon';
        coordinates: number[][][];
    }[];
}

/**
 * Prescripción de aplicación variable
 */
export interface Prescripcion {
    id: string;
    organizationId: string;

    // Ámbito
    plotId: string;
    fieldId?: string;
    cropId?: string;

    // Tipo y fecha
    tipo: TipoPrescripcion;
    fechaCreacion: Date;
    fechaAplicacion?: Date;

    // Producto/Insumo
    productoId?: string;                // Referencia al stock
    productoNombre: string;
    unidad: string;                     // "kg/ha", "lt/ha", "semillas/ha"

    // Zonas y dosis
    zonas: {
        zonaId: string;
        zonaNombre: string;
        dosis: number;                  // Cantidad por hectárea
        dosisTotal: number;             // Cantidad total para la zona
        areaHa: number;
    }[];

    // Totales
    dosisPromedio: number;
    cantidadTotal: number;
    costoEstimado?: number;

    // Estado
    estado: 'borrador' | 'exportada' | 'aplicada';
    formatoExportacion?: FormatoExportacion;
    archivoExportado?: string;          // URL del archivo

    // Notas
    notas?: string;

    // Metadatos
    createdAt: Date;
    createdBy: string;
    updatedAt: Date;
}

/**
 * Resultado del análisis de zonificación
 */
export interface ResultadoZonificacion {
    plotId: string;
    indiceUsado: 'ndvi' | 'ndre' | 'msavi' | 'ndmi' | 'reci';
    fechaAnalisis: Date;

    // Zonas generadas
    zonas: ZonaManejo[];
    numZonas: number;

    // Configuración usada
    metodo: 'kmeans' | 'quantiles' | 'natural_breaks';

    // Estadísticas globales
    indicePromedioGlobal: number;
    areaTotal: number;
}

// ============================================
// CONFIGURACIONES
// ============================================

export const ZONAS_DEFAULT: { nombre: string; color: string }[] = [
    { nombre: 'Zona Baja', color: '#EF4444' },      // Rojo
    { nombre: 'Zona Media-Baja', color: '#F97316' }, // Naranja
    { nombre: 'Zona Media', color: '#EAB308' },     // Amarillo
    { nombre: 'Zona Media-Alta', color: '#84CC16' }, // Lima
    { nombre: 'Zona Alta', color: '#22C55E' },      // Verde
];

export const TIPOS_PRESCRIPCION_CONFIG: Record<TipoPrescripcion, {
    label: string;
    icon: string;
    unidadDefault: string;
}> = {
    fertilizacion: {
        label: 'Fertilización',
        icon: '🧪',
        unidadDefault: 'kg/ha'
    },
    semilla: {
        label: 'Semilla',
        icon: '🌱',
        unidadDefault: 'semillas/ha'
    },
    fitosanitario: {
        label: 'Fitosanitario',
        icon: '💨',
        unidadDefault: 'lt/ha'
    },
    riego: {
        label: 'Riego',
        icon: '💧',
        unidadDefault: 'mm'
    }
};

export const FORMATOS_EXPORTACION_CONFIG: Record<FormatoExportacion, {
    label: string;
    extension: string;
    descripcion: string;
}> = {
    shp: {
        label: 'Shapefile',
        extension: '.shp',
        descripcion: 'Compatible con ArcGIS, QGIS'
    },
    isoxml: {
        label: 'ISOXML',
        extension: '.xml',
        descripcion: 'Compatible con tractores ISOBUS'
    },
    geojson: {
        label: 'GeoJSON',
        extension: '.geojson',
        descripcion: 'Formato web estándar'
    },
    kml: {
        label: 'KML',
        extension: '.kml',
        descripcion: 'Compatible con Google Earth'
    }
};
