/**
 * Crear usuario de prueba activo
 * Credenciales: productor@empresa.com / Productor123
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

const USUARIO = {
    email: 'productor@empresa.com',
    password: 'Productor123',
    displayName: 'Juan Productor'
};

async function crearUsuario() {
    console.log('🔧 Creando usuario de prueba...\n');

    try {
        // Verificar si ya existe
        let userRecord;
        try {
            userRecord = await auth.getUserByEmail(USUARIO.email);
            console.log(`📧 Usuario ya existe: ${userRecord.uid}`);
        } catch (e) {
            // No existe, crear
            userRecord = await auth.createUser({
                email: USUARIO.email,
                password: USUARIO.password,
                displayName: USUARIO.displayName,
                emailVerified: true
            });
            console.log(`✅ Usuario creado en Auth: ${userRecord.uid}`);
        }

        // Crear/actualizar en Firestore
        await db.collection('users').doc(userRecord.uid).set({
            email: USUARIO.email,
            displayName: USUARIO.displayName,
            organizationId: ORG_ID,
            role: 'admin',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
        }, { merge: true });

        console.log(`✅ Usuario actualizado en Firestore`);

        // Agregar como member de la organización
        await db.collection(`organizations/${ORG_ID}/members`).doc(userRecord.uid).set({
            role: 'admin',
            email: USUARIO.email,
            displayName: USUARIO.displayName,
            status: 'active',
            joinedAt: new Date()
        }, { merge: true });

        console.log(`✅ Agregado como miembro de la organización`);

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Usuario listo para usar:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`   📧 Email: ${USUARIO.email}`);
        console.log(`   🔑 Password: ${USUARIO.password}`);
        console.log(`   🏢 Organización: ${ORG_ID}`);
        console.log(`   👤 Rol: admin`);
        console.log(`   ✓ Status: active`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    process.exit(0);
}

crearUsuario();
