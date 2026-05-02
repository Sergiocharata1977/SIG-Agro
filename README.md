# SIG Agro

Sistema de gestion agro con arquitectura multi-tenant por organizacion, modulos operativos, plugins, analisis satelital, IA y notificaciones.

## Estado

Repositorio en desarrollo activo. La documentacion fue consolidada para reflejar solo estado real del codigo y pendientes confirmados.

Documentacion vigente:

- `docs/README.md`
- `docs/01_ESTADO_ACTUAL.md`
- `docs/02_ARQUITECTURA_Y_DATOS.md`
- `docs/03_MODULOS_E_INTEGRACIONES.md`
- `docs/04_OPERACION_Y_RUNBOOK.md`
- `docs/05_ROADMAP_Y_PENDIENTES.md`
- `docs/ADR_001_MODELO_DATOS_V1.md`

## Stack efectivo

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Firebase Auth / Firestore / Messaging
- Firebase Admin
- Groq para endpoints actuales de IA

## Capacidades implementadas

### Core

- Multi-tenant por organizacion
- Autenticacion Firebase
- Sidebar persistente en dashboard
- Sistema base de plugins
- PWA/offline base

### Modulos

- Dashboard
- Campos
- Lotes
- Campanias
- Operaciones
- Scouting
- Riego
- Rentabilidad
- Contabilidad base
- Organizaciones

### Integraciones

- Analisis satelital
- VRA
- Push FCM
- Email de alertas
- SMS de alertas
- WhatsApp saliente de alertas
- Endpoints de IA para chat, recomendaciones y analisis de lote

## Variables de entorno principales

```env
# Firebase cliente
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=

# Firebase Admin
FIREBASE_SERVICE_ACCOUNT_KEY=

# IA
GROQ_API_KEY=

# Alertas e integraciones
RESEND_API_KEY=
ALERTS_EMAIL_FROM=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_SMS_FROM=
TWILIO_WHATSAPP_FROM=

# Copernicus opcional
COPERNICUS_CLIENT_ID=
COPERNICUS_CLIENT_SECRET=
```

## Endpoints relevantes

- `/api/ia/chat`
- `/api/ia/analizar-lote`
- `/api/ia/recomendacion`
- `/api/satellite/analyze`
- `/api/satellite/prescription`
- `/api/notifications/send`
- `/api/notifications/token`
- `/api/alerts/send`

## Notas

- La integracion WhatsApp/Twilio actual es saliente, no conversacional.
- La capa de IA actual necesita consolidacion interna.
- Para pendientes confirmados, ver `docs/05_ROADMAP_Y_PENDIENTES.md`.
