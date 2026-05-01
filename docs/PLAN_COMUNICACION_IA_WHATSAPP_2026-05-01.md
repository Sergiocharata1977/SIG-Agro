# Plan Comunicación & IA — Ejecución multi-agente

**Fecha:** 2026-05-01
**Feature:** Llevar SIG-Agro al mismo nivel que 9001app-firebase en WhatsApp bidireccional, LLM Router multi-proveedor, ElevenLabs TTS y conversaciones persistentes
**Proyectos afectados:** `SIG-Agro` (receptor), `9001app-firebase` (modelo a replicar)

---

## Diagnóstico: Gaps detectados

| Capacidad | 9001app-firebase | SIG-Agro | Gap |
|-----------|-----------------|----------|-----|
| WhatsApp entrante (webhook) | ✅ Meta Graph API | ❌ Solo Twilio outbound | CRÍTICO |
| Conversaciones bidireccionales | ✅ WhatsAppService + tipos | ❌ No existe | CRÍTICO |
| CircuitBreaker + RateLimiter | ✅ Implementado | ❌ No existe | ALTO |
| LLM Router (Groq + Claude fallback) | ✅ LLMRouter.ts | ❌ Solo Groq directo | ALTO |
| Anthropic/Claude SDK | ✅ claude/client.ts | ❌ No instalado | ALTO |
| IA multi-canal (chat+whatsapp+voice) | ✅ UnifiedConverseService | ❌ Solo chat web | ALTO |
| ElevenLabs TTS (Don Cándido) | ✅ elevenlabs/client.ts | ❌ No existe | MEDIO |
| Conversaciones persistidas | ✅ conversationStore | ❌ Solo en memoria | MEDIO |
| Config WhatsApp por organización | ✅ channels_whatsapp | ❌ No existe | MEDIO |
| MediaHandler (imagen/audio/video) | ✅ MediaHandler.ts | ❌ No existe | BAJO |

---

## Resumen de olas

| Ola | Agentes | Paralelos entre sí | Dependen de |
|-----|---------|---------------------|-------------|
| 1 | A, B, C | Sí | Nada |
| 2 | A, B, C | Sí | Ola 1 completa |
| 3 | A, B | Sí | Ola 2 completa |
| 4 | A | No aplica (único) | Ola 3 completa |

---

## Ola 1 — Fundaciones (tipos, clientes SDK, config)
> Ejecutar Agente A + Agente B + Agente C en PARALELO

### Agente A — Tipos WhatsApp + Cliente Meta Graph API

**Puede ejecutarse en paralelo con:** Agente B, Agente C
**Depende de:** nada — es la primera ola

#### Objetivo
Crear los tipos TypeScript completos de WhatsApp y el cliente `WhatsAppClient.ts` que envía mensajes via Meta Graph API v19.0, más `CircuitBreaker.ts` y `RateLimiter.ts`.

#### Archivos a crear
- `src/types/whatsapp.ts` — tipos completos (conversaciones, mensajes, config por org, métricas)
- `src/lib/whatsapp/WhatsAppClient.ts` — cliente Meta Graph API v19.0 con retry
- `src/lib/whatsapp/CircuitBreaker.ts` — control de fallos con estado CLOSED/OPEN/HALF_OPEN
- `src/lib/whatsapp/RateLimiter.ts` — limitador de rate con ventana deslizante

#### Archivos a modificar
- `package.json` — no requiere nuevas dependencias (usa fetch nativo)

#### Prompt completo para el agente

Estás trabajando en SIG-Agro, una aplicación Next.js 16 + React 19 + TypeScript + Firebase para gestión agrícola multi-tenant. El proyecto existe en `c:\Users\Usuario\Documents\Proyectos\ISO -conjunto\SIG-Agro`.

El proyecto tiene estructura: `src/app/api/`, `src/services/`, `src/lib/`, `src/types/`.

**Tarea:** Crear la capa de tipos e infraestructura para WhatsApp via Meta Graph API v19.0.

**1. Crear `src/types/whatsapp.ts`** con las siguientes interfaces:

```typescript
export type WhatsAppProvider = 'meta' | 'twilio'
export type WhatsAppMode = 'notifications_only' | 'inbox' | 'hybrid'
export type ConversationStatus = 'abierta' | 'pendiente_respuesta' | 'en_gestion' | 'cerrada'
export type ConversationType = 'agro' | 'support' | 'alerts'
export type WhatsAppChannel = 'meta' | 'twilio' | 'simulator'
export type MessageDirection = 'inbound' | 'outbound'
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed'

export interface OrganizationWhatsAppConfig {
  enabled: boolean
  provider: WhatsAppProvider
  mode: WhatsAppMode
  whatsapp_phone_number_id?: string
  access_token?: string
  verify_token?: string
  webhook_status?: 'pending' | 'verified' | 'error'
  updatedAt?: Date
}

export interface WhatsAppConversation {
  id: string
  organizationId: string
  phone_e164: string
  status: ConversationStatus
  type: ConversationType
  channel: WhatsAppChannel
  source: 'webhook' | 'manual' | 'simulation'
  ai_enabled: boolean
  lastMessageAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface WhatsAppMessage {
  id: string
  conversationId: string
  organizationId: string
  direction: MessageDirection
  status: MessageStatus
  from: string
  to: string
  body: string
  mediaType?: 'image' | 'video' | 'audio' | 'document'
  mediaUrl?: string
  timestamp: Date
  waMessageId?: string
}

export interface IncomingWhatsAppMessage {
  from: string
  body: string
  waMessageId: string
  phoneNumberId: string
  timestamp: number
  mediaType?: string
  mediaId?: string
}
```

**2. Crear `src/lib/whatsapp/WhatsAppClient.ts`:**

```typescript
// Cliente Meta Graph API v19.0 para envío de mensajes WhatsApp
// Usa fetch nativo, no requiere dependencias externas

const META_API_URL = 'https://graph.facebook.com/v19.0'

export class WhatsAppClient {
  private accessToken: string
  private phoneNumberId: string

  constructor(accessToken: string, phoneNumberId: string) {
    this.accessToken = accessToken
    this.phoneNumberId = phoneNumberId
  }

  async sendTextMessage(to: string, body: string): Promise<{ messageId: string }> {
    // POST a `${META_API_URL}/${this.phoneNumberId}/messages`
    // Headers: Authorization Bearer + Content-Type application/json
    // Body: { messaging_product: "whatsapp", to, type: "text", text: { body } }
    // Retry hasta 3 veces con backoff exponencial (500ms, 1000ms, 2000ms)
    // Lanzar error con detalle si falla después de retries
  }

  async markAsRead(messageId: string): Promise<void> {
    // POST marca mensaje como leído
    // Body: { messaging_product: "whatsapp", status: "read", message_id: messageId }
  }

  static fromEnv(): WhatsAppClient {
    // Crea instancia desde process.env.WHATSAPP_ACCESS_TOKEN y WHATSAPP_PHONE_NUMBER_ID
    // Lanzar Error descriptivo si faltan las variables
  }
}
```

**3. Crear `src/lib/whatsapp/CircuitBreaker.ts`:**

Implementa patrón Circuit Breaker con estados: CLOSED (normal), OPEN (bloqueando llamadas), HALF_OPEN (probando recuperación).
- Umbral de apertura: 5 fallos consecutivos
- Tiempo de recuperación: 30 segundos
- Método `execute<T>(fn: () => Promise<T>): Promise<T>`
- Lanzar `CircuitBreakerOpenError` cuando está OPEN

**4. Crear `src/lib/whatsapp/RateLimiter.ts`:**

Ventana deslizante de 1 minuto, máximo 80 mensajes (límite seguro bajo el tope de Meta).
- Método `checkLimit(): boolean` — retorna false si se excede el límite
- Método `waitForSlot(): Promise<void>` — espera hasta que haya slot disponible

**Criterio de éxito:** Los 4 archivos compilan sin errores TypeScript (`npx tsc --noEmit`). No modificar ningún archivo existente.

---

### Agente B — LLM Router multi-proveedor (Groq + Claude)

**Puede ejecutarse en paralelo con:** Agente A, Agente C
**Depende de:** nada — es la primera ola

#### Objetivo
Instalar `@anthropic-ai/sdk`, crear el `LLMRouter.ts` con su configuración, y el cliente Claude `src/lib/claude/client.ts`, manteniendo el `GroqAgroService.ts` existente como proveedor primario.

#### Archivos a crear
- `src/ai/config/llmRouting.ts` — configuración de capabilities y proveedores
- `src/ai/services/LLMRouter.ts` — orquestador con fallback automático
- `src/lib/claude/client.ts` — ClaudeService wrapper del SDK de Anthropic

#### Archivos a modificar
- `package.json` — agregar `"@anthropic-ai/sdk": "^0.67.0"`

#### Prompt completo para el agente

Estás trabajando en SIG-Agro, Next.js 16 + React 19 + TypeScript + Firebase para gestión agrícola. Proyecto en `c:\Users\Usuario\Documents\Proyectos\ISO -conjunto\SIG-Agro`.

El proyecto YA tiene Groq en `src/lib/groq/GroqAgroService.ts` que usa `GROQ_API_KEY` y modelo `llama-3.3-70b-versatile`. NO modificar ese archivo.

**Tarea:** Crear un LLM Router que permita usar Groq como primario y Claude como fallback.

**1. Instalar dependencia:**
```bash
cd "c:\Users\Usuario\Documents\Proyectos\ISO -conjunto\SIG-Agro"
npm install @anthropic-ai/sdk@^0.67.0
```

**2. Crear `src/ai/config/llmRouting.ts`:**

```typescript
// Capabilities del sistema y su enrutamiento a proveedores
export type LLMCapability = 'chat_agro' | 'analisis_lote' | 'recomendacion' | 'doc_gen'
export type LLMProvider = 'groq' | 'claude'

export interface ProviderRoute {
  primary: LLMProvider
  fallbacks: LLMProvider[]
  maxTokens: number
  temperature: number
}

export const LLM_ROUTING: Record<LLMCapability, ProviderRoute> = {
  chat_agro:      { primary: 'groq',   fallbacks: ['claude'], maxTokens: 2000, temperature: 0.7 },
  analisis_lote:  { primary: 'groq',   fallbacks: ['claude'], maxTokens: 3000, temperature: 0.4 },
  recomendacion:  { primary: 'groq',   fallbacks: ['claude'], maxTokens: 2000, temperature: 0.5 },
  doc_gen:        { primary: 'claude', fallbacks: ['groq'],   maxTokens: 4000, temperature: 0.3 },
}

export const PROVIDER_MODELS: Record<LLMProvider, string> = {
  groq:   process.env.GROQ_MODEL   ?? 'llama-3.3-70b-versatile',
  claude: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
}
```

**3. Crear `src/lib/claude/client.ts`:**

```typescript
import Anthropic from '@anthropic-ai/sdk'

interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string
}

export class ClaudeService {
  private client: Anthropic
  private model: string

  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY no configurada')
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    this.model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6'
  }

  async chat(messages: ClaudeMessage[], systemPrompt: string, maxTokens = 2000): Promise<string> {
    // Usar client.messages.create con retry hasta 2 veces (backoff 1000ms, 2000ms)
    // Retornar content[0].text
  }

  static isAvailable(): boolean {
    return !!process.env.ANTHROPIC_API_KEY
  }
}
```

**4. Crear `src/ai/services/LLMRouter.ts`:**

```typescript
// Orquestador que selecciona proveedor según capability y hace fallback automático
import { LLM_ROUTING, LLMCapability, LLMProvider } from '../config/llmRouting'

interface ChatMessage { role: 'user' | 'assistant'; content: string }

export class LLMRouter {
  async chat(
    capability: LLMCapability,
    messages: ChatMessage[],
    systemPrompt: string
  ): Promise<{ text: string; provider: LLMProvider; usedFallback: boolean }> {
    // 1. Obtener ruta para capability
    // 2. Intentar proveedor primary
    // 3. Si falla (Error o timeout 30s), intentar cada fallback en orden
    // 4. Si todos fallan, lanzar error con detalle de todos los intentos
    // 5. Retornar { text, provider usado, usedFallback: true/false }
  }
}

export const llmRouter = new LLMRouter()
```

**Variables de entorno que necesita (documentar en el código con comentario):**
```
GROQ_API_KEY           # Proveedor primario
ANTHROPIC_API_KEY      # Proveedor fallback (opcional pero recomendado)
ANTHROPIC_MODEL        # default: claude-sonnet-4-6
GROQ_MODEL             # default: llama-3.3-70b-versatile
```

**Criterio de éxito:** Compila sin errores TypeScript. El router usa Groq por defecto y solo llama Claude si Groq falla o si la capability es `doc_gen`. No tocar `GroqAgroService.ts` existente.

---

### Agente C — ElevenLabs TTS (Don Cándido)

**Puede ejecutarse en paralelo con:** Agente A, Agente B
**Depende de:** nada — es la primera ola

#### Objetivo
Crear el cliente ElevenLabs, la configuración de voz de Don Cándido, y el endpoint API `/api/elevenlabs/speech` para text-to-speech.

#### Archivos a crear
- `src/lib/elevenlabs/voice-config.ts` — configuración de voz de Don Cándido
- `src/lib/elevenlabs/client.ts` — ElevenLabsService (TTS)
- `src/app/api/elevenlabs/speech/route.ts` — endpoint POST para convertir texto a audio

#### Archivos a modificar
- Ninguno

#### Prompt completo para el agente

Estás trabajando en SIG-Agro, Next.js 16 + React 19 + TypeScript. Proyecto en `c:\Users\Usuario\Documents\Proyectos\ISO -conjunto\SIG-Agro`.

El asistente IA del proyecto es "Don Cándido", personaje agrícola del Chaco argentino. Ya existe `src/lib/ia/IAAgricolaService.ts` con su prompt de personalidad. ElevenLabs será la voz de ese personaje.

**No hay dependencia npm necesaria** — ElevenLabs usa REST API con fetch nativo.

**1. Crear `src/lib/elevenlabs/voice-config.ts`:**

```typescript
export interface VoiceSettings {
  stability: number           // 0-1
  similarity_boost: number    // 0-1
  style: number               // 0-1
  use_speaker_boost: boolean
}

export interface ElevenLabsVoiceConfig {
  voiceId: string
  modelId: string
  settings: VoiceSettings
  languageCode: string
}

// Configuración de voz Don Cándido (masculino, cálido, argentino)
export const DON_CANDIDO_VOICE: ElevenLabsVoiceConfig = {
  voiceId: process.env.ELEVENLABS_VOICE_ID ?? 'pNInz6obpgDQGcFmaJgB',
  modelId: 'eleven_multilingual_v2',
  settings: {
    stability: 0.71,
    similarity_boost: 0.85,
    style: 0.35,
    use_speaker_boost: true,
  },
  languageCode: 'es',
}
```

**2. Crear `src/lib/elevenlabs/client.ts`:**

```typescript
// Cliente ElevenLabs REST API — convierte texto en audio
// API: https://api.elevenlabs.io/v1/text-to-speech/{voiceId}

export class ElevenLabsService {
  private apiKey: string
  private baseUrl = 'https://api.elevenlabs.io/v1'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async textToSpeech(text: string, config: ElevenLabsVoiceConfig): Promise<ArrayBuffer> {
    // POST a ${baseUrl}/text-to-speech/${config.voiceId}
    // Headers: xi-api-key + Content-Type application/json
    // Body: { text, model_id: config.modelId, voice_settings: config.settings, language_code: config.languageCode }
    // Retornar response.arrayBuffer() (audio/mpeg)
    // Si falla con 4xx/5xx lanzar Error con status y body
  }

  static fromEnv(): ElevenLabsService {
    if (!process.env.ELEVENLABS_API_KEY) throw new Error('ELEVENLABS_API_KEY no configurada')
    return new ElevenLabsService(process.env.ELEVENLABS_API_KEY)
  }

  static isAvailable(): boolean {
    return !!process.env.ELEVENLABS_API_KEY
  }
}
```

**3. Crear `src/app/api/elevenlabs/speech/route.ts`:**

Endpoint POST que recibe `{ text: string }` y devuelve el audio como `audio/mpeg`.
- Validar que `text` no esté vacío y tenga menos de 2500 caracteres
- Usar `ElevenLabsService.fromEnv()` y `DON_CANDIDO_VOICE`
- Retornar `new Response(audioBuffer, { headers: { 'Content-Type': 'audio/mpeg' } })`
- Si `ELEVENLABS_API_KEY` no existe, retornar 503 con `{ error: 'TTS no configurado' }`

**Variables de entorno requeridas:**
```
ELEVENLABS_API_KEY=sk_...
ELEVENLABS_VOICE_ID=          # Opcional, usa Adam por defecto
```

**Criterio de éxito:** El endpoint responde 200 con audio/mpeg cuando se le pasa un texto. Compila sin errores TypeScript.

---

## Ola 2 — Servicios de negocio
> Ejecutar SOLO después de que Ola 1 esté completa
> Ejecutar Agente A + Agente B + Agente C en PARALELO

### Agente A — WhatsApp Webhook bidireccional + WhatsAppService

**Puede ejecutarse en paralelo con:** Agente B, Agente C
**Depende de:** Ola 1 completa (necesita `src/types/whatsapp.ts` y `src/lib/whatsapp/WhatsAppClient.ts`)

#### Objetivo
Crear el webhook entrante de Meta, el `WhatsAppService.ts` para gestión de conversaciones en Firestore, y la configuración por organización.

#### Archivos a crear
- `src/app/api/public/whatsapp/webhook/route.ts` — GET (verificación) + POST (mensajes entrantes)
- `src/services/whatsapp/WhatsAppService.ts` — CRUD de conversaciones y mensajes en Firestore
- `src/app/api/configuracion/whatsapp/route.ts` — GET/PUT config WhatsApp por organización

#### Prompt completo para el agente

Estás trabajando en SIG-Agro, Next.js 16 + React 19 + TypeScript + Firebase. Proyecto en `c:\Users\Usuario\Documents\Proyectos\ISO -conjunto\SIG-Agro`.

Ya existen (creados en Ola 1):
- `src/types/whatsapp.ts` — tipos completos
- `src/lib/whatsapp/WhatsAppClient.ts` — cliente Meta API
- `src/lib/whatsapp/CircuitBreaker.ts`
- `src/lib/firebase-admin.ts` — exports: `adminDb`, `adminAuth`, `adminMessaging`

El multi-tenant usa colecciones: `organizations/{orgId}/...`

**1. Crear `src/app/api/public/whatsapp/webhook/route.ts`:**

```typescript
// GET — verificación del webhook por Meta
// Query params: hub.mode, hub.verify_token, hub.challenge
// Si mode=subscribe y verify_token === process.env.WHATSAPP_VERIFY_TOKEN → responder con hub.challenge
// Sino → 403

// POST — recibir mensajes entrantes de Meta
// 1. Validar X-Hub-Signature-256 con HMAC-SHA256 y process.env.WHATSAPP_APP_SECRET
//    Usando: crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
//    Si no coincide → 401
// 2. Parsear entry[0].changes[0].value
// 3. Si hay messages[] → procesar cada mensaje:
//    a. Extraer from, body, id, timestamp, phoneNumberId
//    b. Llamar WhatsAppService.handleIncoming(incomingMessage, orgId)
//       (obtener orgId buscando en Firestore por phoneNumberId)
// 4. Responder siempre 200 (Meta espera 200 aunque falle el procesamiento)
```

Estructuras Firestore que debe crear/leer:
- `whatsapp_conversations` — conversaciones indexadas por organizationId + phone_e164
- `whatsapp_messages` — mensajes con conversationId
- `organizations/{orgId}/settings/channels_whatsapp` — config de la org

**2. Crear `src/services/whatsapp/WhatsAppService.ts`:**

Clase con métodos:
- `handleIncoming(msg: IncomingWhatsAppMessage, orgId: string): Promise<void>`
  - Crea o actualiza conversación en Firestore
  - Guarda mensaje entrante
  - Si `ai_enabled` en la conversación: llama `llmRouter.chat('chat_agro', historial, systemPrompt)` y envía respuesta via `WhatsAppClient`
- `getConversations(orgId: string, status?: ConversationStatus): Promise<WhatsAppConversation[]>`
- `getMessages(conversationId: string, limit?: number): Promise<WhatsAppMessage[]>`
- `sendMessage(orgId: string, phone: string, body: string): Promise<void>`

**3. Crear `src/app/api/configuracion/whatsapp/route.ts`:**

- `GET`: Lee `organizations/{orgId}/settings/channels_whatsapp` de Firestore
- `PUT`: Actualiza la config, valida que el usuario autenticado sea de esa org

**Variables de entorno:**
```
WHATSAPP_VERIFY_TOKEN=     # Para verificar webhook con Meta
WHATSAPP_APP_SECRET=       # Para validar X-Hub-Signature-256
WHATSAPP_ACCESS_TOKEN=     # Token Meta global (fallback si la org no tiene el propio)
WHATSAPP_PHONE_NUMBER_ID=  # Phone Number ID de Meta global
```

**Criterio de éxito:** El webhook GET responde correctamente con el challenge. El webhook POST guarda mensajes en Firestore. Compila sin errores.

---

### Agente B — UnifiedConverseService (IA multi-canal)

**Puede ejecutarse en paralelo con:** Agente A, Agente C
**Depende de:** Ola 1 completa (necesita `LLMRouter.ts`)

#### Objetivo
Crear el `UnifiedConverseService` que enruta cualquier mensaje (chat web, WhatsApp, futuro voice) al `LLMRouter`, con almacenamiento persistente de conversaciones en Firestore.

#### Archivos a crear
- `src/services/ai-core/conversationStore.ts` — persistencia de sesiones de conversación en Firestore
- `src/services/ai-core/UnifiedConverseService.ts` — servicio central de conversación multi-canal
- `src/services/ai-core/adapters/whatsappAdapter.ts` — adapta mensajes WhatsApp al formato unificado
- `src/services/ai-core/adapters/chatAdapter.ts` — adapta mensajes de chat web al formato unificado

#### Archivos a modificar
- `src/app/api/ia/chat/route.ts` — actualizar para usar `UnifiedConverseService` en lugar de llamar Groq directamente

#### Prompt completo para el agente

Estás en SIG-Agro, Next.js 16 + TypeScript + Firebase. Proyecto en `c:\Users\Usuario\Documents\Proyectos\ISO -conjunto\SIG-Agro`.

Archivos existentes relevantes:
- `src/app/api/ia/chat/route.ts` — endpoint actual, llama Groq directamente, tiene el system prompt de Don Cándido
- `src/lib/groq/GroqAgroService.ts` — servicio Groq existente (NO modificar)
- `src/ai/services/LLMRouter.ts` — creado en Ola 1
- `src/lib/firebase-admin.ts` — exports: `adminDb`

**1. Crear `src/services/ai-core/conversationStore.ts`:**

```typescript
// Colección Firestore: ai_conversations/{conversationId}
// Colección: ai_conversations/{conversationId}/messages/{messageId}

interface ConversationSession {
  id: string
  channel: 'chat' | 'whatsapp'
  userId?: string
  organizationId: string
  externalId?: string          // phone para whatsapp, sessionId para chat
  createdAt: Date
  updatedAt: Date
  messageCount: number
}

interface ConversationMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  provider?: string            // 'groq' | 'claude'
  timestamp: Date
}

// Métodos:
// getOrCreate(channel, externalId, orgId): Promise<ConversationSession>
// addMessage(conversationId, message): Promise<void>
// getHistory(conversationId, limit?: number): Promise<ConversationMessage[]>
// clearHistory(conversationId): Promise<void>
```

**2. Crear `src/services/ai-core/UnifiedConverseService.ts`:**

```typescript
// Punto de entrada único para conversación IA desde cualquier canal

interface ConverseInput {
  channel: 'chat' | 'whatsapp'
  message: string
  organizationId: string
  externalId: string          // userId para chat, phone_e164 para whatsapp
  contexto?: {                // Contexto agrícola opcional
    lote?: { nombre: string; superficie: number; cultivo?: string }
    campania?: { nombre: string; estado: string }
  }
}

interface ConverseOutput {
  text: string
  provider: string
  conversationId: string
  usedFallback: boolean
}

// converse(input: ConverseInput): Promise<ConverseOutput>
// 1. conversationStore.getOrCreate(channel, externalId, orgId)
// 2. conversationStore.getHistory(conversationId, 20) → últimos 20 mensajes
// 3. Construir systemPrompt Don Cándido (extraer del route.ts actual)
// 4. llmRouter.chat('chat_agro', [...history, {role:'user', content: message}], systemPrompt)
// 5. conversationStore.addMessage() para mensaje usuario y respuesta
// 6. Retornar ConverseOutput
```

**3. Crear `src/services/ai-core/adapters/chatAdapter.ts`:**

```typescript
// Adapta el request del endpoint /api/ia/chat al formato ConverseInput
// Input: { mensaje, historial?, contexto?, userId?, organizationId }
// Output: ConverseInput

export function adaptChatRequest(body: unknown, orgId: string): ConverseInput
```

**4. Crear `src/services/ai-core/adapters/whatsappAdapter.ts`:**

```typescript
// Adapta un IncomingWhatsAppMessage al formato ConverseInput
// Input: { from, body, phoneNumberId, organizationId }
// Output: ConverseInput

export function adaptWhatsAppMessage(msg: IncomingWhatsAppMessage, orgId: string): ConverseInput
```

**5. Modificar `src/app/api/ia/chat/route.ts`:**

Cambiar para que use `UnifiedConverseService.converse()` en lugar de llamar Groq directamente. Mantener exactamente la misma firma de request/response. El historial que venía en el request ahora es ignorado (se toma de Firestore).

**Criterio de éxito:** El endpoint `/api/ia/chat` sigue funcionando igual desde el frontend, pero ahora el historial de conversación persiste entre sesiones. Compila sin errores.

---

### Agente C — Actualizar ChatAgro.tsx + endpoint ElevenLabs TTS

**Puede ejecutarse en paralelo con:** Agente A, Agente B
**Depende de:** Ola 1 completa (necesita `src/app/api/elevenlabs/speech/route.ts`)

#### Objetivo
Agregar botón de reproducción de voz al componente `ChatAgro.tsx` que convierte la respuesta de Don Cándido a audio via el endpoint TTS creado en Ola 1.

#### Archivos a modificar
- `src/components/ia/ChatAgro.tsx` — agregar botón de audio en cada respuesta del asistente

#### Prompt completo para el agente

Estás en SIG-Agro, Next.js 16 + React 19 + TypeScript. Proyecto en `c:\Users\Usuario\Documents\Proyectos\ISO -conjunto\SIG-Agro`.

Lee el archivo `src/components/ia/ChatAgro.tsx` completo antes de modificar.

El archivo usa:
- Chat flotante en esquina inferior derecha
- Mensajes con `role: 'user' | 'assistant'`
- El asistente se llama "Don Cándido"

Ya existe el endpoint `POST /api/elevenlabs/speech` que recibe `{ text: string }` y devuelve `audio/mpeg`.

**Tarea:** Agregar un botón de audio en cada mensaje de `role === 'assistant'`.

**Comportamiento:**
1. Junto a cada mensaje del asistente, mostrar un pequeño botón con ícono de speaker (usa `lucide-react` que ya está instalado: `import { Volume2, VolumeX } from 'lucide-react'`)
2. Al hacer click, hacer `fetch('/api/elevenlabs/speech', { method:'POST', body: JSON.stringify({text: mensaje.content}) })`
3. Mientras carga: mostrar spinner, deshabilitar botón
4. Al recibir respuesta: crear `URL.createObjectURL(blob)` y reproducir con `new Audio(url).play()`
5. Si el endpoint devuelve 503 (TTS no configurado): ocultar el botón completamente para todos los mensajes (no mostrar error al usuario)
6. Si falla por otro motivo: mostrar el ícono `VolumeX` brevemente (2 segundos) y volver al estado normal

**Estado a agregar:** `ttsAvailable: boolean | null` (null = no se sabe aún, true = disponible, false = no disponible). Hacer un probe call a `/api/elevenlabs/speech` con texto vacío al montar el componente para determinar disponibilidad (si responde 400 = disponible, si 503 = no disponible).

**Criterio de éxito:** El botón de voz aparece solo cuando ElevenLabs está configurado. No romper ninguna funcionalidad existente del chat. Compila sin errores TypeScript.

---

## Ola 3 — Integración multi-tenant y variables de entorno
> Ejecutar SOLO después de que Ola 2 esté completa
> Ejecutar Agente A + Agente B en PARALELO

### Agente A — Configuración multi-tenant WhatsApp en UI

**Puede ejecutarse en paralelo con:** Agente B
**Depende de:** Ola 2 completa

#### Objetivo
Crear la página de configuración de WhatsApp por organización donde el admin puede ingresar su `access_token`, `phone_number_id` y `verify_token` de Meta.

#### Archivos a crear
- `src/app/(dashboard)/configuracion/whatsapp/page.tsx` — página de configuración WhatsApp
- `src/components/whatsapp/WhatsAppConfigForm.tsx` — formulario de configuración

#### Prompt completo para el agente

Estás en SIG-Agro, Next.js 16 + React 19 + TypeScript. Proyecto en `c:\Users\Usuario\Documents\Proyectos\ISO -conjunto\SIG-Agro`.

Lee cómo se estructuran otras páginas de configuración en `src/app/(dashboard)/configuracion/` para seguir el mismo patrón visual (usa Tailwind CSS v4 + Radix UI).

Existe el endpoint `GET/PUT /api/configuracion/whatsapp` (creado en Ola 2).

**Crear formulario con campos:**
- Toggle "Habilitar WhatsApp" (`enabled`)
- Select "Proveedor": Meta / Twilio
- Input "Phone Number ID" (solo para Meta)
- Input "Access Token" (con tipo password + botón show/hide)
- Input "Verify Token" (para webhook)
- Select "Modo": Solo notificaciones / Inbox / Híbrido
- Badge de estado: Pendiente / Verificado / Error (basado en `webhook_status`)
- Botón "Guardar configuración"
- Botón "Probar webhook" → llama `POST /api/configuracion/whatsapp/test-webhook`

Usar `@radix-ui/react-select` y `@radix-ui/react-dialog` que ya están en el proyecto.

**Criterio de éxito:** La página carga la configuración actual, permite modificarla y guardar. Muestra estado del webhook. Compila sin errores TypeScript.

---

### Agente B — Documentación técnica actualizada

**Puede ejecutarse en paralelo con:** Agente A
**Depende de:** Ola 2 completa

#### Objetivo
Actualizar el archivo `docs/SIG_AGRO_BASELINE_TECNICA_2026-02-14.md` con todas las nuevas capacidades implementadas en este plan.

#### Archivos a modificar
- `docs/SIG_AGRO_BASELINE_TECNICA_2026-02-14.md` — agregar secciones de WhatsApp Meta API, LLM Router, ElevenLabs, UnifiedConverseService

#### Prompt completo para el agente

Estás en SIG-Agro. Lee el archivo `docs/SIG_AGRO_BASELINE_TECNICA_2026-02-14.md` y actualízalo agregando:

1. En **Stack efectivo**: agregar `@anthropic-ai/sdk 0.67.x`, `ElevenLabs REST API (TTS)`
2. Nueva sección **## Comunicación WhatsApp** con:
   - Proveedor: Meta Graph API v19.0 (bidireccional)
   - Webhook entrante: `POST /api/public/whatsapp/webhook`
   - Verificación webhook: `GET /api/public/whatsapp/webhook`
   - Tipos: `src/types/whatsapp.ts`
   - Colecciones Firestore: `whatsapp_conversations`, `whatsapp_messages`
3. Nueva sección **## IA Conversacional** con:
   - LLM Router: Groq (primario) + Claude (fallback)
   - Capabilities: chat_agro, analisis_lote, recomendacion, doc_gen
   - UnifiedConverseService: canal único para chat web y WhatsApp
   - Conversaciones persistidas en Firestore: `ai_conversations`
4. Nueva sección **## Text-to-Speech (Don Cándido)** con:
   - Proveedor: ElevenLabs
   - Endpoint: `POST /api/elevenlabs/speech`
   - Modelo: `eleven_multilingual_v2`
5. Nueva sección **## Variables de entorno nuevas** con tabla completa:

| Variable | Servicio | Requerida |
|----------|----------|-----------|
| `ANTHROPIC_API_KEY` | Claude fallback LLM | No (recomendada) |
| `ANTHROPIC_MODEL` | Claude model ID | No (default: claude-sonnet-4-6) |
| `WHATSAPP_VERIFY_TOKEN` | Webhook Meta | Sí (si usa WhatsApp Meta) |
| `WHATSAPP_APP_SECRET` | Validación HMAC webhook | Sí (si usa WhatsApp Meta) |
| `WHATSAPP_ACCESS_TOKEN` | Meta Graph API | Sí (si usa WhatsApp Meta) |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta Phone Number | Sí (si usa WhatsApp Meta) |
| `ELEVENLABS_API_KEY` | TTS Don Cándido | No (sin TTS si falta) |
| `ELEVENLABS_VOICE_ID` | Voz personalizada | No (usa Adam por defecto) |

Actualizar la fecha del documento a 2026-05-01.

---

## Ola 4 — Verificación e integración final
> Ejecutar SOLO después de que Ola 3 esté completa

### Agente A — Prueba de integración completa

**Puede ejecutarse en paralelo con:** es el único de esta ola
**Depende de:** Ola 3 completa

#### Objetivo
Verificar que todos los flujos funcionan end-to-end: compilación TypeScript, tests existentes, y que el chat web sigue funcionando.

#### Prompt completo para el agente

Estás en SIG-Agro. Proyecto en `c:\Users\Usuario\Documents\Proyectos\ISO -conjunto\SIG-Agro`.

Ejecutar en este orden:

1. `npx tsc --noEmit` — verificar que todo compila sin errores TypeScript
2. `npm run test` — ejecutar tests existentes (vitest)
3. Revisar que `src/app/api/ia/chat/route.ts` no tiene llamadas directas a Groq (debe usar UnifiedConverseService)
4. Verificar que el webhook `src/app/api/public/whatsapp/webhook/route.ts` existe y tiene tanto GET como POST handler
5. Verificar que `src/lib/whatsapp/WhatsAppClient.ts` existe y exporta la clase
6. Verificar que `src/ai/services/LLMRouter.ts` exporta `llmRouter` como singleton
7. Reportar cualquier error encontrado con la ruta exacta del archivo y línea

Si encuentras errores TypeScript, corrígelos. No agregar funcionalidad nueva.

**Criterio de éxito:** `npx tsc --noEmit` sale con código 0. Tests pasan. Reporte final con lista de archivos creados/modificados.

---

## Verificación final (manual)

- [ ] `npx tsc --noEmit` sin errores
- [ ] `npm run test` verde
- [ ] Webhook WhatsApp responde 200 a POST de prueba con payload de Meta
- [ ] Chat web `/api/ia/chat` sigue respondiendo igual (misma API, ahora con historial persistido)
- [ ] Endpoint `/api/elevenlabs/speech` retorna audio/mpeg con texto de prueba
- [ ] Página `/configuracion/whatsapp` carga y permite guardar config
- [ ] LLMRouter usa Groq por defecto, Claude solo como fallback o para `doc_gen`
- [ ] Variables de entorno documentadas en `docs/SIG_AGRO_BASELINE_TECNICA_2026-02-14.md`

---

## Archivos nuevos totales (resumen)

```
src/types/whatsapp.ts
src/lib/whatsapp/WhatsAppClient.ts
src/lib/whatsapp/CircuitBreaker.ts
src/lib/whatsapp/RateLimiter.ts
src/lib/claude/client.ts
src/lib/elevenlabs/client.ts
src/lib/elevenlabs/voice-config.ts
src/ai/config/llmRouting.ts
src/ai/services/LLMRouter.ts
src/app/api/public/whatsapp/webhook/route.ts
src/app/api/configuracion/whatsapp/route.ts
src/app/api/elevenlabs/speech/route.ts
src/services/whatsapp/WhatsAppService.ts
src/services/ai-core/conversationStore.ts
src/services/ai-core/UnifiedConverseService.ts
src/services/ai-core/adapters/chatAdapter.ts
src/services/ai-core/adapters/whatsappAdapter.ts
src/app/(dashboard)/configuracion/whatsapp/page.tsx
src/components/whatsapp/WhatsAppConfigForm.tsx
```

## Archivos modificados (resumen)

```
src/app/api/ia/chat/route.ts              ← usa UnifiedConverseService
src/components/ia/ChatAgro.tsx            ← botón TTS
docs/SIG_AGRO_BASELINE_TECNICA_2026-02-14.md  ← actualizado
package.json                              ← @anthropic-ai/sdk
```
