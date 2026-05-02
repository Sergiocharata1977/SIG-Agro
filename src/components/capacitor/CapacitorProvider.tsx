'use client';

import { ReactNode, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App } from '@capacitor/app';

interface CapacitorProviderProps {
    children: ReactNode;
}

export default function CapacitorProvider({ children }: CapacitorProviderProps) {
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) {
            return;
        }

        const appStateListener = App.addListener('appStateChange', ({ isActive }) => {
            if (!isActive) {
                return;
            }
        });

        const backButtonListener = App.addListener('backButton', ({ canGoBack }) => {
            if (!canGoBack) {
                App.exitApp();
                return;
            }

            window.history.back();
        });

        void (async () => {
            await SplashScreen.hide({ fadeOutDuration: 300 });
            await StatusBar.setStyle({ style: Style.Dark });
            await StatusBar.setBackgroundColor({ color: '#0f172a' });
        })();

        return () => {
            void appStateListener.then((listener) => listener.remove());
            void backButtonListener.then((listener) => listener.remove());
        };
    }, []);

    return <>{children}</>;
}
