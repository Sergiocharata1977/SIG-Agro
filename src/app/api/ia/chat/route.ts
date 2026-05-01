import { NextRequest, NextResponse } from 'next/server';

import { adaptChatRequest } from '@/services/ai-core/adapters/chatAdapter';
import { unifiedConverseService } from '@/services/ai-core/UnifiedConverseService';

const CHAT_SESSION_COOKIE = 'chat_agro_session_id';
const DEFAULT_AI_ORGANIZATION_ID = process.env.DEFAULT_AI_ORGANIZATION_ID || 'default';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const conversationSessionId =
            typeof body?.userId === 'string' && body.userId.trim()
                ? body.userId.trim()
                : request.cookies.get(CHAT_SESSION_COOKIE)?.value || crypto.randomUUID();
        const organizationId =
            typeof body?.organizationId === 'string' && body.organizationId.trim()
                ? body.organizationId.trim()
                : DEFAULT_AI_ORGANIZATION_ID;
        const converseInput = adaptChatRequest(
            {
                ...body,
                sessionId: body?.sessionId ?? conversationSessionId,
                userId: body?.userId ?? conversationSessionId,
            },
            organizationId
        );

        const response = await unifiedConverseService.converse(converseInput);
        const nextResponse = NextResponse.json({
            respuesta: response.text,
            timestamp: new Date().toISOString(),
        });

        nextResponse.cookies.set(CHAT_SESSION_COOKIE, conversationSessionId, {
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 180,
        });

        return nextResponse;
    } catch (error) {
        console.error('Error en API chat:', error);

        if (error instanceof Error && error.message === 'El mensaje es requerido') {
            return NextResponse.json(
                { error: 'El mensaje es requerido' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Error al procesar el mensaje' },
            { status: 500 }
        );
    }
}
