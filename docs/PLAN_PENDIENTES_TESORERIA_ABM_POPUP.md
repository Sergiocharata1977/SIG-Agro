# Plan Pendientes — Tesorería + ABM Popup restantes

**Fecha:** 2026-05-03
**Proyectos afectados:** `SIG-Agro`
**Estado:** Pendiente de ejecución

---

## Resumen de olas

| Ola | Agentes | Paralelos entre sí | Dependen de |
|-----|---------|---------------------|-------------|
| 1 | A, B, C, D | Sí | Nada — todos independientes |
| 2 | A, B | Sí | Ola 1 completa |

---

## Contexto general

### Stack
Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 + Firebase/Firestore

### Patrón ABM Dialog obligatorio

Todas las páginas de ABM siguen este patrón. Ver `src/app/(dashboard)/terceros/page.tsx` como referencia completa.

```typescript
// Estado
const [dialogOpen, setDialogOpen] = useState(false);
const [editando, setEditando] = useState<Entidad | null>(null);
const [formData, setFormData] = useState<FormState>(EMPTY_FORM);
const [guardando, setGuardando] = useState(false);

// Abrir (alta o edición)
function abrirDialog(item?: Entidad) {
  setEditando(item ?? null);
  setFormData(item ? { ...mapearItem(item) } : EMPTY_FORM);
  setDialogOpen(true);
}

// Submit unificado
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setGuardando(true);
  try {
    editando
      ? await actualizar(orgId, editando.id, formData)
      : await crear(orgId, formData);
    setDialogOpen(false);
    setEditando(null);
    setFormData(EMPTY_FORM);
    await cargarDatos();
  } finally {
    setGuardando(false);
  }
}
```

Import Dialog:
```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
```

---

## Ola 1 — Backend Tesorería + ABM Popup (4 agentes paralelos)

---

### Agente A — Types + Service Tesorería

**Puede ejecutarse en paralelo con:** Ola 1 — Agente B, C, D
**Depende de:** nada

#### Archivos a crear
- `src/types/tesoreria.ts`
- `src/services/tesoreria.ts`

#### Prompt completo para el agente

Sos un desarrollador senior en Don Juan GIS. Stack: Next.js 16 + TypeScript + Firebase/Firestore. Sistema multi-tenant por `organizationId`.

**`src/types/tesoreria.ts`:**

```typescript
export type TipoCuenta = 'banco' | 'caja_chica';
export type TipoMovimientoTesoreria = 'ingreso' | 'egreso' | 'transferencia';
export type EstadoTesoreria = 'activo' | 'inactivo';

export interface CuentaBancaria {
  id: string;
  organizationId: string;
  banco: string;
  numeroCuenta: string;
  titular: string;
  tipoCuenta: 'corriente' | 'ahorro' | 'caja_ahorro';
  moneda: 'ARS' | 'USD';
  saldoInicial: number;
  saldo: number;
  estado: EstadoTesoreria;
  notas?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CajaChica {
  id: string;
  organizationId: string;
  nombre: string;
  responsable?: string;
  saldoInicial: number;
  saldo: number;
  moneda: 'ARS' | 'USD';
  estado: EstadoTesoreria;
  notas?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MovimientoTesoreria {
  id: string;
  organizationId: string;
  tipo: TipoMovimientoTesoreria;
  cuentaOrigenTipo: TipoCuenta;
  cuentaOrigenId: string;
  cuentaOrigenNombre: string;
  cuentaDestinoTipo?: TipoCuenta;
  cuentaDestinoId?: string;
  cuentaDestinoNombre?: string;
  fecha: Date;
  concepto: string;
  monto: number;
  terceroId?: string;
  terceroNombre?: string;
  operacionId?: string;
  asientoId?: string;
  notas?: string;
  createdAt: Date;
}

export interface ResumenTesoreria {
  totalBancos: number;
  totalCajas: number;
  totalGeneral: number;
  ingresosMes: number;
  egresosMes: number;
}
```

**`src/services/tesoreria.ts`** — colecciones: `organizations/{orgId}/cuentas_bancarias`, `organizations/{orgId}/cajas_chicas`, `organizations/{orgId}/movimientos_tesoreria`

```typescript
// Cuentas bancarias
export async function crearCuentaBancaria(orgId: string, data: Omit<CuentaBancaria, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>): Promise<string>
export async function obtenerCuentasBancarias(orgId: string): Promise<CuentaBancaria[]>
export async function actualizarCuentaBancaria(orgId: string, id: string, data: Partial<CuentaBancaria>): Promise<void>

// Cajas chicas
export async function crearCajaChica(orgId: string, data: Omit<CajaChica, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>): Promise<string>
export async function obtenerCajasChicas(orgId: string): Promise<CajaChica[]>
export async function actualizarCajaChica(orgId: string, id: string, data: Partial<CajaChica>): Promise<void>

// Movimientos
export async function registrarMovimiento(orgId: string, data: Omit<MovimientoTesoreria, 'id' | 'organizationId' | 'createdAt'>): Promise<string>
// Al registrar: actualizar saldo de cuenta origen (y destino si es transferencia)
export async function obtenerMovimientos(orgId: string, filtros?: { cuentaId?: string; cuentaTipo?: TipoCuenta; desde?: Date; hasta?: Date }): Promise<MovimientoTesoreria[]>

// Resumen
export async function obtenerResumenTesoreria(orgId: string): Promise<ResumenTesoreria>
// Lee todas las cuentas y cajas, suma saldos, filtra movimientos del mes actual para ingresos/egresos
```

**Criterio de éxito:** `npx tsc --noEmit` sin errores. Todas las funciones exportadas correctamente.

---

### Agente B — Types + Service Cheques

**Puede ejecutarse en paralelo con:** Ola 1 — Agente A, C, D
**Depende de:** nada

#### Archivos a crear
- `src/types/cheques.ts`
- `src/services/cheques.ts`

#### Prompt completo para el agente

Sos un desarrollador senior en Don Juan GIS. Stack: Next.js 16 + TypeScript + Firebase/Firestore.

**`src/types/cheques.ts`:**

```typescript
export type EstadoChequeEmitido = 'emitido' | 'presentado' | 'debitado' | 'rechazado' | 'anulado';
export type EstadoChequeRecibido = 'en_cartera' | 'depositado' | 'al_cobro' | 'cobrado' | 'rechazado' | 'endosado' | 'anulado';
export type TipoCheque = 'comun' | 'diferido';

export interface ChequeEmitido {
  id: string;
  organizationId: string;
  numeroCheque: string;
  banco: string;
  cuentaBancariaId: string;
  cuentaBancariaNombre: string;
  tipo: TipoCheque;
  fechaEmision: Date;
  fechaPago: Date;
  monto: number;
  beneficiario: string;
  terceroId?: string;
  concepto: string;
  estado: EstadoChequeEmitido;
  notas?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChequeRecibido {
  id: string;
  organizationId: string;
  numeroCheque: string;
  banco: string;
  tipo: TipoCheque;
  fechaRecepcion: Date;
  fechaPago: Date;
  monto: number;
  librador: string;
  terceroId?: string;
  concepto: string;
  estado: EstadoChequeRecibido;
  cuentaDepositoId?: string;
  cuentaDepositoNombre?: string;
  notas?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResumenCheques {
  emitidosPendientes: number;
  emitidosMonto: number;
  recibidosEnCartera: number;
  recibidosMonto: number;
  vencenEsta7Dias: number;
}
```

**`src/services/cheques.ts`** — colecciones: `organizations/{orgId}/cheques_emitidos`, `organizations/{orgId}/cheques_recibidos`

```typescript
// Cheques emitidos
export async function crearChequeEmitido(orgId: string, data: Omit<ChequeEmitido, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>): Promise<string>
export async function obtenerChequesEmitidos(orgId: string, filtros?: { estado?: EstadoChequeEmitido; desde?: Date; hasta?: Date }): Promise<ChequeEmitido[]>
export async function actualizarEstadoChequeEmitido(orgId: string, id: string, estado: EstadoChequeEmitido): Promise<void>

// Cheques recibidos
export async function crearChequeRecibido(orgId: string, data: Omit<ChequeRecibido, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>): Promise<string>
export async function obtenerChequesRecibidos(orgId: string, filtros?: { estado?: EstadoChequeRecibido; desde?: Date; hasta?: Date }): Promise<ChequeRecibido[]>
export async function actualizarEstadoChequeRecibido(orgId: string, id: string, estado: EstadoChequeRecibido, cuentaDepositoId?: string): Promise<void>

// Resumen
export async function obtenerResumenCheques(orgId: string): Promise<ResumenCheques>
// vencenEsta7Dias: cheques emitidos (pendientes/presentados) y recibidos (en_cartera) con fechaPago <= hoy + 7 días
```

**Criterio de éxito:** `npx tsc --noEmit` sin errores.

---

### Agente C — ABM Popup: /campanias + /campos

**Puede ejecutarse en paralelo con:** Ola 1 — Agente A, B, D
**Depende de:** nada

#### Archivos a modificar
- `src/app/(dashboard)/campanias/page.tsx` — agregar botón Editar + Dialog prellenado
- `src/app/(dashboard)/campanias/nueva/page.tsx` → reemplazar con redirect
- `src/app/(dashboard)/campos/page.tsx` — convertir Link `/campos/nuevo` a Dialog ABM completo
- `src/app/(dashboard)/campos/nuevo/page.tsx` → reemplazar con redirect

#### Prompt completo para el agente

Sos un desarrollador senior en Don Juan GIS.

**Leer COMPLETO antes de modificar:**
- `src/app/(dashboard)/campanias/page.tsx` — ya tiene Dialog de alta, FALTA edición
- `src/app/(dashboard)/campos/page.tsx` — usa Link a `/campos/nuevo`, necesita Dialog completo
- `src/app/(dashboard)/campos/nuevo/page.tsx` — campos del formulario a copiar al Dialog
- `src/app/(dashboard)/campanias/nueva/page.tsx` — campos del formulario a verificar
- `src/app/(dashboard)/terceros/page.tsx` — patrón completo de referencia ABM Dialog

---

**Tarea 1 — `campanias/page.tsx`:**

La página YA tiene Dialog de alta. Solo falta agregar edición:

1. Agregar `const [editando, setEditando] = useState<Campania | null>(null);`
2. Crear función `abrirDialog(item?: Campania)`:
   - Si `item` → prellenar form con sus datos + `setEditando(item)`
   - Si no → `EMPTY_FORM` + `setEditando(null)`
3. Cambiar el botón actual que llama `setDialogOpen(true)` para que llame `abrirDialog()`
4. Agregar botón "Editar" en cada fila de la tabla que llame `abrirDialog(campania)`
5. En `handleSubmit`: si `editando` → llamar `actualizarCampania(orgId, editando.id, formData)`, si no → `crearCampania(orgId, formData)`
6. Verificar que el servicio `actualizarCampania` exista en `src/services/campanias.ts`. Si no existe, créalo.
7. Cambiar título del Dialog: `{editando ? 'Editar campana' : 'Nueva campana'}`

**Tarea 2 — `campanias/nueva/page.tsx`:**
```typescript
import { redirect } from 'next/navigation';
export default function NuevaCampaniaPage() { redirect('/campanias'); }
```

**Tarea 3 — `campos/page.tsx`:**

La página actual muestra lista de campos con un Link a `/campos/nuevo`. Convertir a patrón ABM Dialog:

Estado a agregar:
```typescript
const [dialogOpen, setDialogOpen] = useState(false);
const [editando, setEditando] = useState<Campo | null>(null);
const [guardando, setGuardando] = useState(false);
const [formData, setFormData] = useState({
  nombre: '',
  departamento: '',
  localidad: '',
  provincia: 'Chaco',
  superficieTotal: 0,
});
```

Leer `src/app/(dashboard)/campos/nuevo/page.tsx` para ver todos los campos del formulario y replicarlos en el Dialog. No incluir el mapa editor en el Dialog (es demasiado complejo para popup) — el mapa queda en la página principal como está.

- Reemplazar el `<Link href="/campos/nuevo">` por `<button onClick={() => abrirDialog()}>Nuevo campo</button>`
- Agregar botón "Editar" en cada card de la lista que llame `abrirDialog(campo)`
- El Dialog debe tener: nombre, departamento, localidad, provincia, superficieTotal
- Usar `crearCampo` y `actualizarCampo` de `src/services/campos.ts`
- Verificar que `actualizarCampo` exista. Si no, crearlo.

**Tarea 4 — `campos/nuevo/page.tsx`:**
```typescript
import { redirect } from 'next/navigation';
export default function NuevoCampoPage() { redirect('/campos'); }
```

**Criterio de éxito:** `npx tsc --noEmit` sin errores. CRUD de campañas y campos funciona desde Dialog.

---

### Agente D — ABM Popup: /cuaderno + /riego

**Puede ejecutarse en paralelo con:** Ola 1 — Agente A, B, C
**Depende de:** nada

#### Archivos a modificar
- `src/app/(dashboard)/cuaderno/page.tsx`
- `src/app/(dashboard)/riego/page.tsx`

#### Prompt completo para el agente

Sos un desarrollador senior en Don Juan GIS.

**Leer COMPLETO antes de modificar:**
- `src/app/(dashboard)/cuaderno/page.tsx`
- `src/app/(dashboard)/riego/page.tsx`
- `src/app/(dashboard)/terceros/page.tsx` — patrón Dialog de referencia

---

**Tarea 1 — `cuaderno/page.tsx`:**

La página tiene dos tabs: "cuaderno" (FieldLogbookEntry) y "tratamientos" (TreatmentApplication). Actualmente los formularios de alta son inline en el panel lateral. Convertir AMBOS al patrón Dialog:

**Tab cuaderno:**
- Estado actual inline: `activityType`, `description` (+ fieldId, plotId, campaignId que son filtros globales, NO van al Dialog, quedan como filtros)
- Dialog de alta con: activityType (select), description (textarea), fecha (date input)
- Botón "+ Nuevo registro" abre Dialog. Al guardar: llama `crearRegistroCuaderno(...)`, cierra, recarga

**Tab tratamientos:**
- Estado actual inline: `issueType`, `mode`, `productName`, `dosagePerHa`, `dosageUnit`, `appliedAreaHa`
- Dialog de alta con todos esos campos
- Botón "+ Nuevo tratamiento" abre Dialog. Al guardar: llama `crearTratamiento(...)`, cierra, recarga

Cada tab tiene su propio estado de Dialog independiente:
```typescript
const [cuadernoDialogOpen, setCuadernoDialogOpen] = useState(false);
const [tratamientoDialogOpen, setTratamientoDialogOpen] = useState(false);
```

Los filtros globales (fieldId, plotId, campaignId) quedan como selects en la barra superior de la página, no dentro del Dialog.

---

**Tarea 2 — `riego/page.tsx`:**

La página tiene un formulario inline para crear planes de riego. Los campos inline son: fieldId, plotId, targetMm, method.

Convertir al patrón Dialog:
```typescript
const [dialogOpen, setDialogOpen] = useState(false);
const [editando, setEditando] = useState<IrrigationPlan | null>(null);
const [formData, setFormData] = useState({ fieldId: '', plotId: '', targetMm: 20, method: 'pivot' as IrrigationPlan['method'] });
```

- Botón "+ Nuevo plan de riego" abre Dialog con formulario completo
- Botón "Editar" en cada plan de la lista abre Dialog prellenado
- Al guardar: si `editando` → `actualizarPlanRiego(...)`, sino → `crearPlanRiego(...)`
- Los filtros de visualización (campaignId, fieldId para filtrar la lista) quedan en la barra superior, fuera del Dialog

Agregar imports:
```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
```

**Criterio de éxito:** `npx tsc --noEmit` sin errores en ambos archivos. Formularios funcionan en Dialog.

---

## Ola 2 — Frontend Tesorería (2 agentes paralelos)

> Ejecutar SOLO después de que Ola 1 completa (Agentes A y B)

---

### Agente A — UI Tesorería y Cuentas

**Puede ejecutarse en paralelo con:** Ola 2 — Agente B
**Depende de:** Ola 1 — Agente A (tesoreria.ts)

#### Archivos a crear
- `src/app/(dashboard)/tesoreria/page.tsx`

#### Prompt completo para el agente

Sos un desarrollador senior en Don Juan GIS. Stack: Next.js 16 + React 19 + TypeScript + Tailwind CSS 4.

**Leer antes de crear:**
- `src/contexts/PluginsContext.tsx` — `usePlugins()`, `isActive(pluginId)`
- `src/components/plugins/PluginGate.tsx`
- `src/types/tesoreria.ts` — CuentaBancaria, CajaChica, MovimientoTesoreria, ResumenTesoreria
- `src/services/tesoreria.ts` — crearCuentaBancaria, obtenerCuentasBancarias, crearCajaChica, obtenerCajasChicas, registrarMovimiento, obtenerMovimientos, obtenerResumenTesoreria
- `src/app/(dashboard)/terceros/page.tsx` — patrón ABM Dialog de referencia

**PluginGate:** `pluginId="tesoreria"` — si plugin inactivo, mostrar bloqueo.

**Funcionalidad:**

1. **4 KPIs** (del `obtenerResumenTesoreria`):
   Total bancos | Total cajas | Total general | Ingresos del mes

2. **Tabs:** "Cuentas bancarias" | "Cajas chicas" | "Movimientos"

3. **Tab Cuentas bancarias:**
   - Tabla: Banco | N° Cuenta | Titular | Tipo | Saldo | Estado | Acciones
   - Botón "+ Nueva cuenta" → Dialog con: banco, numeroCuenta, titular, tipoCuenta (select: corriente/ahorro/caja_ahorro), moneda (ARS/USD), saldoInicial, notas
   - Botón "Editar" en fila → mismo Dialog prellenado

4. **Tab Cajas chicas:**
   - Tabla: Nombre | Responsable | Saldo | Moneda | Estado | Acciones
   - Botón "+ Nueva caja" → Dialog con: nombre, responsable, saldoInicial, moneda, notas
   - Botón "Editar" en fila → Dialog prellenado

5. **Tab Movimientos:**
   - Filtros: tipo (ingreso/egreso/transferencia), cuenta, fecha desde/hasta
   - Tabla: Fecha | Cuenta | Tipo (badge) | Concepto | Tercero | Monto | Acciones
   - Botón "+ Registrar movimiento" → Dialog con:
     - tipo (select: ingreso/egreso/transferencia)
     - cuentaOrigenTipo + cuentaOrigenId (select dinámico que carga bancos o cajas según tipo)
     - Si transferencia: cuentaDestino
     - fecha, concepto, monto, terceroId (opcional), notas

**Patrón ABM:** Leer `terceros/page.tsx` completo y replicar estructura (PageShell, ListTable, Dialog, estados guardando/editando).

**Criterio de éxito:** `npx tsc --noEmit` sin errores. CRUD de cuentas y movimientos funciona con Dialog.

---

### Agente B — UI Cheques + Flujo de Caja

**Puede ejecutarse en paralelo con:** Ola 2 — Agente A
**Depende de:** Ola 1 — Agente B (cheques.ts)

#### Archivos a crear
- `src/app/(dashboard)/cheques/page.tsx`
- `src/app/(dashboard)/flujo-caja/page.tsx`

#### Prompt completo para el agente

Sos un desarrollador senior en Don Juan GIS.

**Leer antes de crear:**
- `src/contexts/PluginsContext.tsx`, `src/components/plugins/PluginGate.tsx`
- `src/types/cheques.ts`, `src/services/cheques.ts`
- `src/types/tesoreria.ts`, `src/services/tesoreria.ts` — para flujo de caja
- `src/app/(dashboard)/terceros/page.tsx` — patrón ABM

**PluginGate en ambas páginas:** `pluginId="tesoreria"`.

---

**Página `/cheques/page.tsx`:**

1. **3 KPIs** (del `obtenerResumenCheques`):
   Cheques emitidos pendientes | Cheques en cartera | Vencen esta semana (badge rojo si > 0)

2. **Tabs:** "Emitidos" | "Recibidos"

3. **Tab Emitidos:**
   - Tabla: N° Cheque | Banco | Fecha pago | Beneficiario | Monto | Estado (badge) | Cambiar estado
   - Botón "+ Nuevo cheque emitido" → Dialog con: numeroCheque, banco, cuentaBancariaId (select), tipo (comun/diferido), fechaEmision, fechaPago, monto, beneficiario, concepto, notas
   - Botón "Cambiar estado" → Dialog pequeño con select de estado + confirmar

4. **Tab Recibidos:**
   - Tabla: N° Cheque | Banco | Fecha pago | Librador | Monto | Estado (badge) | Cambiar estado
   - Botón "+ Nuevo cheque recibido" → Dialog con: numeroCheque, banco, tipo, fechaRecepcion, fechaPago, monto, librador, concepto, notas
   - Botón "Cambiar estado" → Dialog con estado + si depositando: select cuenta destino

Colores de badge por estado:
- `emitido` / `en_cartera` → azul
- `debitado` / `cobrado` / `depositado` → verde
- `rechazado` → rojo
- `anulado` → gris

---

**Página `/flujo-caja/page.tsx`:**

1. **Selector de período:** mes actual, mes anterior, personalizado (desde/hasta)

2. **4 KPIs del período:**
   Saldo inicial | Ingresos | Egresos | Saldo final

3. **Tabla de flujo:**
   | Fecha | Concepto | Tipo (badge ingreso=verde / egreso=rojo) | Cuenta | Monto | Saldo acumulado |
   - Datos de `obtenerMovimientos(orgId)` filtrados por período
   - Ordenados cronológicamente con saldo acumulado calculado en frontend

4. **Totales al pie:** Total ingresos | Total egresos | Resultado neto

5. **Botón exportar** (solo visible si `isActive('exportacion')`):
   ```tsx
   {isActive('exportacion') && (
     <button onClick={() => exportarFlujoCaja(flujo, organization?.name ?? '')}>
       Exportar PDF/Excel
     </button>
   )}
   ```
   Importar `exportarFlujoCaja` de `src/services/exportacion.ts`.

**Criterio de éxito:** `npx tsc --noEmit` sin errores. Ambas páginas funcionan con Plugin Gate.

---

## Verificación final

### Tesorería
- [ ] Cuentas bancarias: CRUD con Dialog funciona
- [ ] Cajas chicas: CRUD con Dialog funciona
- [ ] Movimientos: registro con Dialog actualiza saldos
- [ ] `/tesoreria` muestra PluginGate cuando plugin inactivo
- [ ] Cheques emitidos: alta y cambio de estado con Dialog
- [ ] Cheques recibidos: alta y cambio de estado con Dialog
- [ ] `/cheques` muestra PluginGate cuando plugin inactivo
- [ ] `/flujo-caja` muestra movimientos del período con saldo acumulado
- [ ] Botón exportar solo visible con plugin `exportacion` activo

### ABM Popup restantes
- [ ] `/campanias` tiene botón Editar por fila con Dialog prellenado
- [ ] `/campanias/nueva` redirige a `/campanias`
- [ ] `/campos` tiene alta y edición desde Dialog (sin mapa en Dialog)
- [ ] `/campos/nuevo` redirige a `/campos`
- [ ] `/cuaderno` tab cuaderno: alta desde Dialog
- [ ] `/cuaderno` tab tratamientos: alta desde Dialog
- [ ] `/riego` alta y edición de planes de riego desde Dialog

### General
- [ ] `npx tsc --noEmit` sin errores
- [ ] `npm run test` pasa 10/10
