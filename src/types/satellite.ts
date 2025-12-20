// Tipos para integración con Copernicus/Sentinel

export interface CopernicusCredentials {
    clientId: string;
    clientSecret: string;
}

export interface CopernicusToken {
    accessToken: string;
    expiresAt: Date;
    tokenType: string;
}

// Tipos de satélites disponibles
export type SatelliteType = 'SENTINEL-2' | 'SENTINEL-1' | 'LANDSAT-8';

// Índices vegetativos
export interface VegetationIndices {
    ndvi: number;      // Normalized Difference Vegetation Index (-1 a 1)
    evi: number;       // Enhanced Vegetation Index
    ndwi: number;      // Normalized Difference Water Index
    msavi: number;     // Modified Soil-Adjusted Vegetation Index
    ndre: number;      // Normalized Difference Red Edge Index
}

// Punto geográfico
export interface GeoPoint {
    lat: number;
    lng: number;
}

// Polígono de un lote
export interface GeoPolygon {
    type: 'Polygon';
    coordinates: number[][][];
}

// Solicitud de análisis
export interface SatelliteAnalysisRequest {
    polygon: GeoPolygon;
    startDate: string;      // YYYY-MM-DD
    endDate: string;        // YYYY-MM-DD
    satellite?: SatelliteType;
    cloudCoverMax?: number; // 0-100
    indices?: (keyof VegetationIndices)[];
}

// Imagen satelital
export interface SatelliteImage {
    id: string;
    date: string;
    satellite: SatelliteType;
    cloudCover: number;
    thumbnailUrl?: string;
    fullResUrl?: string;
    indices?: Partial<VegetationIndices>;
}

// Respuesta de análisis
export interface SatelliteAnalysisResponse {
    loteId?: string;
    polygon: GeoPolygon;
    analysisDate: string;
    images: SatelliteImage[];
    currentIndices: VegetationIndices;
    historicalTrend: {
        date: string;
        ndvi: number;
        evi: number;
    }[];
    alerts: SatelliteAlert[];
    recommendations: string[];
}

// Alertas detectadas
export interface SatelliteAlert {
    type: 'stress_hidrico' | 'plaga_potencial' | 'fertilidad_baja' | 'anomalia';
    severity: 'baja' | 'media' | 'alta';
    message: string;
    affectedArea?: number; // hectáreas
    coordinates?: GeoPoint;
}

// Análisis de zona específica
export interface ZoneAnalysis {
    zoneId: string;
    zoneName: string;
    areaHa: number;
    indices: VegetationIndices;
    status: 'excelente' | 'bueno' | 'regular' | 'malo';
    trend: 'mejorando' | 'estable' | 'empeorando';
}

// Mapa de prescripción VRA
export interface PrescriptionMap {
    loteId: string;
    type: 'fertilizacion' | 'semilla' | 'aplicacion';
    zones: {
        polygon: GeoPolygon;
        rate: number;
        unit: string;
    }[];
    totalArea: number;
    avgRate: number;
    generatedAt: Date;
}
