# Fix Super Admin UI Routing - 2026-02-16

## Causa raiz detectada
- El sistema podia renderizar la UI vieja cuando `firebaseUser` existia pero `user` no estaba disponible o no resolvia `role=super_admin`.
- Habia dependencia fuerte de `user.role` y no siempre se contemplaba fallback por claim/email en runtime.

## Cambios aplicados

| Archivo | Cambio | Motivo |
|---|---|---|
| `src/lib/auth-utils.ts` | Se agrego `isSuperAdminEmail` y fallback de `resolveUserRole(userData, claims, email)` | Resolver rol cuando claim/doc no llega consistente en runtime |
| `src/contexts/AuthContext.tsx` | Se forzo refresh de claims, logs de diagnostico, fallback super admin tras error, y autobootstrap de `users/{uid}` | Evitar estado `firebaseUser OK` + `user null` para super admin |
| `src/app/dashboard/page.tsx` | Redireccion con `router.replace('/super-admin/productores')` y bloqueo de render legacy si es super admin | Evitar que el super admin vea `/dashboard` viejo |
| `src/components/layout/Sidebar.tsx` | Sidebar normal oculto para super admin por rol o email | Eliminar menu legacy para super admin |
| `src/app/super-admin/layout.tsx` | Guards con fallback por email y redirecciones con `replace` | Acceso super admin robusto |
| `src/app/(dashboard)/layout.tsx` | Redireccion temprana a super admin y bloqueo del layout dashboard para super admin | Evitar acceso a UI vieja en rutas del grupo dashboard |

## Verificacion tecnica
- `npm run lint` OK
- `npm run build` OK

## Checklist manual
1. Login con `superadmin@donjuangis.com`.
2. Abrir `/dashboard`.
3. Resultado esperado: redireccion automatica a `/super-admin/productores`.
4. Verificar menu lateral: `Productores`, `Organizaciones`, `Design System`.
5. Login con usuario no super admin.
6. Verificar que mantiene dashboard normal y no accede a `/super-admin/*`.

## Nota operativa
- Si en produccion no redirige despues de deploy, revisar en consola logs prefijados con `[AuthDebug]` para confirmar:
  - `claimRole`
  - `firestoreRole`
  - `firestoreRol`
  - `resolvedRole`
