/**
 * API Route: Enviar notificaciones de alertas
 * POST /api/alerts/send
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminMessaging } from '@/lib/firebase-admin';
import type { NotificationType } from '@/types/notifications';

interface AlertData {
    titulo: string;
    descripcion: string;
    tipo: string;
    severidad: string;
    accionSugerida?: string;
}

interface SendAlertRequest {
    alertId: string;
    canal: 'push' | 'email' | 'sms' | 'whatsapp';
    alerta: AlertData;
    targetUserId?: string;
    destino: {
        email?: string;
        telefono?: string;
    };
}

function normalizePhoneNumber(phone: string): string {
    return phone.replace(/\s+/g, '').trim();
}

function toWhatsAppAddress(phone: string): string {
    const normalized = normalizePhoneNumber(phone);
    return normalized.startsWith('whatsapp:') ? normalized : `whatsapp:${normalized}`;
}

async function sendTwilioMessage(to: string, from: string, body: string) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
        throw new Error('TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN are not configured');
    }

    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const formBody = new URLSearchParams({
        To: to,
        From: from,
        Body: body,
    });

    const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
            method: 'POST',
            headers: {
                Authorization: `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formBody.toString(),
        }
    );

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Twilio error: ${response.status} - ${errorBody}`);
    }

    return { sent: 1, failed: 0 };
}

async function sendSmsAlert(alerta: AlertData, telefono: string) {
    const fromPhone = process.env.TWILIO_SMS_FROM;
    if (!fromPhone) {
        throw new Error('TWILIO_SMS_FROM is not configured');
    }

    const toPhone = normalizePhoneNumber(telefono);
    const body = `[SIG-Agro] ${alerta.titulo}: ${alerta.descripcion}`;
    const result = await sendTwilioMessage(toPhone, normalizePhoneNumber(fromPhone), body);

    return {
        ...result,
        message: `SMS sent to ${toPhone}`,
    };
}

async function sendWhatsAppAlert(alerta: AlertData, telefono: string) {
    const fromWhatsApp = process.env.TWILIO_WHATSAPP_FROM;
    if (!fromWhatsApp) {
        throw new Error('TWILIO_WHATSAPP_FROM is not configured');
    }

    const toWhatsApp = toWhatsAppAddress(telefono);
    const fromAddress = toWhatsAppAddress(fromWhatsApp);
    const body = `[SIG-Agro] ${alerta.titulo}\n${alerta.descripcion}`;
    const result = await sendTwilioMessage(toWhatsApp, fromAddress, body);

    return {
        ...result,
        message: `WhatsApp sent to ${toWhatsApp}`,
    };
}

function mapAlertTypeToNotificationType(tipo: string): NotificationType {
    const normalized = (tipo || '').toLowerCase();

    if (normalized.includes('clima') || normalized.includes('helada') || normalized.includes('granizo')) {
        return 'alerta_clima';
    }
    if (normalized.includes('plaga')) {
        return 'alerta_plaga';
    }
    if (normalized.includes('scouting')) {
        return 'scouting_urgente';
    }

    return 'sistema';
}

async function sendPushAlert(alertId: string, alerta: AlertData, targetUserId: string) {
    const tokensSnapshot = await adminDb
        .collection('fcm_tokens')
        .where('userId', '==', targetUserId)
        .get();

    if (tokensSnapshot.empty) {
        return { sent: 0, failed: 0, message: 'No FCM tokens found for user' };
    }

    const tokenDocs = tokensSnapshot.docs.map(doc => ({
        id: doc.id,
        token: doc.data().token as string,
    }));

    const response = await adminMessaging.sendEachForMulticast({
        tokens: tokenDocs.map(t => t.token),
        notification: {
            title: alerta.titulo,
            body: alerta.descripcion,
        },
        data: {
            type: mapAlertTypeToNotificationType(alerta.tipo),
            alertId,
            severidad: alerta.severidad,
            clickAction: '/dashboard',
        },
    });

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

    return {
        sent: response.successCount,
        failed: response.failureCount,
        message: 'Push notification processed',
    };
}

async function sendEmailAlert(alerta: AlertData, email: string) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.ALERTS_EMAIL_FROM || 'SIG Agro <alerts@sig-agro.local>';

    if (!apiKey) {
        throw new Error('RESEND_API_KEY is not configured');
    }

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from,
            to: [email],
            subject: `[SIG-Agro] ${alerta.titulo}`,
            html: generarEmailHTML(alerta),
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Email provider error: ${response.status} - ${errorBody}`);
    }

    return { sent: 1, failed: 0, message: `Email sent to ${email}` };
}

export async function POST(request: NextRequest) {
    try {
        const body: SendAlertRequest = await request.json();
        const { alertId, canal, alerta, destino, targetUserId } = body;

        if (!alertId || !canal || !alerta) {
            return NextResponse.json(
                { error: 'Faltan campos requeridos: alertId, canal, alerta' },
                { status: 400 }
            );
        }

        switch (canal) {
            case 'push': {
                if (!targetUserId) {
                    return NextResponse.json(
                        { error: 'targetUserId es requerido para canal push' },
                        { status: 400 }
                    );
                }

                const result = await sendPushAlert(alertId, alerta, targetUserId);
                return NextResponse.json({
                    success: result.failed === 0,
                    alertId,
                    canal,
                    ...result,
                });
            }

            case 'email': {
                if (!destino.email) {
                    return NextResponse.json(
                        { error: 'Email destino requerido para canal email' },
                        { status: 400 }
                    );
                }

                try {
                    const result = await sendEmailAlert(alerta, destino.email);
                    return NextResponse.json({
                        success: true,
                        alertId,
                        canal,
                        ...result,
                    });
                } catch (emailError) {
                    console.error('Error sending email alert:', emailError);
                    return NextResponse.json(
                        { error: 'No se pudo enviar el email de alerta' },
                        { status: 503 }
                    );
                }
            }

            case 'sms': {
                if (!destino.telefono) {
                    return NextResponse.json(
                        { error: 'Telefono destino requerido para canal SMS' },
                        { status: 400 }
                    );
                }

                try {
                    const result = await sendSmsAlert(alerta, destino.telefono);
                    return NextResponse.json({
                        success: true,
                        alertId,
                        canal,
                        ...result,
                    });
                } catch (smsError) {
                    console.error('Error sending SMS alert:', smsError);
                    return NextResponse.json(
                        { error: 'No se pudo enviar el SMS de alerta' },
                        { status: 503 }
                    );
                }
            }

            case 'whatsapp': {
                if (!destino.telefono) {
                    return NextResponse.json(
                        { error: 'Telefono destino requerido para canal WhatsApp' },
                        { status: 400 }
                    );
                }

                try {
                    const result = await sendWhatsAppAlert(alerta, destino.telefono);
                    return NextResponse.json({
                        success: true,
                        alertId,
                        canal,
                        ...result,
                    });
                } catch (whatsappError) {
                    console.error('Error sending WhatsApp alert:', whatsappError);
                    return NextResponse.json(
                        { error: 'No se pudo enviar el mensaje de WhatsApp' },
                        { status: 503 }
                    );
                }
            }

            default:
                return NextResponse.json(
                    { error: `Canal no soportado: ${canal}` },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Error en /api/alerts/send:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

function generarEmailHTML(alerta: AlertData): string {
    const colorSeveridad = {
        critical: '#DC2626',
        warning: '#F59E0B',
        info: '#3B82F6'
    }[alerta.severidad] || '#6B7280';

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${colorSeveridad}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .tipo { display: inline-block; background: #e5e7eb; padding: 4px 12px; border-radius: 12px; font-size: 12px; }
            .action { margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px; }
            .footer { margin-top: 20px; font-size: 12px; color: #6b7280; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0;">Alerta: ${alerta.titulo}</h1>
            </div>
            <div class="content">
                <p><span class="tipo">${alerta.tipo.toUpperCase()}</span></p>
                <p>${alerta.descripcion}</p>
                ${alerta.accionSugerida ? `
                <div class="action">
                    <strong>Accion sugerida:</strong><br>
                    ${alerta.accionSugerida}
                </div>
                ` : ''}
                <div class="footer">
                    <p>Este es un mensaje automatico de SIG-Agro.</p>
                    <p>Ingresa a la plataforma para mas detalles.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
}
