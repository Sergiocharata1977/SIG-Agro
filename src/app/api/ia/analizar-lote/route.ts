/**
 * API de análisis de lotes con IA
 * POST /api/ia/analizar-lote
 */

import { NextRequest, NextResponse } from 'next/server';
import { GroqAgroService } from '@/lib/groq/GroqAgroService';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            plotName,
            cultivoActual,
            variedad,
            superficie,
            ndviPromedio,
            ndviMinimo,
            ndviMaximo,
            estresHidrico,
            estadoLote,
            fechaSiembra,
            densidadSiembra,
            historialNdvi
        } = body;

        if (!plotName) {
            return NextResponse.json(
                { error: 'Falta nombre del lote' },
                { status: 400 }
            );
        }

        const resultado = await GroqAgroService.analizarLote({
            plotName,
            cultivoActual,
            variedad,
            superficie,
            ndviPromedio,
            ndviMinimo,
            ndviMaximo,
            estresHidrico,
            estadoLote,
            fechaSiembra,
            densidadSiembra,
            historialNdvi
        });

        return NextResponse.json({
            success: true,
            ...resultado
        });

    } catch (error: any) {
        console.error('Error en análisis IA:', error);
        return NextResponse.json(
            { error: error.message || 'Error al analizar lote' },
            { status: 500 }
        );
    }
}
