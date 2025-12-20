import { NextRequest, NextResponse } from 'next/server';
import { copernicusService } from '@/services/copernicus-extended';
import type { SatelliteAnalysisRequest, GeoPolygon } from '@/types/satellite';

// POST /api/satellite/analyze
// Analizar lote con datos satelitales
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { polygon, startDate, endDate, satellite, cloudCoverMax } = body as SatelliteAnalysisRequest;

        // Validaciones
        if (!polygon || !polygon.coordinates) {
            return NextResponse.json(
                { error: 'Se requiere un polígono válido' },
                { status: 400 }
            );
        }

        if (!startDate || !endDate) {
            return NextResponse.json(
                { error: 'Se requieren fechas de inicio y fin' },
                { status: 400 }
            );
        }

        const analysisRequest: SatelliteAnalysisRequest = {
            polygon,
            startDate,
            endDate,
            satellite: satellite || 'SENTINEL-2',
            cloudCoverMax: cloudCoverMax || 30,
        };

        const result = await copernicusService.analyzeLote(analysisRequest);

        return NextResponse.json(result);

    } catch (error) {
        console.error('Error in satellite analysis:', error);
        return NextResponse.json(
            { error: 'Error procesando análisis satelital' },
            { status: 500 }
        );
    }
}

// GET /api/satellite/analyze
// Obtener índices rápidos para un lote (demo)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const loteId = searchParams.get('loteId');

        // Demo: generar datos de ejemplo
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Polígono de ejemplo (Chaco, Argentina)
        const demoPolygon: GeoPolygon = {
            type: 'Polygon',
            coordinates: [[
                [-60.5, -27.5],
                [-60.4, -27.5],
                [-60.4, -27.4],
                [-60.5, -27.4],
                [-60.5, -27.5]
            ]]
        };

        const result = await copernicusService.analyzeLote({
            polygon: demoPolygon,
            startDate: thirtyDaysAgo.toISOString().split('T')[0],
            endDate: today.toISOString().split('T')[0],
            cloudCoverMax: 30,
        });

        return NextResponse.json({
            loteId: loteId || 'demo',
            ...result,
        });

    } catch (error) {
        console.error('Error getting satellite data:', error);
        return NextResponse.json(
            { error: 'Error obteniendo datos satelitales' },
            { status: 500 }
        );
    }
}
