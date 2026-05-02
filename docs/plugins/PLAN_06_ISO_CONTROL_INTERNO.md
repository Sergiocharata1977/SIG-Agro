# Plan 06 — Plugin: ISO & Control Interno

**Fecha:** 2026-05-02
**Plugin ID:** `iso_control_interno`
**Feature:** Auditoría de cambios + Aprobaciones + Adjuntos + Exportación Excel/PDF
**Depende de:** PLAN-00 completo

---

## Resumen de olas

| Ola | Agentes | Paralelos entre sí | Dependen de |
|-----|---------|---------------------|-------------|
| 1 | A, B, C, D | Sí | PLAN-00 completo |
| 2 | A, B, C, D | Sí | Ola 1 completa |

---

## Ola 1 — Backend: 4 servicios independientes
> Todos crean archivos distintos. PARALELO.

---

### Agente A — Service Auditoría de Cambios

**Puede ejecutarse en paralelo con:** Ola 1 — Agente B, C, D
**Depende de:** PLAN-00 completo

#### Archivos a crear
- `src/types/auditoria.ts`
- `src/lib/auditoria/AuditoriaService.ts`

#### Prompt completo para el agente

Sos un desarrollador senior en SIG Agro. Stack: Next.js 16 + TypeScript + Firebase/Firestore.

**`src/types/auditoria.ts`:**
```typescript
export type ModuloAuditoria = 'contabilidad' | 'terceros' | 'tesoreria' | 'cheques' | 'operaciones' | 'operaciones_comerciales' | 'presupuesto' | 'centros_costo' | 'campanas' | 'plan_cuentas';
export type AccionAuditoria = 'crear' | 'modificar' | 'eliminar' | 'contabilizar' | 'anular' | 'aprobar' | 'rechazar' | 'cambiar_estado';
export interface RegistroAuditoria {
  id: string; organizationId: string; modulo: ModuloAuditoria; accion: AccionAuditoria;
  entidadId: string; entidadTipo: string; entidadDescripcion: string;
  usuarioId: string; usuarioNombre?: string; usuarioEmail?: string;
  valorAnterior?: Record<string, unknown>; valorNuevo?: Record<string, unknown>;
  camposModificados?: string[]; timestamp: Date;
}
```

**`src/lib/auditoria/AuditoriaService.ts`** — colección: `organizations/{orgId}/auditoria`

```typescript
export class AuditoriaService {
  static async registrar(orgId: string, data: Omit<RegistroAuditoria, 'id' | 'organizationId' | 'timestamp'>): Promise<void>
  static async obtenerRegistros(orgId: string, filtros?: { modulo?: ModuloAuditoria; accion?: AccionAuditoria; usuarioId?: string; entidadId?: string; desde?: Date; hasta?: Date }): Promise<RegistroAuditoria[]>
  static async obtenerRegistrosPorEntidad(orgId: string, entidadId: string): Promise<RegistroAuditoria[]>
}
```

En `registrar`: calcular `camposModificados` como `Object.keys(valorNuevo || {}).filter(k => JSON.stringify((valorAnterior||{})[k]) !== JSON.stringify((valorNuevo||{})[k]))`.

**Criterio de éxito:** `npx tsc --noEmit` sin errores.

---

### Agente B — Types + Service Aprobaciones

**Puede ejecutarse en paralelo con:** Ola 1 — Agente A, C, D
**Depende de:** PLAN-00 completo

#### Archivos a crear
- `src/types/aprobaciones.ts`
- `src/services/aprobaciones.ts`

#### Prompt completo para el agente

**`src/types/aprobaciones.ts`:**
```typescript
export type EstadoAprobacion = 'borrador' | 'pendiente_aprobacion' | 'aprobado' | 'rechazado' | 'contabilizado' | 'anulado';
export type TipoAprobacion = 'pago_grande' | 'ajuste_contable' | 'anulacion' | 'nota_credito' | 'refinanciacion' | 'condonacion' | 'ajuste_cc';
export interface SolicitudAprobacion {
  id: string; organizationId: string; tipo: TipoAprobacion; estado: EstadoAprobacion;
  operacionTipo: string; operacionId?: string; descripcion: string; monto?: number;
  solicitanteId: string; solicitanteNombre?: string; fechaSolicitud: Date; motivoSolicitud: string;
  aprobadorId?: string; aprobadorNombre?: string; fechaAprobacion?: Date; motivoAprobacion?: string;
  historial: Array<{ estado: EstadoAprobacion; usuarioId: string; usuarioNombre?: string; fecha: Date; observacion?: string; }>;
  createdAt: Date; updatedAt: Date;
}
export const UMBRALES_APROBACION: Record<string, number> = { pago_grande: 500000, nota_credito: 100000, ajuste_contable: 50000 };
```

**`src/services/aprobaciones.ts`** — colección: `organizations/{orgId}/solicitudes_aprobacion`
```typescript
export async function crearSolicitud(orgId, data): Promise<string>
// estado inicial = 'pendiente_aprobacion', historial = [{ estado, usuarioId, fecha }]
export async function obtenerSolicitudesPendientes(orgId): Promise<SolicitudAprobacion[]>
export async function obtenerSolicitudes(orgId, filtros?: { estado?; tipo? }): Promise<SolicitudAprobacion[]>
export async function aprobarSolicitud(orgId, solicitudId, aprobadorId, aprobadorNombre, motivo?): Promise<void>
export async function rechazarSolicitud(orgId, solicitudId, aprobadorId, motivo): Promise<void>
export function requiereAprobacion(tipo: string, monto?: number): boolean
```

**Criterio de éxito:** `npx tsc --noEmit` sin errores.

---

### Agente C — Types + Service Adjuntos (Firebase Storage)

**Puede ejecutarse en paralelo con:** Ola 1 — Agente A, B, D
**Depende de:** PLAN-00 completo

#### Archivos a crear
- `src/types/adjuntos.ts`
- `src/services/adjuntos.ts`

#### Prompt completo para el agente

Sos un desarrollador senior en SIG Agro. Stack: Next.js 16 + TypeScript + Firebase Storage + Firestore.

**`src/types/adjuntos.ts`:**
```typescript
export type TipoAdjunto = 'factura' | 'recibo' | 'remito' | 'orden_compra' | 'comprobante_transferencia' | 'cheque_escaneado' | 'contrato' | 'presupuesto' | 'liquidacion' | 'informe' | 'otro';
export interface Adjunto {
  id: string; organizationId: string;
  entidadTipo: string; entidadId: string;
  nombre: string; nombreStorage: string; url: string; contentType: string; tamaño: number;
  tipo: TipoAdjunto; descripcion?: string;
  subidoPor: string; subidoPorNombre?: string; createdAt: Date;
}
```

**`src/services/adjuntos.ts`** — imports: `getStorage, ref, uploadBytes, getDownloadURL, deleteObject` de `firebase/storage` + Firestore.

Colección: `organizations/{orgId}/adjuntos`
Storage path: `organizations/{orgId}/adjuntos/{entidadTipo}/{entidadId}/{nombreStorage}`

```typescript
export async function subirAdjunto(orgId, entidadTipo, entidadId, archivo: File, tipo, subidoPor, descripcion?): Promise<Adjunto>
// 1. nombreStorage = crypto.randomUUID() + extension
// 2. uploadBytes al path de Storage
// 3. getDownloadURL
// 4. addDoc en Firestore
// 5. retornar Adjunto completo

export async function obtenerAdjuntos(orgId, entidadTipo, entidadId): Promise<Adjunto[]>
export async function eliminarAdjunto(orgId, adjuntoId): Promise<void>
// 1. leer adjunto para obtener path
// 2. deleteObject en Storage
// 3. deleteDoc en Firestore
```

**Criterio de éxito:** `npx tsc --noEmit` sin errores.

---

### Agente D — Service Exportación Excel/PDF

**Puede ejecutarse en paralelo con:** Ola 1 — Agente A, B, C
**Depende de:** PLAN-00 completo

#### Archivos a crear
- `src/services/exportacion.ts`

#### Archivos a modificar
- `package.json` — agregar `"xlsx": "^0.18.5"`, `"jspdf": "^2.5.1"`, `"jspdf-autotable": "^3.8.2"`

#### Prompt completo para el agente

Sos un desarrollador senior en SIG Agro. Stack: Next.js 16 + TypeScript. Código corre en el browser.

**Primero:** agregar en `package.json` > `dependencies`:
```json
"xlsx": "^0.18.5",
"jspdf": "^2.5.1",
"jspdf-autotable": "^3.8.2"
```
Luego ejecutar `npm install`.

**`src/services/exportacion.ts`:**

```typescript
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ColumnaExport { header: string; key: string; formato?: 'texto' | 'numero' | 'moneda' | 'fecha'; }
export interface ConfigExport {
  titulo: string; subtitulo?: string; columnas: ColumnaExport[];
  datos: Record<string, unknown>[]; totales?: Record<string, number>;
  nombreArchivo: string; organizacion?: string;
}

export function exportarExcel(config: ConfigExport): void
// XLSX: fila título, fila encabezados (bold), filas datos, fila totales si hay. XLSX.writeFile.

export function exportarPDF(config: ConfigExport): void
// jsPDF landscape si > 5 cols. Título, subtítulo, autoTable, totales row, footer paginación.

// Convenience functions:
export function exportarLibroDiario(asientos: unknown[], orgNombre: string): void
export function exportarMayorCuenta(cuenta: string, movimientos: unknown[], orgNombre: string): void
export function exportarCuentaCorriente(tercero: string, movimientos: unknown[], saldo: number, orgNombre: string): void
export function exportarFlujoCaja(flujo: unknown, orgNombre: string): void
```

Formatear moneda: `new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)`.
Formatear fecha: `new Date(v).toLocaleDateString('es-AR')`.

**Criterio de éxito:** `npm install` exitoso. `npx tsc --noEmit` sin errores.

---

## Ola 2 — Frontend: UI de Control Interno
> PARALELO.

---

### Agente A — UI Auditoría

**Puede ejecutarse en paralelo con:** Ola 2 — Agente B, C, D
**Depende de:** Ola 1 — Agente A

#### Archivos a crear
- `src/app/(dashboard)/auditoria/page.tsx`

#### Prompt completo para el agente

**PluginGate:** `pluginId="iso_control_interno"`.

1. **Filtros:** módulo (select), acción (select con badge colors), usuario (texto), fecha desde/hasta.
2. **Tabla:** Fecha/Hora | Módulo (badge) | Acción (badge: crear=verde, modificar=amarillo, eliminar=rojo, anular=naranja, aprobar=azul) | Entidad | Usuario | Descripción.
3. **Detalle expandible** por fila: `valorAnterior` vs `valorNuevo` side-by-side como JSON formateado. Resaltar en amarillo los campos que cambiaron.
4. **Paginación simple:** primeros 50, botón "Cargar más".

Patrón: `src/app/(dashboard)/terceros/page.tsx` para PageShell y layout.

**Criterio de éxito:** `npx tsc --noEmit` sin errores.

---

### Agente B — UI Aprobaciones

**Puede ejecutarse en paralelo con:** Ola 2 — Agente A, C, D
**Depende de:** Ola 1 — Agente B

#### Archivos a crear
- `src/app/(dashboard)/aprobaciones/page.tsx`

#### Prompt completo para el agente

**PluginGate:** `pluginId="iso_control_interno"`.

1. **KPIs:** Pendientes (badge rojo si > 0) | Aprobadas hoy | Rechazadas mes.
2. **Tabs:** "Pendientes" | "Todas".
3. **Tab Pendientes:** tabla con Fecha | Tipo | Descripción | Solicitante | Monto | Acciones (Aprobar=verde / Rechazar=rojo).
   - Aprobar → Dialog confirmación + observación opcional.
   - Rechazar → Dialog con motivo requerido.
4. **Tab Todas:** igual + filtro estado + historial expandible.

**Criterio de éxito:** `npx tsc --noEmit` sin errores.

---

### Agente C — Componente GestorAdjuntos

**Puede ejecutarse en paralelo con:** Ola 2 — Agente A, B, D
**Depende de:** Ola 1 — Agente C

#### Archivos a crear
- `src/components/adjuntos/GestorAdjuntos.tsx`

#### Archivos a modificar
- `src/app/(dashboard)/cheques/page.tsx` — agregar `<GestorAdjuntos>` en detalle de cheque
- `src/app/(dashboard)/tesoreria/page.tsx` — agregar `<GestorAdjuntos>` en movimientos

#### Prompt completo para el agente

**`src/components/adjuntos/GestorAdjuntos.tsx`:**

```typescript
interface GestorAdjuntosProps {
  orgId: string; entidadTipo: string; entidadId: string;
  usuarioId: string; soloLectura?: boolean;
}
```

Funcionalidad:
1. Carga adjuntos con `obtenerAdjuntos(orgId, entidadTipo, entidadId)`.
2. Lista adjuntos: ícono tipo, nombre, fecha, quién subió. Link abrir URL. Botón eliminar si no soloLectura.
3. Zona upload (no soloLectura): `<input type="file" accept="image/*,.pdf">` max 10MB. Al seleccionar → select TipoAdjunto + descripción opcional + botón "Subir". Spinner durante subida.
4. Mensaje éxito/error.

**Modificar cheques y tesoreria:** en el panel de detalle expandible de cada entidad, agregar:
```tsx
<GestorAdjuntos orgId={user.organizationId} entidadTipo="cheque" entidadId={cheque.id} usuarioId={user.uid} />
```

**Criterio de éxito:** `npx tsc --noEmit` sin errores. Upload funciona.

---

### Agente D — Botones Exportación en Reportes

**Puede ejecutarse en paralelo con:** Ola 2 — Agente A, B, C
**Depende de:** Ola 1 — Agente D

#### Archivos a modificar
- `src/app/(dashboard)/contabilidad/mayor/page.tsx` — botones exportar Mayor
- `src/app/(dashboard)/terceros/[id]/page.tsx` — botón exportar CC
- `src/app/(dashboard)/flujo-caja/page.tsx` — botón exportar Flujo de Caja
- `src/app/(dashboard)/contabilidad/page.tsx` — botón exportar Libro Diario (implementar el ya existente)

#### Prompt completo para el agente

Sos un desarrollador senior en SIG Agro.

**Leer antes de modificar:**
- `src/contexts/PluginsContext.tsx` — `usePlugins()`
- `src/services/exportacion.ts` — `exportarLibroDiario`, `exportarMayorCuenta`, `exportarCuentaCorriente`, `exportarFlujoCaja`, `ConfigExport`
- Cada archivo que vas a modificar (leerlo completo antes)

**En cada página:**
1. Verificar `isActive('exportacion')` — si false, no mostrar botones.
2. Agregar grupo de botones en la toolbar:
   ```tsx
   {isActive('exportacion') && (
     <>
       <BaseButton onClick={() => exportarExcel(config)}><Download size={16} /> Excel</BaseButton>
       <BaseButton onClick={() => exportarPDF(config)}><FileText size={16} /> PDF</BaseButton>
     </>
   )}
   ```
3. Construir `ConfigExport` con los datos del estado local de la página.
4. Usar las funciones de conveniencia (exportarLibroDiario, exportarMayorCuenta, etc.).

**NO cambiar la lógica de carga de datos de las páginas. Solo agregar los botones.**

**Criterio de éxito:** `npx tsc --noEmit` sin errores. Botones aparecen solo con plugin activo y generan archivos reales.

---

## Verificación final Plan 06

- [ ] `AuditoriaService.registrar()` guarda en Firestore con diff de campos
- [ ] `/auditoria` muestra log con filtros y diff expandible
- [ ] `/aprobaciones` permite aprobar/rechazar con popup
- [ ] `GestorAdjuntos` sube archivos a Firebase Storage
- [ ] Botones exportación generan Excel y PDF reales
- [ ] Todo gateado por `isActive('iso_control_interno')` o `isActive('exportacion')`
- [ ] `npx tsc --noEmit` sin errores
- [ ] `npm run test` pasa 10/10
