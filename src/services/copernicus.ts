/**
 * Servicio para integración con Copernicus Data Space Ecosystem
 * Proporciona capas WMS/WMTS gratuitas para imágenes satelitales
 * 
 * URLs públicas de Copernicus Browser (sin autenticación)
 */

// Configuración de capas satelitales gratuitas
export const CAPAS_SATELITALES = {
    // Sentinel-2 True Color (visible)
    sentinel2_true_color: {
        nombre: 'Sentinel-2 True Color',
        descripcion: 'Imagen visible RGB de Sentinel-2',
        url: 'https://services.sentinel-hub.com/ogc/wms/cd280189-7c51-45a6-ab05-f96a76067710',
        layer: 'TRUE-COLOR-S2L2A',
        attribution: '© ESA Copernicus',
    },

    // NDVI (Índice de vegetación)
    ndvi: {
        nombre: 'NDVI',
        descripcion: 'Índice de Vegetación de Diferencia Normalizada',
        url: 'https://services.sentinel-hub.com/ogc/wms/cd280189-7c51-45a6-ab05-f96a76067710',
        layer: 'NDVI',
        attribution: '© ESA Copernicus',
        formula: '(NIR - RED) / (NIR + RED)',
        rango: { min: -1, max: 1 },
        umbralBajo: 0.3,
        umbralAlto: 0.6,
    },

    // NDRE (Normalized Difference Red Edge) - Detecta estrés temprano
    ndre: {
        nombre: 'NDRE',
        descripcion: 'Índice Red Edge - Detecta estrés temprano en cultivos',
        url: 'https://services.sentinel-hub.com/ogc/wms/cd280189-7c51-45a6-ab05-f96a76067710',
        layer: 'NDRE', // Requiere configuración custom en Sentinel Hub
        attribution: '© ESA Copernicus',
        formula: '(NIR - RedEdge) / (NIR + RedEdge)',
        rango: { min: -1, max: 1 },
        umbralBajo: 0.2,
        umbralAlto: 0.5,
        ventajas: 'Mejor para detectar estrés antes que NDVI',
    },

    // MSAVI (Modified Soil Adjusted Vegetation Index)
    msavi: {
        nombre: 'MSAVI',
        descripcion: 'Índice de vegetación ajustado al suelo - Ideal para cultivos bajos',
        url: 'https://services.sentinel-hub.com/ogc/wms/cd280189-7c51-45a6-ab05-f96a76067710',
        layer: 'MSAVI',
        attribution: '© ESA Copernicus',
        formula: '(2 * NIR + 1 - sqrt((2 * NIR + 1)^2 - 8 * (NIR - RED))) / 2',
        rango: { min: 0, max: 1 },
        umbralBajo: 0.2,
        umbralAlto: 0.5,
        ventajas: 'Reduce influencia del suelo desnudo',
    },

    // NDMI (Normalized Difference Moisture Index)
    ndmi: {
        nombre: 'NDMI',
        descripcion: 'Índice de humedad - Contenido de agua en vegetación',
        url: 'https://services.sentinel-hub.com/ogc/wms/cd280189-7c51-45a6-ab05-f96a76067710',
        layer: 'NDMI',
        attribution: '© ESA Copernicus',
        formula: '(NIR - SWIR) / (NIR + SWIR)',
        rango: { min: -1, max: 1 },
        umbralBajo: -0.2,
        umbralAlto: 0.4,
        ventajas: 'Detecta estrés hídrico y contenido de humedad',
    },

    // ReCI (Red Edge Chlorophyll Index)
    reci: {
        nombre: 'ReCI',
        descripcion: 'Índice de clorofila Red Edge - Salud del cultivo',
        url: 'https://services.sentinel-hub.com/ogc/wms/cd280189-7c51-45a6-ab05-f96a76067710',
        layer: 'RECI',
        attribution: '© ESA Copernicus',
        formula: '(NIR / RedEdge) - 1',
        rango: { min: 0, max: 3 },
        umbralBajo: 0.5,
        umbralAlto: 2.0,
        ventajas: 'Estima contenido de clorofila y nitrógeno',
    },

    // Capa OSM base
    osm: {
        nombre: 'OpenStreetMap',
        descripcion: 'Mapa base de OpenStreetMap',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors',
    },

    // Capa satélite Esri (gratuita)
    satellite_esri: {
        nombre: 'Satélite (Esri)',
        descripcion: 'Imágenes satelitales de Esri',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '© Esri',
    },

    // Sentinel-2 de Copernicus Browser público
    sentinel2_copernicus: {
        nombre: 'Sentinel-2 (Copernicus)',
        descripcion: 'Imágenes Sentinel-2 de Copernicus Browser',
        url: 'https://services.sentinel-hub.com/ogc/wms/cd280189-7c51-45a6-ab05-f96a76067710',
        layer: 'TRUE-COLOR-S2L2A',
        attribution: '© ESA Copernicus Sentinel-2',
    }
};

// Colores de escala NDVI
export const ESCALA_NDVI = [
    { valor: -1.0, color: '#0000FF', label: 'Agua' },
    { valor: 0.0, color: '#C0C0C0', label: 'Suelo desnudo' },
    { valor: 0.2, color: '#FFFF00', label: 'Vegetación escasa' },
    { valor: 0.4, color: '#ADFF2F', label: 'Vegetación moderada' },
    { valor: 0.6, color: '#00FF00', label: 'Vegetación sana' },
    { valor: 0.8, color: '#006400', label: 'Vegetación muy densa' },
    { valor: 1.0, color: '#003300', label: 'Vegetación óptima' },
];

// Escalas de color para todos los índices
export const ESCALAS_INDICES = {
    ndvi: ESCALA_NDVI,

    // NDRE - Rojo-amarillo-verde (similar a NDVI pero con diferente interpretación)
    ndre: [
        { valor: -1.0, color: '#0000FF', label: 'Agua/Sin vegetación' },
        { valor: 0.0, color: '#C0C0C0', label: 'Suelo desnudo' },
        { valor: 0.2, color: '#FF6B6B', label: 'Estrés severo' },
        { valor: 0.3, color: '#FFBB00', label: 'Estrés moderado' },
        { valor: 0.4, color: '#90EE90', label: 'Saludable' },
        { valor: 0.5, color: '#228B22', label: 'Muy saludable' },
        { valor: 1.0, color: '#003300', label: 'Óptimo' },
    ],

    // MSAVI - Ajustado al suelo
    msavi: [
        { valor: 0.0, color: '#D2691E', label: 'Suelo expuesto' },
        { valor: 0.1, color: '#DEB887', label: 'Muy baja cobertura' },
        { valor: 0.2, color: '#F0E68C', label: 'Baja cobertura' },
        { valor: 0.3, color: '#ADFF2F', label: 'Cobertura moderada' },
        { valor: 0.5, color: '#32CD32', label: 'Buena cobertura' },
        { valor: 0.7, color: '#228B22', label: 'Alta cobertura' },
        { valor: 1.0, color: '#006400', label: 'Cobertura total' },
    ],

    // NDMI - Índice de humedad (azul para húmedo, marrón para seco)
    ndmi: [
        { valor: -1.0, color: '#8B4513', label: 'Muy seco' },
        { valor: -0.5, color: '#D2691E', label: 'Seco' },
        { valor: -0.2, color: '#DEB887', label: 'Bajo contenido de agua' },
        { valor: 0.0, color: '#F5F5DC', label: 'Normal' },
        { valor: 0.2, color: '#87CEEB', label: 'Húmedo' },
        { valor: 0.4, color: '#4682B4', label: 'Muy húmedo' },
        { valor: 1.0, color: '#0000CD', label: 'Saturado de agua' },
    ],

    // ReCI - Clorofila (verde oscuro = alta clorofila)
    reci: [
        { valor: 0.0, color: '#FFFACD', label: 'Sin clorofila' },
        { valor: 0.5, color: '#FFD700', label: 'Clorofila baja' },
        { valor: 1.0, color: '#ADFF2F', label: 'Clorofila moderada' },
        { valor: 1.5, color: '#32CD32', label: 'Clorofila buena' },
        { valor: 2.0, color: '#228B22', label: 'Clorofila alta' },
        { valor: 3.0, color: '#006400', label: 'Clorofila óptima' },
    ],
};

// Tipo para los índices disponibles
export type IndiceVegetacion = 'ndvi' | 'ndre' | 'msavi' | 'ndmi' | 'reci';

// Configuración completa de índices
export const INDICES_CONFIG: Record<IndiceVegetacion, {
    nombre: string;
    descripcion: string;
    formula: string;
    unidad: string;
    rango: { min: number; max: number };
    umbralBajo: number;
    umbralAlto: number;
    interpretacion: {
        bajo: string;
        medio: string;
        alto: string;
    };
}> = {
    ndvi: {
        nombre: 'NDVI',
        descripcion: 'Índice de Vegetación de Diferencia Normalizada',
        formula: '(NIR - RED) / (NIR + RED)',
        unidad: '',
        rango: { min: -1, max: 1 },
        umbralBajo: 0.3,
        umbralAlto: 0.6,
        interpretacion: {
            bajo: 'Vegetación estresada o suelo desnudo',
            medio: 'Vegetación en desarrollo',
            alto: 'Vegetación densa y saludable',
        },
    },
    ndre: {
        nombre: 'NDRE',
        descripcion: 'Índice Red Edge - Detecta estrés temprano',
        formula: '(NIR - RedEdge) / (NIR + RedEdge)',
        unidad: '',
        rango: { min: -1, max: 1 },
        umbralBajo: 0.2,
        umbralAlto: 0.5,
        interpretacion: {
            bajo: 'Estrés en etapa temprana detectado',
            medio: 'Cultivo en condición normal',
            alto: 'Cultivo muy saludable',
        },
    },
    msavi: {
        nombre: 'MSAVI',
        descripcion: 'Índice ajustado al suelo - Ideal para cultivos bajos',
        formula: '(2*NIR+1-sqrt((2*NIR+1)²-8*(NIR-RED)))/2',
        unidad: '',
        rango: { min: 0, max: 1 },
        umbralBajo: 0.2,
        umbralAlto: 0.5,
        interpretacion: {
            bajo: 'Baja cobertura vegetal',
            medio: 'Cobertura moderada',
            alto: 'Alta cobertura vegetal',
        },
    },
    ndmi: {
        nombre: 'NDMI',
        descripcion: 'Índice de humedad - Contenido de agua',
        formula: '(NIR - SWIR) / (NIR + SWIR)',
        unidad: '',
        rango: { min: -1, max: 1 },
        umbralBajo: -0.2,
        umbralAlto: 0.4,
        interpretacion: {
            bajo: 'Estrés hídrico severo',
            medio: 'Contenido de agua normal',
            alto: 'Alto contenido de agua',
        },
    },
    reci: {
        nombre: 'ReCI',
        descripcion: 'Índice de Clorofila Red Edge',
        formula: '(NIR / RedEdge) - 1',
        unidad: '',
        rango: { min: 0, max: 3 },
        umbralBajo: 0.5,
        umbralAlto: 2.0,
        interpretacion: {
            bajo: 'Deficiencia de nitrógeno probable',
            medio: 'Niveles normales de clorofila',
            alto: 'Alta actividad fotosintética',
        },
    },
};

/**
 * Obtiene el color para un valor de índice dado
 */
export function getColorForValue(indice: IndiceVegetacion, valor: number): string {
    const escala = ESCALAS_INDICES[indice];
    if (!escala) return '#808080';

    for (let i = escala.length - 1; i >= 0; i--) {
        if (valor >= escala[i].valor) {
            return escala[i].color;
        }
    }
    return escala[0].color;
}

/**
 * Interpreta un valor de índice
 */
export function interpretarValor(indice: IndiceVegetacion, valor: number): {
    nivel: 'bajo' | 'medio' | 'alto';
    texto: string;
    color: string;
} {
    const config = INDICES_CONFIG[indice];
    if (!config) return { nivel: 'medio', texto: 'Sin datos', color: '#808080' };

    if (valor < config.umbralBajo) {
        return { nivel: 'bajo', texto: config.interpretacion.bajo, color: '#EF4444' };
    } else if (valor > config.umbralAlto) {
        return { nivel: 'alto', texto: config.interpretacion.alto, color: '#22C55E' };
    } else {
        return { nivel: 'medio', texto: config.interpretacion.medio, color: '#F59E0B' };
    }
}


/**
 * Genera URL de WMS para un bounding box específico
 */
export function generarUrlWMS(
    config: {
        baseUrl: string;
        layer: string;
        bbox: [number, number, number, number]; // [west, south, east, north]
        width?: number;
        height?: number;
        format?: string;
        time?: string;
    }
): string {
    const { baseUrl, layer, bbox, width = 512, height = 512, format = 'image/png', time } = config;

    const params = new URLSearchParams({
        SERVICE: 'WMS',
        VERSION: '1.3.0',
        REQUEST: 'GetMap',
        LAYERS: layer,
        BBOX: bbox.join(','),
        CRS: 'EPSG:4326',
        WIDTH: width.toString(),
        HEIGHT: height.toString(),
        FORMAT: format,
    });

    if (time) {
        params.append('TIME', time);
    }

    return `${baseUrl}?${params.toString()}`;
}

/**
 * Calcula el bounding box de un polígono GeoJSON
 */
export function calcularBoundingBox(
    coordinates: number[][]
): [number, number, number, number] {
    let minLng = Infinity;
    let minLat = Infinity;
    let maxLng = -Infinity;
    let maxLat = -Infinity;

    for (const [lng, lat] of coordinates) {
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
    }

    // Agregar un pequeño margen
    const margen = 0.01;
    return [
        minLng - margen,
        minLat - margen,
        maxLng + margen,
        maxLat + margen
    ];
}

/**
 * URLs alternativas gratuitas que no requieren autenticación
 */
export const URLS_GRATUITAS = {
    // Sentinel-2 cloudless mosaic (Maptiler)
    sentinel2_mosaic: 'https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=get_your_own_key',

    // NASA GIBS - MODIS NDVI
    modis_ndvi: 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi',

    // Copernicus Browser embed (iframe) - alternativa visual
    copernicus_browser: 'https://dataspace.copernicus.eu/browser/',
};

/**
 * Obtiene la fecha actual en formato ISO para consultas WMS
 */
export function getFechaActualISO(): string {
    const hoy = new Date();
    const hace30dias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);
    return `${hace30dias.toISOString().split('T')[0]}/${hoy.toISOString().split('T')[0]}`;
}
