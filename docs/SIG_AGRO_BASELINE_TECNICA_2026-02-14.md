# SIG Agro - Baseline Tecnica

Fecha: 2026-02-14
Estado: actualizado

## Stack efectivo
- Next.js 16.0.8
- React 19.2.1
- TypeScript 5.x
- Firebase (Auth, Firestore, Messaging, Storage)

## Modulos tecnicos verificados
- Multi-tenant por `organizations/{orgId}/...`
- Analisis satelital multi-indice (NDVI/NDRE/MSAVI/NDMI/ReCI)
- VRA (zonificacion k-means + exportacion ISOXML/GeoJSON/KML)
- Clima con Open-Meteo
- PWA/offline con Service Worker + IndexedDB
- Notificaciones push (FCM) por backend

## Correcciones aplicadas en este sprint
1. Fix P0 de compilacion:
- `src/services/satellite-analysis.ts`
- Corregida firma de `obtenerAnalisisCompleto`.

2. Notificaciones push reales:
- `src/app/api/notifications/send/route.ts`
- Se reemplazo simulacion por `adminMessaging.sendEachForMulticast`.
- Se agrego limpieza de tokens invalidos/no registrados.

3. Alertas backend sin simulacion:
- `src/app/api/alerts/send/route.ts`
- `push`: envio real por FCM.
- `email`: envio real via Resend (si `RESEND_API_KEY` existe).
- `sms/whatsapp`: envio real via Twilio.

4. Trazabilidad de usuario destino en alertas:
- `src/services/alerts.ts`
- Se agrego `targetUserId` en configuracion y payload al endpoint.

5. Testing automatizado de APIs criticas:
- `vitest` incorporado al proyecto.
- Tests unitarios para:
  - `POST /api/alerts/send`
  - `POST /api/notifications/send`

## Variables de entorno requeridas para alertas
- `FIREBASE_SERVICE_ACCOUNT_KEY`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `RESEND_API_KEY` (solo para canal email)
- `ALERTS_EMAIL_FROM` (opcional, default definido en backend)
- `TWILIO_ACCOUNT_SID` (canales SMS/WhatsApp)
- `TWILIO_AUTH_TOKEN` (canales SMS/WhatsApp)
- `TWILIO_SMS_FROM` (canal SMS)
- `TWILIO_WHATSAPP_FROM` (canal WhatsApp, ej. `whatsapp:+14155238886`)
