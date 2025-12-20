/**
 * Service Worker para SIG-Agro PWA
 * Maneja cache de assets y datos offline
 */

const CACHE_NAME = 'sig-agro-v1';
const DATA_CACHE_NAME = 'sig-agro-data-v1';

// Assets estáticos a cachear
const STATIC_ASSETS = [
    '/',
    '/dashboard',
    '/scouting',
    '/campos',
    '/operaciones',
    '/offline',
    '/manifest.json',
];

// API endpoints a cachear (network first, fallback to cache)
const API_ROUTES = [
    '/api/campos',
    '/api/lotes',
];

// Instalación: cachear assets estáticos
self.addEventListener('install', (event) => {
    console.log('[SW] Instalando Service Worker...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Cacheando assets estáticos');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[SW] Assets cacheados exitosamente');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Error cacheando assets:', error);
            })
    );
});

// Activación: limpiar caches viejos
self.addEventListener('activate', (event) => {
    console.log('[SW] Activando Service Worker...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME && name !== DATA_CACHE_NAME)
                        .map((name) => {
                            console.log('[SW] Eliminando cache viejo:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Service Worker activado');
                return self.clients.claim();
            })
    );
});

// Fetch: estrategia de cache
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Ignorar requests que no son GET
    if (request.method !== 'GET') {
        return;
    }

    // Ignorar extensiones de Chrome y otros
    if (url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') {
        return;
    }

    // API requests: Network first, fallback to cache
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirst(request));
        return;
    }

    // Assets estáticos: Cache first, fallback to network
    if (isStaticAsset(url.pathname)) {
        event.respondWith(cacheFirst(request));
        return;
    }

    // Páginas de navegación: Network first con fallback offline
    if (request.mode === 'navigate') {
        event.respondWith(networkFirstWithOfflineFallback(request));
        return;
    }

    // Default: network first
    event.respondWith(networkFirst(request));
});

// Estrategia: Cache first
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.error('[SW] Error en cacheFirst:', error);
        return new Response('Offline', { status: 503 });
    }
}

// Estrategia: Network first
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);

        // Cachear respuesta exitosa de API
        if (networkResponse.ok && request.url.includes('/api/')) {
            const cache = await caches.open(DATA_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.log('[SW] Red no disponible, usando cache');
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        return new Response(JSON.stringify({
            error: 'Offline',
            offline: true
        }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Estrategia: Network first con fallback a página offline
async function networkFirstWithOfflineFallback(request) {
    try {
        const networkResponse = await fetch(request);

        // Cachear página para uso offline
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.log('[SW] Página no disponible, buscando en cache');

        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Fallback a página offline
        const offlineResponse = await caches.match('/offline');
        if (offlineResponse) {
            return offlineResponse;
        }

        return new Response('Offline - No hay conexión a internet', {
            status: 503,
            headers: { 'Content-Type': 'text/html' }
        });
    }
}

// Verificar si es un asset estático
function isStaticAsset(pathname) {
    const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ico'];
    return staticExtensions.some(ext => pathname.endsWith(ext)) ||
        pathname.startsWith('/_next/static/');
}

// Escuchar mensajes del cliente
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.delete(CACHE_NAME);
        caches.delete(DATA_CACHE_NAME);
    }
});

// Sincronización en background
self.addEventListener('sync', (event) => {
    console.log('[SW] Evento de sync:', event.tag);

    if (event.tag === 'sync-pending-data') {
        event.waitUntil(syncPendingData());
    }
});

// Sincronizar datos pendientes
async function syncPendingData() {
    console.log('[SW] Sincronizando datos pendientes...');

    // Notificar a los clientes que se está sincronizando
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
        client.postMessage({
            type: 'SYNC_STATUS',
            status: 'syncing'
        });
    });

    // La lógica de sincronización real se hace en el cliente con IndexedDB
    // El SW solo notifica que hay conexión disponible

    clients.forEach(client => {
        client.postMessage({
            type: 'SYNC_STATUS',
            status: 'online'
        });
    });
}

// Push notifications (para alertas)
self.addEventListener('push', (event) => {
    if (!event.data) return;

    const data = event.data.json();

    const options = {
        body: data.body || 'Nueva notificación de SIG-Agro',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/'
        },
        actions: [
            { action: 'open', title: 'Ver' },
            { action: 'close', title: 'Cerrar' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'SIG-Agro', options)
    );
});

// Click en notificación
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'open' || !event.action) {
        const url = event.notification.data?.url || '/';
        event.waitUntil(
            self.clients.openWindow(url)
        );
    }
});

console.log('[SW] Service Worker cargado');
