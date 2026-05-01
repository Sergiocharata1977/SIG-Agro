import admin from 'firebase-admin';
import { llmRouter } from '@/ai/services/LLMRouter';
import { adminDb } from '@/lib/firebase-admin';
import { WhatsAppClient } from '@/lib/whatsapp/WhatsAppClient';
import type {
    ConversationStatus,
    IncomingWhatsAppMessage,
    OrganizationWhatsAppConfig,
    WhatsAppConversation,
    WhatsAppMessage,
} from '@/types/whatsapp';

const CONVERSATIONS_COLLECTION = 'whatsapp_conversations';
const MESSAGES_COLLECTION = 'whatsapp_messages';
const SETTINGS_DOC_ID = 'channels_whatsapp';
const DEFAULT_SYSTEM_PROMPT = `Sos Don Candido, asesor agricola de SIG-Agro. Responde en espanol rioplatense, con tono cercano, practico y claro. Prioriza recomendaciones accionables, contexto productivo y prudencia cuando falten datos.`;

function toDate(value: unknown): Date | undefined {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    if (typeof value === 'object' && value && 'toDate' in value) {
        return (value as { toDate: () => Date }).toDate();
    }

    return undefined;
}

function mapConversation(
    id: string,
    data: FirebaseFirestore.DocumentData
): WhatsAppConversation {
    return {
        id,
        organizationId: data.organizationId as string,
        phone_e164: data.phone_e164 as string,
        contactName: data.contactName as string | undefined,
        status: (data.status as ConversationStatus | undefined) ?? 'abierta',
        type: (data.type as WhatsAppConversation['type'] | undefined) ?? 'agro',
        channel: (data.channel as WhatsAppConversation['channel'] | undefined) ?? 'meta',
        source: (data.source as WhatsAppConversation['source'] | undefined) ?? 'webhook',
        ai_enabled: Boolean(data.ai_enabled),
        lastInboundAt: toDate(data.lastInboundAt),
        lastOutboundAt: toDate(data.lastOutboundAt),
        lastMessageAt: toDate(data.lastMessageAt),
        assignedUserId: data.assignedUserId as string | undefined,
        tags: Array.isArray(data.tags) ? (data.tags as string[]) : undefined,
        participants: Array.isArray(data.participants)
            ? (data.participants as WhatsAppConversation['participants'])
            : undefined,
        unreadCount: typeof data.unreadCount === 'number' ? data.unreadCount : 0,
        createdAt: toDate(data.createdAt) ?? new Date(),
        updatedAt: toDate(data.updatedAt) ?? new Date(),
    };
}

function mapMessage(id: string, data: FirebaseFirestore.DocumentData): WhatsAppMessage {
    return {
        id,
        conversationId: data.conversationId as string,
        organizationId: data.organizationId as string,
        direction: (data.direction as WhatsAppMessage['direction'] | undefined) ?? 'inbound',
        status: (data.status as WhatsAppMessage['status'] | undefined) ?? 'sent',
        from: data.from as string,
        to: data.to as string,
        body: (data.body as string | undefined) ?? '',
        mediaType: data.mediaType as WhatsAppMessage['mediaType'] | undefined,
        mediaUrl: data.mediaUrl as string | undefined,
        attachments: Array.isArray(data.attachments)
            ? (data.attachments as WhatsAppMessage['attachments'])
            : undefined,
        participantRole: data.participantRole as WhatsAppMessage['participantRole'] | undefined,
        timestamp: toDate(data.timestamp) ?? new Date(),
        waMessageId: data.waMessageId as string | undefined,
        replyToMessageId: data.replyToMessageId as string | undefined,
        error: data.error as WhatsAppMessage['error'] | undefined,
        metadata: data.metadata as WhatsAppMessage['metadata'] | undefined,
        metrics: data.metrics as WhatsAppMessage['metrics'] | undefined,
    };
}

export class WhatsAppService {
    async handleIncoming(msg: IncomingWhatsAppMessage, orgId: string): Promise<void> {
        const now = new Date();
        const config = await this.getOrganizationConfig(orgId);
        const conversation = await this.getOrCreateConversation(orgId, msg, config, now);

        await adminDb.collection(MESSAGES_COLLECTION).doc(`in_${msg.waMessageId}`).set({
            conversationId: conversation.id,
            organizationId: orgId,
            direction: 'inbound',
            status: 'delivered',
            from: msg.from,
            to: msg.phoneNumberId,
            body: msg.body,
            mediaType: normalizeMediaType(msg.mediaType),
            mediaUrl: msg.mediaUrl,
            participantRole: 'customer',
            timestamp: new Date(msg.timestamp * 1000),
            waMessageId: msg.waMessageId,
            metadata: {
                profileName: msg.profileName,
                referral: msg.referral,
                rawPayload: msg.rawPayload,
            },
        }, { merge: true });

        if (!conversation.ai_enabled) {
            return;
        }

        const history = await this.getMessages(conversation.id, 20);
        const messages = history.map((item) => ({
            role: item.direction === 'inbound' ? 'user' as const : 'assistant' as const,
            content: item.body,
        }));
        const systemPrompt = getSystemPrompt(config);

        const reply = await llmRouter.chat('chat_agro', messages, systemPrompt);
        if (!reply.text.trim()) {
            return;
        }

        await this.sendMessageInternal(orgId, msg.from, reply.text, conversation.id, config, {
            provider: reply.provider,
            usedFallback: reply.usedFallback,
            source: 'ai_auto_reply',
            inboundWaMessageId: msg.waMessageId,
        });
    }

    async getConversations(
        orgId: string,
        status?: ConversationStatus
    ): Promise<WhatsAppConversation[]> {
        let query = adminDb
            .collection(CONVERSATIONS_COLLECTION)
            .where('organizationId', '==', orgId);

        if (status) {
            query = query.where('status', '==', status);
        }

        const snapshot = await query.orderBy('lastMessageAt', 'desc').get();
        return snapshot.docs.map((doc) => mapConversation(doc.id, doc.data()));
    }

    async getMessages(conversationId: string, limit = 50): Promise<WhatsAppMessage[]> {
        const snapshot = await adminDb
            .collection(MESSAGES_COLLECTION)
            .where('conversationId', '==', conversationId)
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();

        return snapshot.docs
            .map((doc) => mapMessage(doc.id, doc.data()))
            .reverse();
    }

    async sendMessage(orgId: string, phone: string, body: string): Promise<void> {
        const config = await this.getOrganizationConfig(orgId);
        const conversation = await this.findConversation(orgId, phone);
        const conversationId = conversation?.id
            ?? (await this.getOrCreateConversation(
                orgId,
                {
                    from: phone,
                    body: '',
                    waMessageId: `manual_${Date.now()}`,
                    phoneNumberId: config?.whatsapp_phone_number_id ?? process.env.WHATSAPP_PHONE_NUMBER_ID ?? '',
                    timestamp: Math.floor(Date.now() / 1000),
                },
                config,
                new Date()
            )).id;

        await this.sendMessageInternal(orgId, phone, body, conversationId, config, {
            source: 'manual',
        });
    }

    private async sendMessageInternal(
        orgId: string,
        phone: string,
        body: string,
        conversationId: string,
        config?: OrganizationWhatsAppConfig | null,
        metadata?: Record<string, unknown>
    ): Promise<void> {
        const resolvedConfig = config ?? await this.getOrganizationConfig(orgId);
        const client = this.getClient(resolvedConfig);
        const now = new Date();
        const result = await client.sendTextMessage(phone, body);
        const outboundPhoneNumberId =
            resolvedConfig?.whatsapp_phone_number_id ?? process.env.WHATSAPP_PHONE_NUMBER_ID ?? '';

        await adminDb.collection(MESSAGES_COLLECTION).doc(`out_${result.messageId}`).set({
            conversationId,
            organizationId: orgId,
            direction: 'outbound',
            status: 'sent',
            from: outboundPhoneNumberId,
            to: phone,
            body,
            participantRole: 'ai',
            timestamp: now,
            waMessageId: result.messageId,
            metadata: {
                ...metadata,
                contacts: result.contacts,
            },
            metrics: {
                sentAt: now,
            },
        }, { merge: true });

        await adminDb.collection(CONVERSATIONS_COLLECTION).doc(conversationId).set({
            lastOutboundAt: now,
            lastMessageAt: now,
            updatedAt: now,
        }, { merge: true });
    }

    private async getOrCreateConversation(
        orgId: string,
        msg: IncomingWhatsAppMessage,
        config: OrganizationWhatsAppConfig | null,
        now: Date
    ): Promise<WhatsAppConversation> {
        const existing = await this.findConversation(orgId, msg.from);
        const aiEnabled = config?.enabled !== false && config?.mode !== 'notifications_only';
        const basePayload = {
            organizationId: orgId,
            phone_e164: msg.from,
            contactName: msg.profileName ?? existing?.contactName ?? null,
            status: existing?.status ?? 'abierta',
            type: existing?.type ?? 'agro',
            channel: existing?.channel ?? 'meta',
            source: existing?.source ?? 'webhook',
            ai_enabled: existing?.ai_enabled ?? aiEnabled,
            lastInboundAt: new Date(msg.timestamp * 1000),
            lastMessageAt: new Date(msg.timestamp * 1000),
            updatedAt: now,
            unreadCount: admin.firestore.FieldValue.increment(1),
            participants: existing?.participants ?? [
                {
                    id: msg.from,
                    role: 'customer',
                    displayName: msg.profileName,
                    phone_e164: msg.from,
                    joinedAt: now,
                },
                {
                    id: 'don-candido',
                    role: 'ai',
                    displayName: 'Don Candido',
                    joinedAt: now,
                },
            ],
        };

        if (existing) {
            await adminDb.collection(CONVERSATIONS_COLLECTION).doc(existing.id).set(basePayload, { merge: true });
            return {
                ...existing,
                contactName: msg.profileName ?? existing.contactName,
                lastInboundAt: new Date(msg.timestamp * 1000),
                lastMessageAt: new Date(msg.timestamp * 1000),
                updatedAt: now,
                unreadCount: (existing.unreadCount ?? 0) + 1,
            };
        }

        const docRef = adminDb.collection(CONVERSATIONS_COLLECTION).doc();
        await docRef.set({
            id: docRef.id,
            ...basePayload,
            createdAt: now,
        });

        return mapConversation(docRef.id, {
            id: docRef.id,
            ...basePayload,
            unreadCount: 1,
            createdAt: now,
        });
    }

    private async findConversation(
        orgId: string,
        phone: string
    ): Promise<WhatsAppConversation | null> {
        const snapshot = await adminDb
            .collection(CONVERSATIONS_COLLECTION)
            .where('organizationId', '==', orgId)
            .where('phone_e164', '==', phone)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return null;
        }

        const doc = snapshot.docs[0];
        return mapConversation(doc.id, doc.data());
    }

    private async getOrganizationConfig(orgId: string): Promise<OrganizationWhatsAppConfig | null> {
        const snapshot = await adminDb
            .collection('organizations')
            .doc(orgId)
            .collection('settings')
            .doc(SETTINGS_DOC_ID)
            .get();

        if (!snapshot.exists) {
            return null;
        }

        const data = snapshot.data() ?? {};
        return {
            enabled: Boolean(data.enabled),
            provider: (data.provider as OrganizationWhatsAppConfig['provider'] | undefined) ?? 'meta',
            mode: (data.mode as OrganizationWhatsAppConfig['mode'] | undefined) ?? 'inbox',
            whatsapp_phone_number_id: data.whatsapp_phone_number_id as string | undefined,
            access_token: data.access_token as string | undefined,
            verify_token: data.verify_token as string | undefined,
            app_secret: data.app_secret as string | undefined,
            business_account_id: data.business_account_id as string | undefined,
            webhook_status: data.webhook_status as OrganizationWhatsAppConfig['webhook_status'] | undefined,
            default_assignee_user_id: data.default_assignee_user_id as string | undefined,
            allowed_channels: Array.isArray(data.allowed_channels)
                ? (data.allowed_channels as OrganizationWhatsAppConfig['allowed_channels'])
                : undefined,
            max_messages_per_minute: data.max_messages_per_minute as number | undefined,
            metadata: data.metadata as Record<string, unknown> | undefined,
            updatedAt: toDate(data.updatedAt),
        };
    }

    private getClient(config?: OrganizationWhatsAppConfig | null): WhatsAppClient {
        const accessToken = config?.access_token ?? process.env.WHATSAPP_ACCESS_TOKEN;
        const phoneNumberId =
            config?.whatsapp_phone_number_id ?? process.env.WHATSAPP_PHONE_NUMBER_ID;

        if (!accessToken || !phoneNumberId) {
            throw new Error(
                'No hay configuracion de WhatsApp disponible para enviar mensajes.'
            );
        }

        return new WhatsAppClient(accessToken, phoneNumberId);
    }
}

function normalizeMediaType(
    mediaType?: string
): WhatsAppMessage['mediaType'] | undefined {
    if (!mediaType) return undefined;
    if (mediaType === 'image' || mediaType === 'video' || mediaType === 'audio' || mediaType === 'document') {
        return mediaType;
    }

    return undefined;
}

function getSystemPrompt(config: OrganizationWhatsAppConfig | null): string {
    const configured = config?.metadata?.systemPrompt;
    return typeof configured === 'string' && configured.trim()
        ? configured
        : DEFAULT_SYSTEM_PROMPT;
}

export const whatsappService = new WhatsAppService();
