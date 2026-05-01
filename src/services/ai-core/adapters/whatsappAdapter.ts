import type { IncomingWhatsAppMessage } from '@/types/whatsapp';

import type { ConverseInput } from '../UnifiedConverseService';

export function adaptWhatsAppMessage(
    msg: IncomingWhatsAppMessage,
    orgId: string
): ConverseInput {
    return {
        channel: 'whatsapp',
        message: msg.body.trim(),
        organizationId: orgId,
        externalId: msg.from,
    };
}
