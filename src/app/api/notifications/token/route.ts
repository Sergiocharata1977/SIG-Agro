import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// POST /api/notifications/token
// Guardar token FCM de un dispositivo
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { token, userId, platform, deviceId } = body;

        if (!token || !userId || !deviceId) {
            return NextResponse.json(
                { error: 'Missing required fields: token, userId, deviceId' },
                { status: 400 }
            );
        }

        // Buscar si ya existe un token para este dispositivo
        const existingToken = await adminDb
            .collection('fcm_tokens')
            .where('deviceId', '==', deviceId)
            .limit(1)
            .get();

        if (!existingToken.empty) {
            // Actualizar token existente
            await existingToken.docs[0].ref.update({
                token,
                userId,
                platform: platform || 'web',
                lastUsedAt: new Date(),
            });
        } else {
            // Crear nuevo registro
            await adminDb.collection('fcm_tokens').add({
                token,
                userId,
                deviceId,
                platform: platform || 'web',
                createdAt: new Date(),
                lastUsedAt: new Date(),
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Token saved successfully',
        });

    } catch (error) {
        console.error('Error saving FCM token:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/notifications/token
// Eliminar token FCM (cuando el usuario cierra sesión)
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const deviceId = searchParams.get('deviceId');

        if (!deviceId) {
            return NextResponse.json(
                { error: 'Missing deviceId parameter' },
                { status: 400 }
            );
        }

        const tokenDocs = await adminDb
            .collection('fcm_tokens')
            .where('deviceId', '==', deviceId)
            .get();

        const batch = adminDb.batch();
        tokenDocs.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        return NextResponse.json({
            success: true,
            message: `Deleted ${tokenDocs.size} token(s)`,
        });

    } catch (error) {
        console.error('Error deleting FCM token:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
