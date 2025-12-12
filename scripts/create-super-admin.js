/**
 * Script para crear Super Admin en SIG Agro
 * Ejecutar: node scripts/create-super-admin.js
 * Requiere: service-account.json en la raíz del proyecto
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

// Inicializar Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();
const db = admin.firestore();

async function createSuperAdmin() {
    console.log('🚀 Creando Super Admin para SIG Agro...\n');

    try {
        const email = 'superadmin@doncandido.agro';
        const password = 'SuperAdmin2024!';
        const displayName = 'Super Admin';

        // 1. Crear usuario en Authentication
        let uid;
        try {
            const userRecord = await auth.createUser({
                email,
                password,
                emailVerified: true,
                displayName,
            });
            uid = userRecord.uid;
            console.log('✅ Usuario creado en Authentication');
        } catch (e) {
            if (e.code === 'auth/email-already-exists') {
                console.log('ℹ️  El usuario ya existe en Auth, actualizando rol en Firestore...');
                const user = await auth.getUserByEmail(email);
                uid = user.uid;
            } else {
                throw e;
            }
        }

        console.log('   UID:', uid);

        // 2. Crear documento en Firestore (users collection)
        await db.collection('users').doc(uid).set({
            email,
            displayName,
            role: 'super_admin', // ← Rol Clave
            status: 'active',
            organizationId: null, // No pertenece a una org
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        console.log('✅ Documento creado/actualizado en Firestore\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📧 Email:    ${email}`);
        console.log(`🔑 Password: ${password}`);
        console.log('👤 Rol:      super_admin');
        console.log('🛡️  Acceso:   Panel Super Admin');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('✅ ¡Super Admin listo!');
        console.log('   Ingresa en: http://localhost:3000/auth/login');
        console.log('   Panel: http://localhost:3000/super-admin/organizaciones\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

createSuperAdmin();
