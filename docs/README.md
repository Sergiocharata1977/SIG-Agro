# Documentacion SIG Agro

Fecha de consolidacion: 2026-05-01

Esta carpeta se redujo a un set corto de documentos operativos. Se eliminaron handoffs, prompts de agentes, planes historicos y reportes de coordinacion que ya no aportaban al estado real del repo.

## Documentos vigentes

1. `README.md`
   Indice documental y criterio de uso.

2. `01_ESTADO_ACTUAL.md`
   Resumen ejecutivo del estado real del proyecto, modulos activos y cambios recientes implementados.

3. `02_ARQUITECTURA_Y_DATOS.md`
   Arquitectura vigente, multi-tenant, plugins, servicios e invariantes del modelo de datos.

4. `03_MODULOS_E_INTEGRACIONES.md`
   Mapa funcional de modulos e integraciones reales: IA, FCM, email, SMS, WhatsApp, satelital, clima y PWA.

5. `04_OPERACION_Y_RUNBOOK.md`
   Runbook operativo, verificaciones manuales, variables de entorno y problemas conocidos.

6. `05_ROADMAP_Y_PENDIENTES.md`
   Trabajo pendiente que aun no fue ejecutado o esta incompleto.

7. `ADR_001_MODELO_DATOS_V1.md`
   Decision de arquitectura todavia vigente sobre dominios operativos y estructura multi-tenant.

## Criterios

- Esta documentacion describe solo estado implementado o pendientes confirmados en el repo.
- No se documentan planes historicos salvo que sigan vigentes.
- Los cambios nuevos deben reflejarse primero en `01_ESTADO_ACTUAL.md` y, si afectan arquitectura, tambien en `02_ARQUITECTURA_Y_DATOS.md`.
