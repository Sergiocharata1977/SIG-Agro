# Plan 03 — Plugin: Operaciones Comerciales

**Fecha:** 2026-05-02
**Plugin ID:** `operaciones_comerciales`
**Feature:** Servicios técnicos, venta de repuestos/maquinaria y nuevos tipos de operación
**Depende de:** PLAN-00 completo

---

## Resumen de olas

| Ola | Agentes | Paralelos entre sí | Dependen de |
|-----|---------|---------------------|-------------|
| 1 | A, B | Sí | PLAN-00 completo |
| 2 | A, B | Sí | Ola 1 completa |

---

## Ola 1 — Backend: Types + Services
> Agentes independientes. PARALELO.

---

### Agente A — Nuevos tipos de operación (extend core)

**Puede ejecutarse en paralelo con:** Ola 1 — Agente B
**Depende de:** PLAN-00 completo

#### Objetivo
Extender `TipoOperacion` y `asientos-auto.ts` con 7 nuevos tipos: gasto general, anticipo cliente/proveedor, cuota financiación, transferencia interna, nota crédito/débito.

#### Archivos a modificar
- `src/types/contabilidad-simple.ts` — extender TipoOperacion + nuevas interfaces DatosXxx
- `src/services/asientos-auto.ts` — agregar casos al switch de generarAsientoAutomatico

#### Prompt completo para el agente

Sos un desarrollador senior en SIG Agro. Stack: Next.js 16 + TypeScript.

**Leer COMPLETO antes de modificar:**
- `src/types/contabilidad-simple.ts` — TipoOperacion actual (7 valores), patrones DatosXxx
- `src/services/asientos-auto.ts` — función `generarAsientoAutomatico()` con switch

**Modificación 1: `src/types/contabilidad-simple.ts`**

Extender el union `TipoOperacion` agregando al final:
```typescript
| 'gasto_general' | 'anticipo_cliente' | 'anticipo_proveedor'
| 'cuota_financiacion' | 'transferencia_interna'
| 'nota_credito' | 'nota_debito'
```

Agregar interfaces al final del archivo:
```typescript
export interface DatosGastoGeneral {
  concepto: string; cuentaGastoId: string; cuentaGastoNombre: string;
  monto: number; medioPago: MedioPago;
  terceroId?: string; campaniaId?: string; fecha: Date; observaciones?: string;
}
export interface DatosAnticipo {
  terceroId: string; monto: number; medioPago: MedioPago;
  esCliente: boolean; fecha: Date; observaciones?: string;
}
export interface DatosCuotaFinanciacion {
  entidadFinanciera: string; numeroCuota: number; totalCuotas: number;
  capital: number; interes: number; monto: number;
  medioPago: MedioPago; fecha: Date; observaciones?: string;
}
export interface DatosTransferenciaInterna {
  origen: 'caja' | 'banco'; origenId: string; origenNombre: string;
  destino: 'caja' | 'banco'; destinoId: string; destinoNombre: string;
  monto: number; fecha: Date; observaciones?: string;
}
export interface DatosNotaCredito {
  terceroId: string; monto: number; motivo: string; fecha: Date; observaciones?: string;
}
```

**Modificación 2: `src/services/asientos-auto.ts`**

Agregar al switch de `generarAsientoAutomatico()`:
- `gasto_general`: Debe: cuentaGastoId → Haber: 1.1.1 (efectivo) o 1.1.2 (banco) según medioPago
- `anticipo_cliente`: Debe: 1.1.1/2 → Haber: 2.1.3 (Anticipos clientes)
- `anticipo_proveedor`: Debe: 1.1.4 (Anticipos proveedores) → Haber: 1.1.1/2
- `cuota_financiacion`: Debe: 3.1.1 (capital) + 5.x (interés) → Haber: 1.1.1/2
- `transferencia_interna`: sin impacto contable (retornar asiento con lineas vacías)
- `nota_credito`: Debe: 4.1.1 (Ventas) → Haber: 1.1.3 (Clientes)
- `nota_debito`: Debe: 2.1.1 (Proveedores) → Haber: 5.1.1 (Compras)

NO cambiar los 7 casos existentes. Solo agregar los nuevos.

**Criterio de éxito:** `npx tsc --noEmit` sin errores. Switch cubre todos los nuevos tipos.

---

### Agente B — Types + Service Operaciones Comerciales

**Puede ejecutarse en paralelo con:** Ola 1 — Agente A
**Depende de:** PLAN-00 completo

#### Objetivo
Crear tipos y servicio para operaciones comerciales (servicio técnico, repuestos, maquinaria).

#### Archivos a crear
- `src/types/operaciones-comerciales.ts`
- `src/services/operaciones-comerciales.ts`

#### Prompt completo para el agente

Sos un desarrollador senior en SIG Agro. Stack: Next.js 16 + TypeScript + Firebase/Firestore.

**`src/types/operaciones-comerciales.ts`:**

```typescript
export type TipoOperacionComercial = 'servicio_tecnico' | 'venta_repuesto' | 'venta_maquinaria';
export type EstadoOperacionComercial = 'borrador' | 'pendiente' | 'facturado' | 'cobrado' | 'anulado';
export type CondicionVenta = 'contado' | 'credito_30' | 'credito_60' | 'credito_90' | 'financiado';

export interface LineaOperacionComercial {
  descripcion: string; cantidad: number; precioUnitario: number;
  descuento: number; subtotal: number; esRepuesto?: boolean; esManoObra?: boolean;
}

export interface OperacionComercial {
  id: string; organizationId: string; tipo: TipoOperacionComercial; estado: EstadoOperacionComercial;
  fecha: Date; numeroDocumento?: string; terceroId: string; terceroNombre: string;
  lineas: LineaOperacionComercial[];
  subtotal: number; descuentoGlobal: number; iva: number; montoIVA: number; total: number;
  condicionVenta: CondicionVenta; medioCobro?: string;
  maquinaId?: string; ordenServicioId?: string;
  maquinaVendidaDescripcion?: string; marcaMaquina?: string; modeloMaquina?: string; anioMaquina?: number;
  asientoId?: string; notas?: string; creadoPor: string; createdAt: Date; updatedAt: Date;
}
```

**`src/services/operaciones-comerciales.ts`** — colección: `organizations/{orgId}/operaciones_comerciales`

```typescript
export async function crearOperacionComercial(orgId, data): Promise<string>
export async function obtenerOperacionesComerciales(orgId, filtros?: { tipo?; estado?; desde?; hasta?; terceroId? }): Promise<OperacionComercial[]>
export async function obtenerOperacionComercial(orgId, id): Promise<OperacionComercial | null>
export async function actualizarEstadoOperacion(orgId, id, estado, asientoId?): Promise<void>
export function calcularTotalesLineas(lineas: LineaOperacionComercial[], ivaPct: number): { subtotal: number; montoIVA: number; total: number }
// subtotal = sum(qty * precio * (1 - desc/100)); montoIVA = subtotal * ivaPct/100; total = subtotal + montoIVA
```

**Criterio de éxito:** `npx tsc --noEmit` sin errores.

---

## Ola 2 — Frontend: UI de Operaciones
> Ejecutar SOLO después de Ola 1. PARALELO.

---

### Agente A — Extender /operaciones con nuevos tipos

**Puede ejecutarse en paralelo con:** Ola 2 — Agente B
**Depende de:** Ola 1 — Agente A

#### Objetivo
Agregar los 7 nuevos tipos de operación al dialog de `/operaciones`.

#### Archivos a modificar
- `src/app/(dashboard)/operaciones/page.tsx`

#### Prompt completo para el agente

Sos un desarrollador senior en SIG Agro.

**Leer COMPLETO antes de modificar:**
- `src/app/(dashboard)/operaciones/page.tsx` — código actual (ya convertido a popup en PLAN_ABM_POPUP)
- `src/types/contabilidad-simple.ts` — nuevos tipos: DatosGastoGeneral, DatosAnticipo, DatosCuotaFinanciacion, DatosTransferenciaInterna, DatosNotaCredito
- `src/contexts/PluginsContext.tsx`, `src/components/plugins/PluginGate.tsx`

**Qué agregar:**

La página YA tiene el Dialog de selector de tipo + formularios. Los nuevos tipos aparecen SOLO si el plugin `operaciones_comerciales` está activo. Implementar así:

```tsx
const { isActive } = usePlugins();
const tiposDisponibles = [
  // siempre disponibles (core):
  'compra_insumo', 'aplicacion_insumo', 'cosecha', 'entrega_acopiador', 'venta', 'cobro', 'pago',
  // solo con plugin:
  ...(isActive('operaciones_comerciales') ? ['gasto_general', 'anticipo_cliente', 'anticipo_proveedor', 'cuota_financiacion', 'transferencia_interna', 'nota_credito', 'nota_debito'] : []),
];
```

En la grilla de cards del selector, agregar los nuevos tipos (solo si `isActive`). Para cada nuevo tipo, agregar el formulario específico en la Vista 2 del Dialog:

- **Gasto general:** concepto, cuentaGasto (select del plan de cuentas), monto, medioPago, tercero (opcional)
- **Anticipo cliente:** tercero (solo clientes), monto, medioPago
- **Anticipo proveedor:** tercero (solo proveedores), monto, medioPago
- **Cuota financiación:** entidadFinanciera, numeroCuota/totalCuotas, capital, interés, monto total, medioPago
- **Nota crédito:** tercero (cliente), monto, motivo
- **Nota débito:** tercero (proveedor), monto, motivo
- **Transferencia interna:** origen (select caja/banco), destino (select caja/banco), monto

Usar el mismo patrón de submit que los tipos existentes: llamar `generarAsientoAutomatico()`, cerrar dialog, recargar.

**NO tocar los 7 tipos existentes ni la lógica de submit.**

**Criterio de éxito:** `npx tsc --noEmit` sin errores. Nuevos tipos aparecen solo con plugin activo.

---

### Agente B — UI Operaciones Comerciales

**Puede ejecutarse en paralelo con:** Ola 2 — Agente A
**Depende de:** Ola 1 — Agente B

#### Objetivo
Crear la página `/operaciones/comerciales` con ABM popup para servicios técnicos, ventas de repuestos y maquinaria.

#### Archivos a crear
- `src/app/(dashboard)/operaciones/comerciales/page.tsx`

#### Prompt completo para el agente

Sos un desarrollador senior en SIG Agro. Stack: Next.js 16 + React 19 + TypeScript + Tailwind CSS 4.

**Leer antes de crear:**
- `src/contexts/PluginsContext.tsx`, `src/components/plugins/PluginGate.tsx`
- `src/types/operaciones-comerciales.ts`, `src/services/operaciones-comerciales.ts`
- `src/services/terceros.ts` — para cargar terceros en formulario
- `src/app/(dashboard)/terceros/page.tsx` — patrón ABM popup

**PluginGate:** `pluginId="operaciones_comerciales"`.

**Funcionalidad:**

1. **4 KPIs:** Facturado mes | Cobrado mes | Pendiente cobro | Operaciones abiertas

2. **Filtros:** tipo, estado, fecha, tercero (texto libre para buscar)

3. **Tabla:**
   N° Doc | Fecha | Tipo (badge) | Cliente | Total | Estado (badge) | Acciones (Editar estado / Ver detalle)

4. **Botón "+ Nueva operación"** → Dialog multi-paso:
   - Paso 1: 3 cards visuales — Servicio Técnico | Venta Repuestos | Venta Maquinaria
   - Paso 2: datos generales (cliente select, fecha, condición venta, N° documento)
   - Paso 3: líneas — tabla editable, botón "Agregar línea" (descripción, qty, precio, descuento, subtotal auto)
   - Paso 4: totales + IVA + campos específicos + notas. Botones: "Borrador" / "Facturar"

5. **Acción "Cambiar estado"** → Dialog pequeño con select estado + observación.

6. **Detalle expandible** al hacer click en fila: muestra todas las líneas.

**Criterio de éxito:** `npx tsc --noEmit` sin errores. CRUD funcional con popups.

---

## Verificación final Plan 03

- [ ] Nuevos tipos de operación en asientos-auto.ts generan asientos correctos
- [ ] En `/operaciones`, los nuevos tipos solo aparecen con plugin activo
- [ ] `/operaciones/comerciales` muestra PluginGate cuando plugin inactivo
- [ ] Se pueden crear servicios técnicos, ventas de repuestos y maquinaria con popup
- [ ] `npx tsc --noEmit` sin errores
