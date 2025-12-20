import { getMessaging, getToken, onMessage, type Messaging, type MessagePayload } from 'firebase/messaging';
import { app } from '@/lib/firebase';
import type { NotificationPayload, NotificationType, NotificationPreferences } from '@/types/notifications';

// VAPID Key - debe estar configurado en Firebase Console
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

class FCMService {
    private messaging: Messaging | null = null;
    private token: string | null = null;
    private initialized = false;

    // Verificar si el navegador soporta notificaciones
    isSupported(): boolean {
        return typeof window !== 'undefined' &&
            'Notification' in window &&
            'serviceWorker' in navigator &&
            'PushManager' in window;
    }

    // Verificar estado del permiso
    getPermissionStatus(): NotificationPermission | 'unsupported' {
        if (!this.isSupported()) return 'unsupported';
        return Notification.permission;
    }

    // Solicitar permiso de notificaciones
    async requestPermission(): Promise<boolean> {
        if (!this.isSupported()) {
            console.warn('Push notifications not supported');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }

    // Inicializar FCM
    async initialize(): Promise<string | null> {
        if (this.initialized && this.token) return this.token;

        if (!this.isSupported()) {
            console.warn('Push notifications not supported');
            return null;
        }

        if (Notification.permission !== 'granted') {
            console.warn('Notification permission not granted');
            return null;
        }

        try {
            // Registrar Service Worker
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            console.log('Service Worker registered:', registration);

            // Obtener instancia de messaging
            this.messaging = getMessaging(app);

            // Obtener token FCM
            this.token = await getToken(this.messaging, {
                vapidKey: VAPID_KEY,
                serviceWorkerRegistration: registration,
            });

            console.log('FCM Token obtained:', this.token?.substring(0, 20) + '...');

            // Configurar listener para mensajes en foreground
            this.setupForegroundListener();

            this.initialized = true;
            return this.token;
        } catch (error) {
            console.error('Error initializing FCM:', error);
            return null;
        }
    }

    // Configurar listener para mensajes cuando la app está en primer plano
    private setupForegroundListener() {
        if (!this.messaging) return;

        onMessage(this.messaging, (payload: MessagePayload) => {
            console.log('Foreground message received:', payload);

            // Mostrar notificación nativa si tenemos permiso
            if (Notification.permission === 'granted' && payload.notification) {
                const { title, body, icon } = payload.notification;
                new Notification(title || 'SIG Agro', {
                    body: body || '',
                    icon: icon || '/logo-sig-agro.png',
                    badge: '/logo-sig-agro.png',
                    data: payload.data,
                });
            }

            // Disparar evento personalizado para que los componentes puedan reaccionar
            window.dispatchEvent(new CustomEvent('fcm-message', { detail: payload }));
        });
    }

    // Obtener token actual
    getToken(): string | null {
        return this.token;
    }

    // Guardar token en el backend
    async saveTokenToServer(userId: string): Promise<boolean> {
        if (!this.token) {
            console.warn('No FCM token available');
            return false;
        }

        try {
            const response = await fetch('/api/notifications/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: this.token,
                    userId,
                    platform: 'web',
                    deviceId: this.getDeviceId(),
                }),
            });

            return response.ok;
        } catch (error) {
            console.error('Error saving FCM token:', error);
            return false;
        }
    }

    // Generar ID de dispositivo único
    private getDeviceId(): string {
        let deviceId = localStorage.getItem('fcm_device_id');
        if (!deviceId) {
            deviceId = 'web_' + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('fcm_device_id', deviceId);
        }
        return deviceId;
    }

    // Enviar notificación a través del backend
    async sendNotification(
        targetUserId: string,
        type: NotificationType,
        payload: NotificationPayload
    ): Promise<boolean> {
        try {
            const response = await fetch('/api/notifications/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetUserId,
                    type,
                    payload,
                }),
            });

            return response.ok;
        } catch (error) {
            console.error('Error sending notification:', error);
            return false;
        }
    }

    // Actualizar preferencias de notificaciones
    async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<boolean> {
        try {
            const response = await fetch('/api/notifications/preferences', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(preferences),
            });

            return response.ok;
        } catch (error) {
            console.error('Error updating preferences:', error);
            return false;
        }
    }

    // Mostrar notificación local (sin servidor)
    showLocalNotification(title: string, options?: NotificationOptions): void {
        if (Notification.permission === 'granted') {
            new Notification(title, {
                icon: '/logo-sig-agro.png',
                badge: '/logo-sig-agro.png',
                ...options,
            });
        }
    }
}

// Exportar instancia singleton
export const fcmService = new FCMService();

// Hooks helper para componentes
export function useFCMStatus() {
    return {
        isSupported: fcmService.isSupported(),
        permission: fcmService.getPermissionStatus(),
        token: fcmService.getToken(),
    };
}
