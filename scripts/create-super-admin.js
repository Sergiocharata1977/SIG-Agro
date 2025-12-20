/**
 * Script para crear usuario Super Admin
 * Ejecutar con: node scripts/create-super-admin.js
 */

const { cert, getApps, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const fs = require('fs');
const path = require('path');

// Configuración del Super Admin
const SUPER_ADMIN_EMAIL = 'sergio@empresa.com';
const SUPER_ADMIN_PASSWORD = 'Sergio123';

async function createSuperAdmin() {
    console.log('🚀 Iniciando creación de Super Admin...\n');

    // Inicializar Firebase Admin si no está inicializado
    if (getApps().length === 0) {
        const serviceAccountPath = path.resolve(process.cwd(), 'service-account.json');

        if (!fs.existsSync(serviceAccountPath)) {
            console.error('❌ No se encontró service-account.json en la raíz del proyecto');
            process.exit(1);
        }

        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

        initializeApp({
            credential: cert(serviceAccount),
        });

        console.log(`📦 Firebase Admin inicializado para proyecto: ${serviceAccount.project_id}`);
    }

    const auth = getAuth();

    try {
        // Intentar obtener usuario existente
        let user;
        try {
            user = await auth.getUserByEmail(SUPER_ADMIN_EMAIL);
            console.log(`✅ Usuario existente encontrado: ${user.uid}`);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                // Crear usuario si no existe
                user = await auth.createUser({
                    email: SUPER_ADMIN_EMAIL,
                    password: SUPER_ADMIN_PASSWORD,
                    displayName: 'Super Admin',
                    emailVerified: true,
                });
                console.log(`✅ Usuario creado: ${user.uid}`);
            } else {
                throw error;
            }
        }

        // Asignar custom claims de Super Admin
        await auth.setCustomUserClaims(user.uid, {
            superAdmin: true,
            role: 'super_admin'
        });

        console.log(`✅ Claims de Super Admin asignados a ${SUPER_ADMIN_EMAIL}`);
        console.log('\n🎉 ¡Super Admin configurado exitosamente!');
        console.log(`   Email: ${SUPER_ADMIN_EMAIL}`);
        console.log(`   UID: ${user.uid}`);
        console.log(`   Claims: { superAdmin: true, role: 'super_admin' }`);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }

    process.exit(0);
}

createSuperAdmin();
