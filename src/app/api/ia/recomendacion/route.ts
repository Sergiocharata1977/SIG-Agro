/**
 * API para generar recomendaciones agrícolas
 * POST /api/ia/recomendacion
 */

import { NextRequest, NextResponse } from 'next/server';
import { GroqAgroService } from '@/lib/groq/GroqAgroService';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const { tipo, cultivo, estadio, ndvi, observaciones } = body;

        if (!tipo || !cultivo) {
            return NextResponse.json(
                { error: 'Faltan tipo y cultivo' },
                { status: 400 }
            );
        }

        const recomendacion = await GroqAgroService.generarRecomendacion(
            tipo,
            { cultivo, estadio, ndvi, observaciones }
        );

        return NextResponse.json({
            success: true,
            recomendacion
        });

    } catch (error: any) {
        console.error('Error generando recomendación:', error);
        return NextResponse.json(
            { error: error.message || 'Error al generar recomendación' },
            { status: 500 }
        );
    }
}
