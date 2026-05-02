'use client';

import { useCallback, useEffect, useState } from 'react';
import { useCapacitorNetwork } from '@/hooks/useCapacitorNetwork';
import {
    initDB,
    getPendingSync,
    removePendingSync,
    incrementRetries,
    PendingSyncItem
} from '@/lib/indexed-db';

interface OfflineStatus {
    isOnline: boolean;
    pendingCount: number;
    isSyncing: boolean;
    lastSyncTime: Date | null;
}

interface UseOfflineSyncReturn {
    status: OfflineStatus;
    syncNow: () => Promise<void>;
}

/**
 * Hook para manejar el estado offline y sincronizacion.
 */
export function useOfflineSync(): UseOfflineSyncReturn {
    const { isOnline } = useCapacitorNetwork();
    const [status, setStatus] = useState<OfflineStatus>({
        isOnline,
        pendingCount: 0,
        isSyncing: false,
        lastSyncTime: null
    });

    useEffect(() => {
        setStatus((prev) => {
            if (prev.isOnline === isOnline) {
                return prev;
            }

            console.log(isOnline ? '[Offline] Conexion restaurada' : '[Offline] Conexion perdida');
            return { ...prev, isOnline };
        });
    }, [isOnline]);

    useEffect(() => {
        const init = async () => {
            try {
                await initDB();
                const pending = await getPendingSync();
                setStatus((prev) => ({ ...prev, pendingCount: pending.length }));
            } catch (error) {
                console.error('[Offline] Error inicializando IndexedDB:', error);
            }
        };

        void init();
    }, []);

    const syncNow = useCallback(async () => {
        if (!isOnline) {
            console.log('[Offline] No hay conexion, sync pospuesto');
            return;
        }

        setStatus((prev) => ({ ...prev, isSyncing: true }));
        console.log('[Offline] Iniciando sincronizacion...');

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

            setStatus((prev) => ({
                ...prev,
                isSyncing: false,
                pendingCount: failed,
                lastSyncTime: new Date()
            }));
        } catch (error) {
            console.error('[Offline] Error en sincronizacion:', error);
            setStatus((prev) => ({ ...prev, isSyncing: false }));
        }
    }, [isOnline]);

    useEffect(() => {
        if (isOnline) {
            void syncNow();
        }
    }, [isOnline, syncNow]);

    return {
        status,
        syncNow
    };
}

/**
 * Sincronizar un item individual al servidor.
 */
async function syncItem(item: PendingSyncItem): Promise<boolean> {
    if (item.retries >= 5) {
        console.warn('[Offline] Item excedio maximo de reintentos:', item);
        return false;
    }

    try {
        const response = await fetch(item.endpoint, {
            method: item.action === 'create' ? 'POST' : item.action === 'update' ? 'PUT' : 'DELETE',
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

export function OfflineIndicator() {
    const { status } = useOfflineSync();

    if (status.isOnline && status.pendingCount === 0) {
        return null;
    }

    return (
        <div
            className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-lg ${
                status.isOnline ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
            }`}
        >
            {!status.isOnline && (
                <>
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    Sin conexion
                </>
            )}
            {status.isOnline && status.pendingCount > 0 && (
                <>
                    {status.isSyncing ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
                    ) : (
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                    )}
                    {status.isSyncing ? 'Sincronizando...' : `${status.pendingCount} pendientes`}
                </>
            )}
        </div>
    );
}
