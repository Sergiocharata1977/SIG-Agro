import type {
    CopernicusToken,
    SatelliteAnalysisRequest,
    SatelliteAnalysisResponse,
    SatelliteImage,
    VegetationIndices,
    SatelliteAlert,
    GeoPolygon,
    PrescriptionMap,
    SatelliteType
} from '@/types/satellite';

// Configuración de Copernicus Data Space
const COPERNICUS_API_URL = 'https://dataspace.copernicus.eu/api/v1';
const AUTH_URL = 'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token';

// Cache de token
let cachedToken: CopernicusToken | null = null;

export class CopernicusService {
    private clientId: string;
    private clientSecret: string;

    constructor() {
        this.clientId = process.env.COPERNICUS_CLIENT_ID || '';
        this.clientSecret = process.env.COPERNICUS_CLIENT_SECRET || '';
    }

    // Obtener token de acceso
    async getAccessToken(): Promise<string> {
        // Reutilizar token si no expiró
        if (cachedToken && new Date() < cachedToken.expiresAt) {
            return cachedToken.accessToken;
        }

        if (!this.clientId || !this.clientSecret) {
            throw new Error('Copernicus credentials not configured');
        }

        try {
            const response = await fetch(AUTH_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'client_credentials',
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                }),
            });

            if (!response.ok) {
                throw new Error(`Auth failed: ${response.status}`);
            }

            const data = await response.json();

            cachedToken = {
                accessToken: data.access_token,
                expiresAt: new Date(Date.now() + (data.expires_in - 60) * 1000),
                tokenType: data.token_type,
            };

            return cachedToken.accessToken;
        } catch (error) {
            console.error('Error getting Copernicus token:', error);
            throw error;
        }
    }

    // Buscar imágenes disponibles
    async searchImages(request: SatelliteAnalysisRequest): Promise<SatelliteImage[]> {
        const token = await this.getAccessToken();

        // Convertir polígono a formato WKT
        const wkt = this.polygonToWKT(request.polygon);

        const params = new URLSearchParams({
            collections: request.satellite || 'SENTINEL-2',
            datetime: `${request.startDate}/${request.endDate}`,
            geometry: wkt,
            limit: '10',
            'filter': `eo:cloud_cover<${request.cloudCoverMax || 30}`,
        });

        try {
            const response = await fetch(`${COPERNICUS_API_URL}/search?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Search failed: ${response.status}`);
            }

            const data = await response.json();

            return data.features.map((feature: any) => ({
                id: feature.id,
                date: feature.properties.datetime,
                satellite: feature.collection as SatelliteType,
                cloudCover: feature.properties['eo:cloud_cover'],
                thumbnailUrl: feature.assets?.thumbnail?.href,
                fullResUrl: feature.assets?.visual?.href,
            }));
        } catch (error) {
            console.error('Error searching images:', error);
            throw error;
        }
    }

    // Calcular índices vegetativos
    async calculateIndices(imageId: string, polygon: GeoPolygon): Promise<VegetationIndices> {
        // En producción, esto llamaría a la API de procesamiento de Copernicus
        // Por ahora, simulamos los cálculos

        // Valores simulados basados en temporada
        const month = new Date().getMonth();
        const isGrowingSeason = month >= 9 || month <= 3; // Sep-Mar en Argentina

        const baseNdvi = isGrowingSeason ? 0.65 : 0.35;
        const variation = (Math.random() - 0.5) * 0.2;

        return {
            ndvi: Math.max(-1, Math.min(1, baseNdvi + variation)),
            evi: Math.max(-1, Math.min(1, (baseNdvi + variation) * 0.9)),
            ndwi: Math.max(-1, Math.min(1, (baseNdvi + variation) * 0.7 - 0.1)),
            msavi: Math.max(-1, Math.min(1, (baseNdvi + variation) * 0.85)),
            ndre: Math.max(-1, Math.min(1, (baseNdvi + variation) * 0.75)),
        };
    }

    // Análisis completo de lote
    async analyzeLote(request: SatelliteAnalysisRequest): Promise<SatelliteAnalysisResponse> {
        try {
            // Buscar imágenes disponibles
            const images = await this.searchImages(request);

            // Calcular índices actuales (última imagen)
            const currentIndices = images.length > 0
                ? await this.calculateIndices(images[0].id, request.polygon)
                : this.getDefaultIndices();

            // Generar tendencia histórica
            const historicalTrend = this.generateHistoricalTrend(request.startDate, request.endDate);

            // Detectar alertas
            const alerts = this.detectAlerts(currentIndices);

            // Generar recomendaciones
            const recommendations = this.generateRecommendations(currentIndices, alerts);

            return {
                polygon: request.polygon,
                analysisDate: new Date().toISOString(),
                images,
                currentIndices,
                historicalTrend,
                alerts,
                recommendations,
            };
        } catch (error) {
            console.error('Error analyzing lote:', error);
            throw error;
        }
    }

    // Detectar alertas basadas en índices
    private detectAlerts(indices: VegetationIndices): SatelliteAlert[] {
        const alerts: SatelliteAlert[] = [];

        // Estrés hídrico (NDWI bajo)
        if (indices.ndwi < 0.1) {
            alerts.push({
                type: 'stress_hidrico',
                severity: indices.ndwi < -0.1 ? 'alta' : 'media',
                message: `Posible estrés hídrico detectado. NDWI: ${indices.ndwi.toFixed(2)}`,
                affectedArea: undefined,
            });
        }

        // Baja vigorosidad (NDVI bajo)
        if (indices.ndvi < 0.3) {
            alerts.push({
                type: 'fertilidad_baja',
                severity: indices.ndvi < 0.2 ? 'alta' : 'media',
                message: `Vegetación con baja vigorosidad. NDVI: ${indices.ndvi.toFixed(2)}`,
            });
        }

        // Posible plaga (cambio anómalo en NDRE)
        if (indices.ndre < 0.2 && indices.ndvi > 0.4) {
            alerts.push({
                type: 'plaga_potencial',
                severity: 'media',
                message: 'Anomalía detectada que podría indicar presencia de plagas',
            });
        }

        return alerts;
    }

    // Generar recomendaciones
    private generateRecommendations(indices: VegetationIndices, alerts: SatelliteAlert[]): string[] {
        const recommendations: string[] = [];

        // Basado en NDVI
        if (indices.ndvi >= 0.6) {
            recommendations.push('✅ El cultivo muestra excelente desarrollo vegetativo');
        } else if (indices.ndvi >= 0.4) {
            recommendations.push('🟡 Desarrollo vegetativo normal. Continuar monitoreo');
        } else {
            recommendations.push('⚠️ Revisar nutrición y estado del cultivo en campo');
        }

        // Basado en alertas
        if (alerts.some(a => a.type === 'stress_hidrico')) {
            recommendations.push('💧 Considerar riego suplementario o revisar drenaje');
        }

        if (alerts.some(a => a.type === 'plaga_potencial')) {
            recommendations.push('🔍 Realizar scouting en zonas afectadas');
        }

        if (alerts.some(a => a.type === 'fertilidad_baja')) {
            recommendations.push('🌱 Evaluar aplicación de fertilizante foliar');
        }

        return recommendations;
    }

    // Generar tendencia histórica (simulada)
    private generateHistoricalTrend(startDate: string, endDate: string): { date: string; ndvi: number; evi: number }[] {
        const trend = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const interval = Math.max(7, Math.floor(daysDiff / 10)); // Max 10 puntos

        let baseValue = 0.4;
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + interval)) {
            // Simular curva de crecimiento
            baseValue += (Math.random() - 0.3) * 0.1;
            baseValue = Math.max(0.2, Math.min(0.8, baseValue));

            trend.push({
                date: d.toISOString().split('T')[0],
                ndvi: baseValue,
                evi: baseValue * 0.9,
            });
        }

        return trend;
    }

    // Generar mapa de prescripción VRA
    async generatePrescriptionMap(
        loteId: string,
        polygon: GeoPolygon,
        type: 'fertilizacion' | 'semilla' | 'aplicacion'
    ): Promise<PrescriptionMap> {
        const indices = await this.calculateIndices('', polygon);

        // Dividir en zonas basadas en NDVI
        const zones = this.generateZones(polygon, indices);

        return {
            loteId,
            type,
            zones,
            totalArea: this.calculateArea(polygon),
            avgRate: zones.reduce((sum, z) => sum + z.rate, 0) / zones.length,
            generatedAt: new Date(),
        };
    }

    // Generar zonas de manejo
    private generateZones(polygon: GeoPolygon, indices: VegetationIndices): PrescriptionMap['zones'] {
        // Simulación de 3 zonas de manejo
        const baseRate = indices.ndvi > 0.5 ? 120 : 100; // kg/ha

        return [
            { polygon, rate: baseRate * 1.2, unit: 'kg/ha' },
            { polygon, rate: baseRate, unit: 'kg/ha' },
            { polygon, rate: baseRate * 0.8, unit: 'kg/ha' },
        ];
    }

    // Calcular área del polígono (aproximado)
    private calculateArea(polygon: GeoPolygon): number {
        // Simplificación - en producción usar librería geoespacial
        const coords = polygon.coordinates[0];
        let area = 0;
        for (let i = 0; i < coords.length - 1; i++) {
            area += coords[i][0] * coords[i + 1][1];
            area -= coords[i + 1][0] * coords[i][1];
        }
        return Math.abs(area / 2) * 111 * 111; // Aprox a hectáreas
    }

    // Convertir polígono a WKT
    private polygonToWKT(polygon: GeoPolygon): string {
        const coords = polygon.coordinates[0]
            .map(c => `${c[0]} ${c[1]}`)
            .join(', ');
        return `POLYGON((${coords}))`;
    }

    // Valores por defecto
    private getDefaultIndices(): VegetationIndices {
        return { ndvi: 0.5, evi: 0.45, ndwi: 0.3, msavi: 0.42, ndre: 0.35 };
    }
}

// Exportar instancia singleton
export const copernicusService = new CopernicusService();
