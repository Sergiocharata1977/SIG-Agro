# Plan Tecnico Implementado: ABM Organizaciones + UI + Bootstrap

Fecha: 2026-02-14
Estado: implementado (v1 operativa)

## 1) Modelo multi-organizacion implementado

Regla de negocio:
- Productor (usuario padre) puede tener N organizaciones.
- Los copilotos se crean a nivel productor y pueden operar sobre una o multiples organizaciones.
- Por defecto, el usuario tiene acceso a todas sus organizaciones (`accessAllOrganizations=true`).

Campos en `users/{uid}`:
- `organizationId`: organizacion activa (compatibilidad con modulos actuales).
- `organizationIds[]`: organizaciones habilitadas al usuario.
- `accessAllOrganizations`: boolean (default `true`).

## 2) ABM de organizaciones

Se agrego pantalla de gestion para owner/admin:
- Ruta: `/organizaciones`
- Archivo: `src/app/(dashboard)/organizaciones/page.tsx`

Funciones soportadas:
- Alta de organizacion
- Edicion de organizacion
- Activar/suspender organizacion
- Seleccionar organizacion activa

Servicios usados:
- `crearOrganizacionParaUsuario(...)`
- `actualizarOrganizacion(...)`
- `cambiarOrganizacionActiva(...)`

## 3) Rediseno de navegacion/UI

Cambios principales:
- Sidebar redisenado con jerarquia visual mas clara.
- Selector de organizacion activa dentro de sidebar.
- Nuevo item de menu: `Organizaciones`.
- Header movil simplificado y consistente.

Archivos:
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/DashboardHeader.tsx`

## 4) Bootstrap automatico

Script nuevo:
- `scripts/bootstrap.js`
- Comando: `npm run bootstrap`

Que crea automaticamente:
- 1 productor owner
- 1 copiloto admin
- 2 organizaciones base
- membresias y documentos `users`
- datos minimos de `fields` y `plots`

Requisitos de credenciales (sin versionar secretos):
- `FIREBASE_SERVICE_ACCOUNT_KEY` (JSON) o
- `service-account.json` local en raiz (gitignored)

## 5) Compatibilidad y siguientes pasos tecnicos

Compatibilidad:
- Se mantiene `organizationId` para no romper modulos existentes.
- El cambio de organizacion activa actualiza ese campo y refresca contexto.

Siguientes pasos recomendados:
1. Eliminar `window.location.reload()` en ABM y pasar a refresco reactivo por contexto.
2. Agregar reglas Firestore para validar acceso por `organizationIds`.
3. E2E del flujo completo: login -> alta org -> seleccion org -> operaciones por org.

