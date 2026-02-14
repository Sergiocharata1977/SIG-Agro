# SIG Agro - Release Readiness (Tecnico)

Fecha: 2026-02-14
Version objetivo: RC tecnico

## Checklist

### 1. Build y calidad base
- [x] `npm run lint`
- [x] `npm run build`
- [x] Fix P0 de sintaxis en servicio satelital aplicado

### 2. Alertas y notificaciones
- [x] `POST /api/notifications/send` sin simulacion
- [x] Limpieza automatica de tokens FCM invalidos
- [x] `POST /api/alerts/send` sin respuestas simuladas
- [x] Canales `sms` y `whatsapp` implementados en backend
- [x] Tests unitarios de rutas de alertas/notificaciones (`vitest`)
- [ ] Prueba E2E de alertas push con token real
- [ ] Prueba de email de alerta con `RESEND_API_KEY`

### 3. Seguridad y multi-tenant
- [ ] Validacion de acceso cruzado por organizacion
- [ ] Revalidar `firestore.rules` con casos negativos

### 4. Operacion
- [ ] Runbook de incidentes tecnicos
- [ ] Dashboard de errores/latencia

## Riesgos residuales
1. Dependencia de configuracion externa para envio de email/SMS/WhatsApp.
2. Faltan pruebas E2E de regresion en alertas/notificaciones.

## Go/No-Go (tecnico)
- Go condicional si: lint/build en verde y pruebas de push/email completadas.
- No-Go si: falla envio real de push o errores P0 abiertos.
