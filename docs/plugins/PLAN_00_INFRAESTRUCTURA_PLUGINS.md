# Plan 00 — Infraestructura de Plugins

**Fecha:** 2026-05-02
**Feature:** Sistema base para activar/desactivar plugins por organización
**Proyecto:** SIG-Agro
**Prioridad:** CRÍTICO — todo lo demás depende de este plan

---

## Resumen de olas

| Ola | Agentes | Paralelos entre sí | Dependen de |
|-----|---------|---------------------|-------------|
| 1 | A, B | Sí | Nada |
| 2 | A, B | Sí | Ola 1 completa |

---

## Ola 1 — Backend: Types + Service + Hook
> Agente A y Agente B son independientes. Ejecutar en PARALELO.

---

### Agente A — Types, Service y Context de Plugins

**Puede ejecutarse en paralelo con:** Ola 1 — Agente B
**Depende de:** nada — es la primera ola

#### Objetivo
Crear los tipos, el servicio Firestore y el contexto React para el sistema de plugins.

#### Archivos a crear
- `src/types/plugins.ts` — PluginId, Plugin, OrganizationPlugins
- `src/services/plugins.ts` — CRUD Firestore para plugins de la org
- `src/contexts/PluginsContext.tsx` — React context + hook usePlugins()

#### Prompt completo para el agente

Sos un desarrollador senior en SIG Agro / Don Juan GIS. Stack: Next.js 16 + React 19 + TypeScript + Firebase/Firestore. Multi-tenant por `organizationId`. El contexto de auth está en `src/contexts/AuthContext.tsx` y expone `{ user }` donde `user.organizationId` es el tenant ID.

**Leer como modelos:**
- `src/contexts/AuthContext.tsx` — cómo se estructura un context React con Firebase
- `src/services/terceros.ts` — patrón de servicio Firestore
- `src/types/contabilidad-simple.ts` — cómo se definen tipos

---

**Archivo 1: `src/types/plugins.ts`**

```typescript
export type PluginId =
  | 'contabilidad_avanzada'
  | 'tesoreria'
  | 'cuentas_corrientes'
  | 'operaciones_comerciales'
  | 'agro_gestion'
  | 'presupuesto_control'
  | 'iso_control_interno'
  | 'exportacion';

export interface PluginDefinicion {
  id: PluginId;
  nombre: string;
  descripcion: string;
  icono: string;                  // nombre de ícono lucide-react
  categoria: 'contabilidad' | 'tesoreria' | 'comercial' | 'agro' | 'control';
  dependencias?: PluginId[];      // plugins requeridos
  rutasHabilitadas: string[];     // rutas de Next.js que habilita (para sidebar)
}

export interface OrganizationPlugins {
  organizationId: string;
  pluginsActivos: PluginId[];
  updatedAt: Date;
  updatedBy: string;
}

// Catálogo completo de plugins disponibles en el sistema
export const CATALOGO_PLUGINS: PluginDefinicion[] = [
  {
    id: 'contabilidad_avanzada',
    nombre: 'Contabilidad Avanzada',
    descripcion: 'Mayor por cuenta, libro diario completo y cuentas corrientes detalladas con historial y mora.',
    icono: 'BookOpen',
    categoria: 'contabilidad',
    rutasHabilitadas: ['/contabilidad/mayor', '/terceros/[id]'],
  },
  {
    id: 'tesoreria',
    nombre: 'Tesorería',
    descripcion: 'Control de caja, bancos, cheques recibidos/emitidos y flujo de caja proyectado.',
    icono: 'Landmark',
    categoria: 'tesoreria',
    rutasHabilitadas: ['/tesoreria', '/cheques', '/flujo-caja'],
  },
  {
    id: 'operaciones_comerciales',
    nombre: 'Operaciones Comerciales',
    descripcion: 'Servicios técnicos, venta de repuestos, venta de maquinaria y operaciones financieras avanzadas.',
    icono: 'ShoppingCart',
    categoria: 'comercial',
    rutasHabilitadas: ['/operaciones/comerciales'],
  },
  {
    id: 'agro_gestion',
    nombre: 'Agro Gestión',
    descripcion: 'Resultado económico por campaña y por lote, desglose de costos e ingresos, comparativa interanual.',
    icono: 'Sprout',
    categoria: 'agro',
    rutasHabilitadas: ['/campanas/resultado'],
  },
  {
    id: 'presupuesto_control',
    nombre: 'Presupuesto & Control',
    descripcion: 'Centros de costo, presupuesto por campaña y comparativa presupuesto vs ejecución real.',
    icono: 'BarChart3',
    categoria: 'control',
    rutasHabilitadas: ['/centros-costo', '/presupuesto'],
  },
  {
    id: 'iso_control_interno',
    nombre: 'ISO & Control Interno',
    descripcion: 'Auditoría de cambios, workflow de aprobaciones y adjuntos de comprobantes.',
    icono: 'ShieldCheck',
    categoria: 'control',
    rutasHabilitadas: ['/auditoria', '/aprobaciones'],
  },
  {
    id: 'exportacion',
    nombre: 'Exportación Excel/PDF',
    descripcion: 'Descarga de reportes en Excel y PDF: libro diario, mayor, cuentas corrientes, flujo de caja.',
    icono: 'Download',
    categoria: 'contabilidad',
    rutasHabilitadas: [],  // no agrega rutas, agrega botones en páginas existentes
  },
];
```

---

**Archivo 2: `src/services/plugins.ts`**

Colección Firestore: `organizations/{orgId}/settings/plugins` (documento único por org)

```typescript
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { OrganizationPlugins, PluginId } from '@/types/plugins';

export async function obtenerPluginsActivos(orgId: string): Promise<PluginId[]>
// Lee doc en organizations/{orgId}/settings/plugins
// Si no existe → retorna [] (sin plugins activos)
// Retorna pluginsActivos del documento

export async function activarPlugin(orgId: string, pluginId: PluginId, userId: string): Promise<void>
// Lee el doc actual, agrega pluginId al array si no está, guarda

export async function desactivarPlugin(orgId: string, pluginId: PluginId, userId: string): Promise<void>
// Lee el doc actual, remueve pluginId del array, guarda

export async function setPluginsActivos(orgId: string, plugins: PluginId[], userId: string): Promise<void>
// Reemplaza toda la lista de plugins activos (usado desde super-admin)

export function tienePlugin(pluginsActivos: PluginId[], pluginId: PluginId): boolean
// Función pura: retorna pluginsActivos.includes(pluginId)
```

---

**Archivo 3: `src/contexts/PluginsContext.tsx`**

```typescript
'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { obtenerPluginsActivos } from '@/services/plugins';
import type { PluginId } from '@/types/plugins';

interface PluginsContextValue {
  pluginsActivos: PluginId[];
  isActive: (pluginId: PluginId) => boolean;
  loading: boolean;
  refetch: () => Promise<void>;
}

const PluginsContext = createContext<PluginsContextValue>({
  pluginsActivos: [],
  isActive: () => false,
  loading: true,
  refetch: async () => {},
});

export function PluginsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [pluginsActivos, setPluginsActivos] = useState<PluginId[]>([]);
  const [loading, setLoading] = useState(true);

  async function cargar() {
    if (!user?.organizationId) return;
    setLoading(true);
    try {
      const activos = await obtenerPluginsActivos(user.organizationId);
      setPluginsActivos(activos);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void cargar(); }, [user?.organizationId]);

  return (
    <PluginsContext.Provider value={{
      pluginsActivos,
      isActive: (id) => pluginsActivos.includes(id),
      loading,
      refetch: cargar,
    }}>
      {children}
    </PluginsContext.Provider>
  );
}

export function usePlugins() {
  return useContext(PluginsContext);
}
```

El `PluginsProvider` debe agregarse en `src/app/layout.tsx` dentro del árbol de providers (después de `AuthProvider`).

**Modificar `src/app/layout.tsx`:** importar `PluginsProvider` y envolver el contenido. Leer el layout actual antes de modificar.

**Criterio de éxito:**
- `npx tsc --noEmit` sin errores.
- El hook `usePlugins()` retorna `{ isActive, pluginsActivos, loading }`.
- El servicio lee y escribe en Firestore correctamente.

---

### Agente B — Componente PluginGate

**Puede ejecutarse en paralelo con:** Ola 1 — Agente A
**Depende de:** nada

#### Objetivo
Crear el componente `PluginGate` que actúa como guardia: si el plugin no está activo muestra una pantalla de "módulo no disponible", si está activo renderiza los children.

#### Archivos a crear
- `src/components/plugins/PluginGate.tsx` — componente guardia
- `src/components/plugins/PluginCard.tsx` — card visual de plugin para el catálogo

#### Prompt completo para el agente

Sos un desarrollador senior en SIG Agro. Stack: Next.js 16 + React 19 + TypeScript + Tailwind CSS 4.

**Leer como modelos:**
- `src/components/design-system/index.ts` — qué componentes hay disponibles
- `src/app/(dashboard)/terceros/page.tsx` — cómo se usa PageShell, BaseCard, BaseButton

**IMPORTANTE:** Este agente NO puede usar `usePlugins()` porque ese hook lo crea el Agente A en la misma ola. En cambio, `PluginGate` recibe las props directamente.

---

**Archivo 1: `src/components/plugins/PluginGate.tsx`**

```typescript
import type { ReactNode } from 'react';
import type { PluginId, PluginDefinicion } from '@/types/plugins';
import { CATALOGO_PLUGINS } from '@/types/plugins';
// Íconos de lucide-react: Lock, ExternalLink, Sparkles

interface PluginGateProps {
  pluginId: PluginId;
  isActive: boolean;        // viene del hook usePlugins() en el padre
  children: ReactNode;
  fallback?: ReactNode;     // si se pasa, usa este en vez del default
}
```

Comportamiento:
- Si `isActive === true`: renderiza `{children}` directamente, sin wrapper
- Si `isActive === false` y hay `fallback`: renderiza `{fallback}`
- Si `isActive === false` y no hay `fallback`: renderiza la pantalla de "módulo no disponible"

**Pantalla de módulo no disponible** (diseño):
```
┌─────────────────────────────────────────┐
│  🔒  [ícono del plugin]                  │
│                                         │
│  [nombre del plugin]                    │
│  [descripción del plugin]               │
│                                         │
│  Este módulo no está activo en tu plan  │
│                                         │
│  [Botón "Contactar para activar"]       │  → href="mailto:info@donjuangis.com"
└─────────────────────────────────────────┘
```

Usar `CATALOGO_PLUGINS.find(p => p.id === pluginId)` para obtener nombre, descripción e ícono.
Centrar en pantalla. Fondo gris suave. Ícono candado grande. Botones con BaseButton.

---

**Archivo 2: `src/components/plugins/PluginCard.tsx`**

Card visual para mostrar un plugin en el panel de configuración. Props:

```typescript
interface PluginCardProps {
  plugin: PluginDefinicion;
  activo: boolean;
  onActivar?: () => void;   // solo en modo admin
  onDesactivar?: () => void;
  modoAdmin?: boolean;      // si false, solo muestra info
}
```

Diseño de la card:
- Header: ícono del plugin (de lucide-react) + nombre + badge "Activo" / "Inactivo"
- Body: descripción
- Footer (solo si `modoAdmin`): botón "Activar" (verde) o "Desactivar" (rojo)
- Si `modoAdmin === false` y no está activo: botón "Más información" o "Contactar"

**Criterio de éxito:**
- `npx tsc --noEmit` sin errores.
- `PluginGate` muestra la pantalla de upgrade cuando `isActive=false`.
- `PluginCard` muestra correctamente el estado del plugin.

---

## Ola 2 — Frontend: UI de configuración de plugins
> Ejecutar SOLO después de Ola 1.
> Agente A y Agente B son independientes. Ejecutar en PARALELO.

---

### Agente A — Página de Configuración de Plugins (usuario)

**Puede ejecutarse en paralelo con:** Ola 2 — Agente B
**Depende de:** Ola 1 completa

#### Objetivo
Crear la página `/configuracion/plugins` donde cada organización puede ver qué plugins tiene activos y solicitar nuevos.

#### Archivos a crear
- `src/app/(dashboard)/configuracion/plugins/page.tsx` — vista de plugins del usuario

#### Prompt completo para el agente

Sos un desarrollador senior en SIG Agro. Stack: Next.js 16 + React 19 + TypeScript + Tailwind CSS 4.

**Leer antes de crear:**
- `src/types/plugins.ts` — CATALOGO_PLUGINS, PluginId, PluginDefinicion
- `src/hooks/usePlugins.ts` o `src/contexts/PluginsContext.tsx` — hook usePlugins()
- `src/components/plugins/PluginCard.tsx` — componente PluginCard
- `src/app/(dashboard)/terceros/page.tsx` — patrón PageShell, BaseCard

**Funcionalidad:**

1. **Header:** "Módulos de tu plan" + descripción breve

2. **KPIs:** N° módulos activos / N° módulos disponibles

3. **Grid de PluginCards** agrupados por categoría:
   - Categoría Contabilidad
   - Categoría Tesorería
   - Categoría Comercial
   - Categoría Agro
   - Categoría Control

4. Cada card usa `<PluginCard plugin={p} activo={isActive(p.id)} modoAdmin={false} />`.

5. Los plugins activos se ven con badge verde "Activo" y ícono check.
   Los inactivos se ven con badge gris y ícono candado.

6. **NO** tiene botones de activar/desactivar (eso es solo para super-admin). Solo información.

**Criterio de éxito:** `npx tsc --noEmit` sin errores. La página carga y muestra los plugins del catálogo con su estado.

---

### Agente B — Panel Super-Admin de Plugins

**Puede ejecutarse en paralelo con:** Ola 2 — Agente A
**Depende de:** Ola 1 completa

#### Objetivo
Crear la página de super-admin para activar/desactivar plugins por organización.

#### Archivos a crear
- `src/app/(dashboard)/super-admin/plugins/page.tsx` — panel de activación para super-admin

#### Prompt completo para el agente

Sos un desarrollador senior en SIG Agro. Stack: Next.js 16 + React 19 + TypeScript + Tailwind CSS 4.

**Leer antes de crear:**
- `src/types/plugins.ts` — CATALOGO_PLUGINS, PluginId
- `src/services/plugins.ts` — activarPlugin, desactivarPlugin, setPluginsActivos, obtenerPluginsActivos
- `src/components/plugins/PluginCard.tsx` — PluginCard con modoAdmin=true
- `src/app/(dashboard)/terceros/page.tsx` — patrón de página

**Funcionalidad:**

1. **Selector de organización** (dropdown) — cargar lista de organizaciones desde `src/app/api/super-admin/organizations/route.ts` o directamente desde Firestore `organizations/` collection.

2. **Al seleccionar una org:** cargar sus plugins activos con `obtenerPluginsActivos(orgId)`.

3. **Grid de PluginCards** con `modoAdmin={true}`:
   - Botón "Activar" llama `activarPlugin(orgId, pluginId, userId)` + refetch
   - Botón "Desactivar" llama `desactivarPlugin(orgId, pluginId, userId)` + refetch
   - Mostrar loading spinner durante la operación

4. **Botón "Guardar preset"** → Dialog donde se puede guardar la combinación de plugins como preset (guardar en Firestore `superadmin/presets/{nombre}` → `{ plugins: PluginId[] }`). Útil para "Plan Básico", "Plan Agro", "Plan Full".

5. **Botón "Aplicar preset"** → Dialog que muestra los presets guardados y permite aplicar uno de un click a la org seleccionada.

**Criterio de éxito:** `npx tsc --noEmit` sin errores. El super-admin puede activar/desactivar plugins por org.

---

## Verificación final Plan 00

- [ ] `src/types/plugins.ts` exporta `PluginId`, `PluginDefinicion`, `CATALOGO_PLUGINS`
- [ ] `src/services/plugins.ts` lee y escribe en `organizations/{orgId}/settings/plugins`
- [ ] `src/contexts/PluginsContext.tsx` exporta `PluginsProvider` y `usePlugins()`
- [ ] `PluginsProvider` está en `src/app/layout.tsx`
- [ ] `usePlugins().isActive('tesoreria')` retorna `false` para una org sin plugins
- [ ] `PluginGate` con `isActive=false` muestra pantalla de upgrade
- [ ] `/configuracion/plugins` muestra el catálogo con estados
- [ ] `/super-admin/plugins` permite activar/desactivar por org
- [ ] `npx tsc --noEmit` sin errores
- [ ] `npm run test` pasa 10/10
