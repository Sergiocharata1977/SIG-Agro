import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockAdminDb, mockAdminMessaging } = vi.hoisted(() => ({
    mockAdminDb: {
        collection: vi.fn(),
        batch: vi.fn(),
    },
    mockAdminMessaging: {
        sendEachForMulticast: vi.fn(),
    },
}));

vi.mock('@/lib/firebase-admin', () => ({
    adminDb: mockAdminDb,
    adminMessaging: mockAdminMessaging,
}));

import { POST } from '@/app/api/alerts/send/route';

describe('POST /api/alerts/send', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        delete process.env.TWILIO_ACCOUNT_SID;
        delete process.env.TWILIO_AUTH_TOKEN;
        delete process.env.TWILIO_SMS_FROM;
        delete process.env.TWILIO_WHATSAPP_FROM;
        delete process.env.RESEND_API_KEY;
    });

    it('returns 400 when push is requested without targetUserId', async () => {
        const request = new Request('http://localhost/api/alerts/send', {
            method: 'POST',
            body: JSON.stringify({
                alertId: 'a1',
                canal: 'push',
                alerta: {
                    titulo: 'Alerta',
                    descripcion: 'Desc',
                    tipo: 'clima',
                    severidad: 'warning',
                },
                destino: {},
            }),
        });

        const response = await POST(request as never);
        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toEqual({
            error: 'targetUserId es requerido para canal push',
        });
    });

    it('sends SMS through Twilio when config is present', async () => {
        process.env.TWILIO_ACCOUNT_SID = 'AC123';
        process.env.TWILIO_AUTH_TOKEN = 'token123';
        process.env.TWILIO_SMS_FROM = '+5491111111111';

        const fetchMock = vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ sid: 'SM123' }), { status: 201 })
        );
        vi.stubGlobal('fetch', fetchMock);

        const request = new Request('http://localhost/api/alerts/send', {
            method: 'POST',
            body: JSON.stringify({
                alertId: 'a2',
                canal: 'sms',
                alerta: {
                    titulo: 'Helada',
                    descripcion: 'Temperatura bajo cero',
                    tipo: 'clima',
                    severidad: 'critical',
                },
                destino: { telefono: '+5492222222222' },
            }),
        });

        const response = await POST(request as never);
        const payload = await response.json();

        expect(response.status).toBe(200);
        expect(payload.success).toBe(true);
        expect(payload.canal).toBe('sms');
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0]?.[0]).toContain('https://api.twilio.com/2010-04-01/Accounts/AC123/Messages.json');
        expect(String(fetchMock.mock.calls[0]?.[1]?.body)).toContain('To=%2B5492222222222');
    });
});
