import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockIoTIngest } = vi.hoisted(() => ({
  mockIoTIngest: vi.fn(),
}));

vi.mock('@/services/integration-hub', () => ({
  ingestarTelemetriaIoT: mockIoTIngest,
}));

import { POST } from '@/app/api/integrations/iot/ingest/route';

describe('POST /api/integrations/iot/ingest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna 400 si faltan requeridos', async () => {
    const request = new Request('http://localhost/api/integrations/iot/ingest', {
      method: 'POST',
      body: JSON.stringify({ organizationId: 'org-1' }),
    });

    const response = await POST(request as never);
    expect(response.status).toBe(400);
  });

  it('retorna resultado del ingest', async () => {
    mockIoTIngest.mockResolvedValue({ success: true, id: 'reading-1', duplicate: false });

    const request = new Request('http://localhost/api/integrations/iot/ingest', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'org-1',
        externalEventId: 'evt-1',
        provider: 'sim',
        sourceDeviceId: 'dev-1',
        metric: 'soil_moisture',
        value: 30,
        unit: '%',
        measuredAt: new Date().toISOString(),
      }),
    });

    const response = await POST(request as never);
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
  });
});
