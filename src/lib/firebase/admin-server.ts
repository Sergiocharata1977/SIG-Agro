import * as admin from 'firebase-admin';

// Inicialización Singleton de Firebase Admin
// Usa variables de entorno para las credenciales

let adminApp: admin.app.App | undefined;

function initializeAdmin() {
    if (admin.apps.length) {
        return admin.app();
    }

    // Leer credenciales desde variables de entorno
    const projectId = process.env.FIREBASE_PROJECT_ID || 'sig-agro-83adc';
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@sig-agro-83adc.iam.gserviceaccount.com';
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '';

    if (!privateKey) {
        console.warn('FIREBASE_PRIVATE_KEY no está configurada. Admin SDK limitado.');
        // En desarrollo, intentar sin credenciales (funcionalidad limitada)
        return admin.initializeApp({
            projectId
        });
    }

    return admin.initializeApp({
        credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey
        })
    });
}

export function getAdminFirestore() {
    if (!adminApp) {
        adminApp = initializeAdmin();
    }
    return adminApp.firestore();
}

