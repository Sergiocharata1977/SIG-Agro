import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminMessaging } from '@/lib/firebase-admin';
import type { NotificationType, NotificationPayload } from '@/types/notifications';

// POST /api/notifications/send
// Enviar notificacion push a un usuario
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
                { error: 'No FCM tokens found for user', sent: 0, failed: 0 },
                { status: 200 }
            );
        }

        const tokenDocs = tokensSnapshot.docs.map(doc => ({
            id: doc.id,
            token: doc.data().token as string,
        }));
        const tokens = tokenDocs.map(t => t.token);

        // Verificar preferencias del usuario
        const preferencesDoc = await adminDb
            .collection('notification_preferences')
            .doc(targetUserId)
            .get();

        const preferences = preferencesDoc.data();

        // Verificar si el tipo esta habilitado
        if (preferences && !preferences.types?.[type]) {
            return NextResponse.json(
                { message: 'Notification type disabled by user', sent: 0, failed: 0 },
                { status: 200 }
            );
        }

        // Verificar quiet hours (soporta ventana cruzando medianoche)
        if (preferences?.quietHours?.enabled) {
            const now = new Date();
            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            const { start, end } = preferences.quietHours;

            const inQuietHours = start <= end
                ? (currentTime >= start && currentTime <= end)
                : (currentTime >= start || currentTime <= end);

            if (inQuietHours) {
                return NextResponse.json(
                    { message: 'User is in quiet hours', sent: 0, failed: 0 },
                    { status: 200 }
                );
            }
        }

        const message = {
            notification: {
                title: payload.title,
                body: payload.body,
                icon: payload.icon || '/logo-sig-agro.png',
            },
            data: {
                type,
                ...(payload.data || {}),
                clickAction: '/dashboard',
            },
            tokens,
        };

        const response = await adminMessaging.sendEachForMulticast(message);

        // Limpiar tokens invalidos/no registrados
        const invalidTokenIndexes: number[] = [];
        response.responses.forEach((sendResponse, index) => {
            if (!sendResponse.success) {
                const code = sendResponse.error?.code || '';
                if (
                    code === 'messaging/invalid-registration-token' ||
                    code === 'messaging/registration-token-not-registered'
                ) {
                    invalidTokenIndexes.push(index);
                }
            }
        });

        if (invalidTokenIndexes.length > 0) {
            const batch = adminDb.batch();
            invalidTokenIndexes.forEach(index => {
                const docId = tokenDocs[index]?.id;
                if (docId) {
                    batch.delete(adminDb.collection('fcm_tokens').doc(docId));
                }
            });
            await batch.commit();
        }

        // Guardar registro de notificacion
        await adminDb.collection('notifications').add({
            userId: targetUserId,
            type,
            payload,
            createdAt: new Date(),
            sentAt: new Date(),
            sentCount: response.successCount,
            failedCount: response.failureCount,
            read: false,
        });

        return NextResponse.json({
            success: true,
            sent: response.successCount,
            failed: response.failureCount,
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
