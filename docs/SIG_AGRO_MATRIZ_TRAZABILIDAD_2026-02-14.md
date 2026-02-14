# SIG Agro - Matriz de Trazabilidad Tecnica

Fecha: 2026-02-14

| Modulo | Servicio | Endpoint/API | Estado tecnico | Evidencia |
|---|---|---|---|---|
| Alertas | `src/services/alerts.ts` | `POST /api/alerts/send` | Activo (push/email/sms/whatsapp real) | `src/app/api/alerts/send/route.ts` |
| Notificaciones push | `src/services/fcm.ts` | `POST /api/notifications/send` | Activo (FCM real) | `src/app/api/notifications/send/route.ts` |
| Tokens FCM | `src/services/fcm.ts` | `POST/DELETE /api/notifications/token` | Activo | `src/app/api/notifications/token/route.ts` |
| Satelital | `src/services/satellite-analysis.ts` | `POST/GET /api/satellite/analyze` | Activo (multi-indice + fix sintaxis) | `src/services/satellite-analysis.ts` |
| VRA | `src/services/vra.ts` | `POST /api/satellite/prescription` | Activo | `src/services/vra.ts` |
| IA agro | `src/services/dashboard-ia.ts` | `/api/ia/chat`, `/api/ia/analizar-lote`, `/api/ia/recomendacion` | Activo | `src/app/api/ia/*` |
| Clima | `src/services/weather.ts` | Integracion Open-Meteo | Activo | `src/services/weather.ts` |
| Offline/PWA | `src/lib/indexed-db.ts`, `src/hooks/useOfflineSync.tsx` | Service Worker + pagina offline | Activo | `src/components/pwa/PWAProvider.tsx` |

## Pendientes tecnicos visibles
1. Definir smoke test formal previo a release.
2. Agregar tests E2E (no solo unitarios) para alertas/notificaciones.
