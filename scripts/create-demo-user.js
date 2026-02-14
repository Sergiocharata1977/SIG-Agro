/**
 * Script para crear usuario de demo en Firebase Auth
 * Este usuario podrá acceder a la organización de ejemplo
 * 
 * Uso: node scripts/create-demo-user.js
 */

const admin = require('firebase-admin');

// Cargar credenciales
const serviceAccount = require('../service-account.json');

// Evitar reinicialización si ya existe
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const auth = admin.auth();
const db = admin.firestore();

// Datos del usuario demo
const DEMO_USER = {
    email: 'demo@losalgarrobos.com.ar',
    password: 'Demo2024!',
    displayName: 'Usuario Demo',
    organizationId: process.env.ORG_ID || 'demo-agro-chaco' // ID de la organización creada en seed-data.js
};

async function createDemoUser() {
    console.log('🔑 Creando usuario de demo...\n');

    try {
        let uid;

        // 1. Intentar crear usuario en Firebase Auth
        try {
            const userRecord = await auth.createUser({
                email: DEMO_USER.email,
                password: DEMO_USER.password,
                displayName: DEMO_USER.displayName,
                emailVerified: true
            });
            uid = userRecord.uid;
            console.log(`✅ Usuario creado en Auth: ${DEMO_USER.email}`);
        } catch (e) {
            if (e.code === 'auth/email-already-exists') {
                console.log('ℹ️  El usuario ya existe en Auth, obteniendo UID...');
                const existingUser = await auth.getUserByEmail(DEMO_USER.email);
                uid = existingUser.uid;

                // Actualizar contraseña por si cambió
                await auth.updateUser(uid, {
                    password: DEMO_USER.password
                });
                console.log('✅ Contraseña actualizada');
            } else {
                throw e;
            }
        }

        // 2. Crear/actualizar documento en Firestore
        await db.collection('users').doc(uid).set({
            email: DEMO_USER.email,
            displayName: DEMO_USER.displayName,
            organizationId: DEMO_USER.organizationId,
            role: 'owner',
            status: 'active',
            modulosHabilitados: null, // Acceso a todos los módulos
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log('✅ Documento de usuario creado en Firestore');

        // 3. Verificar que la organización existe
        const orgDoc = await db.collection('organizations').doc(DEMO_USER.organizationId).get();
        if (orgDoc.exists) {
            console.log(`✅ Organización vinculada: ${orgDoc.data().name}`);
        } else {
            console.log('⚠️  Organización no encontrada. Ejecuta primero: node scripts/seed-data.js');
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ ¡Usuario de demo creado exitosamente!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n📧 Email:     ' + DEMO_USER.email);
        console.log('🔐 Password:  ' + DEMO_USER.password);
        console.log('🏢 Empresa:   Agropecuaria Los Algarrobos');
        console.log('\n👉 Ahora podés iniciar sesión en:');
        console.log('   http://localhost:3000/auth/login');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }

    process.exit(0);
}

createDemoUser();

