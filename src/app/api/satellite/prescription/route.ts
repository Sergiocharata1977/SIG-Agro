import { NextRequest, NextResponse } from 'next/server';
import { copernicusService } from '@/services/copernicus-extended';
import type { GeoPolygon } from '@/types/satellite';

// POST /api/satellite/prescription
// Generar mapa de prescripción VRA
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { loteId, polygon, type } = body as {
            loteId: string;
            polygon: GeoPolygon;
            type: 'fertilizacion' | 'semilla' | 'aplicacion';
        };

        if (!loteId || !polygon || !type) {
            return NextResponse.json(
                { error: 'Se requiere loteId, polygon y type' },
                { status: 400 }
            );
        }

        const prescriptionMap = await copernicusService.generatePrescriptionMap(
            loteId,
            polygon,
            type
        );

        return NextResponse.json(prescriptionMap);

    } catch (error) {
        console.error('Error generating prescription map:', error);
        return NextResponse.json(
            { error: 'Error generando mapa de prescripción' },
            { status: 500 }
        );
    }
}
