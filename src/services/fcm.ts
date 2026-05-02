import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import {
    ActionPerformed,
    PushNotificationSchema,
    PushNotifications,
    Token
} from '@capacitor/push-notifications';
import type { NotificationPayload, NotificationPreferences, NotificationType } from '@/types/notifications';

class FCMService {
    private token: string | null = null;
    private initialized = false;
    private listenersRegistered = false;
    private permissionStatus: NotificationPermission | 'unsupported' = 'default';

    isSupported(): boolean {
        if (Capacitor.isNativePlatform()) {
            return true;
        }

        return typeof Notification !== 'undefined';
    }

    getPermissionStatus(): NotificationPermission | 'unsupported' {
        if (Capacitor.isNativePlatform()) {
            return this.permissionStatus;
        }

        if (typeof Notification === 'undefined') {
            return 'unsupported';
        }

        this.permissionStatus = Notification.permission;
        return Notification.permission;
    }

    async requestPermission(): Promise<boolean> {
        if (!this.isSupported()) {
            this.permissionStatus = 'unsupported';
            return false;
        }

        try {
            if (Capacitor.isNativePlatform()) {
                const permissions = await PushNotifications.requestPermissions();
                this.permissionStatus = permissions.receive === 'granted' ? 'granted' : 'denied';
                return permissions.receive === 'granted';
            }

            const permission = await Notification.requestPermission();
            this.permissionStatus = permission;
            return permission === 'granted';
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }

    async initialize(): Promise<string | null> {
        if (!this.isSupported()) {
            return null;
        }

        if (!Capacitor.isNativePlatform()) {
            this.initialized = true;
            this.permissionStatus = this.getPermissionStatus();
            return this.token;
        }

        if (this.initialized) {
            return this.token;
        }

        const granted = await this.requestPermission();
        if (!granted) {
            return null;
        }

        if (!this.listenersRegistered) {
            this.registerNativeListeners();
        }

        return new Promise((resolve) => {
            let settled = false;

            const registrationListener = PushNotifications.addListener('registration', (token: Token) => {
                this.token = token.value;
                this.initialized = true;
                this.permissionStatus = 'granted';

                if (!settled) {
                    settled = true;
                    void registrationListener.then((listener) => listener.remove());
                    void registrationErrorListener.then((listener) => listener.remove());
                    resolve(token.value);
                }
            });

            const registrationErrorListener = PushNotifications.addListener('registrationError', (error) => {
                console.error('Push registration error:', error);

                if (!settled) {
                    settled = true;
                    void registrationListener.then((listener) => listener.remove());
                    void registrationErrorListener.then((listener) => listener.remove());
                    resolve(null);
                }
            });

            void PushNotifications.register().catch((error) => {
                console.error('Push registration failed:', error);

                if (!settled) {
                    settled = true;
                    void registrationListener.then((listener) => listener.remove());
                    void registrationErrorListener.then((listener) => listener.remove());
                    resolve(null);
                }
            });
        });
    }

    getToken(): string | null {
        return this.token;
    }

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
                    platform: Capacitor.getPlatform() === 'ios' ? 'ios' : 'android',
                    deviceId: this.getDeviceId(),
                }),
            });

            return response.ok;
        } catch (error) {
            console.error('Error saving FCM token:', error);
            return false;
        }
    }

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

    onMessage(callback: (notification: PushNotificationSchema) => void): void {
        if (!Capacitor.isNativePlatform()) {
            return;
        }

        void PushNotifications.addListener('pushNotificationReceived', callback);
    }

    async showLocalNotification(title: string, options?: NotificationOptions): Promise<void> {
        if (Capacitor.isNativePlatform()) {
            const permissions = await LocalNotifications.requestPermissions();
            if (permissions.display !== 'granted') {
                return;
            }

            await LocalNotifications.schedule({
                notifications: [
                    {
                        id: Date.now(),
                        title,
                        body: options?.body ?? '',
                        extra: options?.data,
                    },
                ],
            });
            return;
        }

        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification(title, {
                icon: '/logo-sig-agro.png',
                badge: '/logo-sig-agro.png',
                ...options,
            });
        }
    }

    private getDeviceId(): string {
        if (typeof localStorage === 'undefined') {
            return `native_${Capacitor.getPlatform()}`;
        }

        let deviceId = localStorage.getItem('fcm_device_id');
        if (!deviceId) {
            const prefix = Capacitor.isNativePlatform() ? Capacitor.getPlatform() : 'web';
            deviceId = `${prefix}_${Math.random().toString(36).substring(2, 15)}`;
            localStorage.setItem('fcm_device_id', deviceId);
        }
        return deviceId;
    }

    private registerNativeListeners() {
        this.listenersRegistered = true;

        void PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('fcm-message', { detail: notification }));
            }
        });

        void PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('fcm-action', { detail: action }));
            }
        });
    }
}

export const fcmService = new FCMService();

export function useFCMStatus() {
    return {
        isSupported: fcmService.isSupported(),
        permission: fcmService.getPermissionStatus(),
        token: fcmService.getToken(),
    };
}
