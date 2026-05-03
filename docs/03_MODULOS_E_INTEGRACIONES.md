# Modulos e Integraciones

Fecha: 2026-05-03

## Modulos funcionales presentes

| Modulo | Estado | Ruta principal | Plugin requerido |
|---|---|---|---|
| Dashboard | Implementado | `/dashboard` | — |
| Metricas | Implementado | `/metricas` | — |
| Campos y GIS | Implementado | `/campos`, `/lotes`, `/dashboard` | `mapa_gis` |
| Analisis IA satelital | Implementado | `/analisis-ia` | `analisis_ia` |
| Campanias | Implementado | `/campanias` | `campanias` |
| Cuaderno de campo | Implementado | `/cuaderno` | `campanias` |
| Rentabilidad | Implementado | `/rentabilidad` | — |
| Operaciones | Implementado | `/operaciones` | — |
| Riego | Implementado | `/riego` | — |
| Scouting | Implementado | `/scouting` | — |
| Contabilidad | Implementado | `/contabilidad` | — |
| Terceros | Implementado | `/terceros` | — |
| Mayor contable | Implementado | `/contabilidad/mayor` | `contabilidad_avanzada` |
| Cuenta corriente tercero | Implementado | `/terceros/[id]` | `contabilidad_avanzada` |
| Operaciones comerciales | Implementado | `/operaciones/comerciales` | `operaciones_comerciales` |
| Resultado por campana | Implementado | `/campanas/resultado` | `agro_gestion` |
| Centros de costo | Implementado | `/centros-costo` | `presupuesto_control` |
| Presupuesto vs real | Implementado | `/presupuesto` | `presupuesto_control` |
| Auditoria de cambios | Implementado | `/auditoria` | `iso_control_interno` |
| Aprobaciones | Implementado | `/aprobaciones` | `iso_control_interno` |
| Plugins (config) | Implementado | `/configuracion/plugins` | — |
| Organizaciones | Implementado | `/organizaciones` | — |
| Documentos / Manual | Implementado | `/documentos` | — |
| Tesoreria | **Pendiente** | `/tesoreria`, `/cheques`, `/flujo-caja` | `tesoreria` |

---

## Integraciones reales confirmadas

### FCM Push

Estado: implementado

Archivos:
- `src/services/fcm.ts`
- `src/app/api/notifications/send/route.ts`
- `src/app/api/notifications/token/route.ts`

### WhatsApp Meta API

Estado: implementado (bidireccional)

Archivos:
- `src/app/api/whatsapp/webhook/route.ts`
- `src/services/whatsapp.ts`

Conversaciones persistidas en Firestore.

### LLM Router multi-proveedor

Estado: implementado

Proveedores: Groq (primario), Claude Anthropic (fallback).
Archivo: `src/services/llm-router.ts`

### ElevenLabs Text-to-Speech

Estado: implementado

Archivo: `src/services/elevenlabs.ts`

### Email de alertas (Resend)

Estado: implementado

Archivo: `src/app/api/alerts/send/route.ts`

### Firebase Storage (adjuntos)

Estado: implementado

Archivo: `src/services/adjuntos.ts`
Path: `organizations/{orgId}/adjuntos/{entidadTipo}/{entidadId}/{file}`

---

## Sistema de plugins

Estado: implementado

Catalogo de plugins activos:

| ID | Nombre comercial |
|---|---|
| `contabilidad_avanzada` | Contabilidad Avanzada |
| `tesoreria` | Tesoreria |
| `cuentas_corrientes` | Cuentas Corrientes |
| `operaciones_comerciales` | Operaciones Comerciales |
| `agro_gestion` | Agro Gestion |
| `presupuesto_control` | Presupuesto y Control |
| `iso_control_interno` | ISO y Control Interno |
| `exportacion` | Exportacion Excel/PDF |

Activacion: por organizacion en Firestore `organizations/{orgId}/settings/plugins`.
Control de acceso en UI: `PluginGate` y `usePlugins().isActive(pluginId)`.

---

## Integraciones pendientes

- Twilio SMS: extraer a capa de proveedor propia, persistir resultados.
- WhatsApp webhook inbound: validacion de firma, historial de conversaciones.
- `/api/notifications/preferences`: ruta faltante.
