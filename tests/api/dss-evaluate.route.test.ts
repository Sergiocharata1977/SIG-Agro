import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockEvaluate } = vi.hoisted(() => ({
  mockEvaluate: vi.fn(),
}));

vi.mock('@/services/dss/AgronomicDssEngine', () => ({
  evaluateAgronomicDss: mockEvaluate,
}));

import { POST } from '@/app/api/agro/dss/evaluate/route';

describe('POST /api/agro/dss/evaluate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna 400 si faltan campos requeridos', async () => {
    const request = new Request('http://localhost/api/agro/dss/evaluate', {
      method: 'POST',
      body: JSON.stringify({ organizationId: 'org-1' }),
    });

    const response = await POST(request as never);
    expect(response.status).toBe(400);
  });

  it('retorna evaluacion de DSS', async () => {
    mockEvaluate.mockReturnValue({
      rulesetVersion: '1.0.0',
      alerts: [],
      executionLog: [],
      totalEvaluationMs: 10,
      errors: [],
      sla: { maxRules: 100, maxTotalEvaluationMs: 250, maxRuleEvaluationMs: 25 },
    });

    const request = new Request('http://localhost/api/agro/dss/evaluate', {
      method: 'POST',
      body: JSON.stringify({ organizationId: 'org-1', metrics: { ndvi: 0.5 } }),
    });

    const response = await POST(request as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.rulesetVersion).toBe('1.0.0');
  });
});
