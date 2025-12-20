// Firebase Messaging Service Worker
// Este archivo DEBE estar en /public para que funcione

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Configuración de Firebase (debe coincidir con tu app)
firebase.initializeApp({
    apiKey: "AIzaSyA_REPLACE_WITH_YOUR_KEY",
    authDomain: "sig-agro.firebaseapp.com",
    projectId: "sig-agro",
    storageBucket: "sig-agro.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
});

const messaging = firebase.messaging();

// Manejar mensajes en background
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Background message:', payload);

    const notificationTitle = payload.notification?.title || 'SIG Agro';
    const notificationOptions = {
        body: payload.notification?.body || '',
        icon: payload.notification?.icon || '/logo-sig-agro.png',
        badge: '/logo-sig-agro.png',
        tag: payload.data?.tag || 'sig-agro-notification',
        data: payload.data,
        actions: [
            { action: 'open', title: 'Ver' },
            { action: 'dismiss', title: 'Descartar' }
        ],
        vibrate: [200, 100, 200],
        requireInteraction: payload.data?.urgent === 'true'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manejar click en notificación
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification click:', event);

    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/dashboard';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Si ya hay una ventana abierta, enfocarla
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.focus();
                    client.navigate(urlToOpen);
                    return;
                }
            }
            // Si no hay ventana, abrir una nueva
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Manejar instalación del SW
self.addEventListener('install', (event) => {
    console.log('[firebase-messaging-sw.js] Service Worker installed');
    self.skipWaiting();
});

// Manejar activación del SW
self.addEventListener('activate', (event) => {
    console.log('[firebase-messaging-sw.js] Service Worker activated');
    event.waitUntil(clients.claim());
});
