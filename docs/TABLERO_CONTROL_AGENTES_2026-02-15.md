# TABLERO DE CONTROL AGENTES - SIG AGRO

Fecha de corte: 2026-02-15
Objetivo: controlar cierre de agentes, detectar incompletos y definir lanzamientos pendientes.

## Estado por agente (evidencia en repo local)

| Agente | Estado | Evidencia en repo local | Accion inmediata |
|---|---|---|---|
| A1 Arquitectura y Datos | Completado | ADR + tipos + migracion + seed A1 | Mantener estabilidad de esquema |
| A2 Cuaderno + Tratamientos | Completado | Modulo `/cuaderno` + servicios + export CSV | Integrar firma regulatoria avanzada |
| A3 Riego | Completado | Modulo `/riego` + KPIs + alertas | Integrar telemetria real para automatizacion |
| A4 DSS Agronomico | Completado | Motor DSS + ruleset + endpoint + tests unitarios | Integrar calibracion por cultivo/region |
| A5 Catastro/lotes | Completado | Modulo lotes con versionado geometrico + comparativa + validaciones | Integrar editor geometrico de mapa |
| A6 Integraciones IoT/Maquinaria | Completado v1 simulado | Hub de integraciones + idempotencia + APIs + tests unitarios | Conectar adaptadores reales por proveedor |
| A7 Rentabilidad Productiva | Completado v1 | Modulo `/rentabilidad` con KPIs y comparativa interanual | Afinar reconciliacion con contabilidad avanzada |
| A8 UX/UI y Navegacion | Completado | Navegacion unificada con modulos operativos y consistencia visual | Iterar micro UX por uso real |
| A9 QA/E2E/Observabilidad | Completado v1 | Tests API nuevos + unitarios dominio + gate `qa:gate` | Ampliar E2E browser de journeys completos |
| A10 Coordinacion e Integracion | Completado v1 | Plan maestro + prompts + matriz consolidada | Mantener seguimiento diario |

## Incompleto que se completa ahora (A10)

Se completa oficialmente A10 v1 con este tablero operativo y protocolo de control:
1. Cada agente debe entregar `branch + commit hash + evidencia de pruebas`.
2. Orden de merge obligatorio: `A1 -> A2/A3/A4/A5 -> A6/A7 -> A8 -> A9`.
3. Gate por merge: `npm run lint && npm run build && npm run test`.
4. Registro obligatorio en documento de coordinacion por bloque de trabajo.

## Agentes por lanzar del plan original

Pendientes de lanzamiento efectivo:
- Ninguno (A1-A10 implementados en este branch local, con A6/A7/A9 en version v1).

Ya lanzados con avance en repo local:
- A1 a A10 (ver matriz superior).

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

