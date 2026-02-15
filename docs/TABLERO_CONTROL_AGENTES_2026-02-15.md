# TABLERO DE CONTROL AGENTES - SIG AGRO

Fecha de corte: 2026-02-15
Objetivo: controlar cierre de agentes, detectar incompletos y definir lanzamientos pendientes.

## Estado por agente (evidencia en repo local)

| Agente | Estado | Evidencia en repo local | Accion inmediata |
|---|---|---|---|
| A1 Arquitectura y Datos | Pendiente | No se detectan nuevas colecciones/ADRs/migraciones A1 | Lanzar A1 y exigir PR/commit hash |
| A2 Cuaderno + Tratamientos | Pendiente | No hay modulo dedicado `field_logbooks`/`treatments` | Lanzar A2 despues de A1 |
| A3 Riego | Pendiente | No hay modulo dedicado de planificacion de riego | Lanzar A3 despues de A1 |
| A4 DSS Agronomico | Pendiente | No existen artefactos DSS reportados en `src/services/dss` | Lanzar A4 despues de A1 |
| A5 Catastro/Subparcelas | Pendiente | No existen `subplots` ni versionado geometrico | Lanzar A5 despues de A1 |
| A6 Integraciones IoT/Maquinaria | No iniciado | No hay pipelines/normalizacion IoT dedicados | Lanzar A6 tras base A1 |
| A7 Rentabilidad Productiva | Parcial legacy | Hay piezas de costos/margen dispersas, no tablero integrado | Completar A7 con dashboard unificado |
| A8 UX/UI y Navegacion | Parcial-alto | Sidebar/header/tokens y ABM organizaciones implementados | Cerrar checklist UX cross-modulo |
| A9 QA/E2E/Observabilidad | Parcial | Hay tests API y e2e smoke de alertas/notificaciones | Expandir cobertura journeys criticos |
| A10 Coordinacion e Integracion | Completado v1 | Plan maestro + prompts + matriz consolidada | Mantener seguimiento diario |

## Incompleto que se completa ahora (A10)

Se completa oficialmente A10 v1 con este tablero operativo y protocolo de control:
1. Cada agente debe entregar `branch + commit hash + evidencia de pruebas`.
2. Orden de merge obligatorio: `A1 -> A2/A3/A4/A5 -> A6/A7 -> A8 -> A9`.
3. Gate por merge: `npm run lint && npm run build && npm run test`.
4. Registro obligatorio en documento de coordinacion por bloque de trabajo.

## Agentes por lanzar del plan original

Pendientes de lanzamiento efectivo:
- A1
- A2
- A3
- A4
- A5
- A6
- A7 (fase de cierre, no finalizado)
- A9 (fase de cierre, no finalizado)

Ya lanzados con avance en repo local:
- A8 (parcial-alto)
- A10 (completado v1)

## Checklist de unificacion (cuando entreguen ramas)

1. Validar cambios A1 y merge.
2. Merge paralelo controlado A2/A3/A4/A5.
3. Integrar A6 + A7.
4. Pasada de homogeneizacion UX A8.
5. QA final A9 (E2E + gates).
6. Release candidate y acta de cierre.

## Plantilla minima de reporte por agente

```md
### Reporte Agente X - YYYY-MM-DD HH:mm
- Estado: en_progreso|bloqueado|completado
- Branch: feature/aX-...
- Commit(s): <hash>
- Avances:
  - ...
- Archivos modificados:
  - ...
- Pruebas ejecutadas:
  - lint/build/test/e2e ...
- Riesgos/Bloqueos:
  - ...
- Proximo paso:
  - ...
```
