/**
 * Asignar organización a todos los usuarios
 */
const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
const ORG_ID = 'demo-agro-chaco';

async function asignarOrganizacion() {
    console.log('🔧 Asignando organización a usuarios...\n');

    const usersSnap = await db.collection('users').get();

    for (const doc of usersSnap.docs) {
        const data = doc.data();
        console.log(`📧 ${data.email || doc.id}`);
        console.log(`   orgId actual: ${data.organizationId || 'ninguno'}`);

        // Asignar si no tiene
        if (!data.organizationId || data.organizationId === 'null') {
            await db.collection('users').doc(doc.id).update({
                organizationId: ORG_ID
            });
            console.log(`   ✅ Asignado: ${ORG_ID}`);
        } else {
            console.log(`   ➡️ Ya tiene organización`);
        }
    }

    console.log('\n✅ Proceso completado');
    process.exit(0);
}

asignarOrganizacion();
