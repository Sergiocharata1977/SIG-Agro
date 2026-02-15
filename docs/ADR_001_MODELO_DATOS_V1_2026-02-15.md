# ADR-001: Modelo de Datos v1 para Dominios Operativos SIG Agro

Fecha: 2026-02-15
Estado: Aprobado (A1)
Decision owner: Coordinacion tecnica

## Contexto
El plan multiagente requiere un modelo comun para cerrar brechas en:
- cuaderno de campo,
- tratamientos,
- riego,
- subparcelas con versionado,
- sensores/telemetria,
- rentabilidad por unidad productiva.

La base existente era funcional pero fragmentada por modulo, sin contrato unificado para nuevas capacidades.

## Decision
Se adopta esquema de dominios v1 bajo `organizations/{orgId}` con colecciones:
1. `field_logbooks`
2. `treatments`
3. `irrigation_plans`
4. `subplots`
5. `sensor_readings`
6. `profitability_snapshots`

Reglas estructurales:
- Todos los documentos incluyen auditoria (`createdAt`, `updatedAt`, `createdBy`, `status`).
- Todas las entidades son multi-tenant por `organizationId`.
- `organizationId` activo se mantiene para compatibilidad; `organizationIds[]` para acceso multipertenencia.
- Geometrias de subparcelas guardan historial de versionado.

## Consecuencias
Positivas:
- Contrato de datos consistente para A2-A7.
- Integracion simple con dashboards y E2E.
- Mejor trazabilidad para auditoria operativa.

Trade-offs:
- Requiere migracion de usuarios legacy para normalizar `organizationIds` y `accessAllOrganizations`.
- Firestore no impone esquema; validacion pasa a capa de servicios/tests.

## Implementacion A1
- Tipos unificados: `src/types/domain-model.ts`
- Migracion: `scripts/migrate-a1-domain-model.js`
- Seed tecnico: `scripts/seed-a1-domain.js`
- Scripts npm:
  - `npm run migrate:a1:dry`
  - `npm run migrate:a1`
  - `npm run seed:a1`

## Riesgos y mitigacion
- Riesgo: datos legacy incompletos.
  - Mitigacion: migracion idempotente y modo dry-run.
- Riesgo: acceso cruzado entre organizaciones.
  - Mitigacion: reforzar validaciones por `organizationId` en servicios/API.

## Criterio de salida A1
- ADR aprobado.
- Migracion y seed ejecutables.
- Build y lint en verde.
