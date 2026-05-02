# Plan 02 — Plugin: Tesorería

**Fecha:** 2026-05-02
**Plugin ID:** `tesoreria`
**Feature:** Caja/Bancos + Cheques + Flujo de caja proyectado
**Depende de:** PLAN-00 completo

---

## Resumen de olas

| Ola | Agentes | Paralelos entre sí | Dependen de |
|-----|---------|---------------------|-------------|
| 1 | A, B | Sí | PLAN-00 completo |
| 2 | A, B, C | Sí | Ola 1 completa |

---

## Ola 1 — Backend: Types + Services
> Agente A y Agente B crean archivos distintos. PARALELO.

---

### Agente A — Types + Service Caja y Bancos

**Puede ejecutarse en paralelo con:** Ola 1 — Agente B
**Depende de:** PLAN-00 completo

#### Objetivo
Crear tipos y servicio Firestore para Caja y Bancos.

#### Archivos a crear
- `src/types/tesoreria.ts`
- `src/services/tesoreria.ts`

#### Prompt completo para el agente

Sos un desarrollador senior en SIG Agro. Stack: Next.js 16 + TypeScript + Firebase/Firestore.

**Leer como modelos:**
- `src/types/contabilidad-simple.ts` — patrones de tipos
- `src/services/terceros.ts` — patrón de servicio Firestore con organizationId

**`src/types/tesoreria.ts`** — definir:

```typescript
export type TipoCaja = 'caja_principal' | 'caja_chica' | 'caja_sucursal';
export type TipoMovimientoCaja = 'ingreso' | 'egreso' | 'transferencia_entrada' | 'transferencia_salida' | 'ajuste';
export type EstadoCuenta = 'activa' | 'inactiva' | 'cerrada';
export type TipoMovimientoBanco = 'deposito' | 'extraccion' | 'transferencia_entrada' | 'transferencia_salida' | 'debito_automatico' | 'acreditacion' | 'ajuste';
export type EstadoConciliacion = 'pendiente' | 'conciliado' | 'observado';

export interface Caja {
  id: string; organizationId: string; nombre: string; tipo: TipoCaja;
  responsable?: string; saldoActual: number; saldoInicial: number;
  moneda: 'ARS' | 'USD'; estado: EstadoCuenta; notas?: string;
  createdAt: Date; updatedAt: Date;
}

export interface MovimientoCaja {
  id: string; organizationId: string; cajaId: string; cajaNombre: string;
  tipo: TipoMovimientoCaja; fecha: Date; concepto: string; monto: number;
  saldoAnterior: number; saldoPosterior: number;
  terceroId?: string; terceroNombre?: string;
  cajaDestinoId?: string; cuentaBancariaId?: string; asientoId?: string;
  usuarioId: string; usuarioNombre?: string; createdAt: Date;
}

export interface CuentaBancaria {
  id: string; organizationId: string; banco: string;
  tipoCuenta: 'caja_ahorro' | 'cuenta_corriente';
  numeroCuenta: string; cbu?: string; alias?: string; titular: string;
  moneda: 'ARS' | 'USD'; saldoActual: number; saldoInicial: number;
  estado: EstadoCuenta; notas?: string; createdAt: Date; updatedAt: Date;
}

export interface MovimientoBanco {
  id: string; organizationId: string; cuentaBancariaId: string; cuentaNombre: string;
  tipo: TipoMovimientoBanco; fecha: Date; fechaValor?: Date; concepto: string;
  monto: number; saldoAnterior: number; saldoPosterior: number;
  numeroComprobante?: string; conciliacion: EstadoConciliacion;
  terceroId?: string; terceroNombre?: string; chequeId?: string; asientoId?: string;
  usuarioId: string; createdAt: Date;
}

export interface ResumenTesoreria {
  totalCajas: number; totalBancos: number;
  saldoTotalCajas: number; saldoTotalBancos: number; saldoTotal: number;
  movimientosHoy: number; ultimaActualizacion: Date;
}
```

**`src/services/tesoreria.ts`** — colecciones:
- `organizations/{orgId}/cajas`
- `organizations/{orgId}/movimientos_caja`
- `organizations/{orgId}/cuentas_bancarias`
- `organizations/{orgId}/movimientos_banco`

Funciones (todas async, todas con `orgId: string` como primer param):
```typescript
export async function crearCaja(orgId, data): Promise<string>
export async function obtenerCajas(orgId): Promise<Caja[]>
export async function actualizarCaja(orgId, cajaId, data): Promise<void>
export async function registrarMovimientoCaja(orgId, data): Promise<string>
// transacción: saldoAnterior = saldoActual, saldoPosterior = anterior ± monto según tipo, actualiza saldo en Caja
export async function obtenerMovimientosCaja(orgId, cajaId, desde?, hasta?): Promise<MovimientoCaja[]>
export async function crearCuentaBancaria(orgId, data): Promise<string>
export async function obtenerCuentasBancarias(orgId): Promise<CuentaBancaria[]>
export async function actualizarCuentaBancaria(orgId, cuentaId, data): Promise<void>
export async function registrarMovimientoBanco(orgId, data): Promise<string>
// igual que caja pero para CuentaBancaria
export async function obtenerMovimientosBanco(orgId, cuentaId, desde?, hasta?): Promise<MovimientoBanco[]>
export async function obtenerResumenTesoreria(orgId): Promise<ResumenTesoreria>
// suma saldoActual de cajas activas + cuentas bancarias activas
```

**Criterio de éxito:** `npx tsc --noEmit` sin errores.

---

### Agente B — Types + Service Cheques

**Puede ejecutarse en paralelo con:** Ola 1 — Agente A
**Depende de:** PLAN-00 completo

#### Objetivo
Crear tipos y servicio Firestore para Cheques (recibidos, emitidos, rechazados).

#### Archivos a crear
- `src/types/cheques.ts`
- `src/services/cheques.ts`

#### Prompt completo para el agente

Sos un desarrollador senior en SIG Agro. Stack: Next.js 16 + TypeScript + Firebase/Firestore.

**Leer como modelos:**
- `src/services/terceros.ts` — patrón Firestore
- `src/types/contabilidad-simple.ts` — patrones de tipos

**`src/types/cheques.ts`:**

```typescript
export type TipoCheque = 'recibido' | 'emitido';
export type EstadoChequeRecibido = 'en_cartera' | 'depositado' | 'acreditado' | 'rechazado' | 'recuperado' | 'entregado_tercero' | 'anulado';
export type EstadoChequeEmitido = 'emitido' | 'presentado' | 'debitado' | 'rechazado' | 'anulado';
export type MotivoRechazo = 'fondos_insuficientes' | 'firma_no_coincide' | 'cuenta_cerrada' | 'defecto_formal' | 'orden_no_pagar' | 'otro';

export interface Cheque {
  id: string; organizationId: string; tipo: TipoCheque;
  numeroCheque: string; banco: string; sucursalBanco?: string; numeroCuenta?: string;
  fechaEmision: Date; fechaVencimiento: Date; monto: number; moneda: 'ARS' | 'USD'; esDiferido: boolean;
  terceroId?: string; terceroNombre: string;
  estadoRecibido?: EstadoChequeRecibido;
  estadoEmitido?: EstadoChequeEmitido;
  cuentaBancariaDestinoId?: string; cajaOrigenId?: string;
  operacionOrigenId?: string; asientoId?: string;
  fechaRechazo?: Date; motivoRechazo?: MotivoRechazo; motivoRechazoDetalle?: string;
  estadoGestion?: 'pendiente' | 'en_gestion' | 'recuperado' | 'incobrable' | 'judicializado';
  fechaRecuperacion?: Date; responsableGestion?: string;
  notas?: string; creadoPor: string; createdAt: Date; updatedAt: Date;
}

export interface MovimientoCheque {
  id: string; organizationId: string; chequeId: string;
  estadoAnterior: string; estadoNuevo: string; fecha: Date;
  usuarioId: string; usuarioNombre?: string; observacion?: string; createdAt: Date;
}

export interface ResumenCheques {
  enCartera: number; enCarteraMonto: number;
  vencenEsta7Dias: number; rechazados: number; rechazadosMonto: number;
  emitidosPendientes: number; emitidosMonto: number;
}
```

**`src/services/cheques.ts`** — colecciones:
- `organizations/{orgId}/cheques`
- `organizations/{orgId}/movimientos_cheque`

```typescript
export async function crearCheque(orgId, data): Promise<string>
export async function obtenerCheques(orgId, filtros?: { tipo?; estado?; desde?; hasta?; terceroId? }): Promise<Cheque[]>
export async function obtenerCheque(orgId, chequeId): Promise<Cheque | null>
export async function cambiarEstadoCheque(orgId, chequeId, nuevoEstado, usuarioId, observacion?): Promise<void>
// transacción: actualiza cheque.estadoRecibido/Emitido + crea MovimientoCheque
export async function registrarRechazo(orgId, chequeId, motivo, detalle, usuarioId): Promise<void>
export async function obtenerChequesVencenProximos(orgId, dias): Promise<Cheque[]>
// cheques recibidos en_cartera con fechaVencimiento <= hoy + dias
export async function obtenerResumenCheques(orgId): Promise<ResumenCheques>
```

**Criterio de éxito:** `npx tsc --noEmit` sin errores.

---

## Ola 2 — Frontend: UI Completa de Tesorería
> Ejecutar SOLO después de Ola 1.
> Agentes A, B y C son independientes. PARALELO.

---

### Agente A — UI Caja y Bancos

**Puede ejecutarse en paralelo con:** Ola 2 — Agente B, C
**Depende de:** Ola 1 — Agente A

#### Objetivo
Crear la página `/tesoreria` con gestión de cajas y cuentas bancarias, protegida por PluginGate.

#### Archivos a crear
- `src/app/(dashboard)/tesoreria/page.tsx`

#### Prompt completo para el agente

Sos un desarrollador senior en SIG Agro. Stack: Next.js 16 + React 19 + TypeScript + Tailwind CSS 4.

**Leer antes de crear:**
- `src/contexts/PluginsContext.tsx` — `usePlugins()`
- `src/components/plugins/PluginGate.tsx`
- `src/types/tesoreria.ts` — todos los tipos
- `src/services/tesoreria.ts` — todas las funciones
- `src/app/(dashboard)/terceros/page.tsx` — patrón ABM popup completo

**Estructura de la página:**

```tsx
export default function TesoreriaPage() {
  const { isActive } = usePlugins();
  if (!isActive('tesoreria')) return <PluginGate pluginId="tesoreria" isActive={false}>{null}</PluginGate>;
  // ...
}
```

**Funcionalidad (patrón ABM popup para TODO):**

1. **4 KPIs:** Saldo total cajas | Saldo total bancos | Total | Movimientos hoy

2. **Tabs: "Cajas" | "Bancos"**

**Tab Cajas:**
- Tabla: Nombre | Tipo | Responsable | Saldo (formateado ARS) | Estado | Acciones
- Botón "+ Nueva caja" → Dialog (campos: nombre, tipo, responsable, saldoInicial, moneda, notas). Patrón `abrirDialog()`.
- Botón "Editar" en fila → mismo Dialog con datos prellenados.
- Botón "Ver movimientos" → panel acordeón debajo de la fila con tabla de últimos 20 movimientos.
- Botón "+ Movimiento" en panel de movimientos → Dialog (tipo, fecha, concepto, monto, terceroId opcional).

**Tab Bancos:** idéntico pero para CuentaBancaria + MovimientoBanco.

**Formato moneda:** `new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)`.

**Criterio de éxito:** `npx tsc --noEmit` sin errores. ABM funcional con popup.

---

### Agente B — UI Cheques

**Puede ejecutarse en paralelo con:** Ola 2 — Agente A, C
**Depende de:** Ola 1 — Agente B

#### Objetivo
Crear la página `/cheques` con gestión completa de cheques recibidos, emitidos y rechazados.

#### Archivos a crear
- `src/app/(dashboard)/cheques/page.tsx`

#### Prompt completo para el agente

Sos un desarrollador senior en SIG Agro.

**Leer antes de crear:**
- `src/contexts/PluginsContext.tsx`, `src/components/plugins/PluginGate.tsx`
- `src/types/cheques.ts`, `src/services/cheques.ts`
- `src/app/(dashboard)/terceros/page.tsx` — patrón ABM popup

**PluginGate:** igual que tesoreria, con `pluginId="tesoreria"`.

**Funcionalidad:**

1. **4 KPIs:** En cartera (cantidad + monto) | Vencen en 7 días (naranja si > 0) | Rechazados | Emitidos pendientes

2. **Banner alerta** si cheques vencen en 7 días.

3. **3 Tabs:** "Recibidos" | "Emitidos" | "Rechazados"

Cada tab: tabla con filtros (estado, fecha, tercero) + botón "+ Nuevo cheque". Popup para crear/cambiar estado.

**Badge estados:**
- en_cartera=azul, depositado=amarillo, acreditado=verde, rechazado=rojo, anulado=gris
- emitido=azul, debitado=verde, rechazado=rojo

**Dialog "Cambiar estado":** muestra historial de estados + select nuevo estado + observación.

**Dialog "Nuevo cheque":** numeroCheque, banco, fechaEmision, fechaVencimiento, monto, moneda, esDiferido, terceroNombre, notas.

**Criterio de éxito:** `npx tsc --noEmit` sin errores. Tres tabs funcionales con popup.

---

### Agente C — Service + UI Flujo de Caja Proyectado

**Puede ejecutarse en paralelo con:** Ola 2 — Agente A, B
**Depende de:** Ola 1 completa (necesita tesoreria.ts Y cheques.ts)

#### Objetivo
Crear el servicio de proyección y la página `/flujo-caja`.

#### Archivos a crear
- `src/services/flujo-caja.ts`
- `src/app/(dashboard)/flujo-caja/page.tsx`

#### Prompt completo para el agente

Sos un desarrollador senior en SIG Agro. Stack: Next.js 16 + TypeScript + Tailwind CSS 4.

**Leer antes de crear:**
- `src/types/tesoreria.ts`, `src/services/tesoreria.ts`
- `src/types/cheques.ts`, `src/services/cheques.ts`
- `src/contexts/PluginsContext.tsx`, `src/components/plugins/PluginGate.tsx`
- `src/app/(dashboard)/rentabilidad/page.tsx` — patrón de dashboard con KPIs

**`src/services/flujo-caja.ts`:**

```typescript
export interface SemanaFlujo { semana: number; fechaInicio: Date; fechaFin: Date; ingresos: number; egresos: number; saldoNeto: number; saldoAcumulado: number; }
export interface FlujoCajaProyectado {
  saldoActualTotal: number;
  proyeccionSemanal: SemanaFlujo[];   // 4 semanas
  proyeccionMensual: { mes: string; ingresos: number; egresos: number; saldo: number }[]; // 3 meses
  alertaDeficit: boolean;
  chequesACobrar30dias: number; chequesAPagar30dias: number;
}
export async function obtenerFlujoCajaProyectado(orgId: string): Promise<FlujoCajaProyectado>
```

Lógica:
1. `obtenerResumenTesoreria(orgId)` → saldo actual.
2. `obtenerChequesVencenProximos(orgId, 90)` → ingresos proyectados por fecha vencimiento.
3. `obtenerCheques(orgId, { tipo: 'emitido' })` → egresos proyectados.
4. Agrupar por semana (4 semanas) y por mes (3 meses).
5. Saldo acumulado semana a semana.
6. `alertaDeficit = true` si alguna semana queda negativa.

**Página `/flujo-caja`:**

PluginGate con `pluginId="tesoreria"`.

1. 5 KPIs: Saldo actual | A cobrar 30d | A pagar 30d | Saldo proyectado 30d | Badge "DÉFICIT" si alertaDeficit.
2. Tabla proyección semanal: 4 semanas. Filas en rojo si saldo negativo.
3. Tabla proyección mensual: 3 meses.
4. Lista cheques que vencen en 7 días.

**Criterio de éxito:** `npx tsc --noEmit` sin errores. Proyección con datos reales.

---

## Verificación final Plan 02

- [ ] `/tesoreria` muestra PluginGate cuando plugin inactivo
- [ ] Se puede crear caja, banco y registrar movimientos con popup
- [ ] `/cheques` permite crear y cambiar estados con historial
- [ ] Alertas de vencimiento funcionan
- [ ] `/flujo-caja` muestra proyección semanal y mensual real
- [ ] `npx tsc --noEmit` sin errores
