'use client';

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { ConnectionStatus, Network } from '@capacitor/network';

type ConnectionType = ConnectionStatus['connectionType'] | 'unknown';

interface NetworkState {
    isOnline: boolean;
    connectionType: ConnectionType;
}

const getBrowserFallbackState = (): NetworkState => ({
    isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
    connectionType: 'unknown',
});

export function useCapacitorNetwork(): NetworkState {
    const [state, setState] = useState<NetworkState>(getBrowserFallbackState);

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) {
            const handleOnline = () => {
                setState({
                    isOnline: true,
                    connectionType: 'unknown',
                });
            };

            const handleOffline = () => {
                setState({
                    isOnline: false,
                    connectionType: 'none',
                });
            };

            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);

            return () => {
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
            };
        }

        let isMounted = true;

        const updateStatus = (status: ConnectionStatus) => {
            if (!isMounted) {
                return;
            }

            setState({
                isOnline: status.connected,
                connectionType: status.connectionType,
            });
        };

        void Network.getStatus().then(updateStatus).catch(() => {
            if (isMounted) {
                setState(getBrowserFallbackState());
            }
        });

        const listenerPromise = Network.addListener('networkStatusChange', updateStatus);

        return () => {
            isMounted = false;
            void listenerPromise.then((listener) => listener.remove());
        };
    }, []);

    return state;
}
