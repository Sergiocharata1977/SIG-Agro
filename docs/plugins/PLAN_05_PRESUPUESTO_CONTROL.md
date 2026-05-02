# Plan 05 — Plugin: Presupuesto & Control

**Fecha:** 2026-05-02
**Plugin ID:** `presupuesto_control`
**Feature:** Centros de costo + Presupuesto vs Real
**Depende de:** PLAN-00 completo

---

## Resumen de olas

| Ola | Agentes | Paralelos entre sí | Dependen de |
|-----|---------|---------------------|-------------|
| 1 | A, B | Sí | PLAN-00 completo |
| 2 | A, B | Sí | Ola 1 completa |

---

## Ola 1 — Backend: Types + Services

### Agente A — Types + Service Centros de Costo

**Puede ejecutarse en paralelo con:** Ola 1 — Agente B
**Depende de:** PLAN-00 completo

#### Archivos a crear
- `src/types/centros-costo.ts`
- `src/services/centros-costo.ts`

#### Prompt completo para el agente

**`src/types/centros-costo.ts`:**
```typescript
export type TipoCentroCosto = 'administracion' | 'ventas' | 'repuestos' | 'servicios_tecnicos' | 'taller' | 'campo' | 'maquinaria' | 'sucursal' | 'campana' | 'lote' | 'cultivo' | 'otro';
export interface CentroCosto {
  id: string; organizationId: string; codigo: string; nombre: string; tipo: TipoCentroCosto;
  descripcion?: string; campaniaId?: string; campoId?: string; loteId?: string;
  padre?: string; activo: boolean; createdAt: Date; updatedAt: Date;
}
export interface MovimientoCentroCosto {
  id: string; organizationId: string; centroCostoId: string; centroCostoNombre: string;
  fecha: Date; concepto: string; tipoMovimiento: 'cargo' | 'abono';
  monto: number; operacionId: string; tipoOperacion: string; asientoId?: string; createdAt: Date;
}
export interface ResumenCentroCosto {
  centroCostoId: string; nombre: string; totalCargos: number; totalAbonos: number;
  saldo: number; cantidadMovimientos: number;
}
```

**`src/services/centros-costo.ts`** — colecciones: `organizations/{orgId}/centros_costo`, `organizations/{orgId}/movimientos_cc`

```typescript
export async function crearCentroCosto(orgId, data): Promise<string>
export async function obtenerCentrosCosto(orgId, soloActivos?: boolean): Promise<CentroCosto[]>
export async function actualizarCentroCosto(orgId, id, data): Promise<void>
export async function registrarMovimientoCentroCosto(orgId, data): Promise<string>
export async function obtenerMovimientosCentroCosto(orgId, ccId, desde?, hasta?): Promise<MovimientoCentroCosto[]>
export async function obtenerResumenesCentrosCosto(orgId): Promise<ResumenCentroCosto[]>
```

**Criterio de éxito:** `npx tsc --noEmit` sin errores.

---

### Agente B — Types + Service Presupuesto vs Real

**Puede ejecutarse en paralelo con:** Ola 1 — Agente A
**Depende de:** PLAN-00 completo

#### Archivos a crear
- `src/types/presupuesto.ts`
- `src/services/presupuesto.ts`

#### Prompt completo para el agente

**`src/types/presupuesto.ts`:**
```typescript
export type CategoriaPresupuesto = 'semillas' | 'fertilizantes' | 'agroquimicos' | 'combustible' | 'labores' | 'fletes' | 'seguros' | 'arrendamientos' | 'cosecha' | 'mano_obra' | 'servicios_tecnicos' | 'repuestos' | 'gastos_admin' | 'gastos_comerciales' | 'financiamiento' | 'otros_gastos' | 'venta_granos' | 'otros_ingresos';
export type TipoPresupuesto = 'gasto' | 'ingreso';
export interface LineaPresupuesto {
  id: string; categoria: CategoriaPresupuesto; descripcion: string; tipo: TipoPresupuesto;
  montoPresupuestado: number; montoReal: number; diferencia: number; variacionPct: number;
}
export interface Presupuesto {
  id: string; organizationId: string; nombre: string;
  campaniaId?: string; campoId?: string; loteId?: string; cultivo?: string; hectareas?: number; año: number;
  lineas: LineaPresupuesto[];
  totalPresupuestadoGastos: number; totalPresupuestadoIngresos: number;
  totalRealGastos: number; totalRealIngresos: number;
  margenPresupuestado: number; margenReal: number;
  estado: 'activo' | 'cerrado' | 'borrador';
  notas?: string; createdAt: Date; updatedAt: Date;
}
```

**`src/services/presupuesto.ts`** — colección: `organizations/{orgId}/presupuestos`

```typescript
export async function crearPresupuesto(orgId, data): Promise<string>
export async function obtenerPresupuestos(orgId, campaniaId?): Promise<Presupuesto[]>
export async function obtenerPresupuesto(orgId, id): Promise<Presupuesto | null>
export async function actualizarPresupuesto(orgId, id, data): Promise<void>
export async function actualizarMontoReal(orgId, presupuestoId, categoria, montoReal): Promise<void>
// Lee, actualiza línea, recalcula diferencia y variacionPct, recalcula totales, guarda
export function calcularTotalesPresupuesto(lineas: LineaPresupuesto[]): Pick<Presupuesto, 'totalPresupuestadoGastos' | 'totalPresupuestadoIngresos' | 'totalRealGastos' | 'totalRealIngresos' | 'margenPresupuestado' | 'margenReal'>
```

**Criterio de éxito:** `npx tsc --noEmit` sin errores.

---

## Ola 2 — Frontend: UI
> PARALELO.

### Agente A — UI Centros de Costo

**Puede ejecutarse en paralelo con:** Ola 2 — Agente B
**Depende de:** Ola 1 — Agente A

#### Archivos a crear
- `src/app/(dashboard)/centros-costo/page.tsx`

#### Prompt completo para el agente

**PluginGate:** `pluginId="presupuesto_control"`.

Página con patrón ABM popup (leer `src/app/(dashboard)/terceros/page.tsx`):

1. **KPIs:** Total CC activos | CC con mayor gasto | CC en negativo

2. **Tabla:**
   Código | Nombre | Tipo (badge) | Total Cargos | Total Abonos | Saldo | Acciones

3. **Botón "+ Nuevo CC"** → Dialog: código, nombre, tipo, descripción, campaña opcional.
   Botón "Editar" en fila → mismo Dialog prellenado.

4. **Botón "Ver movimientos"** → panel acordeón debajo de la fila con tabla de movimientos filtrable.

5. **Tabla resumen** al pie: comparativa de todos los CCs.

**Criterio de éxito:** `npx tsc --noEmit` sin errores. ABM con popup funcional.

---

### Agente B — UI Presupuesto vs Real

**Puede ejecutarse en paralelo con:** Ola 2 — Agente A
**Depende de:** Ola 1 — Agente B

#### Archivos a crear
- `src/app/(dashboard)/presupuesto/page.tsx`

#### Prompt completo para el agente

**PluginGate:** `pluginId="presupuesto_control"`.

1. **Selector de presupuesto** (dropdown). Botón "+ Nuevo presupuesto" → Dialog: nombre, campaña, campo, lote, cultivo, hectáreas, año.

2. **4 KPIs del presupuesto seleccionado:**
   Gastos presupuestados | Gastos reales | Ingresos presupuestados | Ingresos reales + Margen vs Real

3. **Tabla de líneas:**
   | Categoría | Tipo | Presupuestado | Real | Diferencia | Variación % |
   - Verde si favorável (ahorro en gastos / mayor ingreso).
   - Rojo si desfavorable.
   - Botón "Editar" en línea → Dialog para actualizar montoReal.
   - Botón "+ Agregar línea" → Dialog: categoría, descripción, tipo, montoPresupuestado.

4. **Barras comparativas** (puro CSS, sin librería): dos barras por categoría.

**Criterio de éxito:** `npx tsc --noEmit` sin errores.

---

## Verificación final Plan 05

- [ ] `/centros-costo` y `/presupuesto` muestran PluginGate cuando plugin inactivo
- [ ] ABM de centros de costo funciona con popup
- [ ] Presupuesto se puede cargar y editar líneas con popup
- [ ] Variaciones se calculan correctamente
- [ ] `npx tsc --noEmit` sin errores
