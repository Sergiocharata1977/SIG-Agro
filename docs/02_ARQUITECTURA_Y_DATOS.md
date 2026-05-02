# Arquitectura y Datos

Fecha: 2026-05-01

## Stack efectivo

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- Firebase Auth
- Firestore
- Firebase Admin
- Firebase Messaging
- Groq API
- `@anthropic-ai/sdk` 0.67.x
- Meta Graph API v19.0 para WhatsApp
- ElevenLabs REST API

## Arquitectura vigente

### Frontend

- Rutas App Router con grupo `(dashboard)` para experiencia autenticada.
- Sidebar lateral como contenedor de navegacion operativa.
- Modulos UI en `src/app`, `src/components`, `src/components/design-system`.

### Backend

- API routes en `src/app/api`.
- Servicios de dominio en `src/services`.
- Integraciones tecnicas en `src/lib`.
- Router de IA y configuracion de capacidades en `src/ai`.

### Multi-tenant

La unidad primaria es `organizationId`.

Principios vigentes:

- Los datos operativos deben vivir dentro de `organizations/{orgId}` o llevar `organizationId`.
- El acceso efectivo depende de usuario, organizacion activa y plugins habilitados.
- La UI filtra navegacion y acceso por capacidad.

## Componentes de control de acceso

Archivos clave:

- `src/contexts/AuthContext.tsx`
- `src/lib/access-control/effectiveAccess.ts`
- `src/lib/access-control/profiles.ts`
- `src/services/plugins/CapabilityService.ts`
- `src/services/plugins/PluginLifecycleService.ts`
- `src/components/PluginGuard.tsx`

## Plugins

El sistema de plugins esta materializado en manifiestos locales y servicios de capacidad.

Archivos clave:

- `src/config/plugins/*.manifest.ts`
- `src/config/plugins/index.ts`

Estado:

- Base implementada.
- Integrada con sidebar y guard de rutas.
- Aun requiere madurez documental y mayor cobertura operativa.

## Modelo de datos operativo vigente

Dominios relevantes confirmados en repo:

- organizaciones
- campos
- lotes
- campanias
- scouting
- operaciones
- contabilidad
- analisis satelital
- alertas
- notificaciones
- `whatsapp_conversations`
- `whatsapp_messages`
- `ai_conversations`

## Comunicacion WhatsApp

- Proveedor principal implementado: Meta Graph API v19.0.
- Webhook entrante: `POST /api/public/whatsapp/webhook`.
- Verificacion del webhook: `GET /api/public/whatsapp/webhook`.
- Tipos compartidos: `src/types/whatsapp.ts`.
- Servicio conversacional: `src/services/whatsapp/WhatsAppService.ts`.
- Cliente de envio: `src/lib/whatsapp/WhatsAppClient.ts`.
- Configuracion por organizacion persistida en `organizations/{orgId}/settings/channels_whatsapp`.

## IA Conversacional

- Router LLM: `src/ai/services/LLMRouter.ts`.
- Capacidades activas: `chat_agro`, `analisis_lote`, `recomendacion`, `doc_gen`.
- Estrategia de proveedores: Groq primario con Claude como fallback.
- Servicio unificado de conversacion: `src/services/ai-core/UnifiedConverseService.ts`.
- Persistencia: `ai_conversations` con subcoleccion `messages`.
- Adaptadores vigentes: chat web y WhatsApp.

## Text-to-Speech

- Proveedor: ElevenLabs.
- Endpoint operativo: `POST /api/elevenlabs/speech`.
- Voz de Don Juan GIS resuelta desde `src/lib/elevenlabs/voice-config`.

## Invariantes recomendados

- Todo documento operativo debe tener `organizationId`.
- Toda accion server-side debe validar contexto de organizacion.
- Toda integracion externa debe registrar resultado, error y metadatos del proveedor.

## Estado de decisiones

La decision de dominios operativos v1 sigue vigente y se conserva en `ADR_001_MODELO_DATOS_V1.md`.
