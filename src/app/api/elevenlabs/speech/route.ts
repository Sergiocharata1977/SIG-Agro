import { NextRequest, NextResponse } from 'next/server';
import { ElevenLabsService } from '@/lib/elevenlabs/client';
import { DON_CANDIDO_VOICE } from '@/lib/elevenlabs/voice-config';

const MAX_TEXT_LENGTH = 2500;

export async function POST(request: NextRequest) {
    if (!ElevenLabsService.isAvailable()) {
        return NextResponse.json(
            { error: 'TTS no configurado' },
            { status: 503 }
        );
    }

    try {
        const body = await request.json();
        const text = typeof body?.text === 'string' ? body.text.trim() : '';

        if (!text) {
            return NextResponse.json(
                { error: 'El texto es requerido' },
                { status: 400 }
            );
        }

        if (text.length >= MAX_TEXT_LENGTH) {
            return NextResponse.json(
                { error: 'El texto debe tener menos de 2500 caracteres' },
                { status: 400 }
            );
        }

        const service = ElevenLabsService.fromEnv();
        const audioBuffer = await service.textToSpeech(text, DON_CANDIDO_VOICE);

        return new Response(audioBuffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
            },
        });
    } catch (error: any) {
        console.error('Error en ElevenLabs TTS:', error);

        return NextResponse.json(
            { error: error.message || 'Error al generar audio' },
            { status: 500 }
        );
    }
}
