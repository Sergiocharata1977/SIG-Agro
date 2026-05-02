# Plan 01 — Plugin: Contabilidad Avanzada

**Fecha:** 2026-05-02
**Plugin ID:** `contabilidad_avanzada`
**Feature:** Mayor por cuenta + Cuenta corriente completa de terceros
**Depende de:** PLAN-00 completo (infraestructura de plugins)
**Servicios ya existentes:** CuentasService, AsientosService, TercerosService, contabilidad.ts, terceros.ts

---

## Resumen de olas

| Ola | Agentes | Paralelos entre sí | Dependen de |
|-----|---------|---------------------|-------------|
| 1 | A, B | Sí | PLAN-00 completo |

> Una sola ola: los servicios ya existen, solo es UI. Agentes independientes.

---

## Ola 1 — UI: Mayor y Cuenta Corriente
> Ejecutar Agente A + Agente B en PARALELO.

---

### Agente A — Página Mayor por Cuenta

**Puede ejecutarse en paralelo con:** Ola 1 — Agente B
**Depende de:** PLAN-00 completo

#### Objetivo
Crear la página `/contabilidad/mayor` protegida con `PluginGate` que muestra todos los movimientos de una cuenta contable con filtros y saldo acumulado.

#### Archivos a crear
- `src/app/(dashboard)/contabilidad/mayor/page.tsx`

#### Archivos a modificar
- `src/app/(dashboard)/contabilidad/page.tsx` — agregar link "Ver Mayor" en tabla de cuentas

#### Prompt completo para el agente

Sos un desarrollador senior en SIG Agro. Stack: Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 + Firebase.

**Leer antes de crear:**
- `src/contexts/PluginsContext.tsx` — hook `usePlugins()`
- `src/components/plugins/PluginGate.tsx` — componente PluginGate
- `src/app/(dashboard)/contabilidad/page.tsx` — patrón de página, useAuth, imports
- `src/services/contabilidad.ts` — `obtenerAsientos(uid)`, `obtenerCuentas(uid)`
- `src/types/contabilidad.ts` — `AsientoContable`, `CuentaContable`
- `src/components/design-system/index.ts` — componentes disponibles

**Estructura de la página:**

```tsx
export default function MayorPage() {
  const { isActive } = usePlugins();
  
  // Si el plugin no está activo → mostrar gate
  if (!isActive('contabilidad_avanzada')) {
    return <PluginGate pluginId="contabilidad_avanzada" isActive={false}>{null}</PluginGate>;
  }
  
  // Resto del componente...
}
```

**Funcionalidad:**

1. **Selector de cuenta:** dropdown que carga desde `obtenerCuentas(firebaseUser.uid)`. Formato: "1.1.1 — Caja".
   Si la URL tiene query param `?cuenta=1.1.1` → preseleccionar esa cuenta.

2. **Filtros:** fecha desde, fecha hasta, tipo de asiento (todos/apertura/operativo/ajuste/cierre/automático).

3. **Tabla Mayor** (cuando hay cuenta seleccionada):
   | Fecha | N° Asiento | Concepto | Tipo | Debe | Haber | Saldo acumulado |
   - Orden: fecha ASC.
   - Saldo acumulado: para activo/gasto → debe suma, haber resta. Para pasivo/patrimonio/ingreso → invertido.
   - Fila en rojo si saldo negativo en cuenta de activo.

4. **Totales al pie:** Total Debe | Total Haber | Saldo final.

5. **KPIs:** Saldo actual | Movimientos en período | Último movimiento.

**Lógica de datos:**
- `obtenerAsientos(firebaseUser.uid)` devuelve todos los asientos.
- Filtrar client-side: asientos que tienen una línea con `cuentaId` o `cuentaCodigo` igual a la cuenta seleccionada.
- Calcular saldo acumulado ordenando por fecha.

**Modificar contabilidad/page.tsx:**
En la tabla del balance, columna "Acciones" → `<Link href={/contabilidad/mayor?cuenta=${c.cuentaCodigo}}>Mayor</Link>`.

**Criterio de éxito:**
- `npx tsc --noEmit` sin errores.
- Si plugin inactivo → muestra PluginGate.
- Si plugin activo → tabla con saldo acumulado correcto.

---

### Agente B — Página Cuenta Corriente de Terceros

**Puede ejecutarse en paralelo con:** Ola 1 — Agente A
**Depende de:** PLAN-00 completo

#### Objetivo
Crear `/terceros/[id]` con historial completo de movimientos, saldo, mora y estado de cuenta, protegida con PluginGate.

#### Archivos a crear
- `src/app/(dashboard)/terceros/[id]/page.tsx`

#### Archivos a modificar
- `src/app/(dashboard)/terceros/page.tsx` — agregar botón "Ver CC" por fila

#### Prompt completo para el agente

Sos un desarrollador senior en SIG Agro. Stack: Next.js 16 + React 19 + TypeScript + Tailwind CSS 4.

**Leer antes de crear:**
- `src/contexts/PluginsContext.tsx` — `usePlugins()`
- `src/components/plugins/PluginGate.tsx`
- `src/app/(dashboard)/terceros/page.tsx` — patrón completo
- `src/services/terceros.ts` — `obtenerTercero(orgId, id)`, `obtenerMovimientosTercero(orgId, id)`
- `src/types/contabilidad-simple.ts` — `Tercero`, `MovimientoTercero`

**Estructura de la página:**

```tsx
'use client';
import { useParams } from 'next/navigation';
// ...
export default function CuentaCorrientePage() {
  const { isActive } = usePlugins();
  const params = useParams();
  const id = params.id as string;
  
  if (!isActive('contabilidad_avanzada')) {
    return <PluginGate pluginId="contabilidad_avanzada" isActive={false}>{null}</PluginGate>;
  }
  // ...
}
```

**Funcionalidad:**

1. **Header:** nombre, CUIT, tipo (badge), localidad. Botón "← Volver a Terceros".

2. **4 KPIs:**
   - Saldo cliente (lo que nos debe) — verde si > 0
   - Saldo proveedor (lo que le debemos) — rojo si > 0
   - Total movimientos
   - Último movimiento (fecha)

3. **Filtros:** fecha desde/hasta, tipo de operación.

4. **Tabla de movimientos:**
   | Fecha | Tipo (badge color por tipo) | Descripción | Cargo cliente | Abono cliente | Saldo cliente | Cargo proveedor | Abono proveedor | Saldo proveedor |
   - Orden: fecha DESC.
   - Saldo acumulado calculado desde el más antiguo.

5. **Sección mora (simple):** movimientos con `montoCliente > 0` de más de 30 días sin cobro posterior. Mostrar días vencidos.

6. **Totales al pie.**

**Modificar terceros/page.tsx:**
En acciones de cada fila: `<Link href={/terceros/${t.id}}>Ver CC</Link>`.

**Criterio de éxito:**
- `npx tsc --noEmit` sin errores.
- PluginGate funciona.
- Historial con saldo acumulado correcto.

---

## Verificación final Plan 01

- [ ] `/contabilidad/mayor` muestra PluginGate cuando `contabilidad_avanzada` no está activo
- [ ] `/contabilidad/mayor?cuenta=1.1.1` preselecciona la cuenta correcta
- [ ] Saldo acumulado es correcto para cuentas de activo y de pasivo
- [ ] `/terceros/[id]` muestra PluginGate cuando plugin inactivo
- [ ] `/terceros/[id]` carga movimientos y calcula saldo correctamente
- [ ] `npx tsc --noEmit` sin errores
