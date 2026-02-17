# Runbook de Continuidad - SIG Agro

## Objetivo

Permitir que otro agente continúe sin reanalizar todo el historial.

## Repositorios

- App principal agro: `sig-agro`
- Documentacion: `sig-agro-doc`
- Proyecto separado (no mezclar): `9001app-firebase`

## Regla Operativa Importante

No mezclar commits entre `sig-agro` y `9001app-firebase`.

## Flujo de Trabajo Recomendado

1. Entrar a repo `sig-agro`.
2. `git pull origin main`
3. Implementar cambio.
4. `npm run lint`
5. Commit pequeno y claro.
6. Push a `main`.
7. Verificar deploy Vercel.

## Verificaciones Clave en Produccion

### ABM Organizaciones Productor

- Ruta: `/organizaciones`
- Debe:
  - abrir popup de alta
  - crear organizacion
  - listar
  - permitir activar "Usar"

### Sidebar Productor

- Debe verse en tema verde.
- No debe repetir varias veces el mismo bloque de "Organizacion".

### Resiliencia Auth

- Si Firestore devuelve permisos limitados, la app no debe romper con pantalla blanca.

## Problemas Conocidos

- Warnings de permisos Firestore en consola pueden seguir apareciendo.
- Si no crea organizaciones:
  - revisar variables Admin SDK en Vercel (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` o `FIREBASE_SERVICE_ACCOUNT_KEY`).

## Archivos Fuente Clave

- `sig-agro/src/app/(dashboard)/organizaciones/page.tsx`
- `sig-agro/src/app/api/producer/organizations/route.ts`
- `sig-agro/src/services/organizations.ts`
- `sig-agro/src/contexts/AuthContext.tsx`
- `sig-agro/src/components/layout/Sidebar.tsx`
- `sig-agro/src/components/super-admin/SuperAdminSidebar.tsx`
