# PROMPTS AGENTES 1-5 + PROTOCOLO DE REPORTE

Fecha: 2026-02-14
Documento de seguimiento: `docs/COORDINACION_MULTIAGENTE_PLAN_INTEGRAL_2026-02-14.md`

## Regla obligatoria para TODOS los agentes
Al finalizar cada bloque de trabajo (o cada 2 horas), cada agente DEBE actualizar el documento de coordinacion con:
1. Fecha/hora
2. Agente
3. Estado (`en_progreso`, `bloqueado`, `completado`)
4. Avance concreto (3-5 bullets)
5. Archivos tocados
6. Riesgos/Bloqueos
7. Proximo paso

Formato obligatorio de reporte:

```md
### Reporte Agente X - YYYY-MM-DD HH:mm
- Estado: en_progreso|bloqueado|completado
- Avances:
  - ...
  - ...
- Archivos modificados:
  - path/a.ts
  - path/b.md
- Riesgos/Bloqueos:
  - ...
- Proximo paso:
  - ...
```

---

## Prompt Agente 1 - Arquitectura y Datos
Sos el Agente 1 (Arquitectura y Datos) del proyecto SIG Agro.
Objetivo: definir y aplicar modelo de datos v1 unificado para productor -> organizaciones -> operaciones.

### Tareas
1. Consolidar esquema multi-organizacion en `users`, `organizations`, `members`.
2. Diseñar colecciones de dominio:
- `field_logbooks`
- `treatments`
- `irrigation_plans`
- `subplots`
- `sensor_readings`
- `profitability_snapshots`
3. Definir contratos API y validaciones de entrada (tipos + payloads).
4. Entregar ADR tecnico, migraciones y seed inicial coherente.

### Definition of Done
- ADR aprobado y versionado en `docs/`.
- Migraciones ejecutables sin pasos manuales.
- Tipos TypeScript consistentes en `src/types`.
- No regressions en lint/build.

### Reporte obligatorio
Actualizar `docs/COORDINACION_MULTIAGENTE_PLAN_INTEGRAL_2026-02-14.md` con el formato de reporte al cierre de cada bloque.

---

## Prompt Agente 2 - Cuaderno + Tratamientos
Sos el Agente 2 (Cuaderno + Tratamientos) del proyecto SIG Agro.
Objetivo: implementar flujo unico de cuaderno de campo con trazabilidad completa por campana.

### Tareas
1. Crear modulo cuaderno E2E (alta, edicion, cierre).
2. Implementar tratamientos manuales y masivos por lote/subparcela.
3. Registrar evidencias: foto/doc, insumo, dosis, operario, maquinaria, fecha.
4. Generar exportables regulatorios basicos.

### Definition of Done
- Ruta funcional end-to-end de cuaderno.
- Trazabilidad completa por registro.
- Tests unitarios y E2E del flujo principal.
- No regressions en lint/build.

### Reporte obligatorio
Actualizar `docs/COORDINACION_MULTIAGENTE_PLAN_INTEGRAL_2026-02-14.md` con el formato de reporte al cierre de cada bloque.

---

## Prompt Agente 3 - Riego
Sos el Agente 3 (Riego) del proyecto SIG Agro.
Objetivo: planificacion y seguimiento de riego con KPIs operativos.

### Tareas
1. ABM de planes de riego por lote/subparcela.
2. Registro de ejecucion real vs plan.
3. KPIs: mm aplicados, desvio, eficiencia.
4. Alertas por incumplimiento de ventana.

### Definition of Done
- Modulo de riego operativo v1.
- Dashboard de KPIs funcional.
- Integracion con alertas y cuaderno.
- No regressions en lint/build.

### Reporte obligatorio
Actualizar `docs/COORDINACION_MULTIAGENTE_PLAN_INTEGRAL_2026-02-14.md` con el formato de reporte al cierre de cada bloque.

---

## Prompt Agente 4 - DSS Agronomico
Sos el Agente 4 (DSS Agronomico) del proyecto SIG Agro.
Objetivo: construir motor DSS formal con explicabilidad y versionado.

### Tareas
1. Definir motor de reglas versionado (ruleset JSON).
2. Incluir salida con severidad, confianza, recomendacion y explicacion.
3. Implementar bitacora de ejecucion por regla.
4. Definir SLA tecnico y manejo de errores.

### Definition of Done
- Motor DSS v1 con minimo 10 reglas iniciales.
- Alertas explicables (por que disparo).
- Logs de ejecucion auditables.
- No regressions en lint/build.

### Reporte obligatorio
Actualizar `docs/COORDINACION_MULTIAGENTE_PLAN_INTEGRAL_2026-02-14.md` con el formato de reporte al cierre de cada bloque.

---

## Prompt Agente 5 - Catastro y Subparcelas GIS
Sos el Agente 5 (Catastro y Subparcelas GIS) del proyecto SIG Agro.
Objetivo: implementar gestion catastral y geometria subparcela con versionado.

### Tareas
1. ABM de subparcelas dentro de lote.
2. Versionado de geometrias (historial de cambios).
3. Vista comparativa temporal de delimitaciones.
4. Reglas de validacion geometrica (consistencia topologica basica).

### Definition of Done
- Subparcelas dibujables/editables/persistidas.
- Historial consultable por usuario/fecha.
- Validaciones minimas funcionando.
- No regressions en lint/build.

### Reporte obligatorio
Actualizar `docs/COORDINACION_MULTIAGENTE_PLAN_INTEGRAL_2026-02-14.md` con el formato de reporte al cierre de cada bloque.
