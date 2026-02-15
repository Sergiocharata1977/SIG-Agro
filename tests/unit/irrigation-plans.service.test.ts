import { describe, expect, it } from 'vitest';
import type { IrrigationPlan } from '@/types/domain-model';
import { calcularResumenRiego, generarAlertasRiego } from '@/services/irrigation-plans';

function plan(overrides: Partial<IrrigationPlan> = {}): IrrigationPlan {
  return {
    id: 'p1',
    organizationId: 'org-1',
    campaignId: '2025-2026',
    fieldId: 'f1',
    plotId: 'l1',
    planDate: new Date('2026-02-10T00:00:00Z'),
    targetMm: 20,
    appliedMm: 18,
    executionStatus: 'completed',
    method: 'pivot',
    deviationMm: -2,
    status: 'active',
    createdAt: new Date('2026-02-01T00:00:00Z'),
    updatedAt: new Date('2026-02-01T00:00:00Z'),
    createdBy: 'u1',
    ...overrides,
  };
}

describe('irrigation-plans summary and alerts', () => {
  it('calcula resumen de planes y eficiencia', () => {
    const plans = [plan(), plan({ id: 'p2', targetMm: 30, appliedMm: 27 })];
    const summary = calcularResumenRiego(plans, new Date('2026-02-15T00:00:00Z'));

    expect(summary.totalPlans).toBe(2);
    expect(summary.totalTargetMm).toBe(50);
    expect(summary.totalAppliedMm).toBe(45);
    expect(summary.efficiencyPercent).toBe(90);
    expect(summary.overduePlans).toBe(0);
  });

  it('genera alertas por fuera de ventana y eficiencia baja', () => {
    const plans = [
      plan({
        id: 'p3',
        executionStatus: 'planned',
        appliedMm: undefined,
        planDate: new Date('2026-01-01T00:00:00Z'),
      }),
      plan({ id: 'p4', targetMm: 30, appliedMm: 10 }),
    ];

    const alerts = generarAlertasRiego(plans, new Date('2026-02-15T00:00:00Z'));

    expect(alerts.some((a) => a.includes('fuera de ventana'))).toBe(true);
    expect(alerts.some((a) => a.includes('Eficiencia'))).toBe(true);
  });
});
