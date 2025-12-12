/**
 * Script simple para verificar si los datos existen
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

async function verificar() {
    console.log('🔍 Verificando datos en Firebase...');
    console.log(`📁 Project ID: ${serviceAccount.project_id}`);
    console.log(`📁 Organización: ${ORG_ID}\n`);

    try {
        // Verificar organización
        const orgDoc = await db.collection('organizations').doc(ORG_ID).get();
        if (orgDoc.exists) {
            console.log('✅ Organización existe:', orgDoc.data().name);
        } else {
            console.log('❌ Organización NO existe');
        }

        // Verificar fields
        const fieldsSnap = await db.collection(`organizations/${ORG_ID}/fields`).get();
        console.log(`\n📍 Fields: ${fieldsSnap.size} documentos`);
        fieldsSnap.docs.forEach(doc => {
            console.log(`   - ${doc.data().nombre} (${doc.data().superficieTotal} ha)`);
        });

        // Verificar plots
        const plotsSnap = await db.collection(`organizations/${ORG_ID}/plots`).get();
        console.log(`\n📍 Plots: ${plotsSnap.size} documentos`);
        plotsSnap.docs.forEach(doc => {
            console.log(`   - ${doc.data().nombre} (${doc.data().superficie} ha)`);
        });

        // Verificar crops
        const cropsSnap = await db.collection(`organizations/${ORG_ID}/crops`).get();
        console.log(`\n📍 Crops: ${cropsSnap.size} documentos`);
        cropsSnap.docs.forEach(doc => {
            console.log(`   - ${doc.data().cultivo} - ${doc.data().variedad}`);
        });

        // Verificar campos legacy
        const camposSnap = await db.collection(`organizations/${ORG_ID}/campos`).get();
        console.log(`\n📍 Campos (legacy): ${camposSnap.size} documentos`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    process.exit(0);
}

verificar();
