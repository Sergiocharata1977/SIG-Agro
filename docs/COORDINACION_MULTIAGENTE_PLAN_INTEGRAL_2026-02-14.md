# COORDINACION MULTIAGENTE - PLAN INTEGRAL SIG AGRO

Fecha: 2026-02-14
Owner: Coordinador Tecnico
Estado: listo para ejecucion

## 1. Objetivo General
Cerrar brecha para posicionar SIG Agro al nivel de referencia de mercado, cubriendo:
- Producto operativo end-to-end (cuaderno, tratamientos, riego, rotaciones).
- DSS agronomico formal (reglas/modelos + explicabilidad).
- Integraciones (sensores + maquinaria bidireccional).
- Rentabilidad por campo/lote/cultivo/campana.
- UX/UI consistente estilo 9001app.
- Documentacion comercial y tecnica alineada al producto real.

## 2. Estructura de Ejecucion Recomendada
Cantidad recomendada: 9 agentes + 1 coordinador.

Razon:
- Menos de 7 agentes alarga demasiado el camino critico.
- Mas de 10 aumenta overhead de merge/conflictos.
- 9 permite paralelizar por dominio sin romper coherencia.

Roles:
1. Arquitectura y datos
2. Cuaderno + tratamientos
3. Riego
4. DSS (alertas/plagas/enfermedades)
5. Catastro/subparcelas GIS
6. Integraciones IoT/maquinaria
7. Rentabilidad y contabilidad productiva
8. UX/UI y navegacion
9. QA/E2E/observabilidad
10. Coordinador (vos/yo)

## 3. Fases

### Fase A (Semanas 1-2): Base comun
- Modelo de datos final v1.
- Convenciones de API y eventos.
- Setup de pruebas E2E y datos bootstrap.
- UI shell consolidado.

### Fase B (Semanas 3-6): Modulos core
- Cuaderno + tratamientos.
- Riego.
- Catastro/subparcelas.
- Rentabilidad v1.

### Fase C (Semanas 7-9): Inteligencia e integraciones
- DSS explicable v1.
- Sensores e ingesta telemetria.
- Maquinaria/connect bidireccional v1.

### Fase D (Semanas 10-12): Hardening y salida comercial
- E2E completos + performance + seguridad.
- Documentacion usuario/tecnica/comercial sincronizada.
- Release candidate + checklist go-live.

## 4. Reglas de Coordinacion
- Branch por agente: `feature/aN-<tema>`
- Entregas en lotes chicos (PR diario o cada 2 dias).
- No tocar dominios ajenos sin issue de coordinacion.
- Cada PR incluye:
  - impacto funcional
  - migraciones de datos
  - pruebas agregadas
  - riesgos
- Demo integrada semanal obligatoria.

## 5. Prompts listos para agentes

## Prompt Agente 1 - Arquitectura y Datos
Objetivo: definir y aplicar modelo de datos v1 unificado para productor->organizaciones->operaciones.
Tareas:
1. Consolidar esquema multi-organizacion en `users`, `organizations`, `members`.
2. Diseñar colecciones de dominio: `field_logbooks`, `treatments`, `irrigation_plans`, `subplots`, `sensor_readings`, `profitability_snapshots`.
3. Definir contratos API y validaciones de entrada.
4. Entregar ADR + migraciones + seed.
DoD:
- Documento ADR aprobado.
- Migraciones ejecutables sin datos manuales.
- Tipos TS consistentes en todo `src/types`.

## Prompt Agente 2 - Cuaderno + Tratamientos
Objetivo: flujo unico de cuaderno de campo con trazabilidad completa por campana.
Tareas:
1. Crear modulo cuaderno E2E (alta/edicion/cierre).
2. Agregar tratamientos manuales y masivos por lote/subparcela.
3. Evidencias: foto/doc/insumo/dosis/operario/maquinaria/fecha.
4. Exportables regulatorios basicos.
DoD:
- Ruta funcional de punta a punta.
- Trazabilidad por registro y auditoria.
- Tests unit + E2E del flujo principal.

## Prompt Agente 3 - Riego
Objetivo: planificacion y seguimiento de riego con KPIs.
Tareas:
1. ABM de planes de riego por lote/subparcela.
2. Registro de ejecucion real vs plan.
3. KPIs: mm aplicados, desvio, eficiencia.
4. Alertas por incumplimiento de ventana.
DoD:
- Dashboard riego v1 operativo.
- Integrado con alertas y cuaderno.

## Prompt Agente 4 - DSS Agronomico
Objetivo: motor DSS formal con explicabilidad.
Tareas:
1. Definir motor de reglas versionado (JSON ruleset).
2. Incluir severidad, confianza, recomendacion, razon explicable.
3. Versionado y bitacora de ejecucion.
4. SLA: tiempo de respuesta y manejo de errores.
DoD:
- Motor DSS con al menos 10 reglas productivas iniciales.
- Registro de por que se disparo cada alerta.

## Prompt Agente 5 - Catastro y Subparcelas GIS
Objetivo: gestion catastral y geometria subparcela con versionado.
Tareas:
1. ABM de subparcelas dentro de lote.
2. Versionado de geometrias (historial de cambios).
3. Vista comparativa temporal de delimitaciones.
4. Reglas de validacion geometrica.
DoD:
- Subparcelas dibujables/editables y persistidas.
- Historial consultable.

## Prompt Agente 6 - Integraciones IoT y Maquinaria
Objetivo: ingesta sensores y conectividad bidireccional maquinaria.
Tareas:
1. Pipeline de ingesta telemetria (normalizacion por proveedor).
2. Modelo comun de medidas y calidad de dato.
3. API de envio/recepcion de tareas a maquinaria (v1).
4. Reintentos, idempotencia, logs de integracion.
DoD:
- Conector simulado end-to-end probado.
- Dashboards basicos de telemetria.

## Prompt Agente 7 - Rentabilidad Productiva
Objetivo: tablero de margen por lote/cultivo/campana conectado a contabilidad.
Tareas:
1. Modelo de costos directos/indirectos por actividad.
2. Integracion con asientos/operaciones contables.
3. KPIs: margen bruto, costo/ha, costo/tn, ROI campana.
4. Vistas comparativas interanuales.
DoD:
- Tablero util para decision comercial.
- Reconciliacion contable basica validada.

## Prompt Agente 8 - UX/UI y Navegacion
Objetivo: unificar experiencia visual estilo 9001app con foco productivo.
Tareas:
1. Aplicar design tokens globales coherentes.
2. Redisenar menu y arquitectura de informacion por tareas del productor.
3. Mejorar densidad visual, estados vacios y flujos movil.
4. Homogeneizar componentes criticos.
DoD:
- UI consistente en modulos principales.
- Checklist responsive desktop/mobile aprobado.

## Prompt Agente 9 - QA, E2E y Observabilidad
Objetivo: garantizar calidad de release y monitoreo operativo.
Tareas:
1. Suite E2E para journeys criticos (login, org, cuaderno, tratamiento, margen).
2. Cobertura de APIs sensibles y casos de error.
3. Instrumentar logs funcionales y trazas por request.
4. Definir release gates automaticos.
DoD:
- Pipeline con gates minimos (lint/test/build/e2e smoke).
- Informe de riesgos residual por release.

## 6. Prompt del Coordinador
Objetivo: sincronizar, priorizar y destrabar dependencias.
Tareas:
1. Mantener tablero de dependencias y camino critico.
2. Revisar PRs en orden de impacto sistemico.
3. Alinear definiciones de negocio con producto comercial.
4. Consolidar changelog y estado ejecutivo semanal.
DoD:
- Roadmap vivo actualizado.
- 0 bloqueos abiertos > 72h sin plan de accion.

## 7. Dependencias Criticas
- A1 (arquitectura) desbloquea A2/A3/A4/A5/A7.
- A8 (UI shell) corre en paralelo y absorbe modulos al cierre de cada sprint.
- A9 depende de entregas parciales de todos para automatizar e2e progresivo.

## 8. Entregables de Cierre (Semana 12)
1. Release Candidate funcional.
2. Documentacion usuario + tecnica + comercial sincronizada.
3. Matriz de trazabilidad actualizada.
4. Demo comercial guionada con 3 casos de uso reales.

## 9. KPI de Exito
- Tiempo alta->ejecucion operacion en cuaderno < 3 min.
- Exactitud de trazabilidad operativa >= 95%.
- Cobertura E2E de journeys criticos >= 85%.
- Margen por lote/campana disponible en <= 5 clics.
- NPS interno de usabilidad (equipo piloto) >= 8/10.

## 10. Estado Consolidado (Control Tecnico)

Fecha de corte: 2026-02-15

Resumen:
- El repositorio local actual NO contiene aun entregables tecnicos visibles de A1-A5 (excepto base de UI shell + ABM organizaciones ya integrados).
- No se encontraron artefactos DSS reportados (ejemplos esperados):
  - `src/services/dss/AgronomicDssEngine.ts`
  - `src/types/dss-agronomico.ts`
  - `src/config/dss-agronomico-ruleset.v1.json`
  - `src/__tests__/services/AgronomicDssEngine.test.ts`
- El error mencionado en otro reporte (`src/services/documents/DocumentServiceAdmin.ts`) no aplica a este arbol `sig-agro` (esa ruta no existe aqui).

Matriz de estado A1-A5:

| Agente | Estado actual en repo local | Evidencia encontrada |
|---|---|---|
| A1 Arquitectura y Datos | Pendiente de merge | Sin nuevos tipos/migraciones A1 identificables |
| A2 Cuaderno + Tratamientos | Pendiente de merge | Sin modulo `field_logbooks`/`treatments` visible |
| A3 Riego | Pendiente de merge | Sin `irrigation_plans`/pantallas de riego |
| A4 DSS Agronomico | Pendiente de merge | Sin motor DSS/ruleset/tests en repo local |
| A5 Catastro/Subparcelas GIS | Pendiente de merge | Sin entidades `subplots`/versionado geometrico |

Accion requerida para unificacion:
1. Cada agente debe entregar su rama/commit hash exacto.
2. Integrar por orden de dependencia: A1 -> A2/A3/A4/A5.
3. Ejecutar validacion de integracion tras cada merge (`lint`, `build`, `test`).

## 11. Reportes Operativos

### Reporte Coordinador - 2026-02-15 19:45
- Estado: en_progreso
- Avances:
  - Se audito estado real del repo `sig-agro` y se detecto diferencia entre reporte verbal y codigo disponible.
  - Se verifico que no estan aun en este arbol los artefactos de DSS informados.
  - Se corrio validacion tecnica de baseline actual (`npm run lint` y `npm run build`) con resultado OK.
  - Se consolido matriz de estado A1-A5 en este documento.
- Archivos modificados:
  - `docs/COORDINACION_MULTIAGENTE_PLAN_INTEGRAL_2026-02-14.md`
- Riesgos/Bloqueos:
  - Riesgo alto de desalineacion entre lo implementado por agentes y lo realmente mergeado al branch local.
- Proximo paso:
  - Recibir hash/PR de cada agente y unificar secuencialmente en rama integradora.

### Reporte Coordinador - 2026-02-15 20:25
- Estado: completado
- Avances:
  - Se ejecuto control de estado A1-A10 con evidencia de repo local.
  - Se detecto que la mayoria de agentes no tiene aun entregables mergeados en este arbol.
  - Se completo el bloque faltante de coordinacion/integracion (A10) creando tablero operativo central.
  - Se dejo lista la matriz de pendientes y protocolo de unificacion por orden de dependencia.
- Archivos modificados:
  - `docs/TABLERO_CONTROL_AGENTES_2026-02-15.md`
  - `docs/COORDINACION_MULTIAGENTE_PLAN_INTEGRAL_2026-02-14.md`
- Riesgos/Bloqueos:
  - Aun faltan ramas/hashes concretos de agentes A1-A7 y A9 para poder unificar.
- Proximo paso:
  - Lanzar/recibir entregas pendientes y ejecutar merge secuencial con gates de calidad.

### Reporte Agente 1 - 2026-02-15 21:05
- Estado: completado
- Avances:
  - Se definio y versiono ADR de arquitectura de datos v1.
  - Se implementaron tipos de dominio unificados para colecciones A1.
  - Se implemento migracion ejecutable (dry-run y aplicar) para normalizar usuarios multi-organizacion.
  - Se implemento seed tecnico de dominios operativos para testing/arranque.
  - Se agregaron scripts npm de migracion/seed A1.
- Archivos modificados:
  - `docs/ADR_001_MODELO_DATOS_V1_2026-02-15.md`
  - `src/types/domain-model.ts`
  - `src/types/index.ts`
  - `scripts/migrate-a1-domain-model.js`
  - `scripts/seed-a1-domain.js`
  - `package.json`
- Riesgos/Bloqueos:
  - Firestore no impone schema; la validacion estricta queda para capas de servicios/API de A2-A7.
- Proximo paso:
  - Ejecutar A2/A3/A4/A5 sobre este contrato de datos y comenzar integracion secuencial.
