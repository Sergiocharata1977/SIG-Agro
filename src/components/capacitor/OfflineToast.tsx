'use client';

import { useCapacitorNetwork } from '@/hooks/useCapacitorNetwork';

export function OfflineToast() {
    const { isOnline } = useCapacitorNetwork();

    if (isOnline) {
        return null;
    }

    return (
        <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm text-white shadow-lg">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
            Sin conexion: los cambios se sincronizaran al reconectarte
        </div>
    );
}
