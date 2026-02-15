import { describe, expect, it } from 'vitest';
import { exportTratamientosCsv } from '@/services/treatments';
import type { TreatmentApplication } from '@/types/domain-model';

function sampleTreatment(overrides: Partial<TreatmentApplication> = {}): TreatmentApplication {
  return {
    id: 't-1',
    organizationId: 'org-1',
    campaignId: '2025-2026',
    fieldId: 'field-1',
    plotId: 'plot-1',
    mode: 'manual',
    issueType: 'maleza',
    productName: 'Herbicida "Demo"',
    dosagePerHa: 2.5,
    dosageUnit: 'l_ha',
    appliedAreaHa: 10,
    applicationDate: new Date('2026-02-15T10:00:00.000Z'),
    operatorIds: ['u1'],
    createdAt: new Date('2026-02-15T10:00:00.000Z'),
    updatedAt: new Date('2026-02-15T10:00:00.000Z'),
    createdBy: 'u1',
    status: 'active',
    ...overrides,
  };
}

describe('exportTratamientosCsv', () => {
  it('genera header y fila csv', () => {
    const csv = exportTratamientosCsv([sampleTreatment()]);
    const lines = csv.split('\n');

    expect(lines.length).toBe(2);
    expect(lines[0]).toContain('"id"');
    expect(lines[1]).toContain('"t-1"');
    expect(lines[1]).toContain('"2026-02-15T10:00:00.000Z"');
  });

  it('escapa comillas en valores', () => {
    const csv = exportTratamientosCsv([sampleTreatment()]);
    expect(csv).toContain('"Herbicida ""Demo"""');
  });
});
