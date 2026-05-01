import type { ConverseInput } from '../UnifiedConverseService';

interface ChatRequestBody {
    mensaje?: unknown;
    contexto?: ConverseInput['contexto'];
    userId?: unknown;
    sessionId?: unknown;
    organizationId?: unknown;
}

export function adaptChatRequest(body: unknown, orgId: string): ConverseInput {
    const parsed = (body ?? {}) as ChatRequestBody;
    const message = typeof parsed.mensaje === 'string' ? parsed.mensaje.trim() : '';

    if (!message) {
        throw new Error('El mensaje es requerido');
    }

    const externalIdCandidate =
        typeof parsed.userId === 'string' && parsed.userId.trim()
            ? parsed.userId.trim()
            : typeof parsed.sessionId === 'string' && parsed.sessionId.trim()
                ? parsed.sessionId.trim()
                : 'anonymous-chat';

    return {
        channel: 'chat',
        message,
        organizationId: orgId,
        externalId: externalIdCandidate,
        contexto: parsed.contexto,
    };
}
