# Operacion y Runbook

Fecha: 2026-05-01

## Objetivo

Permitir continuidad operativa y tecnica sin reanalizar el historial del proyecto.

## Flujo de trabajo recomendado

1. Trabajar siempre sobre `main` con cambios pequenos.
2. Verificar `git status` antes de editar.
3. No mezclar cambios de este repo con otros proyectos.
4. Ejecutar validaciones puntuales segun el area tocada.
5. Hacer commit chico y descriptivo.

## Verificaciones manuales clave

### Navegacion dashboard

- El sidebar izquierdo debe permanecer visible en modulos del grupo `(dashboard)`.
- En movil debe abrir desde el boton de menu y no reemplazar la navegacion lateral en desktop.

### Organizaciones

- Ruta: `/organizaciones`
- Debe listar, crear, editar y activar organizacion.

### Plugins

- Ruta: `/configuracion/plugins`
- Debe reflejar plugins habilitados por organizacion.

### Analisis IA

- Ruta: `/analisis-ia`
- Debe cargar el dashboard IA y respetar `PluginGuard`.

### WhatsApp Meta

- Verificar `GET /api/public/whatsapp/webhook` con `hub.mode`, `hub.verify_token` y `hub.challenge`.
- Probar `POST /api/public/whatsapp/webhook` con payload valido y firma `X-Hub-Signature-256`.
- Validar `GET /api/configuracion/whatsapp` y `PUT /api/configuracion/whatsapp` con organizacion activa.

### Don Candido TTS

- Endpoint: `POST /api/elevenlabs/speech`
- Debe devolver `audio/mpeg` cuando `ELEVENLABS_API_KEY` esta configurada.

### Push FCM

- Guardado de token: `/api/notifications/token`
- Envio: `/api/notifications/send`

### Alertas

- Envio backend: `/api/alerts/send`
- Canales soportados hoy: `push`, `email`, `sms`, `whatsapp`

## Variables de entorno relevantes

### Firebase

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_VAPID_KEY`
- `FIREBASE_SERVICE_ACCOUNT_KEY`

### IA

- `GROQ_API_KEY`
- `ANTHROPIC_API_KEY`
- `ANTHROPIC_MODEL`

### Alertas y comunicaciones

- `RESEND_API_KEY`
- `ALERTS_EMAIL_FROM`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_SMS_FROM`
- `TWILIO_WHATSAPP_FROM`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_APP_SECRET`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_VOICE_ID`

## Problemas conocidos

- Existen errores TypeScript fuera del area documental.
- No existe `/api/notifications/preferences`.
- La operacion conversacional de WhatsApp ya persiste mensajes, pero aun requiere UI de inbox y monitoreo operativo.
- Algunas piezas del repo mantienen texto o branding historico.

## Archivos tecnicos clave

- `src/app/(dashboard)/layout.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/contexts/AuthContext.tsx`
- `src/app/api/alerts/send/route.ts`
- `src/app/api/public/whatsapp/webhook/route.ts`
- `src/app/api/configuracion/whatsapp/route.ts`
- `src/app/api/elevenlabs/speech/route.ts`
- `src/app/api/notifications/send/route.ts`
- `src/app/api/notifications/token/route.ts`
- `src/app/api/ia/*`
- `src/ai/services/LLMRouter.ts`
- `src/services/ai-core/UnifiedConverseService.ts`
- `src/services/whatsapp/WhatsAppService.ts`
