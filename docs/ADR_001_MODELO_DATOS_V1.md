# ADR-001: Modelo de Datos v1 para Dominios Operativos SIG Agro

Fecha: 2026-02-15
Estado: aprobado y vigente

## Contexto

SIG Agro necesitaba un contrato comun para dominios operativos nuevos y multi-tenant, evitando que cada modulo creciera con estructuras aisladas.

## Decision

Se adopta un esquema de dominios v1 bajo `organizations/{orgId}` con colecciones operativas especializadas.

Colecciones base definidas:

1. `field_logbooks`
2. `treatments`
3. `irrigation_plans`
4. `lotes_detalle`
5. `sensor_readings`
6. `profitability_snapshots`

## Reglas estructurales

- Todos los documentos deben incluir auditoria.
- Todas las entidades operativas deben ser multi-tenant.
- El `organizationId` es obligatorio como identidad transversal.
- Las geometrias de lotes deben soportar historial/versionado.

## Consecuencias

Positivas:

- Contrato de datos consistente para crecimiento modular.
- Mejor trazabilidad tecnica.
- Base util para dashboards, E2E y nuevos servicios.

Trade-offs:

- Requiere migraciones y disciplina de validacion.
- Firestore no impone esquema por si solo.

## Evidencia implementada

- `src/types/domain-model.ts`
- `scripts/migrate-a1-domain-model.js`
- `scripts/seed-a1-domain.js`

## Estado actual

La decision sigue vigente como marco de arquitectura, aunque no todos los dominios definidos en el ADR estan igualmente maduros en la UI o en los flujos finales del producto.
