# SIG Agro - Baseline Tecnica

Fecha: 2026-05-01
Estado: verificado (tsc limpio, 10/10 tests)

---

## Stack efectivo

| Tecnologia | Version |
|-----------|---------|
| Next.js | 16.0.8 |
| React | 19.2.1 |
| TypeScript | 5.x |
| Tailwind CSS | 4.x |
| Capacitor | app Android nativa con WebView |
| `@capacitor/push-notifications` | push nativo Android |
| `@capacitor/camera` | camara nativa |
| `@capacitor/geolocation` | GPS nativo |
| `@capacitor/network` | estado de red nativo |
| Firebase SDK | 12.6.0 (Auth, Firestore, Messaging, Storage) |
| Firebase Admin SDK | 13.6.0 |
| IndexedDB | persistencia offline (sin cambios) |
| Leaflet + react-leaflet | 1.9.4 + 5.0.0 (mapas GIS) |
| `@anthropic-ai/sdk` | 0.67.x (Claude fallback LLM) |
| ElevenLabs REST API | v1 (TTS Don Candido) |
| Vitest | 3.x (tests unitarios y de API) |
| Playwright | 1.x (tests E2E) |

---

## Modulos tecnicos verificados

- Multi-tenant por `organizations/{orgId}/...`
- Analisis satelital multi-indice (NDVI/NDRE/MSAVI/NDMI/ReCI)
- VRA (zonificacion k-means + exportacion ISOXML/GeoJSON/KML)
- Clima con Open-Meteo
- Push nativo Android (FCM) con `@capacitor/push-notifications` + backend
- WhatsApp bidireccional via Meta Graph API v19.0
- IA conversacional multi-proveedor (Groq + Claude)
- TTS voz Don Candido (ElevenLabs)

---

## Comunicacion WhatsApp (Meta Graph API)

- **Proveedor:** Meta Graph API v19.0 (bidireccional, no Twilio)
- **Webhook entrante:** `POST /api/public/whatsapp/webhook`
- **Verificacion webhook:** `GET /api/public/whatsapp/webhook` (challenge Meta)
- **Seguridad:** HMAC-SHA256 con `WHATSAPP_APP_SECRET` en header `X-Hub-Signature-256`
- **Tipos:** `src/types/whatsapp.ts`
- **Cliente:** `src/lib/whatsapp/WhatsAppClient.ts` (retry + backoff)
- **Resiliencia:** `src/lib/whatsapp/CircuitBreaker.ts` + `src/lib/whatsapp/RateLimiter.ts`
- **Colecciones Firestore:** `whatsapp_conversations`, `whatsapp_messages`
- **Config por org:** `organizations/{orgId}/settings/channels_whatsapp`
- **Configuracion UI:** `GET/PUT /api/configuracion/whatsapp`

---

## IA Conversacional

- **LLM Router:** `src/ai/services/LLMRouter.ts` - Groq (primario) + Claude (fallback automatico)
- **Capabilities:**
  - `chat_agro` -> Groq (fallback Claude)
  - `analisis_lote` -> Groq (fallback Claude)
  - `recomendacion` -> Groq (fallback Claude)
  - `doc_gen` -> Claude (fallback Groq)
- **Punto de entrada unico:** `src/services/ai-core/UnifiedConverseService.ts`
- **Canales soportados:** chat web (`/api/ia/chat`) y WhatsApp (webhook)
- **Adaptadores:** `src/services/ai-core/adapters/chatAdapter.ts`, `whatsappAdapter.ts`
- **Persistencia de conversaciones:** Firestore `ai_conversations/{id}/messages`
- **Modelos:**
  - Groq: `llama-3.3-70b-versatile` (default)
  - Claude: `claude-sonnet-4-6` (default)

---

## Text-to-Speech - Don Candido

- **Proveedor:** ElevenLabs REST API v1
- **Endpoint:** `POST /api/elevenlabs/speech` - recibe `{text}`, retorna `audio/mpeg`
- **Modelo:** `eleven_multilingual_v2`
- **Configuracion:** `src/lib/elevenlabs/voice-config.ts` (`DON_CANDIDO_VOICE`)
- **UI:** boton de voz en `ChatAgro.tsx` - aparece solo si `ELEVENLABS_API_KEY` esta configurada

---

## Notificaciones push (FCM)

- **Servicio:** `src/services/fcm.ts`
- **Cliente Android:** `@capacitor/push-notifications`
- **Endpoint registro token:** `POST /api/notifications/token`
- **Endpoint envio:** `POST /api/notifications/send`
- **Limpieza automatica:** tokens invalidos/no registrados eliminados en cada envio

---

## Alertas multi-canal

- **Endpoint:** `POST /api/alerts/send`
- **Canales:** `push` (FCM), `email` (Resend), `sms` (Twilio), `whatsapp` (Twilio outbound)
- **Servicio CRUD:** `src/services/alerts.ts`
- **Tipos de alerta:** `ndvi_bajo`, `estres_hidrico`, `plaga_detectada`, `clima_adverso`, `cosecha_proxima`, etc.

---

## Variables de entorno completas

### Firebase
| Variable | Descripcion |
|----------|-------------|
| `FIREBASE_SERVICE_ACCOUNT_KEY` | JSON de service account (Admin SDK) |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ID del proyecto |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | API key cliente |

### IA - Groq + Claude
| Variable | Descripcion | Requerida |
|----------|-------------|-----------|
| `GROQ_API_KEY` | Proveedor LLM primario | Si |
| `GROQ_MODEL` | Modelo Groq | No (default: `llama-3.3-70b-versatile`) |
| `ANTHROPIC_API_KEY` | Claude fallback LLM | No (recomendada) |
| `ANTHROPIC_MODEL` | Modelo Claude | No (default: `claude-sonnet-4-6`) |

### WhatsApp - Meta Graph API
| Variable | Descripcion | Requerida |
|----------|-------------|-----------|
| `WHATSAPP_VERIFY_TOKEN` | Token de verificacion webhook | Si |
| `WHATSAPP_APP_SECRET` | Secret para HMAC-SHA256 | Si |
| `WHATSAPP_ACCESS_TOKEN` | Token acceso Meta Graph API | Si |
| `WHATSAPP_PHONE_NUMBER_ID` | Phone Number ID de Meta | Si |

### ElevenLabs TTS
| Variable | Descripcion | Requerida |
|----------|-------------|-----------|
| `ELEVENLABS_API_KEY` | API key ElevenLabs | No (TTS deshabilitado si falta) |
| `ELEVENLABS_VOICE_ID` | ID de voz personalizada | No (default: Adam) |

### Alertas
| Variable | Descripcion | Requerida |
|----------|-------------|-----------|
| `RESEND_API_KEY` | Email via Resend | No (canal email deshabilitado si falta) |
| `ALERTS_EMAIL_FROM` | Email remitente | No (default definido en backend) |
| `TWILIO_ACCOUNT_SID` | Twilio auth | No (canales SMS/WA Twilio) |
| `TWILIO_AUTH_TOKEN` | Twilio auth | No |
| `TWILIO_SMS_FROM` | Numero SMS remitente | No |
| `TWILIO_WHATSAPP_FROM` | Numero WA Twilio | No (ej. `whatsapp:+14155238886`) |

---

## Android (Capacitor)

### Build
- `npm run build` -> genera `/out` (static export de Next.js)
- `npx cap sync android` -> copia `/out` al WebView Android
- `cd android && ./gradlew assembleDebug` -> genera APK

### App ID
`com.agrotech.sigagro`

### Permisos nativos
- `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION` - GPS para mapas y scouting
- `CAMERA` - fotos georreferenciadas en scouting
- `READ_MEDIA_IMAGES` / `WRITE_EXTERNAL_STORAGE` - almacenamiento fotos
- `INTERNET` + `ACCESS_NETWORK_STATE` - conectividad
- Push notification permissions - alertas proactivas

### Archivos eliminados (eran PWA)
- `public/sw.js`
- `public/firebase-messaging-sw.js`
- `public/manifest.json`
- `src/components/pwa/PWAProvider.tsx`
- `src/app/offline/page.tsx`

### Archivos nuevos (Capacitor)
- `capacitor.config.ts` - configuracion Capacitor
- `android/` - proyecto Gradle Android
- `src/components/capacitor/CapacitorProvider.tsx`
- `src/components/capacitor/OfflineToast.tsx`
- `src/hooks/useCapacitorCamera.ts`
- `src/hooks/useCapacitorGeolocation.ts`
- `src/hooks/useCapacitorNetwork.ts`

---

## Verificacion final (manual en dispositivo Android)

- [ ] `public/sw.js` no existe
- [ ] `public/firebase-messaging-sw.js` no existe
- [ ] `public/manifest.json` no existe
- [ ] `grep -r "serviceWorker.register" src/` -> 0 resultados
- [ ] `npm run build` -> codigo de salida 0
- [ ] `npx cap sync android` -> sin errores
- [ ] APK instala en dispositivo fisico Android 10+
- [ ] Splash screen aparece y desaparece
- [ ] Boton back de Android funciona (historial -> cierra app)
- [ ] Push notification llega en background
- [ ] Camara abre desde modulo de scouting
- [ ] GPS obtiene posicion en mapa
- [ ] Toast "Sin conexion" aparece al desactivar WiFi
- [ ] IndexedDB persiste datos offline (scouting sin internet)
- [ ] Al reconectar, datos offline se sincronizan

---

## Nota sobre API Routes

Con `output: 'export'` en `next.config.ts`, las API routes (`/api/*`) **no se incluyen en el build estatico**. La app Android consume esas APIs desde el servidor (Firebase/Vercel). El flujo es:

```text
App Android (WebView) --fetch--> API routes deployadas en Vercel/Firebase
                  <--        Respuesta JSON
```

La app funciona offline para lectura/scouting (IndexedDB). Las operaciones que requieren servidor (IA, alertas, satelite) necesitan conexion.

---

## Tiempo estimado

| Ola | Tarea | Tiempo |
|-----|-------|--------|
| Ola 1 | Eliminar PWA + instalar Capacitor | 2-3 horas |
| Ola 2 | Wrappers nativos + FCM + Provider | 3-4 horas |
| Ola 3 | Build + docs | 1-2 horas |
| **Total** | | **~1 dia de trabajo** |

---

## Verificacion Ola 4 - 2026-05-01

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | Sin errores |
| `npm run test` (vitest) | 10/10 tests |
| `chat/route.ts` usa UnifiedConverseService | Si |
| Webhook WhatsApp GET+POST existe | `src/app/api/public/whatsapp/webhook/route.ts` |
| WhatsAppClient exporta clase | `src/lib/whatsapp/WhatsAppClient.ts` |
| LLMRouter exporta singleton `llmRouter` | `src/ai/services/LLMRouter.ts:176` |
| ElevenLabs endpoint existe | `src/app/api/elevenlabs/speech/route.ts` |
| Config WhatsApp endpoint existe | `src/app/api/configuracion/whatsapp/route.ts` |
