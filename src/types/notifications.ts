// Tipos para el sistema de notificaciones push

export interface NotificationPayload {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    image?: string;
    tag?: string;
    data?: Record<string, unknown>;
    actions?: NotificationAction[];
}

export interface NotificationAction {
    action: string;
    title: string;
    icon?: string;
}

export type NotificationType =
    | 'alerta_clima'
    | 'alerta_plaga'
    | 'operacion_pendiente'
    | 'cosecha_lista'
    | 'scouting_urgente'
    | 'sistema'
    | 'recordatorio';

export interface PushNotification {
    id: string;
    type: NotificationType;
    payload: NotificationPayload;
    userId: string;
    organizationId: string;
    createdAt: Date;
    readAt?: Date;
    sentAt?: Date;
    clickedAt?: Date;
}

export interface FCMToken {
    token: string;
    userId: string;
    deviceId: string;
    platform: 'web' | 'android' | 'ios';
    createdAt: Date;
    lastUsedAt: Date;
}

export interface NotificationPreferences {
    userId: string;
    enabled: boolean;
    types: {
        alerta_clima: boolean;
        alerta_plaga: boolean;
        operacion_pendiente: boolean;
        cosecha_lista: boolean;
        scouting_urgente: boolean;
        sistema: boolean;
        recordatorio: boolean;
    };
    quietHours?: {
        enabled: boolean;
        start: string; // HH:mm
        end: string;   // HH:mm
    };
}
