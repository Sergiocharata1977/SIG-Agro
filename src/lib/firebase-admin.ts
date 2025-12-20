import admin from 'firebase-admin';

// Inicializar Firebase Admin una sola vez
if (!admin.apps.length) {
    // En desarrollo, usar variables de entorno
    // En producción, usar service account JSON
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        : undefined;

    admin.initializeApp({
        credential: serviceAccount
            ? admin.credential.cert(serviceAccount)
            : admin.credential.applicationDefault(),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
}

// Exportar instancia de Firestore
export const adminDb = admin.firestore();

// Exportar instancia de Auth
export const adminAuth = admin.auth();

// Exportar instancia de Messaging (para FCM)
export const adminMessaging = admin.messaging();

// Verificar token de usuario
export async function verifyIdToken(token: string) {
    try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        return decodedToken;
    } catch (error) {
        console.error('Error verifying token:', error);
        return null;
    }
}

// Obtener usuario por UID
export async function getUser(uid: string) {
    try {
        return await adminAuth.getUser(uid);
    } catch (error) {
        console.error('Error getting user:', error);
        return null;
    }
}
