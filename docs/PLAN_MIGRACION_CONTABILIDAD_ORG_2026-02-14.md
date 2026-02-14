# Plan de Migracion Contable a organizations/{orgId}

Fecha: 2026-02-14
Estado: en ejecucion (fase base implementada)

## Objetivo
Unificar contabilidad en modelo organizacional:
- origen legacy: `agro_productores/{productorId}/...`
- destino: `organizations/{orgId}/accounts` y `organizations/{orgId}/journal_entries`

## Modelo de dominio esperado
- `Productor` = entidad padre
- `Organizacion` = entidad hija
- Relacion: `1 Productor -> N Organizaciones`
- Cada organizacion puede tener multiples usuarios copilotos (members con roles)

## Entregables implementados
1. Servicio unificado:
- `src/services/accounting-org.ts`
- Numeracion atomica de asientos via transaccion y contador en:
  - `organizations/{orgId}/system/accounting_counter`

2. Script de migracion:
- `scripts/migrate-accounting-to-org.js`
- Modo simulacion:
  - `npm run migrate:accounting:dry`
- Modo ejecucion:
  - `npm run migrate:accounting`
- Opcional por productor:
  - `node scripts/migrate-accounting-to-org.js --dry-run --producer=<producerId>`

3. Normalizacion de tipo:
- `src/types/accounting.ts`
- `unidadMedida` corregido de `has` a `ha`.

## Reglas de migracion
1. Resolver organizaciones destino del productor con prioridad:
- `agro_productores/{producerId}.organizationIds` (modelo padre-hijo)
- fallback: `organizations` where `createdBy == producerId`
- fallback legacy: `users/{producerId}.organizationId`
2. Migrar cuentas:
- de `agro_productores/{producerId}/cuentas`
- a `organizations/{orgId}/accounts` para cada organizacion asociada
- evita duplicados por `codigo`.
3. Migrar asientos:
- de `agro_productores/{producerId}/asientos`
- a `organizations/{orgId}/journal_entries` para cada organizacion asociada
- evita duplicados por `legacyAsientoId`.
4. Ajustar contador con maximo `numero` migrado.

## Campos legacy preservados
- `legacyProducerId`
- `legacyAsientoId`

## Checklist operativo
1. Ejecutar dry-run y guardar salida.
2. Verificar conteos por organizacion.
3. Ejecutar migracion real.
4. Validar:
- cantidad de cuentas migradas,
- cantidad de asientos migrados,
- contador `journalEntryNumber`.
5. Repetir dry-run (debe quedar en 0 nuevos elementos).

## Riesgos y mitigacion
1. Usuario legacy sin `organizationId`:
- el script lo marca como `skip`.
2. Duplicados preexistentes:
- dedupe por `codigo` y `legacyAsientoId`.
3. Inconsistencias de tipos:
- la migracion normaliza campos minimos y conserva metadata legacy.
