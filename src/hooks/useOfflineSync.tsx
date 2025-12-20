'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    initDB,
    getPendingSync,
    removePendingSync,
    incrementRetries,
    PendingSyncItem
} from '@/lib/indexed-db';

interface OfflineStatus {
    isOnline: boolean;
    isServiceWorkerReady: boolean;
    pendingCount: number;
    isSyncing: boolean;
    lastSyncTime: Date | null;
}

interface UseOfflineSyncReturn {
    status: OfflineStatus;
    syncNow: () => Promise<void>;
    registerServiceWorker: () => Promise<void>;
}

/**
 * Hook para manejar el estado offline y sincronización
 */
export function useOfflineSync(): UseOfflineSyncReturn {
    const [status, setStatus] = useState<OfflineStatus>({
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
        isServiceWorkerReady: false,
        pendingCount: 0,
        isSyncing: false,
        lastSyncTime: null
    });

    // Detectar cambios de conectividad
    useEffect(() => {
        const handleOnline = () => {
            console.log('[Offline] Conexión restaurada');
            setStatus(prev => ({ ...prev, isOnline: true }));
            // Trigger sync automático
            syncNow();
        };

        const handleOffline = () => {
            console.log('[Offline] Conexión perdida');
            setStatus(prev => ({ ...prev, isOnline: false }));
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Inicializar IndexedDB y cargar estado
    useEffect(() => {
        const init = async () => {
            try {
                await initDB();
                const pending = await getPendingSync();
                setStatus(prev => ({ ...prev, pendingCount: pending.length }));
            } catch (error) {
                console.error('[Offline] Error inicializando IndexedDB:', error);
            }
        };

        init();
    }, []);

    // Escuchar mensajes del Service Worker
    useEffect(() => {
        const handleSWMessage = (event: MessageEvent) => {
            if (event.data?.type === 'SYNC_STATUS') {
                if (event.data.status === 'syncing') {
                    setStatus(prev => ({ ...prev, isSyncing: true }));
                } else if (event.data.status === 'online') {
                    setStatus(prev => ({
                        ...prev,
                        isSyncing: false,
                        lastSyncTime: new Date()
                    }));
                    // Refrescar contador de pendientes
                    updatePendingCount();
                }
            }
        };

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', handleSWMessage);
        }

        return () => {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.removeEventListener('message', handleSWMessage);
            }
        };
    }, []);

    const updatePendingCount = async () => {
        try {
            const pending = await getPendingSync();
            setStatus(prev => ({ ...prev, pendingCount: pending.length }));
        } catch (error) {
            console.error('[Offline] Error actualizando pendientes:', error);
        }
    };

    /**
     * Registrar Service Worker
     */
    const registerServiceWorker = useCallback(async () => {
        if (!('serviceWorker' in navigator)) {
            console.warn('[Offline] Service Workers no soportados');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });

            console.log('[Offline] Service Worker registrado:', registration.scope);
            setStatus(prev => ({ ...prev, isServiceWorkerReady: true }));

            // Verificar actualizaciones
            registration.addEventListener('updatefound', () => {
                console.log('[Offline] Nueva versión del Service Worker encontrada');
            });

        } catch (error) {
            console.error('[Offline] Error registrando Service Worker:', error);
        }
    }, []);

    /**
     * Sincronizar datos pendientes
     */
    const syncNow = useCallback(async () => {
        if (!status.isOnline) {
            console.log('[Offline] No hay conexión, sync pospuesto');
            return;
        }

        setStatus(prev => ({ ...prev, isSyncing: true }));
        console.log('[Offline] Iniciando sincronización...');

        try {
            const pendingItems = await getPendingSync();
            console.log(`[Offline] ${pendingItems.length} items pendientes`);

            let synced = 0;
            let failed = 0;

            for (const item of pendingItems) {
                try {
                    const success = await syncItem(item);
                    if (success) {
                        await removePendingSync(item.id!);
                        synced++;
                    } else {
                        await incrementRetries(item.id!);
                        failed++;
                    }
                } catch (error) {
                    console.error('[Offline] Error sincronizando item:', error);
                    await incrementRetries(item.id!);
                    failed++;
                }
            }

            console.log(`[Offline] Sync completo: ${synced} exitosos, ${failed} fallidos`);

            setStatus(prev => ({
                ...prev,
                isSyncing: false,
                pendingCount: failed,
                lastSyncTime: new Date()
            }));

        } catch (error) {
            console.error('[Offline] Error en sincronización:', error);
            setStatus(prev => ({ ...prev, isSyncing: false }));
        }
    }, [status.isOnline]);

    return {
        status,
        syncNow,
        registerServiceWorker
    };
}

/**
 * Sincronizar un item individual al servidor
 */
async function syncItem(item: PendingSyncItem): Promise<boolean> {
    // Limitar reintentos
    if (item.retries >= 5) {
        console.warn('[Offline] Item excedió máximo de reintentos:', item);
        return false;
    }

    try {
        const response = await fetch(item.endpoint, {
            method: item.action === 'create' ? 'POST' :
                item.action === 'update' ? 'PUT' : 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(item.data)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        console.log('[Offline] Item sincronizado:', item.type, item.action);
        return true;
    } catch (error) {
        console.error('[Offline] Error sincronizando:', error);
        return false;
    }
}

// ============================================
// COMPONENTE DE INDICADOR OFFLINE
// ============================================

export function OfflineIndicator() {
    const { status } = useOfflineSync();

    if (status.isOnline && status.pendingCount === 0) {
        return null;
    }

    return (
        <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-full shadow-lg text-sm font-medium flex items-center gap-2 z-50 ${status.isOnline
                ? 'bg-amber-100 text-amber-800'
                : 'bg-red-100 text-red-800'
            }`}>
            {!status.isOnline && (
                <>
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    Sin conexión
                </>
            )}
            {status.isOnline && status.pendingCount > 0 && (
                <>
                    {status.isSyncing ? (
                        <span className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    )}
                    {status.isSyncing ? 'Sincronizando...' : `${status.pendingCount} pendientes`}
                </>
            )}
        </div>
    );
}
