/**
 * API Route: Enviar notificaciones de alertas
 * POST /api/alerts/send
 * 
 * Envía notificaciones push y/o email para alertas
 */

import { NextRequest, NextResponse } from 'next/server';

// Tipos para la request
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
    destino: {
        email?: string;
        telefono?: string;
    };
}

export async function POST(request: NextRequest) {
    try {
        const body: SendAlertRequest = await request.json();
        const { alertId, canal, alerta, destino } = body;

        // Validación básica
        if (!alertId || !canal || !alerta) {
            return NextResponse.json(
                { error: 'Faltan campos requeridos: alertId, canal, alerta' },
                { status: 400 }
            );
        }

        // Procesar según el canal
        switch (canal) {
            case 'push':
                // Firebase Cloud Messaging (FCM)
                // TODO: Implementar cuando se configure FCM
                console.log(`[PUSH] Enviando notificación para alerta ${alertId}`);
                console.log(`  Título: ${alerta.titulo}`);
                console.log(`  Tipo: ${alerta.tipo} | Severidad: ${alerta.severidad}`);

                // Por ahora retornamos éxito simulado
                return NextResponse.json({
                    success: true,
                    message: 'Notificación push enviada (simulado)',
                    alertId,
                    canal
                });

            case 'email':
                // Email con Resend, SendGrid, o nodemailer
                if (!destino.email) {
                    return NextResponse.json(
                        { error: 'Email destino requerido para canal email' },
                        { status: 400 }
                    );
                }

                console.log(`[EMAIL] Enviando a ${destino.email}`);
                console.log(`  Asunto: [SIG-Agro] ${alerta.titulo}`);
                console.log(`  Cuerpo: ${alerta.descripcion}`);

                // TODO: Implementar con servicio de email real
                // Ejemplo con Resend:
                // await resend.emails.send({
                //     from: 'alertas@sig-agro.com',
                //     to: destino.email,
                //     subject: `[SIG-Agro Alerta] ${alerta.titulo}`,
                //     html: generarEmailHTML(alerta)
                // });

                return NextResponse.json({
                    success: true,
                    message: `Email enviado a ${destino.email} (simulado)`,
                    alertId,
                    canal
                });

            case 'sms':
                // SMS con Twilio u otro proveedor
                if (!destino.telefono) {
                    return NextResponse.json(
                        { error: 'Teléfono destino requerido para canal SMS' },
                        { status: 400 }
                    );
                }

                console.log(`[SMS] Enviando a ${destino.telefono}`);
                console.log(`  Mensaje: ${alerta.titulo} - ${alerta.severidad}`);

                return NextResponse.json({
                    success: true,
                    message: `SMS enviado a ${destino.telefono} (simulado)`,
                    alertId,
                    canal
                });

            case 'whatsapp':
                // WhatsApp Business API
                if (!destino.telefono) {
                    return NextResponse.json(
                        { error: 'Teléfono destino requerido para WhatsApp' },
                        { status: 400 }
                    );
                }

                console.log(`[WHATSAPP] Enviando a ${destino.telefono}`);

                return NextResponse.json({
                    success: true,
                    message: `WhatsApp enviado a ${destino.telefono} (simulado)`,
                    alertId,
                    canal
                });

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

// Helper para generar HTML del email
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
                <h1 style="margin: 0;">⚠️ ${alerta.titulo}</h1>
            </div>
            <div class="content">
                <p><span class="tipo">${alerta.tipo.toUpperCase()}</span></p>
                <p>${alerta.descripcion}</p>
                ${alerta.accionSugerida ? `
                <div class="action">
                    <strong>📋 Acción sugerida:</strong><br>
                    ${alerta.accionSugerida}
                </div>
                ` : ''}
                <div class="footer">
                    <p>Este es un mensaje automático de SIG-Agro.</p>
                    <p>Ingresa a la plataforma para más detalles.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
}
