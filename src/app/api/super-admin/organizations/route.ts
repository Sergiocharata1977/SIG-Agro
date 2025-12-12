import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/config';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';

// NOTA: En un entorno de producción ideal, usaríamos firebase-admin en el servidor API 
// para bypass de reglas de seguridad, pero para mantener consistencia con el cliente web
// y dado que 'isSuperAdmin' se verificará con reglas o middleware, usamos SDK cliente aquí
// SIMULANDO admin access o asumiendo reglas permisivas para el rol super_admin.

// Para una implementación robusta de Super Admin API, lo correcto es usar firebase-admin
import { getAdminFirestore } from '@/lib/firebase/admin-server'; // Necesitamos crear esto o usar admin directo si Next lo permite

/**
 * GET /api/super-admin/organizations
 */
export async function GET(req: NextRequest) {
    try {
        // TODO: Verificar auth header o cookie y rol super_admin

        const adminDb = getAdminFirestore();
        const snapshot = await adminDb.collection('organizations').get();

        const organizations = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({ organizations });
    } catch (error) {
        console.error('Error GET organizations:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

/**
 * POST /api/super-admin/organizations
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, plan, features } = body;

        if (!name) {
            return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
        }

        const adminDb = getAdminFirestore();

        // Crear ID (slug)
        const orgId = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString().slice(-4);

        const newOrg = {
            id: orgId,
            name,
            plan: plan || 'free',
            features: {
                // Defaults
                mapa_gis: true,
                campanias: true,
                ...features
            },
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Crear en firestore
        await adminDb.collection('organizations').doc(orgId).set(newOrg);

        return NextResponse.json({ organization: newOrg }, { status: 201 });
    } catch (error) {
        console.error('Error POST organization:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
