/**
 * API Route para chat con IA agrícola
 */

import { NextRequest, NextResponse } from 'next/server';
import { IAAgricolaService } from '@/lib/ia/IAAgricolaService';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { mensaje, historial = [], contexto } = body;

        if (!mensaje) {
            return NextResponse.json(
                { error: 'El mensaje es requerido' },
                { status: 400 }
            );
        }

        // Convertir historial al formato esperado
        const historialFormateado = historial.map((msg: { role: string; content: string }) => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
        }));

        // Llamar al servicio de IA
        const respuesta = await IAAgricolaService.chat(
            mensaje,
            historialFormateado,
            contexto
        );

        return NextResponse.json({
            respuesta,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error en API chat:', error);
        return NextResponse.json(
            { error: 'Error al procesar el mensaje' },
            { status: 500 }
        );
    }
}
