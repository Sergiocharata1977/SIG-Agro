# Modulos e Integraciones

Fecha: 2026-05-01

## Modulos funcionales presentes

| Modulo | Estado | Evidencia principal |
|---|---|---|
| Dashboard | Implementado | `src/app/dashboard/page.tsx`, `src/app/(dashboard)/layout.tsx` |
| Campos | Implementado | `src/app/campos/*` |
| Lotes | Implementado base | `src/app/(dashboard)/lotes/page.tsx` |
| Campanias | Implementado | `src/app/campanias/*` |
| Operaciones | Implementado base | `src/app/(dashboard)/operaciones/page.tsx` |
| Riego | Implementado base | `src/app/(dashboard)/riego/page.tsx` |
| Scouting | Implementado | `src/app/(dashboard)/scouting/page.tsx` |
| Rentabilidad | Implementado base | `src/app/(dashboard)/rentabilidad/page.tsx` |
| Contabilidad | Implementado base | `src/app/contabilidad/*` y `src/app/(dashboard)/terceros/page.tsx` |
| Organizaciones | Implementado | `src/app/(dashboard)/organizaciones/page.tsx` |
| Plugins | Implementado base | `src/app/(dashboard)/configuracion/plugins/page.tsx` |
| Analisis IA | Implementado | `src/app/(dashboard)/analisis-ia/page.tsx` |

## Integraciones reales confirmadas

### FCM Push

Estado: implementado

Archivos:

- `src/services/fcm.ts`
- `src/app/api/notifications/send/route.ts`
- `src/app/api/notifications/token/route.ts`

Observaciones:

- Envio real por Firebase Admin Messaging.
- Limpieza de tokens invalidos implementada.
- Falta la route `/api/notifications/preferences`.

### Email de alertas

Estado: implementado

Archivo:

- `src/app/api/alerts/send/route.ts`

Proveedor:

- Resend via `fetch`.

### SMS y WhatsApp

Estado: mixto; Twilio sigue en alertas salientes y Meta WhatsApp ya es bidireccional

Archivos:

- `src/app/api/alerts/send/route.ts`
- `src/app/api/public/whatsapp/webhook/route.ts`
- `src/app/api/configuracion/whatsapp/route.ts`
- `src/services/whatsapp/WhatsAppService.ts`
- `src/lib/whatsapp/WhatsAppClient.ts`
- `src/types/whatsapp.ts`

Proveedor:

- Twilio via REST API para SMS y WhatsApp legacy saliente.
- Meta Graph API v19.0 para WhatsApp bidireccional.

Observaciones:

- El webhook entrante de Meta valida `verify_token` y firma HMAC.
- Las conversaciones se persisten en Firestore (`whatsapp_conversations`, `whatsapp_messages`).
- La configuracion del canal ya es multi-tenant a nivel backend.
- Falta madurar la capa de inbox operativa en UI.

### IA

Estado: implementado con capa nueva unificada y piezas legacy aun presentes

Archivos:

- `src/app/api/ia/chat/route.ts`
- `src/app/api/ia/analizar-lote/route.ts`
- `src/app/api/ia/recomendacion/route.ts`
- `src/ai/services/LLMRouter.ts`
- `src/ai/config/llmRouting.ts`
- `src/services/ai-core/UnifiedConverseService.ts`
- `src/services/ai-core/conversationStore.ts`
- `src/lib/ia/IAAgricolaService.ts`
- `src/lib/groq/GroqAgroService.ts`
- `src/lib/claude/client.ts`

Proveedor real detectado en codigo:

- Groq (`GROQ_API_KEY`) como primario.
- Claude via Anthropic (`ANTHROPIC_API_KEY`) como fallback.

Observaciones:

- La documentacion historica hablaba de Gemini, pero el codigo activo usa Groq.
- `LLMRouter` enruta por capability: `chat_agro`, `analisis_lote`, `recomendacion`, `doc_gen`.
- `UnifiedConverseService` unifica chat web y WhatsApp con persistencia en `ai_conversations`.
- Existen servicios IA previos con responsabilidades superpuestas que aun conviven.

### Text-to-Speech

Estado: implementado

Archivos:

- `src/app/api/elevenlabs/speech/route.ts`
- `src/lib/elevenlabs/client.ts`
- `src/lib/elevenlabs/voice-config.ts`
- `src/components/ia/ChatAgro.tsx`

Proveedor:

- ElevenLabs.

Observaciones:

- La voz de Don Juan GIS se expone por backend.
- Si falta `ELEVENLABS_API_KEY`, el endpoint responde `503` y la aplicacion sigue sin TTS.

### Satelital y VRA

Estado: implementado

Archivos:

- `src/services/satellite-analysis.ts`
- `src/services/copernicus.ts`
- `src/services/copernicus-extended.ts`
- `src/services/vra.ts`
- `src/app/api/satellite/analyze/route.ts`
- `src/app/api/satellite/prescription/route.ts`

### Clima

Estado: implementado

Archivo:

- `src/services/weather.ts`

### PWA y Offline

Estado: implementado base

Archivos:

- `src/components/pwa/PWAProvider.tsx`
- `src/hooks/useOfflineSync.tsx`
- `src/lib/indexed-db.ts`
- `public/sw.js`

## Conclusiones tecnicas

- Las integraciones actuales son utiles para operaciones puntuales.
- La base de comunicaciones e IA ya dio el salto a webhook, persistencia y fallback entre proveedores.
- El siguiente frente tecnico es consolidar UI operativa, observabilidad y cierre de piezas legacy.
