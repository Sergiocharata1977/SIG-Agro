export type WhatsAppProvider = 'meta' | 'twilio';
export type WhatsAppMode = 'notifications_only' | 'inbox' | 'hybrid';
export type ConversationStatus = 'abierta' | 'pendiente_respuesta' | 'en_gestion' | 'cerrada';
export type ConversationType = 'agro' | 'support' | 'alerts';
export type WhatsAppChannel = 'meta' | 'twilio' | 'simulator';
export type MessageDirection = 'inbound' | 'outbound';
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed';
export type WhatsAppMediaType = 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'location' | 'contacts';
export type WhatsAppMessageMediaType = 'image' | 'video' | 'audio' | 'document';
export type WhatsAppWebhookStatus = 'pending' | 'verified' | 'error';
export type WhatsAppConversationSource = 'webhook' | 'manual' | 'simulation';
export type WhatsAppParticipantRole = 'customer' | 'agent' | 'ai' | 'system';

export interface OrganizationWhatsAppConfig {
    enabled: boolean;
    provider: WhatsAppProvider;
    mode: WhatsAppMode;
    whatsapp_phone_number_id?: string;
    access_token?: string;
    verify_token?: string;
    app_secret?: string;
    business_account_id?: string;
    webhook_status?: WhatsAppWebhookStatus;
    default_assignee_user_id?: string;
    allowed_channels?: WhatsAppChannel[];
    max_messages_per_minute?: number;
    metadata?: Record<string, unknown>;
    updatedAt?: Date;
}

export interface WhatsAppConversationParticipant {
    id: string;
    role: WhatsAppParticipantRole;
    displayName?: string;
    phone_e164?: string;
    userId?: string;
    joinedAt?: Date;
}

export interface WhatsAppConversation {
    id: string;
    organizationId: string;
    phone_e164: string;
    contactName?: string;
    status: ConversationStatus;
    type: ConversationType;
    channel: WhatsAppChannel;
    source: WhatsAppConversationSource;
    ai_enabled: boolean;
    lastInboundAt?: Date;
    lastOutboundAt?: Date;
    lastMessageAt?: Date;
    assignedUserId?: string;
    tags?: string[];
    participants?: WhatsAppConversationParticipant[];
    unreadCount?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface WhatsAppMediaAttachment {
    id?: string;
    type: WhatsAppMediaType;
    url?: string;
    mimeType?: string;
    sha256?: string;
    filename?: string;
    caption?: string;
}

export interface WhatsAppMessageErrorDetail {
    code?: string | number;
    title?: string;
    message: string;
    details?: string;
}

export interface WhatsAppMessageMetrics {
    attemptCount?: number;
    lastAttemptAt?: Date;
    sentAt?: Date;
    deliveredAt?: Date;
    readAt?: Date;
    failedAt?: Date;
    latencyMs?: number;
}

export interface WhatsAppMessage {
    id: string;
    conversationId: string;
    organizationId: string;
    direction: MessageDirection;
    status: MessageStatus;
    from: string;
    to: string;
    body: string;
    mediaType?: WhatsAppMessageMediaType;
    mediaUrl?: string;
    attachments?: WhatsAppMediaAttachment[];
    participantRole?: WhatsAppParticipantRole;
    timestamp: Date;
    waMessageId?: string;
    replyToMessageId?: string;
    error?: WhatsAppMessageErrorDetail;
    metadata?: Record<string, unknown>;
    metrics?: WhatsAppMessageMetrics;
}

export interface IncomingWhatsAppMessage {
    from: string;
    body: string;
    waMessageId: string;
    phoneNumberId: string;
    timestamp: number;
    profileName?: string;
    mediaType?: string;
    mediaId?: string;
    mediaUrl?: string;
    referral?: Record<string, unknown>;
    rawPayload?: Record<string, unknown>;
}

export interface WhatsAppTemplateComponentParameter {
    type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
    text?: string;
    currency?: {
        fallback_value: string;
        code: string;
        amount_1000: number;
    };
    date_time?: {
        fallback_value: string;
    };
    image?: {
        link: string;
    };
    document?: {
        link: string;
        filename?: string;
    };
    video?: {
        link: string;
    };
}

export interface WhatsAppTemplateComponent {
    type: 'header' | 'body' | 'button';
    sub_type?: 'quick_reply' | 'url';
    index?: string;
    parameters: WhatsAppTemplateComponentParameter[];
}

export interface WhatsAppTemplateMessage {
    name: string;
    language: {
        code: string;
    };
    components?: WhatsAppTemplateComponent[];
}

export interface WhatsAppSendTextRequest {
    to: string;
    body: string;
    previewUrl?: boolean;
    contextMessageId?: string;
}

export interface WhatsAppSendResult {
    messageId: string;
    status: 'accepted';
    contacts?: Array<{
        input: string;
        wa_id?: string;
    }>;
}

export interface MetaGraphSuccessResponse {
    messaging_product?: 'whatsapp';
    contacts?: Array<{
        input: string;
        wa_id?: string;
    }>;
    messages?: Array<{
        id: string;
        message_status?: string;
    }>;
}

export interface MetaGraphErrorResponse {
    error: {
        message: string;
        type?: string;
        code?: number;
        error_subcode?: number;
        fbtrace_id?: string;
        error_data?: {
            details?: string;
        };
    };
}

export interface WhatsAppConversationMetrics {
    conversationId?: string;
    organizationId: string;
    totalMessages: number;
    inboundMessages: number;
    outboundMessages: number;
    failedMessages: number;
    deliveredMessages: number;
    readMessages: number;
    avgFirstResponseTimeMs?: number;
    avgDeliveryTimeMs?: number;
    lastMessageAt?: Date;
    windowStartedAt?: Date;
    windowEndedAt?: Date;
}

export interface OrganizationWhatsAppMetrics {
    organizationId: string;
    activeConversations: number;
    openConversations: number;
    aiEnabledConversations: number;
    totalInboundMessages: number;
    totalOutboundMessages: number;
    totalFailedMessages: number;
    deliveryRate?: number;
    readRate?: number;
    periodStart: Date;
    periodEnd: Date;
}
