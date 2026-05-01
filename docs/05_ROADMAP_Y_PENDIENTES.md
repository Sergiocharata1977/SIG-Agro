# Roadmap y Pendientes

Fecha: 2026-05-01

Este documento conserva solo pendientes vigentes o trabajo detectado como incompleto. No incluye planes historicos ya absorbidos o descartados.

## Prioridad 1

### Seguridad y robustez

- Proteger con validacion de usuario y organizacion las rutas `/api/alerts/send` y `/api/ia/*`.
- Reforzar validaciones de acceso cruzado por `organizationId`.
- Revisar y endurecer `firestore.rules`.

### Calidad tecnica

- Resolver errores TypeScript abiertos en:
  - `src/app/campos/nuevo/page.tsx`
  - `src/services/cost-calculator.ts`
  - `src/services/fcm.ts`
- Completar la ruta faltante `/api/notifications/preferences`.

### Integraciones

- Extraer Twilio a una capa `service/provider` propia.
- Persistir resultado de envios SMS/WhatsApp/email.
- Agregar ids del proveedor y trazabilidad por mensaje.

## Prioridad 2

### IA

- Unificar `IAAgricolaService` y `GroqAgroService`.
- Estandarizar prompts, contexto y respuesta estructurada.
- Corregir documentacion y branding para reflejar el proveedor real activo.

### Twilio y WhatsApp

- Implementar webhook entrante.
- Validar firma Twilio.
- Crear historial de conversaciones y mensajes.
- Soportar estados de entrega.

### E2E y smoke tests

- Login.
- Creacion de organizacion.
- Cambio de organizacion activa.
- Navegacion entre dashboard, campos, lotes y analisis IA.

## Prioridad 3

### UX y consistencia

- Unificar microcopy y etiquetas.
- Consolidar tokens visuales.
- Revisar textos historicos heredados.

### Roadmap de producto integrado

Pendiente de ejecucion:

- Centro de comunicaciones.
- Automatizaciones por evento.
- IA con contexto por lote/campania/alerta.
- Bandeja operacional para WhatsApp.

## No ejecutado a la fecha

Queda explicitamente sin ejecutar:

- Plataforma conversacional completa sobre Twilio/WhatsApp.
- Integracion inbound/outbound completa con trazabilidad.
- Consolidacion final de preferencias de notificaciones.
- Hardening integral de release productivo.
