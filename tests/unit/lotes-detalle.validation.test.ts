import { describe, expect, it } from 'vitest';
import { validarGeometriaLote } from '@/services/lotes-detalle';

describe('validarGeometriaLote', () => {
  it('valida poligono correcto', () => {
    const geo = '{"type":"Polygon","coordinates":[[[-58.9,-27.4],[-58.89,-27.4],[-58.89,-27.41],[-58.9,-27.41],[-58.9,-27.4]]]}';
    const result = validarGeometriaLote(geo);

    expect(result.valid).toBe(true);
    expect(result.areaHa).toBeGreaterThan(0);
  });

  it('rechaza poligono no cerrado', () => {
    const geo = '{"type":"Polygon","coordinates":[[[-58.9,-27.4],[-58.89,-27.4],[-58.89,-27.41],[-58.9,-27.41]]]}';
    const result = validarGeometriaLote(geo);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('cerrado'))).toBe(true);
  });
});
