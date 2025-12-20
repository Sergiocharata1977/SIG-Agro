/**
 * Servicio de IndexedDB para almacenamiento offline
 * Almacena datos localmente cuando no hay conexión
 */

const DB_NAME = 'sig-agro-offline';
const DB_VERSION = 1;

// Nombres de object stores
export const STORES = {
    PENDING_SYNC: 'pending_sync',       // Datos pendientes de sincronizar
    CACHED_DATA: 'cached_data',         // Datos cacheados para offline
    SCOUTING: 'scouting_offline',       // Observaciones de scouting offline
    SETTINGS: 'settings'                // Configuración local
};

let db: IDBDatabase | null = null;

/**
 * Inicializar IndexedDB
 */
export async function initDB(): Promise<IDBDatabase> {
    if (db) return db;

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('Error abriendo IndexedDB:', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            db = request.result;
            console.log('IndexedDB inicializada correctamente');
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = (event.target as IDBOpenDBRequest).result;

            // Store para datos pendientes de sync
            if (!database.objectStoreNames.contains(STORES.PENDING_SYNC)) {
                const pendingStore = database.createObjectStore(STORES.PENDING_SYNC, {
                    keyPath: 'id',
                    autoIncrement: true
                });
                pendingStore.createIndex('type', 'type', { unique: false });
                pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
            }

            // Store para datos cacheados
            if (!database.objectStoreNames.contains(STORES.CACHED_DATA)) {
                const cachedStore = database.createObjectStore(STORES.CACHED_DATA, {
                    keyPath: 'key'
                });
                cachedStore.createIndex('expiry', 'expiry', { unique: false });
            }

            // Store para scouting offline
            if (!database.objectStoreNames.contains(STORES.SCOUTING)) {
                const scoutingStore = database.createObjectStore(STORES.SCOUTING, {
                    keyPath: 'localId',
                    autoIncrement: true
                });
                scoutingStore.createIndex('synced', 'synced', { unique: false });
                scoutingStore.createIndex('timestamp', 'timestamp', { unique: false });
            }

            // Store para configuración
            if (!database.objectStoreNames.contains(STORES.SETTINGS)) {
                database.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
            }

            console.log('IndexedDB schema creado/actualizado');
        };
    });
}

/**
 * Agregar item a una store
 */
export async function addItem<T>(storeName: string, item: T): Promise<number> {
    const database = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(item);

        request.onsuccess = () => resolve(request.result as number);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Obtener item por key
 */
export async function getItem<T>(storeName: string, key: string | number): Promise<T | null> {
    const database = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Obtener todos los items de una store
 */
export async function getAllItems<T>(storeName: string): Promise<T[]> {
    const database = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Obtener items por índice
 */
export async function getItemsByIndex<T>(
    storeName: string,
    indexName: string,
    value: IDBValidKey
): Promise<T[]> {
    const database = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(value);

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Actualizar item
 */
export async function updateItem<T>(storeName: string, item: T): Promise<void> {
    const database = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(item);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * Eliminar item
 */
export async function deleteItem(storeName: string, key: string | number): Promise<void> {
    const database = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * Limpiar toda una store
 */
export async function clearStore(storeName: string): Promise<void> {
    const database = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// ============================================
// FUNCIONES ESPECÍFICAS
// ============================================

export interface PendingSyncItem {
    id?: number;
    type: 'scouting' | 'alert' | 'operation' | 'other';
    action: 'create' | 'update' | 'delete';
    endpoint: string;
    data: unknown;
    timestamp: Date;
    retries: number;
}

/**
 * Agregar item para sincronización pendiente
 */
export async function addPendingSync(item: Omit<PendingSyncItem, 'id'>): Promise<number> {
    return addItem(STORES.PENDING_SYNC, {
        ...item,
        timestamp: new Date(),
        retries: 0
    });
}

/**
 * Obtener items pendientes de sincronizar
 */
export async function getPendingSync(): Promise<PendingSyncItem[]> {
    return getAllItems<PendingSyncItem>(STORES.PENDING_SYNC);
}

/**
 * Marcar item como sincronizado (eliminar)
 */
export async function removePendingSync(id: number): Promise<void> {
    return deleteItem(STORES.PENDING_SYNC, id);
}

/**
 * Incrementar contador de reintentos
 */
export async function incrementRetries(id: number): Promise<void> {
    const item = await getItem<PendingSyncItem>(STORES.PENDING_SYNC, id);
    if (item) {
        item.retries++;
        await updateItem(STORES.PENDING_SYNC, item);
    }
}

// ============================================
// CACHE DE DATOS
// ============================================

interface CachedDataItem {
    key: string;
    data: unknown;
    timestamp: Date;
    expiry: Date;
}

/**
 * Guardar datos en cache local
 */
export async function cacheData(
    key: string,
    data: unknown,
    ttlMinutes: number = 60
): Promise<void> {
    const now = new Date();
    const expiry = new Date(now.getTime() + ttlMinutes * 60 * 1000);

    await updateItem(STORES.CACHED_DATA, {
        key,
        data,
        timestamp: now,
        expiry
    });
}

/**
 * Obtener datos del cache
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
    const item = await getItem<CachedDataItem>(STORES.CACHED_DATA, key);

    if (!item) return null;

    // Verificar expiración
    if (new Date() > new Date(item.expiry)) {
        await deleteItem(STORES.CACHED_DATA, key);
        return null;
    }

    return item.data as T;
}

/**
 * Limpiar cache expirado
 */
export async function cleanExpiredCache(): Promise<number> {
    const allCached = await getAllItems<CachedDataItem>(STORES.CACHED_DATA);
    const now = new Date();
    let cleaned = 0;

    for (const item of allCached) {
        if (now > new Date(item.expiry)) {
            await deleteItem(STORES.CACHED_DATA, item.key);
            cleaned++;
        }
    }

    return cleaned;
}
