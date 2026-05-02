# Plan ABM Popup — Conversión de formularios inline a Dialog

**Fecha:** 2026-05-02
**Feature:** Convertir todos los ABMs existentes al patrón popup Dialog
**Depende de:** Nada — puede ejecutarse en PARALELO con PLAN-00
**Nota:** Las páginas NUEVAS creadas en PLAN-01 a 06 ya usan popup desde el inicio.

---

## Resumen de olas

| Ola | Agentes | Paralelos entre sí | Dependen de |
|-----|---------|---------------------|-------------|
| 1 | A, B, C, D, E | Sí | Nada |

**Páginas ya correctas (NO tocar):**
- `terceros/page.tsx` — ya tiene Dialog
- `organizaciones/page.tsx` — ya tiene Dialogs

---

## PATRÓN ESTÁNDAR — referencia para todos los agentes

```typescript
// Estado
const [dialogOpen, setDialogOpen] = useState(false);
const [editando, setEditando] = useState<Entidad | null>(null);
const [formData, setFormData] = useState<FormState>(EMPTY_FORM);
const [guardando, setGuardando] = useState(false);

// Abrir (crea o edita)
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
    editando ? await actualizar(orgId, editando.id, formData) : await crear(orgId, formData);
    setDialogOpen(false); setEditando(null); setFormData(EMPTY_FORM);
    await cargarDatos();
  } finally { setGuardando(false); }
}
```

Imports: `import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'`

---

## Ola 1 — Convertir páginas existentes (5 agentes paralelos)

---

### Agente A — Convertir /operaciones a popup

**Puede ejecutarse en paralelo con:** Ola 1 — Agente B, C, D, E
**Depende de:** nada

#### Archivos a modificar
- `src/app/(dashboard)/operaciones/page.tsx`

#### Prompt completo para el agente

Sos un desarrollador senior en SIG Agro. Stack: Next.js 16 + React 19 + TypeScript + Tailwind CSS 4.

**Leer COMPLETO antes de modificar:**
- `src/app/(dashboard)/operaciones/page.tsx`
- `src/app/(dashboard)/terceros/page.tsx` — patrón Dialog de referencia
- `src/types/contabilidad-simple.ts` — TipoOperacion

La página muestra formularios inline. Convertir a Dialog de 2 pasos:

**Estado:**
```typescript
const [dialogOpen, setDialogOpen] = useState(false);
const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoOperacion | null>(null);
const [guardando, setGuardando] = useState(false);
```

**Vista 1** (tipoSeleccionado === null): grilla de 7 cards con nombre + ícono de cada tipo. Click en card → `setTipoSeleccionado(tipo)`.

**Vista 2** (tipoSeleccionado !== null): formulario específico del tipo + botón "← Volver" + botón "Cancelar".

Al guardar: llama mismo handler existente → `setDialogOpen(false)` → recarga lista.

La lista "Registros operativos" queda como panel principal. Botón "+ Registrar operación" arriba.

NO cambiar la lógica de negocio ni los servicios.

**Criterio de éxito:** `npx tsc --noEmit` sin errores. Dialog funciona con todos los tipos.

---

### Agente B — Convertir /campanias + eliminar /campanias/nueva

**Puede ejecutarse en paralelo con:** Ola 1 — Agente A, C, D, E
**Depende de:** nada

#### Archivos a modificar
- `src/app/(dashboard)/campanias/page.tsx`
- `src/app/(dashboard)/campanias/nueva/page.tsx` → reemplazar con redirect

#### Prompt completo para el agente

Sos un desarrollador senior en SIG Agro.

**Leer COMPLETO:**
- `src/app/(dashboard)/campanias/page.tsx`
- `src/app/(dashboard)/campanias/nueva/page.tsx` — campos del formulario a mover
- `src/app/(dashboard)/terceros/page.tsx` — patrón Dialog

1. En `campanias/page.tsx`: aplicar patrón estándar ABM popup. Botón "Nueva campaña" → Dialog. Botón "Editar" en fila → mismo Dialog prellenado. Campos iguales que en `/campanias/nueva`.

2. En `campanias/nueva/page.tsx`:
```typescript
import { redirect } from 'next/navigation';
export default function NuevaCampaniaPage() { redirect('/campanias'); }
```

**Criterio de éxito:** `npx tsc --noEmit` sin errores. CRUD desde Dialog.

---

### Agente C — Convertir /contabilidad/asiento + mover formulario

**Puede ejecutarse en paralelo con:** Ola 1 — Agente A, B, D, E
**Depende de:** nada

#### Archivos a modificar
- `src/app/(dashboard)/contabilidad/page.tsx`
- `src/app/(dashboard)/contabilidad/asiento/page.tsx` → redirect

#### Prompt completo para el agente

**Leer COMPLETO:**
- `src/app/(dashboard)/contabilidad/page.tsx`
- `src/app/(dashboard)/contabilidad/asiento/page.tsx`
- `src/services/contabilidad.ts` — crearAsiento
- `src/types/contabilidad.ts` — AsientoContable, LineaAsiento

1. En `contabilidad/page.tsx`: cambiar botón/link "Nuevo asiento" para abrir Dialog (max-w-4xl). Formulario con: fecha, concepto, tipo. Tabla dinámica de líneas con "Agregar línea" y botón X. Totales en tiempo real. Guardar deshabilitado si Debe ≠ Haber (tolerancia 0.01).

2. En `contabilidad/asiento/page.tsx`:
```typescript
import { redirect } from 'next/navigation';
export default function AsientoPage() { redirect('/contabilidad'); }
```

**Criterio de éxito:** `npx tsc --noEmit` sin errores.

---

### Agente D — Convertir /campos + eliminar /campos/nuevo

**Puede ejecutarse en paralelo con:** Ola 1 — Agente A, B, C, E
**Depende de:** nada

#### Archivos a modificar
- `src/app/(dashboard)/campos/page.tsx`
- `src/app/(dashboard)/campos/nuevo/page.tsx` → redirect

#### Prompt completo para el agente

**Leer COMPLETO:**
- `src/app/(dashboard)/campos/page.tsx`
- `src/app/(dashboard)/campos/nuevo/page.tsx`
- `src/app/(dashboard)/terceros/page.tsx` — patrón Dialog

1. `campos/page.tsx`: agregar patrón ABM popup con campos del formulario de `/campos/nuevo`. Botón "Nuevo campo" y botón "Editar" en filas.

2. `campos/nuevo/page.tsx`:
```typescript
import { redirect } from 'next/navigation';
export default function NuevoCampoPage() { redirect('/campos'); }
```

**Criterio de éxito:** `npx tsc --noEmit` sin errores.

---

### Agente E — Convertir /cuaderno y /riego

**Puede ejecutarse en paralelo con:** Ola 1 — Agente A, B, C, D
**Depende de:** nada

#### Archivos a modificar
- `src/app/(dashboard)/cuaderno/page.tsx`
- `src/app/(dashboard)/riego/page.tsx`

#### Prompt completo para el agente

Sos un desarrollador senior en SIG Agro.

**Leer COMPLETO:**
- `src/app/(dashboard)/cuaderno/page.tsx`
- `src/app/(dashboard)/riego/page.tsx`
- `src/app/(dashboard)/terceros/page.tsx` — patrón Dialog

Para cada archivo:
- Identificar todos los formularios inline (alta de registros, tratamientos, planes de riego, etc.)
- Moverlos a Dialog con patrón estándar
- La lista principal permanece en la página
- Botón "Nuevo X" abre Dialog. Botón "Editar" en cada fila abre Dialog prellenado
- NO cambiar la lógica de negocio, servicios ni validaciones

Agregar imports: `import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'`

**Criterio de éxito:** `npx tsc --noEmit` sin errores en ambos archivos.

---

## Verificación final Plan ABM Popup

- [ ] `/operaciones` — Dialog selector de tipo + formulario
- [ ] `/campanias` — CRUD con Dialog. `/campanias/nueva` redirige
- [ ] `/contabilidad` — Dialog asiento manual. `/contabilidad/asiento` redirige
- [ ] `/campos` — CRUD con Dialog. `/campos/nuevo` redirige
- [ ] `/cuaderno` — formularios en Dialog
- [ ] `/riego` — formularios en Dialog
- [ ] `npx tsc --noEmit` sin errores
- [ ] `npm run test` pasa 10/10
