import * as admin from 'firebase-admin';

// Inicialización Singleton de Firebase Admin
// Usa variables de entorno para las credenciales

let adminApp: admin.app.App | undefined;

function cleanPrivateKey(value?: string): string {
    return (value || '').replace(/\\n/g, '\n').trim();
}

function parseServiceAccountJson(raw?: string): {
    projectId?: string;
    clientEmail?: string;
    privateKey?: string;
} | null {
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        return {
            projectId: parsed.project_id || parsed.projectId,
            clientEmail: parsed.client_email || parsed.clientEmail,
            privateKey: cleanPrivateKey(parsed.private_key || parsed.privateKey),
        };
    } catch {
        return null;
    }
}

function initializeAdmin() {
    if (admin.apps.length) {
        return admin.app();
    }

    const serviceAccount = parseServiceAccountJson(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
        process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    );

    const projectId =
        serviceAccount?.projectId ||
        process.env.FIREBASE_PROJECT_ID ||
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
        'sig-agro-83adc';

    const clientEmail =
        serviceAccount?.clientEmail ||
        process.env.FIREBASE_CLIENT_EMAIL ||
        process.env.GOOGLE_CLIENT_EMAIL ||
        '';

    const privateKey =
        serviceAccount?.privateKey ||
        cleanPrivateKey(process.env.FIREBASE_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY);

    if (!projectId || !clientEmail || !privateKey) {
        throw new Error(
            'Firebase Admin credenciales incompletas. Configurar FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY o FIREBASE_SERVICE_ACCOUNT_KEY'
        );
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

