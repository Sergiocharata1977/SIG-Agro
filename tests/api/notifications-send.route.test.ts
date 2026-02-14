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

import { POST } from '@/app/api/notifications/send/route';

function createCollectionMock() {
    const notificationsAdd = vi.fn().mockResolvedValue({ id: 'n1' });
    const tokensGet = vi.fn().mockResolvedValue({
        empty: false,
        docs: [
            {
                id: 'tok1',
                data: () => ({ token: 'token-1' }),
            },
        ],
    });
    const preferencesGet = vi.fn().mockResolvedValue({
        data: () => ({
            types: { sistema: true },
            quietHours: { enabled: false, start: '23:00', end: '06:00' },
        }),
    });

    mockAdminDb.collection.mockImplementation((name: string) => {
        if (name === 'fcm_tokens') {
            return {
                where: vi.fn().mockReturnValue({ get: tokensGet }),
                doc: vi.fn((id: string) => ({ id })),
            };
        }
        if (name === 'notification_preferences') {
            return {
                doc: vi.fn().mockReturnValue({ get: preferencesGet }),
            };
        }
        if (name === 'notifications') {
            return { add: notificationsAdd };
        }
        return {};
    });

    mockAdminDb.batch.mockReturnValue({
        delete: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
    });

    return { notificationsAdd, tokensGet, preferencesGet };
}

describe('POST /api/notifications/send', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns 400 when required fields are missing', async () => {
        const request = new Request('http://localhost/api/notifications/send', {
            method: 'POST',
            body: JSON.stringify({ targetUserId: 'u1' }),
        });

        const response = await POST(request as never);
        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toEqual({
            error: 'Missing required fields: targetUserId, type, payload',
        });
    });

    it('sends notification and returns counts', async () => {
        const { notificationsAdd } = createCollectionMock();

        mockAdminMessaging.sendEachForMulticast.mockResolvedValue({
            successCount: 1,
            failureCount: 0,
            responses: [{ success: true }],
        });

        const request = new Request('http://localhost/api/notifications/send', {
            method: 'POST',
            body: JSON.stringify({
                targetUserId: 'u1',
                type: 'sistema',
                payload: {
                    title: 'Aviso',
                    body: 'Mensaje',
                },
            }),
        });

        const response = await POST(request as never);
        const payload = await response.json();

        expect(response.status).toBe(200);
        expect(payload.success).toBe(true);
        expect(payload.sent).toBe(1);
        expect(payload.failed).toBe(0);
        expect(mockAdminMessaging.sendEachForMulticast).toHaveBeenCalledTimes(1);
        expect(notificationsAdd).toHaveBeenCalledTimes(1);
    });
});
