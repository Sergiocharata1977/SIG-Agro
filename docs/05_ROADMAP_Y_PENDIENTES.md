# Roadmap y Pendientes

Fecha: 2026-05-03

Este documento conserva solo pendientes vigentes o trabajo detectado como incompleto. No incluye planes historicos ya absorbidos o descartados.

---

## Planes documentados pendientes de ejecucion

### PLAN_02_TESORERIA — Plugin Tesoreria (NO ejecutado)

Plan en `docs/plugins/PLAN_02_TESORERIA.md`.
Incluye: bancos, cajas, cheques (emitidos/recibidos), flujo de caja.
Rutas a crear: `/tesoreria`, `/cheques`, `/flujo-caja`.
Servicios a crear: `tesoreria.ts`, `cheques.ts`.
Estado: documentado, listo para ejecutar.

### PLAN_ABM_POPUP — Conversion de formularios inline a Dialog (parcialmente ejecutado)

Plan en `docs/plugins/PLAN_ABM_POPUP.md`.
Ya convertido: `/operaciones` (tiene Dialog).
Pendiente de conversion:
- `/campanias/page.tsx` + redirect en `/campanias/nueva`
- `/contabilidad/page.tsx` + redirect en `/contabilidad/asiento`
- `/campos/page.tsx` + redirect en `/campos/nuevo`
- `/cuaderno/page.tsx`
- `/riego/page.tsx`

### PLAN_CONTABLE_CENTRAL_OLAS.md — Plan original 10 olas

Archivo: `docs/PLAN_CONTABLE_CENTRAL_OLAS.md`.
Este plan fue el documento original antes de la arquitectura de plugins.
La mayoria de sus items fueron absorbidos por PLAN_00 a PLAN_06.
Lo que queda pendiente de ese plan esta cubierto por PLAN_ABM_POPUP y PLAN_02.
Puede archivarse cuando se complete PLAN_02 y PLAN_ABM_POPUP.

---

## Prioridad 1 — Tecnico urgente

### Seguridad

- Proteger con validacion de usuario y organizacion las rutas `/api/alerts/send` y `/api/ia/*`.
- Reforzar validaciones de acceso cruzado por `organizationId`.
- Revisar y endurecer `firestore.rules`.

### Calidad

- Resolver errores TypeScript abiertos en:
  - `src/app/campos/nuevo/page.tsx`
  - `src/services/cost-calculator.ts`
- Completar la ruta faltante `/api/notifications/preferences`.

### Integraciones

- Extraer Twilio a una capa `service/provider` propia.
- Persistir resultado de envios SMS/WhatsApp/email.
- Agregar ids del proveedor y trazabilidad por mensaje.

---

## Prioridad 2 — Producto

### Modulo Tesoreria (PLAN_02)

- Implementar tipos y servicios de bancos, cajas, cheques.
- Crear UI: `/tesoreria`, `/cheques`, `/flujo-caja`.
- Agregar botones de exportacion gateados por plugin `exportacion`.

### Formularios ABM a popup (PLAN_ABM_POPUP)

- Convertir `/campanias`, `/contabilidad`, `/campos`, `/cuaderno`, `/riego` al patron Dialog.
- Agregar redirects en rutas de alta separada (`/campanias/nueva`, `/campos/nuevo`, etc.).

### IA

- Unificar `IAAgricolaService` y `GroqAgroService`.
- Estandarizar prompts, contexto y respuesta estructurada.

### WhatsApp

- Implementar webhook entrante completo.
- Validar firma de requests.
- Crear historial y estados de entrega.

---

## Prioridad 3 — UX y calidad

### Tests E2E

- Login, creacion de organizacion, cambio de organizacion activa.
- Navegacion entre dashboard, campos, lotes y analisis IA.
- Activacion y desactivacion de plugins.

### UX y consistencia

- Unificar microcopy y etiquetas en modulos nuevos (aprobaciones, auditoria, centros-costo).
- Revisar textos de placeholder y descripciones en formularios popup.

---

## Completado en este sprint (01-03 Mayo 2026)

- Sistema de plugins comerciales completo (PLAN_00)
- Contabilidad avanzada: mayor + CC tercero (PLAN_01)
- Operaciones comerciales: tipos + UI (PLAN_03)
- Agro gestion: resultado por campana (PLAN_04)
- Presupuesto y control: centros de costo + presupuesto vs real (PLAN_05)
- ISO control interno: auditoria, aprobaciones, adjuntos, exportacion (PLAN_06)
- Sidebar reorganizado en 5 hubs operativos
- Fix build Vercel/Capacitor (output:export condicional)
- WhatsApp Meta API + LLM Router + ElevenLabs TTS
- Rediseno UI completo con temas y branding Don Juan GIS
