# PLAN FORMULARIOS OPERATIVOS + CONTABILIDAD AUTOMATICA (ORG) - 2026-02-16

## 1. Diagnostico del estado actual (auditado en codigo)

### 1.1 Lo que SI existe por organizacion
- Colecciones contables y de stock por org:
  - `organizations/{orgId}/accounts`
  - `organizations/{orgId}/journal_entries`
  - `organizations/{orgId}/asientos_auto`
  - `organizations/{orgId}/terceros`
  - `organizations/{orgId}/movimientos_terceros`
  - `organizations/{orgId}/products`
  - `organizations/{orgId}/stock_movements`
- Motor de asientos automaticos implementado en `src/services/asientos-auto.ts` para:
  - `compra_insumo`
  - `aplicacion_insumo`
  - `cosecha`
  - `entrega_acopiador`
  - `venta`
  - `cobro`
  - `pago`
- Integracion geoespacial base por org existe para campos/lotes/eventos:
  - `organizations/{orgId}/campos`
  - `organizations/{orgId}/campos/{campoId}/lotes`
  - `organizations/{orgId}/campos/{campoId}/lotes/{loteId}/eventos`

### 1.2 Brechas detectadas (contra requerimiento objetivo)
- Falta persistencia formal de la "operacion de formulario" (compra/aplicacion/cosecha/entrega) como entidad propia.
  - Hoy se guarda asiento y movimientos auxiliares, pero no siempre el registro operativo completo auditado.
- Falta trazabilidad completa formulario -> operacion -> asiento -> movimiento stock -> tercero en un mismo modelo canonico.
- Falta cobertura UI de formularios agro clave (en `operaciones/page.tsx` hoy hay compra/cobro/pago; no completo para aplicacion/cosecha/entrega).
- Falta normalizacion explicita de Depositos/Silos con existencias por ubicacion.
- GIS no esta integrado de punta a punta en todos los formularios contables operativos (principalmente compra y entrega).
- Falta capa de idempotencia/auditoria ISO en todos los botones "Guardar" (evitar doble registro por doble click/reintento).

## 2. Objetivo funcional

Cada formulario operativo debe:
1. Guardar la operacion de negocio (registro operativo) en coleccion propia por org.
2. Ejecutar asiento automatico de doble partida.
3. Ejecutar movimiento fisico de stock (si aplica).
4. Dejar trazabilidad completa campo/lote/campana/deposito/silo/GIS.
5. Dejar auditoria ISO 9001 (quien, cuando, antes/despues, origen, correlacion).

## 3. Modelo de datos recomendado (target por organizacion)

### 3.1 Colecciones nuevas/normalizadas
- `organizations/{orgId}/operations`
  - Registro canonico de toda operacion de formulario.
- `organizations/{orgId}/warehouses`
  - Depositos de insumos / silos / acopio intermedio.
- `organizations/{orgId}/inventory_balances`
  - Saldos por `productId + warehouseId` (cache consistencia).
- `organizations/{orgId}/operation_audit`
  - Trail ISO (evento, payload redacted, estado, actor, requestId).

### 3.2 Relacion minima por documento de operation
Campos obligatorios sugeridos:
- `id`
- `productorId` (obligatorio para consolidado multi-organizacion del agricultor)
- `type`: `compra_insumo | aplicacion_insumo | cosecha | entrega_grano | venta | cobro | pago`
- `status`: `draft | posted | voided`
- `organizationId`
- `campaniaId` (cuando aplique)
- `campoId` (cuando aplique)
- `loteId` (cuando aplique)
- `warehouseOrigenId` / `warehouseDestinoId` (cuando aplique)
- `productId` / `tipoInsumo` / `tipoGrano`
- `quantity`, `unit`, `unitPrice`, `amount`
- `counterpartyId` (tercero)
- `journalEntryId` (asiento generado)
- `stockMovementIds` (1..n)
- `gis`: `polygonId`, `appliedAreaHa`, `geometryVersionId` (cuando aplique)
- `requestId` (idempotencia)
- `createdBy`, `createdAt`, `updatedAt`

### 3.3 Regla de identidad transversal (obligatoria)
- Todo registro operativo/contable debe persistir **ambos IDs**:
  - `productorId`
  - `organizationId`
- Aplica a:
  - `operations`
  - `asientos_auto` / `journal_entries`
  - `stock_movements`
  - `movimientos_terceros`
  - `operation_audit`

## 3.4 Consolidado por agricultor (multi-organizacion)
- Consultas de rendimiento deben poder ejecutarse por:
  - `productorId` (consolidado total)
  - `productorId + organizationId` (detalle por empresa)
  - `productorId + campaniaId` (comparativo temporal)
- KPI objetivo:
  - superficie total sembrada
  - produccion total (tn)
  - rendimiento promedio (tn/ha)
  - rendimiento por campo/lote/cultivo/campana
- Recomendacion de indices:
  - `operations(productorId, type, fecha)`
  - `operations(productorId, campaniaId, campoId, loteId)`
  - `journal_entries(productorId, organizationId, fecha)`
  - `stock_movements(productorId, organizationId, fecha)`

## 4. Plan detallado de formularios (requeridos)

## 4.1 Formulario Compra de Insumos
### Datos UI
- Proveedor (tercero)
- Insumo/producto
- Cantidad
- Precio unitario
- Deposito destino
- Fecha
- Campo opcional / Campana opcional para imputacion posterior

### Reglas contables automaticas
- Debe: cuenta de insumo segun tipo (semilla/fertilizante/agroquimico/combustible)
- Haber: Proveedores

### Reglas de stock
- Entrada en `warehouseDestinoId`
- Actualiza `inventory_balances`
- Crea `stock_movements`

### Persistencia obligatoria
- `operations` (type=compra_insumo)
- `asientos_auto` o `journal_entries`
- `movimientos_terceros`
- `stock_movements`
- `operation_audit`

## 4.2 Formulario Aplicacion de Insumos
### Datos UI
- Campo
- Lote
- Campana
- Insumo aplicado
- Cantidad usada
- Fecha
- Metodo (siembra/fertilizacion/pulverizacion)
- Deposito origen

### Reglas contables automaticas
- Debe: Cultivos en preparacion
- Haber: Insumos (segun tipo)

### Reglas GIS
- Guarda relacion con geometria del lote
- Registra superficie aplicada
- Trazabilidad temporal por campana

### Reglas stock
- Salida de deposito origen

### Persistencia obligatoria
- `operations` (type=aplicacion_insumo)
- `asientos_auto` o `journal_entries`
- `stock_movements`
- `organizations/{orgId}/campos/{campoId}/lotes/{loteId}/eventos`
- `operation_audit`

## 4.3 Formulario Cosecha
### Datos UI
- Campo
- Lote
- Campana
- Cultivo
- Fecha
- Cantidad cosechada (kg/tn)
- Silo/deposito destino

### Reglas contables automaticas
- Debe: Stock de granos
- Haber: Cultivos en preparacion

### Reglas de rendimiento
- Calcular `kg_ha` o `tn_ha`
- Relacionar contra superficie del lote

### Reglas stock
- Entrada a silo/deposito destino

### Persistencia obligatoria
- `operations` (type=cosecha)
- `asientos_auto` o `journal_entries`
- `stock_movements`
- evento de lote
- `operation_audit`

## 4.4 Formulario Entrega de Grano a Acopiador/Puerto
### Datos UI
- Tipo de grano
- Cantidad
- Silo/deposito origen
- Destino (acopiador/puerto)
- Fecha
- Carta de porte
- Flag `esVenta` + precio (si venta directa)

### Reglas contables automaticas
- Caso A (sin venta):
  - Debe: Granos en poder de terceros
  - Haber: Stock de granos
- Caso B (venta directa):
  - Debe: Clientes/Acopiador
  - Haber: Ventas de granos

### Reglas stock
- Salida de silo origen
- Si consignacion: stock logico en terceros

### Persistencia obligatoria
- `operations` (type=entrega_grano)
- `asientos_auto` o `journal_entries`
- `stock_movements`
- `movimientos_terceros` (si venta)
- `operation_audit`

## 5. Transversal Depositos/Silos

## 5.1 Modelo
- `warehouses`: `tipo=deposito_insumos|silo|acopio`
- `inventory_balances`: saldo por producto/ubicacion

## 5.2 Reglas
- Todo formulario que mueva fisico debe exigir origen/destino.
- Validar stock disponible antes de salida.
- Transacciones atomicas (operacion + asiento + stock).

## 6. Arquitectura de ejecucion al presionar Guardar

1. Validar payload de formulario.
2. Generar `requestId` idempotente.
3. Iniciar transaccion.
4. Guardar documento `operations`.
5. Generar asiento automatico.
6. Generar movimientos stock/tercero.
7. Actualizar saldos/cache.
8. Guardar `operation_audit`.
9. Commit y devolver IDs relacionados.

## 7. Checklist ISO 9001 (auditoria)

Cada operacion debe registrar:
- `who`: userId, rol
- `when`: timestamp servidor
- `what`: formulario + version
- `why`: motivo/observaciones
- `where`: org/campo/lote/geo
- `trace`: operationId, asientoId, stockMovementIds, requestId

## 8. Orden de implementacion recomendado (4 sprints)

## Sprint 1
- Modelo `operations`, `warehouses`, `inventory_balances`, `operation_audit`
- Endpoint transaccional base + idempotencia
- Migracion de formulario Compra de Insumos

## Sprint 2
- Formularios Aplicacion + Cosecha con GIS completo
- Integracion con eventos de lote y campana

## Sprint 3
- Formulario Entrega a Acopiador/Puerto (consignacion + venta)
- Reconciliacion contable-stock y reportes de trazabilidad

## Sprint 4
- Hardening: permisos, validaciones, pruebas E2E, reportes ISO exportables

## 9. Criterios de aceptacion

- Todas las operaciones quedan registradas por org en colecciones propias.
- Cada guardado genera automaticamente doble partida balanceada.
- Stock y contabilidad quedan reconciliados por operacion.
- Existe trazabilidad completa por Campo/Lote/Campana/GIS.
- Auditoria ISO disponible por cada evento de formulario.
