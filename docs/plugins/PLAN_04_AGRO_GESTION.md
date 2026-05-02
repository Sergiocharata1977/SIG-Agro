# Plan 04 — Plugin: Agro Gestión

**Fecha:** 2026-05-02
**Plugin ID:** `agro_gestion`
**Feature:** Resultado económico completo por campaña y por lote
**Depende de:** PLAN-00 completo

---

## Resumen de olas

| Ola | Agentes | Paralelos entre sí | Dependen de |
|-----|---------|---------------------|-------------|
| 1 | A | único | PLAN-00 completo |
| 2 | A | único | Ola 1 completa |

---

## Ola 1 — Backend: Service de Resultado

### Agente A — Service Resultado por Campaña y Lote

**Puede ejecutarse en paralelo con:** es el único de esta ola
**Depende de:** PLAN-00 completo

#### Objetivo
Crear el servicio que agrega asientos automáticos para calcular resultado económico por campaña y por lote.

#### Archivos a crear
- `src/services/resultado-campana.ts`

#### Prompt completo para el agente

Sos un desarrollador senior en SIG Agro. Stack: Next.js 16 + TypeScript + Firebase/Firestore.

**Leer antes de crear:**
- `src/services/profitability.ts` — cómo se calcula rentabilidad por cultivo actualmente
- `src/types/contabilidad-simple.ts` — AsientoAutomatico, TipoOperacion
- `src/services/contabilidad.ts` — obtenerAsientos

**`src/services/resultado-campana.ts`:**

```typescript
export interface ConceptoResultado {
  categoria: string;
  tipo: 'ingreso' | 'gasto';
  monto: number;
  cantidadOperaciones: number;
}

export interface ResultadoLote {
  loteId: string; loteNombre: string; hectareas?: number;
  totalIngresos: number; totalGastos: number; margenBruto: number;
  costoPorHa?: number; margenPorHa?: number;
  desglose: ConceptoResultado[];
}

export interface ResultadoCampana {
  campaniaId: string; campaniaNombre: string;
  totalIngresos: number; totalGastos: number; margenBruto: number;
  desglose: ConceptoResultado[];
  porLote: ResultadoLote[];
  hectareas?: number; costoPorHectarea?: number; margenPorHectarea?: number;
}

export async function obtenerResultadoCampana(orgId: string, campaniaId: string): Promise<ResultadoCampana>
// Lee asientos_auto filtrados por campaniaId desde organizations/{orgId}/asientos_auto
// Agrupa por tipoOperacion → categoría (compra_insumo→"Insumos", cosecha→"Cosecha", venta→"Ventas granos", etc.)
// Agrupa por loteId para ResultadoLote

export async function obtenerResultadoLote(orgId: string, loteId: string, campaniaId?: string): Promise<ResultadoLote>

export async function obtenerResumenCampanas(orgId: string): Promise<Array<{
  campaniaId: string; campaniaNombre: string; margenBruto: number; hectareas?: number;
}>>
// Obtiene todas las campañas únicas de asientos_auto y calcula margen de cada una
```

Mapeo `tipoOperacion → categoría`:
- `compra_insumo` → "Insumos" (gasto)
- `aplicacion_insumo` → "Insumos aplicados" (gasto)
- `cosecha` → "Cosecha" (neutro, solo registra qty)
- `venta` | `entrega_acopiador` → "Ventas granos" (ingreso)
- `cobro` → "Cobranzas" (ingreso)
- `pago` → "Pagos" (gasto)
- `gasto_general` → "Gastos generales" (gasto)
- Resto → "Otros"

**Criterio de éxito:** `npx tsc --noEmit` sin errores. Funciones exportadas correctamente.

---

## Ola 2 — Frontend: Dashboard Resultado Campaña

### Agente A — UI Resultado por Campaña y Lote

**Puede ejecutarse en paralelo con:** es el único de esta ola
**Depende de:** Ola 1 completa

#### Objetivo
Crear la página `/campanas/resultado` con vista completa de resultado por campaña y desglose por lote.

#### Archivos a crear
- `src/app/(dashboard)/campanas/resultado/page.tsx`

#### Prompt completo para el agente

Sos un desarrollador senior en SIG Agro. Stack: Next.js 16 + React 19 + TypeScript + Tailwind CSS 4.

**Leer antes de crear:**
- `src/contexts/PluginsContext.tsx`, `src/components/plugins/PluginGate.tsx`
- `src/services/resultado-campana.ts` — ResultadoCampana, ResultadoLote, obtenerResumenCampanas, obtenerResultadoCampana
- `src/app/(dashboard)/rentabilidad/page.tsx` — patrón de dashboard agro con KPIs

**PluginGate:** `pluginId="agro_gestion"`.

**Funcionalidad:**

1. **Selector de campaña** (dropdown) — carga con `obtenerResumenCampanas(orgId)`.

2. **5 KPIs** del resultado seleccionado:
   Total ingresos | Total gastos | Margen bruto | Costo/ha (si hay hectáreas) | Margen/ha

3. **Tabla desglose por concepto:**
   | Categoría | Tipo (badge ingreso=verde/gasto=rojo) | Monto | % del total |
   Subtotales: Total gastos / Total ingresos / Margen bruto.

4. **Tabla desglose por lote** (si hay):
   | Lote | Has | Ingresos | Gastos | Margen | $/ha | Badge (positivo/negativo) |

5. **Comparativa interanual** (si hay campaña anterior en `obtenerResumenCampanas`):
   | Concepto | Anterior | Actual | Variación % |

**Criterio de éxito:** `npx tsc --noEmit` sin errores. Dashboard muestra resultado real.

---

## Verificación final Plan 04

- [ ] `obtenerResultadoCampana` agrupa correctamente por tipo de operación
- [ ] `/campanas/resultado` muestra PluginGate cuando plugin inactivo
- [ ] Selector de campaña carga datos reales
- [ ] Desglose por concepto y por lote correcto
- [ ] `npx tsc --noEmit` sin errores
