import admin from 'firebase-admin';

import { adminDb } from '@/lib/firebase-admin';

export interface ConversationSession {
    id: string;
    channel: 'chat' | 'whatsapp';
    userId?: string;
    organizationId: string;
    externalId?: string;
    createdAt: Date;
    updatedAt: Date;
    messageCount: number;
}

export interface ConversationMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    provider?: string;
    timestamp: Date;
}

type ConversationChannel = ConversationSession['channel'];

const COLLECTION_NAME = 'ai_conversations';
const MESSAGE_SUBCOLLECTION = 'messages';

function buildConversationId(
    channel: ConversationChannel,
    organizationId: string,
    externalId: string
): string {
    const rawKey = `${channel}:${organizationId}:${externalId}`;
    return Buffer.from(rawKey).toString('base64url');
}

function asDate(value: unknown): Date {
    if (value instanceof Date) {
        return value;
    }

    if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
        return value.toDate();
    }

    return new Date();
}

function mapSession(
    id: string,
    data: Record<string, unknown> | undefined
): ConversationSession {
    return {
        id,
        channel: (data?.channel as ConversationChannel) ?? 'chat',
        userId: typeof data?.userId === 'string' ? data.userId : undefined,
        organizationId: typeof data?.organizationId === 'string' ? data.organizationId : 'default',
        externalId: typeof data?.externalId === 'string' ? data.externalId : undefined,
        createdAt: asDate(data?.createdAt),
        updatedAt: asDate(data?.updatedAt),
        messageCount: typeof data?.messageCount === 'number' ? data.messageCount : 0,
    };
}

function mapMessage(
    id: string,
    data: Record<string, unknown> | undefined
): ConversationMessage {
    return {
        id,
        role: (data?.role as ConversationMessage['role']) ?? 'assistant',
        content: typeof data?.content === 'string' ? data.content : '',
        provider: typeof data?.provider === 'string' ? data.provider : undefined,
        timestamp: asDate(data?.timestamp),
    };
}

export class ConversationStore {
    async getOrCreate(
        channel: ConversationChannel,
        externalId: string,
        organizationId: string
    ): Promise<ConversationSession> {
        const conversationId = buildConversationId(channel, organizationId, externalId);
        const conversationRef = adminDb.collection(COLLECTION_NAME).doc(conversationId);
        const snapshot = await conversationRef.get();

        if (!snapshot.exists) {
            const now = new Date();
            const session: Omit<ConversationSession, 'id'> = {
                channel,
                userId: channel === 'chat' ? externalId : undefined,
                organizationId,
                externalId,
                createdAt: now,
                updatedAt: now,
                messageCount: 0,
            };

            await conversationRef.set(session);

            return {
                id: conversationId,
                ...session,
            };
        }

        return mapSession(snapshot.id, snapshot.data());
    }

    async addMessage(
        conversationId: string,
        message: Omit<ConversationMessage, 'id'>
    ): Promise<void> {
        const conversationRef = adminDb.collection(COLLECTION_NAME).doc(conversationId);
        const messageRef = conversationRef.collection(MESSAGE_SUBCOLLECTION).doc();

        const batch = adminDb.batch();
        batch.set(messageRef, {
            role: message.role,
            content: message.content,
            provider: message.provider ?? null,
            timestamp: message.timestamp,
        });
        batch.set(
            conversationRef,
            {
                updatedAt: message.timestamp,
                messageCount: admin.firestore.FieldValue.increment(1),
            },
            { merge: true }
        );

        await batch.commit();
    }

    async getHistory(conversationId: string, limitCount = 20): Promise<ConversationMessage[]> {
        const conversationRef = adminDb.collection(COLLECTION_NAME).doc(conversationId);
        const snapshot = await conversationRef
            .collection(MESSAGE_SUBCOLLECTION)
            .orderBy('timestamp', 'desc')
            .limit(limitCount)
            .get();

        return snapshot.docs
            .map((doc) => mapMessage(doc.id, doc.data()))
            .reverse();
    }

    async clearHistory(conversationId: string): Promise<void> {
        const conversationRef = adminDb.collection(COLLECTION_NAME).doc(conversationId);

        while (true) {
            const messagesSnapshot = await conversationRef
                .collection(MESSAGE_SUBCOLLECTION)
                .limit(200)
                .get();

            if (messagesSnapshot.empty) {
                break;
            }

            const batch = adminDb.batch();
            messagesSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
            await batch.commit();
        }

        await conversationRef.set(
            {
                messageCount: 0,
                updatedAt: new Date(),
            },
            { merge: true }
        );
    }
}

export const conversationStore = new ConversationStore();
