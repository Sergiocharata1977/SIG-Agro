'use client';

import { useEffect } from 'react';
import { useOfflineSync, OfflineIndicator } from '@/hooks/useOfflineSync';

interface PWAProviderProps {
    children: React.ReactNode;
}

/**
 * Proveedor de PWA
 * Inicializa Service Worker y proporciona contexto offline
 */
export default function PWAProvider({ children }: PWAProviderProps) {
    const { registerServiceWorker, status } = useOfflineSync();

    useEffect(() => {
        // Registrar Service Worker en producción
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            // Esperar a que la página cargue completamente
            window.addEventListener('load', () => {
                registerServiceWorker();
            });
        }

        // Solicitar permiso para notificaciones
        if ('Notification' in window && Notification.permission === 'default') {
            // No pedir permiso automáticamente, dejarlo para cuando el usuario lo active
            console.log('[PWA] Notificaciones disponibles, permiso:', Notification.permission);
        }
    }, [registerServiceWorker]);

    // Log del estado en desarrollo
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('[PWA] Estado:', status);
        }
    }, [status]);

    return (
        <>
            {children}
            <OfflineIndicator />
        </>
    );
}

/**
 * Hook para solicitar permiso de notificaciones
 */
export function useNotificationPermission() {
    const requestPermission = async (): Promise<NotificationPermission> => {
        if (!('Notification' in window)) {
            console.warn('[PWA] Notificaciones no soportadas');
            return 'denied';
        }

        if (Notification.permission === 'granted') {
            return 'granted';
        }

        const permission = await Notification.requestPermission();
        return permission;
    };

    const showNotification = (title: string, options?: NotificationOptions) => {
        if (Notification.permission === 'granted') {
            new Notification(title, options);
        }
    };

    return {
        permission: typeof window !== 'undefined' && 'Notification' in window
            ? Notification.permission
            : 'denied',
        requestPermission,
        showNotification
    };
}

/**
 * Hook para detectar si es instalable como PWA
 */
export function usePWAInstall() {
    useEffect(() => {
        let deferredPrompt: any = null;

        const handleBeforeInstall = (e: Event) => {
            // Prevenir prompt automático
            e.preventDefault();
            deferredPrompt = e;
            console.log('[PWA] App instalable detectada');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        };
    }, []);
}
