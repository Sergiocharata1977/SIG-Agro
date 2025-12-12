/**
 * Firebase Admin SDK Initialization
 * Configuración compartida con 9001app-firebase (mismo proyecto Firebase)
 * 
 * Este módulo inicializa Firebase Admin SDK para operaciones del servidor
 * usando el patrón singleton para prevenir múltiples inicializaciones.
 */

import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { Auth, getAuth } from 'firebase-admin/auth';
import { Firestore, getFirestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

// Instancia singleton
let adminApp: App | null = null;

/**
 * Inicializa Firebase Admin SDK con credenciales de cuenta de servicio
 */
export function initializeFirebaseAdmin(): App {
    if (adminApp) {
        return adminApp;
    }

    try {
        const existingApps = getApps();
        if (existingApps.length > 0) {
            adminApp = existingApps[0];
            return adminApp;
        }

        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY;
        const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

        if (!projectId || !clientEmail || !privateKey) {
            throw new Error(
                'Faltan credenciales de Firebase Admin SDK. ' +
                'Configura FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY.'
            );
        }

        // Formatear la clave privada
        const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

        adminApp = initializeApp({
            credential: cert({
                projectId,
                clientEmail,
                privateKey: formattedPrivateKey,
            }),
            storageBucket: storageBucket || `${projectId}.appspot.com`,
        });

        console.log('✅ Firebase Admin SDK inicializado correctamente');
        return adminApp;
    } catch (error) {
        console.error('❌ Error al inicializar Firebase Admin SDK:', error);
        throw error;
    }
}

/**
 * Obtiene la instancia de Firebase Auth Admin
 */
export function getAdminAuth(): Auth {
    initializeFirebaseAdmin();
    return getAuth();
}

/**
 * Obtiene la instancia de Firestore Admin
 */
export function getAdminFirestore(): Firestore {
    initializeFirebaseAdmin();
    return getFirestore();
}

/**
 * Obtiene la instancia de Storage Admin
 */
export function getAdminStorage(): Storage {
    initializeFirebaseAdmin();
    return getStorage();
}
