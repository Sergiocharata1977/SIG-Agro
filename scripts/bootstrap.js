#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Bootstrap automatico de SIG Agro.
 * Crea usuarios, organizaciones y datos minimos operativos.
 *
 * Uso:
 *  npm run bootstrap
 *
 * Requisitos:
 *  - Definir FIREBASE_SERVICE_ACCOUNT_KEY (JSON) o
 *  - Crear service-account.json local (no versionar)
 */

const fs = require('fs');
const path = require('path');
const { cert, getApps, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const PRODUCER = {
    email: process.env.BOOTSTRAP_OWNER_EMAIL || 'productor@empresa.com',
    password: process.env.BOOTSTRAP_OWNER_PASSWORD || 'Productor123',
    displayName: process.env.BOOTSTRAP_OWNER_NAME || 'Productor Principal',
};

const COPILOT = {
    email: process.env.BOOTSTRAP_COPILOT_EMAIL || 'copilot@empresa.com',
    password: process.env.BOOTSTRAP_COPILOT_PASSWORD || 'Copilot123',
    displayName: process.env.BOOTSTRAP_COPILOT_NAME || 'Copiloto Admin',
};

const ORGANIZATIONS = [
    {
        id: process.env.BOOTSTRAP_ORG_1_ID || 'org-estudio-contable-chaco',
        name: process.env.BOOTSTRAP_ORG_1_NAME || 'Estudio Contable Chaco',
        province: 'Chaco',
        city: 'Resistencia',
        email: 'admin@estudiochaco.com',
    },
    {
        id: process.env.BOOTSTRAP_ORG_2_ID || 'org-agro-don-juan',
        name: process.env.BOOTSTRAP_ORG_2_NAME || 'Agro Don Juan',
        province: 'Chaco',
        city: 'Presidencia Roque Saenz Pena',
        email: 'admin@donjuanagro.com',
    },
];

function loadServiceAccount() {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    }

    const localFile = path.resolve(process.cwd(), 'service-account.json');
    if (fs.existsSync(localFile)) {
        return JSON.parse(fs.readFileSync(localFile, 'utf8'));
    }

    throw new Error(
        'Falta FIREBASE_SERVICE_ACCOUNT_KEY o service-account.json local para ejecutar bootstrap.'
    );
}

function slugify(value) {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

async function getOrCreateUser(auth, userConfig) {
    try {
        const existing = await auth.getUserByEmail(userConfig.email);
        await auth.updateUser(existing.uid, {
            displayName: userConfig.displayName,
            password: userConfig.password,
            emailVerified: true,
        });
        return existing;
    } catch (error) {
        if (error.code !== 'auth/user-not-found') throw error;
        return auth.createUser({
            email: userConfig.email,
            password: userConfig.password,
            displayName: userConfig.displayName,
            emailVerified: true,
        });
    }
}

async function ensureOrganization(db, organization, ownerUid) {
    const now = FieldValue.serverTimestamp();
    const ref = db.collection('organizations').doc(organization.id);

    await ref.set(
        {
            name: organization.name,
            slug: slugify(organization.name),
            razonSocial: organization.name,
            email: organization.email,
            province: organization.province,
            city: organization.city,
            plan: 'free',
            status: 'active',
            settings: {
                timezone: 'America/Argentina/Buenos_Aires',
                currency: 'ARS',
                language: 'es',
            },
            features: {
                mapa_gis: true,
                campanias: true,
                contabilidad: true,
                analisis_ia: true,
                documentos: true,
                reportes: true,
                metricas: true,
                max_usuarios: 25,
                max_campos: 100,
                max_hectareas: 20000,
            },
            createdBy: ownerUid,
            updatedAt: now,
            createdAt: now,
        },
        { merge: true }
    );

    await ref.collection('members').doc(ownerUid).set(
        {
            userId: ownerUid,
            role: 'owner',
            status: 'active',
            modulosHabilitados: null,
            invitedBy: ownerUid,
            joinedAt: now,
        },
        { merge: true }
    );

    const fieldRef = ref.collection('fields').doc('field-demo');
    await fieldRef.set(
        {
            nombre: `Campo Demo ${organization.name}`,
            codigo: `FD-${organization.id.slice(-4).toUpperCase()}`,
            provincia: organization.province,
            departamento: organization.city,
            localidad: organization.city,
            superficieTotal: 420,
            superficieCultivable: 390,
            organizationId: organization.id,
            activo: true,
            createdAt: now,
            updatedAt: now,
            createdBy: ownerUid,
        },
        { merge: true }
    );

    await ref.collection('plots').doc('plot-demo').set(
        {
            nombre: 'Lote Demo',
            codigo: `LD-${organization.id.slice(-4).toUpperCase()}`,
            superficie: 210,
            estado: 'sembrado',
            organizationId: organization.id,
            fieldId: 'field-demo',
            activo: true,
            createdAt: now,
            updatedAt: now,
            createdBy: ownerUid,
        },
        { merge: true }
    );
}

async function run() {
    const serviceAccount = loadServiceAccount();

    if (!getApps().length) {
        initializeApp({ credential: cert(serviceAccount) });
    }

    const auth = getAuth();
    const db = getFirestore();

    console.log('Iniciando bootstrap SIG Agro...');
    console.log(`Proyecto Firebase: ${serviceAccount.project_id}`);

    const producerUser = await getOrCreateUser(auth, PRODUCER);
    const copilotUser = await getOrCreateUser(auth, COPILOT);

    for (const organization of ORGANIZATIONS) {
        await ensureOrganization(db, organization, producerUser.uid);

        const orgRef = db.collection('organizations').doc(organization.id);
        await orgRef.collection('members').doc(copilotUser.uid).set(
            {
                userId: copilotUser.uid,
                role: 'admin',
                status: 'active',
                modulosHabilitados: null,
                invitedBy: producerUser.uid,
                joinedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
        );
    }

    const organizationIds = ORGANIZATIONS.map((org) => org.id);

    await db.collection('users').doc(producerUser.uid).set(
        {
            email: PRODUCER.email,
            displayName: PRODUCER.displayName,
            organizationId: organizationIds[0],
            organizationIds,
            accessAllOrganizations: true,
            role: 'owner',
            status: 'active',
            modulosHabilitados: null,
            updatedAt: FieldValue.serverTimestamp(),
            createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
    );

    await db.collection('users').doc(copilotUser.uid).set(
        {
            email: COPILOT.email,
            displayName: COPILOT.displayName,
            organizationId: organizationIds[0],
            organizationIds,
            accessAllOrganizations: true,
            role: 'admin',
            status: 'active',
            modulosHabilitados: null,
            invitedBy: producerUser.uid,
            updatedAt: FieldValue.serverTimestamp(),
            createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
    );

    console.log('Bootstrap completado.');
    console.log('Credenciales productivas de prueba:');
    console.log(`- Productor: ${PRODUCER.email} / ${PRODUCER.password}`);
    console.log(`- Copiloto: ${COPILOT.email} / ${COPILOT.password}`);
    console.log(`- Organizaciones: ${organizationIds.join(', ')}`);
}

run().catch((error) => {
    console.error('Error en bootstrap:', error.message);
    process.exit(1);
});

