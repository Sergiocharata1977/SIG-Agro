# SIG Agro — Baseline Técnica

Fecha: 2026-05-01
Estado: verificado ✅ (tsc limpio, 10/10 tests)

---

## Stack efectivo

| Tecnología | Versión |
|-----------|---------|
| Next.js | 16.0.8 |
| React | 19.2.1 |
| TypeScript | 5.x |
| Tailwind CSS | 4.x |
| Firebase SDK | 12.6.0 (Auth, Firestore, Messaging, Storage) |
| Firebase Admin SDK | 13.6.0 |
| Leaflet + react-leaflet | 1.9.4 + 5.0.0 (mapas GIS) |
| `@anthropic-ai/sdk` | 0.67.x (Claude fallback LLM) |
| ElevenLabs REST API | v1 (TTS Don Cándido) |
| Vitest | 3.x (tests unitarios y de API) |
| Playwright | 1.x (tests E2E) |

---

## Módulos técnicos verificados

- Multi-tenant por `organizations/{orgId}/...`
- Análisis satelital multi-índice (NDVI/NDRE/MSAVI/NDMI/ReCI)
- VRA (zonificación k-means + exportación ISOXML/GeoJSON/KML)
- Clima con Open-Meteo
- Notificaciones push (FCM) por backend con `adminMessaging.sendEachForMulticast`
- WhatsApp bidireccional vía Meta Graph API v19.0
- IA conversacional multi-proveedor (Groq + Claude)
- TTS voz Don Cándido (ElevenLabs)

---

## Comunicación WhatsApp (Meta Graph API)

- **Proveedor:** Meta Graph API v19.0 (bidireccional, no Twilio)
- **Webhook entrante:** `POST /api/public/whatsapp/webhook`
- **Verificación webhook:** `GET /api/public/whatsapp/webhook` (challenge Meta)
- **Seguridad:** HMAC-SHA256 con `WHATSAPP_APP_SECRET` en header `X-Hub-Signature-256`
- **Tipos:** `src/types/whatsapp.ts`
- **Cliente:** `src/lib/whatsapp/WhatsAppClient.ts` (retry + backoff)
- **Resiliencia:** `src/lib/whatsapp/CircuitBreaker.ts` + `src/lib/whatsapp/RateLimiter.ts`
- **Colecciones Firestore:** `whatsapp_conversations`, `whatsapp_messages`
- **Config por org:** `organizations/{orgId}/settings/channels_whatsapp`
- **Configuración UI:** `GET/PUT /api/configuracion/whatsapp`

---

## IA Conversacional

- **LLM Router:** `src/ai/services/LLMRouter.ts` — Groq (primario) + Claude (fallback automático)
- **Capabilities:**
  - `chat_agro` → Groq (fallback Claude)
  - `analisis_lote` → Groq (fallback Claude)
  - `recomendacion` → Groq (fallback Claude)
  - `doc_gen` → Claude (fallback Groq)
- **Punto de entrada único:** `src/services/ai-core/UnifiedConverseService.ts`
- **Canales soportados:** chat web (`/api/ia/chat`) y WhatsApp (webhook)
- **Adaptadores:** `src/services/ai-core/adapters/chatAdapter.ts`, `whatsappAdapter.ts`
- **Persistencia de conversaciones:** Firestore `ai_conversations/{id}/messages`
- **Modelos:**
  - Groq: `llama-3.3-70b-versatile` (default)
  - Claude: `claude-sonnet-4-6` (default)

---

## Text-to-Speech — Don Cándido

- **Proveedor:** ElevenLabs REST API v1
- **Endpoint:** `POST /api/elevenlabs/speech` — recibe `{text}`, retorna `audio/mpeg`
- **Modelo:** `eleven_multilingual_v2`
- **Configuración:** `src/lib/elevenlabs/voice-config.ts` (`DON_CANDIDO_VOICE`)
- **UI:** botón de voz en `ChatAgro.tsx` — aparece solo si `ELEVENLABS_API_KEY` está configurada

---

## Notificaciones push (FCM)

- **Servicio:** `src/services/fcm.ts`
- **Endpoint registro token:** `POST /api/notifications/token`
- **Endpoint envío:** `POST /api/notifications/send`
- **Limpieza automática:** tokens inválidos/no registrados eliminados en cada envío
- **Service Worker:** `public/firebase-messaging-sw.js`

---

## Alertas multi-canal

- **Endpoint:** `POST /api/alerts/send`
- **Canales:** `push` (FCM), `email` (Resend), `sms` (Twilio), `whatsapp` (Twilio outbound)
- **Servicio CRUD:** `src/services/alerts.ts`
- **Tipos de alerta:** `ndvi_bajo`, `estres_hidrico`, `plaga_detectada`, `clima_adverso`, `cosecha_proxima`, etc.

---

## Variables de entorno completas

### Firebase
| Variable | Descripción |
|----------|-------------|
| `FIREBASE_SERVICE_ACCOUNT_KEY` | JSON de service account (Admin SDK) |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ID del proyecto |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Clave VAPID para push web |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | API key cliente |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sender ID FCM |

### IA — Groq + Claude
| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `GROQ_API_KEY` | Proveedor LLM primario | Sí |
| `GROQ_MODEL` | Modelo Groq | No (default: `llama-3.3-70b-versatile`) |
| `ANTHROPIC_API_KEY` | Claude fallback LLM | No (recomendada) |
| `ANTHROPIC_MODEL` | Modelo Claude | No (default: `claude-sonnet-4-6`) |

### WhatsApp — Meta Graph API
| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `WHATSAPP_VERIFY_TOKEN` | Token de verificación webhook | Sí |
| `WHATSAPP_APP_SECRET` | Secret para HMAC-SHA256 | Sí |
| `WHATSAPP_ACCESS_TOKEN` | Token acceso Meta Graph API | Sí |
| `WHATSAPP_PHONE_NUMBER_ID` | Phone Number ID de Meta | Sí |

### ElevenLabs TTS
| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `ELEVENLABS_API_KEY` | API key ElevenLabs | No (TTS deshabilitado si falta) |
| `ELEVENLABS_VOICE_ID` | ID de voz personalizada | No (default: Adam) |

### Alertas
| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `RESEND_API_KEY` | Email via Resend | No (canal email deshabilitado si falta) |
| `ALERTS_EMAIL_FROM` | Email remitente | No (default definido en backend) |
| `TWILIO_ACCOUNT_SID` | Twilio auth | No (canales SMS/WA Twilio) |
| `TWILIO_AUTH_TOKEN` | Twilio auth | No |
| `TWILIO_SMS_FROM` | Número SMS remitente | No |
| `TWILIO_WHATSAPP_FROM` | Número WA Twilio | No (ej. `whatsapp:+14155238886`) |

---

## Verificación Ola 4 — 2026-05-01

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | ✅ Sin errores |
| `npm run test` (vitest) | ✅ 10/10 tests |
| `chat/route.ts` usa UnifiedConverseService | ✅ |
| Webhook WhatsApp GET+POST existe | ✅ `src/app/api/public/whatsapp/webhook/route.ts` |
| WhatsAppClient exporta clase | ✅ `src/lib/whatsapp/WhatsAppClient.ts` |
| LLMRouter exporta singleton `llmRouter` | ✅ `src/ai/services/LLMRouter.ts:176` |
| ElevenLabs endpoint existe | ✅ `src/app/api/elevenlabs/speech/route.ts` |
| Config WhatsApp endpoint existe | ✅ `src/app/api/configuracion/whatsapp/route.ts` |
