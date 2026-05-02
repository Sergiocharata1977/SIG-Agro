# Estado Actual Don Juan GIS

Fecha: 2026-05-01
Estado general: operativo en desarrollo

## Resumen ejecutivo

Don Juan GIS es una aplicacion Next.js 16 con Firebase, orientada a gestion operativa agro, multi-tenant por organizacion, con plugins funcionales, paneles operativos, modulos productivos y una capa de IA conversacional e integraciones de comunicaciones en expansion.

## Cambios implementados confirmados

- Navegacion principal del dashboard unificada con sidebar persistente.
- Eliminacion de la navegacion superior legacy del dashboard.
- Soporte multi-tenant por organizacion activa.
- Sistema de plugins visible en navegacion y control de acceso.
- ABM basico de organizaciones.
- Dashboard, campos, campanias, scouting, riego, operaciones, contabilidad, lotes y rentabilidad presentes en repo.
- Analisis IA disponible por endpoints y dashboard dedicado.
- Router LLM multi-proveedor con Groq como primario y Claude como fallback.
- Conversaciones IA persistidas en Firestore para chat web y adaptadores multi-canal.
- Notificaciones push FCM reales.
- WhatsApp Meta bidireccional con webhook publico y conversaciones persistidas.
- Alertas por email, SMS y WhatsApp salientes desde backend.
- Text-to-Speech de Don Juan GIS via ElevenLabs.
- PWA/offline y service worker presentes.

## Cambio reciente de navegacion

El layout del dashboard usa ahora `Sidebar` como navegacion principal persistente en todas las pantallas del grupo `(dashboard)`.

Archivos clave:

- `src/app/(dashboard)/layout.tsx`
- `src/components/layout/Sidebar.tsx`

Cambio aplicado:

- Se removio el componente `DashboardHeader` como menu principal.
- El menu lateral ya no desaparece al entrar a modulos como `analisis-ia` u otras pantallas del dashboard.

## Estado funcional por area

### Core

- Auth con Firebase: implementado.
- Organizaciones y organizacion activa: implementado.
- Super admin: presente.
- Plugins por organizacion: implementado base.

### Operacion agro

- Campos: implementado.
- Lotes: implementado.
- Campanias: implementado.
- Operaciones: implementado base.
- Scouting: implementado.
- Riego: implementado base.
- Rentabilidad: implementado base.
- Contabilidad: implementado base.

### Analitica e inteligencia

- Analisis satelital: implementado.
- VRA: implementado.
- Dashboard IA: implementado.
- Chat IA y recomendaciones: implementado.
- Router LLM con fallback: implementado.
- UnifiedConverseService con persistencia de conversaciones: implementado.
- TTS de Don Juan GIS: implementado.

### Comunicaciones

- Push FCM: implementado.
- Email de alertas: implementado.
- SMS de alertas: implementado.
- WhatsApp Meta bidireccional: implementado.
- Webhook publico de WhatsApp: implementado.
- Configuracion backend por organizacion para canal WhatsApp: implementado.

## Brechas confirmadas a la fecha

- No existe aun una bandeja operativa de inbox WhatsApp en dashboard para explotar las conversaciones persistidas.
- La convivencia entre servicios IA legacy y la nueva capa `UnifiedConverseService` todavia requiere consolidacion funcional.
- El README historico no reflejaba con precision el proveedor real de IA.
- `src/services/fcm.ts` consume `/api/notifications/preferences`, pero esa ruta aun no existe.
- Existen errores TypeScript abiertos fuera del cambio documental actual:
  - `src/app/campos/nuevo/page.tsx`
  - `src/services/cost-calculator.ts`
  - `src/services/fcm.ts`

## Estado de calidad

- Hay tests API, unitarios, security y E2E en repo.
- No se considera listo para release productivo integral sin cerrar seguridad, preferencias de notificaciones y roadmap de integraciones.
