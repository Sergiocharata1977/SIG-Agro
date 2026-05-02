# Don Juan GIS — Arquitectura Comercial de Plugins

**Fecha:** 2026-05-02
**Proyecto:** SIG-Agro / Don Juan GIS

---

## Concepto

Don Juan GIS es una **plataforma base** con un núcleo contable-agro gratuito o de bajo costo.
Sobre ese núcleo, cada organización puede activar **plugins comerciales** que agregan funcionalidad específica según su tipo de negocio.

Esto permite:
- Vender el sistema a escala (precio base accesible)
- Cobrar por módulos de valor alto (tesorería, control interno, ISO)
- Adaptar el producto a distintos perfiles: productor, concesionaria, empresa agro, administración

---

## Mapa de plugins comerciales

| ID | Nombre | Target | Precio sugerido | Depende de |
|----|--------|--------|-----------------|------------|
| `contabilidad_avanzada` | Contabilidad Avanzada | Contadores, empresas formales | Bajo | — |
| `tesoreria` | Tesorería | Todas las empresas | Medio | — |
| `cuentas_corrientes` | Cuentas Corrientes | Empresas con clientes/proveedores | Medio | — |
| `operaciones_comerciales` | Operaciones Comerciales | Concesionarias, talleres | Medio-Alto | — |
| `agro_gestion` | Agro Gestión | Productores agropecuarios | Medio | — |
| `presupuesto_control` | Presupuesto & Control | Empresas con control de gestión | Alto | `agro_gestion` opcional |
| `iso_control_interno` | ISO & Control Interno | Empresas con ISO 9001 | Alto | — |
| `exportacion` | Exportación Excel/PDF | Todas | Bajo | — |

---

## Qué incluye el CORE (siempre activo, sin plugin)

- Plan de cuentas configurable
- Asientos automáticos básicos agro (compra insumo, cosecha, venta granos, cobro, pago)
- Terceros (clientes/proveedores) — ABM básico con saldo
- Operaciones agro básicas (7 tipos existentes)
- Campañas y lotes — ABM básico
- Dashboard / métricas básicas
- Configuración de organización
- Gestión de usuarios y permisos

---

## Qué aporta cada plugin

### `contabilidad_avanzada`
- **Mayor por cuenta** (vista completa con saldo acumulado, filtros)
- **Libro diario completo** (con todos los filtros: usuario, campaña, lote, CC)
- **Cuenta corriente completa** de clientes y proveedores (historial, mora, vencimientos)

### `tesoreria`
- **Caja y Bancos** (alta, movimientos, transferencias, saldos)
- **Cheques** recibidos, emitidos y rechazados (estados, alertas vencimiento)
- **Flujo de caja proyectado** (semanal/mensual, alertas déficit)

### `cuentas_corrientes`
- Incluido en `contabilidad_avanzada` — o puede venderse por separado

### `operaciones_comerciales`
- **Servicio técnico facturado** (orden de servicio, repuestos, mano de obra)
- **Venta de repuestos** (formulario + asiento automático)
- **Venta de maquinaria** (formulario + asiento automático)
- Nuevos tipos de operación: gasto general, anticipo, financiación, nota crédito/débito

### `agro_gestion`
- **Resultado por campaña** (desglose completo por concepto y lote)
- **Resultado por lote** (costos, ingresos, margen, $/ha)
- **Comparativa interanual**

### `presupuesto_control`
- **Centros de costo** (ABM + asignación a operaciones + reportes)
- **Presupuesto vs Real** (carga de presupuesto por campaña, tabla comparativa)

### `iso_control_interno`
- **Auditoría de cambios** (log completo quién/qué/cuándo + diff)
- **Workflow de aprobaciones** (borrador → aprobado → contabilizado)
- **Adjuntos y comprobantes** (Firebase Storage, por operación)

### `exportacion`
- **Excel/PDF** para todos los reportes: Libro diario, Mayor, CC, Flujo de caja

---

## Arquitectura técnica del sistema de plugins

### Cómo funciona en Firestore

```
organizations/{orgId}/settings/plugins → { pluginsActivos: PluginId[] }
```

### Hook en el frontend

```typescript
const { isActive } = usePlugins();
if (!isActive('tesoreria')) return <PluginGate pluginId="tesoreria" />;
```

### Componente PluginGate

Si el plugin NO está activo → muestra pantalla de "Módulo no disponible" con descripción y botón "Activar módulo" (lleva al super-admin o al plan de suscripción).

Si el plugin SÍ está activo → renderiza los children normalmente.

### Sidebar dinámico

El sidebar filtra los ítems de menú según los plugins activos de la organización. Ítems de plugins inactivos se muestran en gris con ícono de candado (o directamente se ocultan, configurable).

---

## Orden de ejecución de los planes

```
PLAN-00: Infraestructura de Plugins    ← PRIMERO, todo depende de esto
    ↓
PLAN-01: Plugin Contabilidad Avanzada  ─┐
PLAN-02: Plugin Tesorería              ─┤ Paralelos entre sí
PLAN-03: Plugin Operaciones Comerciales─┤ (después de PLAN-00)
PLAN-04: Plugin Agro Gestión           ─┤
PLAN-05: Plugin Presupuesto & Control  ─┤
PLAN-06: Plugin ISO & Control Interno  ─┘
```

**Nota:** La Ola 0 del plan original (conversión ABM a popup) se ejecuta en PARALELO con PLAN-00 ya que no depende de la infraestructura de plugins.

---

## Archivos del plan

| Archivo | Contenido |
|---------|-----------|
| `PLAN_00_INFRAESTRUCTURA_PLUGINS.md` | Infraestructura técnica del sistema de plugins |
| `PLAN_01_CONTABILIDAD_AVANZADA.md` | Mayor, Libro diario, CC completa |
| `PLAN_02_TESORERIA.md` | Caja/Bancos, Cheques, Flujo de caja |
| `PLAN_03_OPERACIONES_COMERCIALES.md` | Servicios técnicos, repuestos, maquinaria |
| `PLAN_04_AGRO_GESTION.md` | Resultado campaña/lote, comparativa |
| `PLAN_05_PRESUPUESTO_CONTROL.md` | Centros de costo, presupuesto vs real |
| `PLAN_06_ISO_CONTROL_INTERNO.md` | Auditoría, aprobaciones, adjuntos, exportación |
| `PLAN_ABM_POPUP.md` | Conversión ABMs existentes a popup (cross-cutting) |
