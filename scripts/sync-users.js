/**
 * Sincronizar usuarios de Firebase Auth con Firestore
 */
const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
const auth = admin.auth();
const ORG_ID = 'demo-agro-chaco';

async function sincronizarUsuarios() {
    console.log('🔄 Sincronizando usuarios Auth → Firestore...\n');

    // Listar todos los usuarios de Auth
    const listResult = await auth.listUsers(100);

    for (const userRecord of listResult.users) {
        console.log(`📧 ${userRecord.email} (${userRecord.uid})`);

        // Verificar si existe en Firestore
        const userDoc = await db.collection('users').doc(userRecord.uid).get();

        if (!userDoc.exists) {
            console.log('   ⚠️ No existe en Firestore, creando...');
            await db.collection('users').doc(userRecord.uid).set({
                email: userRecord.email,
                displayName: userRecord.displayName || userRecord.email?.split('@')[0] || 'Usuario',
                organizationId: ORG_ID,
                role: 'operator',
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log(`   ✅ Creado con orgId: ${ORG_ID}`);
        } else {
            const data = userDoc.data();
            if (!data.organizationId) {
                await db.collection('users').doc(userRecord.uid).update({
                    organizationId: ORG_ID,
                    updatedAt: new Date()
                });
                console.log(`   ✅ Asignado orgId: ${ORG_ID}`);
            } else {
                console.log(`   ➡️ Ya tiene orgId: ${data.organizationId}`);
            }
        }
    }

    console.log('\n✅ Sincronización completada');
    process.exit(0);
}

sincronizarUsuarios();
