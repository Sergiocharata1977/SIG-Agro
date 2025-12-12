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
        // URL pública del EO Browser demo
        url: 'https://services.sentinel-hub.com/ogc/wms/cd280189-7c51-45a6-ab05-f96a76067710',
        layer: 'NDVI',
        attribution: '© ESA Copernicus',
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
        // URL del servicio WMS público de Copernicus
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
