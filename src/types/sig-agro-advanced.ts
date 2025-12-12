/**
 * Tipos para Sistema SIG Agro - Fase 3
 * Colecciones avanzadas: satellite_images, satellite_analysis, 
 * agronomic_practices, alerts, reports
 */

// ============================================
// IMÁGENES SATELITALES
// ============================================

export type TipoImagenSatelital =
    | 'ndvi'
    | 'rgb'
    | 'infrarrojo'
    | 'radar'
    | 'ndwi'
    | 'evi'
    | 'savi';

export type ProveedorSatelital =
    | 'sentinel-2'
    | 'landsat-8'
    | 'modis'
    | 'planet'
    | 'maxar'
    | 'otro';

/**
 * Imagen satelital cruda
 * Colección: /organizations/{orgId}/satellite_images/{imageId}
 */
export interface SatelliteImage {
    id: string;
    organizationId: string;
    plotId: string;                 // Lote asociado
    fieldId?: string;               // Campo (opcional)

    // Datos de captura
    fechaCaptura: Date;
    tipoImagen: TipoImagenSatelital;
    proveedor: ProveedorSatelital;

    // Archivo
    url: string;                    // URL de descarga/visualización
    thumbnailUrl?: string;
    formato?: string;               // 'png', 'tiff', 'jpg'

    // Metadatos técnicos
    resolucion?: number;            // metros/pixel
    coberturaNubes?: number;        // porcentaje 0-100
    angulSolar?: number;            // grados
    bandas?: string[];              // ['B02', 'B03', 'B04', ...]

    // Bounding box
    bbox?: {
        minLng: number;
        minLat: number;
        maxLng: number;
        maxLat: number;
    };

    // Metadatos
    createdAt: Date;
    createdBy: string;
}

// ============================================
// ANÁLISIS SATELITAL (Procesado por IA)
// ============================================

export type TipoAnalisis =
    | 'ndvi'
    | 'estres_hidrico'
    | 'plagas'
    | 'rendimiento'
    | 'fertilizacion'
    | 'completo';

export type NivelSeveridad = 'info' | 'warning' | 'critical';

/**
 * Resultado de análisis satelital procesado
 * Colección: /organizations/{orgId}/satellite_analysis/{analysisId}
 */
export interface SatelliteAnalysis {
    id: string;
    organizationId: string;
    plotId: string;
    fieldId?: string;
    cropId?: string;                // Campaña/cultivo asociado
    imageId?: string;               // Imagen fuente

    // Tipo y fecha
    tipoAnalisis: TipoAnalisis;
    fechaAnalisis: Date;
    fechaDatosSatelitales?: Date;

    // Métricas NDVI
    ndviPromedio?: number;          // 0.0 - 1.0
    ndviMinimo?: number;
    ndviMaximo?: number;
    ndviDesviacion?: number;

    // Zonas del lote
    zonasNdvi?: {
        baja: number;               // % lote con NDVI < 0.3
        media: number;              // % lote con NDVI 0.3-0.6
        alta: number;               // % lote con NDVI > 0.6
    };

    // Detección de problemas
    estresHidrico: boolean;
    nivelEstres?: NivelSeveridad;
    anomaliasDetectadas?: string[];
    plagasDetectadas?: string[];

    // Predicciones
    rendimientoEstimado?: number;   // kg/ha
    confianzaPrediccion?: number;   // 0-100%

    // Comparación histórica
    variacionVsAnterior?: number;   // % cambio
    tendencia?: 'mejora' | 'estable' | 'deterioro';

    // Resumen IA
    resumen: string;
    recomendaciones: string[];

    // Generado por
    generadoPor: 'ia' | 'manual' | 'automatico';
    modeloIA?: string;

    // Metadatos
    createdAt: Date;
    createdBy: string;
}

// ============================================
// ALERTAS
// ============================================

export type TipoAlerta =
    | 'ndvi_bajo'
    | 'estres_hidrico'
    | 'plaga_detectada'
    | 'clima_adverso'
    | 'fertilizacion_baja'
    | 'desviacion_practica'
    | 'cosecha_proxima'
    | 'aplicacion_pendiente'
    | 'otro';

/**
 * Alerta para el agricultor
 * Colección: /organizations/{orgId}/alerts/{alertId}
 */
export interface Alert {
    id: string;
    organizationId: string;
    plotId?: string;
    fieldId?: string;
    cropId?: string;

    // Clasificación
    tipo: TipoAlerta;
    severidad: NivelSeveridad;
    categoria?: 'cultivo' | 'clima' | 'operacion' | 'economico';

    // Contenido
    titulo: string;
    descripcion: string;
    accionSugerida?: string;

    // Origen
    origenTipo?: 'satellite_analysis' | 'weather' | 'schedule' | 'ia' | 'manual';
    origenId?: string;

    // Estado
    leida: boolean;
    resuelta: boolean;
    fechaResolucion?: Date;
    resolucionNotas?: string;

    // Temporalidad
    fechaDeteccion: Date;
    fechaVencimiento?: Date;

    // Metadatos
    createdAt: Date;
    createdBy: string;
}

// ============================================
// INFORMES
// ============================================

export type TipoInforme =
    | 'ndvi'
    | 'rendimiento'
    | 'costos'
    | 'aplicaciones'
    | 'campania_completo'
    | 'comparativo';

export type EstadoInforme = 'generando' | 'listo' | 'error';

/**
 * Informe generado
 * Colección: /organizations/{orgId}/reports/{reportId}
 */
export interface Report {
    id: string;
    organizationId: string;
    plotId?: string;
    fieldId?: string;
    cropId?: string;
    campania?: string;

    // Identificación
    tipo: TipoInforme;
    titulo: string;
    descripcion?: string;

    // Período
    fechaDesde?: Date;
    fechaHasta?: Date;

    // Contenido
    resumen: string;
    metricas: Record<string, number | string>;
    graficos?: {
        tipo: 'linea' | 'barra' | 'pie' | 'area';
        titulo: string;
        datos: any;
    }[];

    // Comparación con buenas prácticas
    comparacionBPA?: {
        practica: string;
        valorReal: number | string;
        valorRecomendado: number | string;
        cumple: boolean;
    }[];

    // Recomendaciones IA
    recomendaciones: string[];
    alertasResumen?: string[];

    // Exportación
    pdfUrl?: string;
    excelUrl?: string;
    estado: EstadoInforme;

    // Metadatos
    createdAt: Date;
    createdBy: string;
    generadoPor?: 'ia' | 'manual';
}

// ============================================
// BUENAS PRÁCTICAS AGRÍCOLAS
// ============================================

/**
 * Práctica agronómica recomendada
 * Colección: /agronomic_practices/{practiceId} (global)
 */
export interface AgronomicPractice {
    id: string;

    // Cultivo asociado
    cultivo: string;                // 'soja', 'maiz', etc.
    region?: string;                // 'NEA', 'Pampa Húmeda', etc.

    // Categoría
    categoria:
    | 'siembra'
    | 'fertilizacion'
    | 'control_malezas'
    | 'control_plagas'
    | 'riego'
    | 'cosecha'
    | 'rotacion'
    | 'sustentabilidad';

    // Contenido
    titulo: string;
    descripcion: string;
    recomendacion: string;

    // Parámetros recomendados
    parametros?: {
        nombre: string;
        valorMinimo?: number;
        valorMaximo?: number;
        valorOptimo?: number;
        unidad?: string;
    }[];

    // Siembra
    densidadMin?: number;           // semillas/ha
    densidadMax?: number;
    densidadOptima?: number;
    profundidadMin?: number;        // cm
    profundidadMax?: number;
    distanciaEntresurcoMin?: number;
    distanciaEntresurcoMax?: number;

    // Fertilización
    fertilizacionNPK?: {
        n: { min: number; max: number; unidad: string };
        p: { min: number; max: number; unidad: string };
        k: { min: number; max: number; unidad: string };
    };

    // Rotación
    rotacionSugerida?: string[];    // Cultivos para rotar
    periodosDescanso?: number;      // años

    // Referencias
    fuente?: string;                // INTA, AACREA, etc.
    urlReferencia?: string;

    // Estado
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// ============================================
// CONFIGURACIONES
// ============================================

export const TIPOS_ALERTA_CONFIG: Record<TipoAlerta, {
    label: string;
    icon: string;
    color: string;
}> = {
    ndvi_bajo: { label: 'NDVI Bajo', icon: '🌿', color: 'bg-red-100 text-red-700' },
    estres_hidrico: { label: 'Estrés Hídrico', icon: '💧', color: 'bg-orange-100 text-orange-700' },
    plaga_detectada: { label: 'Plaga Detectada', icon: '🐛', color: 'bg-red-100 text-red-700' },
    clima_adverso: { label: 'Clima Adverso', icon: '⛈️', color: 'bg-purple-100 text-purple-700' },
    fertilizacion_baja: { label: 'Fertilización Baja', icon: '🧪', color: 'bg-yellow-100 text-yellow-700' },
    desviacion_practica: { label: 'Desviación BPA', icon: '⚠️', color: 'bg-amber-100 text-amber-700' },
    cosecha_proxima: { label: 'Cosecha Próxima', icon: '🌾', color: 'bg-green-100 text-green-700' },
    aplicacion_pendiente: { label: 'Aplicación Pendiente', icon: '📋', color: 'bg-blue-100 text-blue-700' },
    otro: { label: 'Otro', icon: '📌', color: 'bg-gray-100 text-gray-700' }
};

export const SEVERIDAD_CONFIG: Record<NivelSeveridad, {
    label: string;
    color: string;
    bgColor: string;
}> = {
    info: { label: 'Información', color: 'text-blue-600', bgColor: 'bg-blue-50' },
    warning: { label: 'Advertencia', color: 'text-amber-600', bgColor: 'bg-amber-50' },
    critical: { label: 'Crítico', color: 'text-red-600', bgColor: 'bg-red-50' }
};
