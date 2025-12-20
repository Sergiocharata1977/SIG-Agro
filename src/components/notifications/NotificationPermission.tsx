'use client';

import { useState, useEffect } from 'react';
import { fcmService } from '@/services/fcm';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, BellRing, Loader2 } from 'lucide-react';

export function NotificationPermission() {
    const [status, setStatus] = useState<'loading' | 'unsupported' | 'denied' | 'granted' | 'default'>('loading');
    const [isRequesting, setIsRequesting] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (!fcmService.isSupported()) {
            setStatus('unsupported');
            return;
        }
        setStatus(Notification.permission as 'denied' | 'granted' | 'default');
    }, []);

    const handleRequestPermission = async () => {
        setIsRequesting(true);
        try {
            const granted = await fcmService.requestPermission();
            if (granted) {
                const token = await fcmService.initialize();
                if (token && user?.uid) {
                    await fcmService.saveTokenToServer(user.uid);
                }
                setStatus('granted');
            } else {
                setStatus('denied');
            }
        } catch (error) {
            console.error('Error requesting permission:', error);
        } finally {
            setIsRequesting(false);
        }
    };

    if (status === 'loading') {
        return (
            <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Cargando...</span>
            </div>
        );
    }

    if (status === 'unsupported') {
        return (
            <div className="flex items-center gap-2 text-gray-400">
                <BellOff className="h-4 w-4" />
                <span className="text-sm">Notificaciones no soportadas</span>
            </div>
        );
    }

    if (status === 'denied') {
        return (
            <div className="flex items-center gap-2 text-red-500">
                <BellOff className="h-4 w-4" />
                <span className="text-sm">Notificaciones bloqueadas</span>
            </div>
        );
    }

    if (status === 'granted') {
        return (
            <div className="flex items-center gap-2 text-green-600">
                <BellRing className="h-4 w-4" />
                <span className="text-sm">Notificaciones activadas</span>
            </div>
        );
    }

    // status === 'default' - no ha decidido
    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleRequestPermission}
            disabled={isRequesting}
            className="gap-2"
        >
            {isRequesting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Bell className="h-4 w-4" />
            )}
            Activar Notificaciones
        </Button>
    );
}

// Widget compacto para el sidebar
export function NotificationWidget() {
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (fcmService.isSupported()) {
            setPermissionStatus(Notification.permission);
        }

        // Escuchar mensajes FCM
        const handleMessage = (event: CustomEvent) => {
            setUnreadCount(prev => prev + 1);
        };

        window.addEventListener('fcm-message', handleMessage as EventListener);
        return () => window.removeEventListener('fcm-message', handleMessage as EventListener);
    }, []);

    return (
        <div className="relative">
            <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </Button>
        </div>
    );
}
