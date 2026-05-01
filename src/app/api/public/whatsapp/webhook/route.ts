import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';
import type { IncomingWhatsAppMessage } from '@/types/whatsapp';
import { whatsappService } from '@/services/whatsapp/WhatsAppService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type MetaWebhookPayload = {
    entry?: Array<{
        changes?: Array<{
            value?: {
                contacts?: Array<{
                    profile?: {
                        name?: string;
                    };
                    wa_id?: string;
                }>;
                messages?: Array<{
                    id?: string;
                    from?: string;
                    timestamp?: string;
                    type?: string;
                    text?: {
                        body?: string;
                    };
                    image?: {
                        id?: string;
                        mime_type?: string;
                        caption?: string;
                    };
                    video?: {
                        id?: string;
                        mime_type?: string;
                        caption?: string;
                    };
                    audio?: {
                        id?: string;
                        mime_type?: string;
                    };
                    document?: {
                        id?: string;
                        mime_type?: string;
                        caption?: string;
                        filename?: string;
                    };
                    referral?: Record<string, unknown>;
                }>;
                metadata?: {
                    phone_number_id?: string;
                };
            };
        }>;
    }>;
};

type MetaWebhookMessage = NonNullable<
    NonNullable<
        NonNullable<MetaWebhookPayload['entry']>[number]['changes']
    >[number]['value']
> extends { messages?: infer T }
    ? T extends Array<infer M>
        ? M
        : never
    : never;

export async function GET(request: NextRequest) {
    const mode = request.nextUrl.searchParams.get('hub.mode');
    const verifyToken = request.nextUrl.searchParams.get('hub.verify_token');
    const challenge = request.nextUrl.searchParams.get('hub.challenge');

    if (
        mode === 'subscribe'
        && verifyToken
        && verifyToken === process.env.WHATSAPP_VERIFY_TOKEN
        && challenge
    ) {
        return new NextResponse(challenge, { status: 200 });
    }

    return NextResponse.json({ error: 'Webhook verification failed' }, { status: 403 });
}

export async function POST(request: NextRequest) {
    const rawBody = await request.text();

    try {
        if (!isValidSignature(rawBody, request.headers.get('x-hub-signature-256'))) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const payload = JSON.parse(rawBody) as MetaWebhookPayload;
        const value = payload.entry?.[0]?.changes?.[0]?.value;
        const phoneNumberId = value?.metadata?.phone_number_id;
        const orgId = phoneNumberId ? await findOrganizationIdByPhoneNumberId(phoneNumberId) : null;

        if (!orgId || !phoneNumberId) {
            console.warn('WhatsApp webhook received for unknown phone number id', { phoneNumberId });
            return NextResponse.json({ ok: true }, { status: 200 });
        }

        const contactsByWaId = new Map(
            (value?.contacts ?? [])
                .filter((contact) => contact.wa_id)
                .map((contact) => [contact.wa_id as string, contact.profile?.name])
        );

        for (const message of value?.messages ?? []) {
            const incoming = mapIncomingMessage(message, phoneNumberId, contactsByWaId);
            if (!incoming) {
                continue;
            }

            try {
                await whatsappService.handleIncoming(incoming, orgId);
            } catch (error) {
                console.error('Error processing incoming WhatsApp message', {
                    orgId,
                    waMessageId: incoming.waMessageId,
                    error,
                });
            }
        }
    } catch (error) {
        console.error('Error handling WhatsApp webhook', error);
    }

    return NextResponse.json({ ok: true }, { status: 200 });
}

function isValidSignature(rawBody: string, signatureHeader: string | null): boolean {
    const secret = process.env.WHATSAPP_APP_SECRET;
    if (!secret || !signatureHeader) {
        return false;
    }

    const expected = `sha256=${crypto.createHmac('sha256', secret).update(rawBody).digest('hex')}`;
    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(signatureHeader);

    return expectedBuffer.length === receivedBuffer.length
        && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

async function findOrganizationIdByPhoneNumberId(phoneNumberId: string): Promise<string | null> {
    const snapshot = await adminDb
        .collectionGroup('settings')
        .where(admin.firestore.FieldPath.documentId(), '==', 'channels_whatsapp')
        .where('whatsapp_phone_number_id', '==', phoneNumberId)
        .limit(1)
        .get();

    const configDoc = snapshot.docs[0];
    const orgRef = configDoc?.ref.parent.parent;
    return orgRef?.id ?? null;
}

function mapIncomingMessage(
    message: MetaWebhookMessage,
    phoneNumberId: string,
    contactsByWaId: Map<string, string | undefined>
): IncomingWhatsAppMessage | null {
    if (!message.id || !message.from || !message.timestamp) {
        return null;
    }

    const mediaPayload =
        message.image ?? message.video ?? message.audio ?? message.document;
    const body =
        message.text?.body
        ?? message.image?.caption
        ?? message.video?.caption
        ?? message.document?.caption
        ?? '';

    return {
        from: message.from,
        body,
        waMessageId: message.id,
        phoneNumberId,
        timestamp: Number(message.timestamp),
        profileName: contactsByWaId.get(message.from),
        mediaType: message.type,
        mediaId: mediaPayload?.id,
        referral: message.referral,
        rawPayload: message as unknown as Record<string, unknown>,
    };
}
