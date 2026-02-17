# Handoff SIG Agro - 2026-02-17

Este documento deja el estado tecnico listo para continuidad por otro agente.

## 1) Estado General

- Proyecto operativo en produccion con menu lateral verde y ABM de organizaciones a nivel productor.
- Se corrigio contaminacion entre repos:
  - `9001app-firebase` limpio (revert aplicado).
  - `sig-agro` mantiene los cambios agro.
- Deploy reciente en Vercel de `sig-agro` activo sobre rama `main`.

## 2) Cambios Relevantes Implementados

### 2.1 Productor - ABM Organizaciones

- Pantalla ABM en:
  - `sig-agro/src/app/(dashboard)/organizaciones/page.tsx`
- Alta/edicion ahora en formulario popup (`Dialog`), no inline.
- Fix de crash por `user.role` nulo.

### 2.2 Creacion de organizaciones por API server-side

- Nuevo endpoint:
  - `sig-agro/src/app/api/producer/organizations/route.ts`
- Motivo:
  - Evitar bloqueo por reglas Firestore del cliente al crear organizacion.
- Flujo:
  - Front envia token Bearer.
  - API valida token con Firebase Admin.
  - Crea `organizations/{orgId}`, `organizations/{orgId}/members/{uid}` y actualiza `users/{uid}`.

### 2.3 Robustez de carga de organizaciones

- Servicio:
  - `sig-agro/src/services/organizations.ts`
- Se agregaron `try/catch` en queries auxiliares (`createdBy`, `collectionGroup members`) para evitar ruptura por permisos.

### 2.4 Sidebar rediseñado verde (agro)

- Productor:
  - `sig-agro/src/components/layout/Sidebar.tsx`
- Super admin:
  - `sig-agro/src/components/super-admin/SuperAdminSidebar.tsx`
- Se elimino duplicacion visual de seccion "Organizacion" en sidebar de productor.

### 2.5 Auth fallback anti-crash

- Contexto auth:
  - `sig-agro/src/contexts/AuthContext.tsx`
- Si falla lectura de perfil Firestore, se crea fallback de sesion para no romper UI.

## 3) Riesgos / Observaciones

- Aun puede aparecer warning en consola:
  - `FirestoreError: Missing or insufficient permissions`
- Aunque ya no rompe UI, conviene ajustar reglas para reducir ruido de logs.
- Dependencia critica:
  - Variables Firebase Admin correctamente configuradas en Vercel para endpoints `/api/producer/*`.

## 4) Commites Clave (sig-agro)

- `d381863` - fix organizaciones productor: crash por `user null` + fallback auth.
- `40e4951` - ABM organizaciones productor + popup + sidebar verde + API creacion.

## 5) Que Debe Hacer el Proximo Agente

1. Validar que el alta de organizacion funciona en produccion para productor nuevo y existente.
2. Revisar reglas Firestore para minimizar warnings de permisos sin abrir seguridad.
3. Estandarizar formularios popup en modulos restantes (campos, campanias, lotes, operaciones).
4. Documentar visualmente el design system verde en pantallas del manual.

## 6) Smoke Test Manual Rapido

1. Login como productor.
2. Ir a `/organizaciones`.
3. Click `Nueva organizacion` (popup).
4. Crear organizacion.
5. Ver organizacion en listado.
6. Seleccionar `Usar`.
7. Ver cambio de organizacion activa en sidebar.
8. Navegar a `/dashboard` sin errores blancos.
