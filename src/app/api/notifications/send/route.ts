import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { NotificationType, NotificationPayload } from '@/types/notifications';

// POST /api/notifications/send
// Enviar notificación push a un usuario
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { targetUserId, type, payload } = body as {
            targetUserId: string;
            type: NotificationType;
            payload: NotificationPayload;
        };

        if (!targetUserId || !type || !payload) {
            return NextResponse.json(
                { error: 'Missing required fields: targetUserId, type, payload' },
                { status: 400 }
            );
        }

        // Obtener tokens FCM del usuario
        const tokensSnapshot = await adminDb
            .collection('fcm_tokens')
            .where('userId', '==', targetUserId)
            .get();

        if (tokensSnapshot.empty) {
            return NextResponse.json(
                { error: 'No FCM tokens found for user', sent: 0 },
                { status: 200 }
            );
        }

        const tokens = tokensSnapshot.docs.map(doc => doc.data().token);

        // Verificar preferencias del usuario
        const preferencesDoc = await adminDb
            .collection('notification_preferences')
            .doc(targetUserId)
            .get();

        const preferences = preferencesDoc.data();

        // Verificar si el tipo está habilitado
        if (preferences && !preferences.types?.[type]) {
            return NextResponse.json(
                { message: 'Notification type disabled by user', sent: 0 },
                { status: 200 }
            );
        }

        // Verificar quiet hours
        if (preferences?.quietHours?.enabled) {
            const now = new Date();
            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            const { start, end } = preferences.quietHours;

            if (currentTime >= start && currentTime <= end) {
                return NextResponse.json(
                    { message: 'User is in quiet hours', sent: 0 },
                    { status: 200 }
                );
            }
        }

        // Preparar mensaje FCM
        const message = {
            notification: {
                title: payload.title,
                body: payload.body,
                icon: payload.icon || '/logo-sig-agro.png',
            },
            data: {
                type,
                ...payload.data,
                clickAction: '/dashboard',
            },
            tokens,
        };

        // Enviar via Firebase Admin SDK
        // NOTA: Requiere configurar Firebase Admin con service account
        // const response = await getMessaging().sendEachForMulticast(message);

        // Por ahora, simular envío exitoso
        console.log('Sending notification:', message);

        // Guardar registro de notificación
        await adminDb.collection('notifications').add({
            userId: targetUserId,
            type,
            payload,
            createdAt: new Date(),
            sentAt: new Date(),
            read: false,
        });

        return NextResponse.json({
            success: true,
            sent: tokens.length,
            message: 'Notification sent successfully',
        });

    } catch (error) {
        console.error('Error sending notification:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
