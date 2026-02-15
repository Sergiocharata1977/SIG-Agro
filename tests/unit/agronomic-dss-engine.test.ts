import { describe, expect, it } from 'vitest';
import { AgronomicDssEngine } from '@/services/dss/AgronomicDssEngine';

const baseInput = {
  organizationId: 'org-1',
  campaignId: '2025-2026',
  fieldId: 'field-1',
  plotId: 'plot-1',
  metrics: {
    soil_moisture: 18,
    ndvi: 0.4,
    air_temperature: 38,
    humidity: 24,
    rain_forecast_mm: 10,
    pest_index: 30,
    disease_risk: 20,
    wind_speed: 10,
    soil_temperature: 15,
    pressure: 1000,
    rain_7d_mm: 6,
  },
};

describe('AgronomicDssEngine', () => {
  it('dispara alertas cuando reglas matchean', () => {
    const engine = new AgronomicDssEngine();
    const result = engine.evaluate(baseInput);

    expect(result.rulesetVersion).toBe('1.0.0');
    expect(result.alerts.length).toBeGreaterThan(0);
    expect(result.executionLog.length).toBeGreaterThan(0);
    expect(result.alerts.some((a) => a.ruleId === 'R001_SOIL_MOISTURE_LOW')).toBe(true);
  });

  it('no genera error de ruleset invalido en configuracion por defecto', () => {
    const engine = new AgronomicDssEngine();
    const result = engine.evaluate(baseInput);
    expect(result.errors.includes('RULESET_INVALID')).toBe(false);
  });

  it('respeta limite de reglas SLA', () => {
    const engine = new AgronomicDssEngine(undefined, { maxRules: 1 });
    const result = engine.evaluate(baseInput);
    expect(result.errors.includes('SLA_RULE_LIMIT_EXCEEDED')).toBe(true);
  });

  it('expone explicabilidad en alertas', () => {
    const engine = new AgronomicDssEngine();
    const result = engine.evaluate(baseInput);
    const first = result.alerts[0];
    expect(first).toHaveProperty('recommendation');
    expect(first).toHaveProperty('explanation');
    expect(typeof first.confidence).toBe('number');
  });
});
