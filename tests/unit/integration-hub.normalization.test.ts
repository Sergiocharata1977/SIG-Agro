import { describe, expect, it } from 'vitest';
import { normalizeIoTSensorPayload } from '@/services/integration-hub';

describe('normalizeIoTSensorPayload', () => {
  it('normaliza metricas conocidas', () => {
    const normalized = normalizeIoTSensorPayload({
      organizationId: 'org-1',
      externalEventId: 'evt-1',
      provider: 'provider-x',
      sourceDeviceId: 'dev-01',
      metric: 'SOIL_MOISTURE',
      value: 28.2,
      unit: '%',
      measuredAt: '2026-02-15T10:00:00.000Z',
    });

    expect(normalized.metric).toBe('soil_moisture');
    expect(normalized.value).toBe(28.2);
    expect(normalized.quality).toBe('good');
  });

  it('fallback a other para metrica desconocida', () => {
    const normalized = normalizeIoTSensorPayload({
      organizationId: 'org-1',
      externalEventId: 'evt-2',
      provider: 'provider-x',
      sourceDeviceId: 'dev-01',
      metric: 'custom_metric',
      value: 1,
      unit: 'u',
      measuredAt: '2026-02-15T10:00:00.000Z',
    });

    expect(normalized.metric).toBe('other');
  });
});
