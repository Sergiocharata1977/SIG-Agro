# Estado Actual Don Juan GIS

Fecha: 2026-05-03
Estado general: operativo en desarrollo activo

## Resumen ejecutivo

Don Juan GIS es una aplicacion Next.js 16 con Firebase, orientada a gestion operativa agro, multi-tenant por organizacion. Cuenta con un sistema de plugins comerciales para activar modulos opcionales por organizacion, sidebar reorganizado en 5 hubs operativos, IA conversacional, integraciones de comunicaciones (WhatsApp, SMS, email) y build dual (web + Android via Capacitor).

---

## Cambios implementados confirmados — Mayo 2026

### Arquitectura de plugins comerciales (02/05)

Se implemento el sistema completo de plugins como unidad comercial vendible:

- `src/contexts/PluginsContext.tsx` — hook `usePlugins()` con `isActive(pluginId)`
- `src/components/plugins/PluginGate.tsx` — wrapper que bloquea UI si plugin inactivo
- `src/components/plugins/PluginCard.tsx` — card visual para marketplace
- `src/services/plugins.ts` — CRUD en Firestore `organizations/{orgId}/settings/plugins`
- `/configuracion/plugins` — pagina ABM de plugins por organizacion
- `/super-admin/plugins` — pagina de administracion global

Plugins definidos: `contabilidad_avanzada`, `tesoreria`, `cuentas_corrientes`, `operaciones_comerciales`, `agro_gestion`, `presupuesto_control`, `iso_control_interno`, `exportacion`.

### Nuevos modulos ejecutados (02/05)

| Modulo | Ruta | Plugin requerido |
|---|---|---|
| Mayor contable | `/contabilidad/mayor` | `contabilidad_avanzada` |
| Cuenta corriente tercero | `/terceros/[id]` | `contabilidad_avanzada` |
| Operaciones comerciales | `/operaciones/comerciales` | `operaciones_comerciales` |
| Resultado por campana | `/campanas/resultado` | `agro_gestion` |
| Centros de costo | `/centros-costo` | `presupuesto_control` |
| Presupuesto vs real | `/presupuesto` | `presupuesto_control` |
| Auditoria de cambios | `/auditoria` | `iso_control_interno` |
| Aprobaciones | `/aprobaciones` | `iso_control_interno` |

Servicios nuevos: `resultado-campana.ts`, `centros-costo.ts`, `presupuesto.ts`, `operaciones-comerciales.ts`, `aprobaciones.ts`, `adjuntos.ts`, `exportacion.ts`, `auditoria/AuditoriaService.ts`.

Componente: `GestorAdjuntos.tsx` — upload a Firebase Storage.

Tipos nuevos: `auditoria.ts`, `aprobaciones.ts`, `adjuntos.ts`, `centros-costo.ts`, `presupuesto.ts`, `operaciones-comerciales.ts`.

### Sidebar reorganizado (02/05)

El sidebar paso de 4 hubs (Operaciones Agro, Insumos y Stock, Granos y Silos, Finanzas) a 5 hubs operativos:

1. **Campos y GIS** — mapa, campos, lotes, satelital (antes enterrado en megaMenu)
2. **Planificacion de Campana** — campanas, cuaderno, rendimientos
3. **Compras** — insumos, ordenes, proveedores, pagos
4. **Gestion Operaciones y Stock** — siembra, fertilizacion, aplicaciones, cosecha, depositos, stock
5. **Stock Terceros y Ventas** — granos acopiador, entregas, cartas de porte, ventas, cobranzas

El megaMenu quedo reducido a Panel General (dashboard + metricas).

### Rebranding a Don Juan GIS (02/05)

Renombre completo del branding de SIG Agro a Don Juan GIS en toda la interfaz de usuario.

### Fix build Vercel/Capacitor (02/05)

`next.config.ts` hace condicional `output:'export'` segun variable `CAPACITOR_BUILD=true`.
- Vercel: build SSR normal con API routes dinamicas.
- Android APK: `CAPACITOR_BUILD=true` genera `/out` estatico para Capacitor.

### WhatsApp Meta API + LLM Router + ElevenLabs TTS (01/05)

- WhatsApp Business API bidireccional con webhook publico.
- Router LLM multi-proveedor: Groq como primario, Claude como fallback.
- Sintesis de voz con ElevenLabs.
- Conversaciones persistidas en Firestore.

### Sidebar con popups hub y megaMenu (01/05)

- Navegacion unificada en sidebar persistente.
- MegaMenu popup para Panel/GIS/Campanas.
- Popups independientes para cada hub operativo con indicadores y descripciones.
- Correcciones de z-index sobre mapa Leaflet.

### Rediseno UI Stitch + arquitectura multi-tenant (01/05)

- Nuevo sistema visual con tokens de color y temas (verde, azul, negro).
- Arquitectura multi-tenant consolidada por `organizationId`.
- Sistema de roles con `canPerformAction('admin')` y `hasModuleAccess(module)`.

---

## Cambios implementados previos (base acumulada)

- Navegacion principal del dashboard unificada con sidebar persistente.
- Soporte multi-tenant por organizacion activa.
- ABM de organizaciones.
- Dashboard, campos, campanias, cuaderno, riego, operaciones, contabilidad, lotes y rentabilidad.
- Analisis IA disponible por endpoints y dashboard dedicado.
- Notificaciones push FCM reales.
- Alertas por email, SMS y WhatsApp salientes.
- Text-to-Speech via ElevenLabs.
- PWA/offline y service worker.

---

## Archivos clave de navegacion

- `src/app/(dashboard)/layout.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/contexts/PluginsContext.tsx`
- `src/components/plugins/PluginGate.tsx`
