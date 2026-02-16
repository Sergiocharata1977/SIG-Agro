# Diagnostic: Super Admin UI and Routing Issues

## Current State Analysis

| File | Current Condition | Proposed Correction |
|------|-------------------|---------------------|
| `src/contexts/AuthContext.tsx` | Role normalization is local to the file. Uses `userData` and `tokenResult.claims` with some logic dispersed. | Centralize in `src/lib/auth-utils.ts`. Use `resolveUserRole(userData, tokenClaims)`. |
| `src/app/dashboard/page.tsx` | Redirection in `useEffect` depends on `authLoading` and `user?.role`. | Ensure `user.role` is accurately set by the helper. Add a more robust guard or consider a higher-level layout check. |
| `src/components/layout/Sidebar.tsx` | Shows "Organizaciones" if `canPerformAction('admin')`. Shows modules based on `hasModuleAccess`. | For Super Admins, this sidebar should probably not be seen at all, or should be completely replaced by `SuperAdminSidebar`. |
| `src/app/super-admin/layout.tsx` | Handles its own `super_admin` role guard. | Keep, but ensure consistency with the unified role helper. |

## Role Variants Found
- `super_admin`
- `super-admin`
- `superadmin`
- `role` (in claims)
- `rol` (in some legacy objects)

## Legacy UI Collision
- Super admins landing on `/dashboard` see the legacy dashboard (KPIs, Map) for a brief moment before redirection.
- `Sidebar` contains items that are irrelevant for Super Admins (Contabilidad, Mapa GIS, etc.).

## Verification of Super Admin Persistence
- `AuthContext.tsx` already contains an auto-bootstrap logic for Super Admins (lines 134-166) if the Firestore document is missing. This is good but needs to ensure the `role` is correctly set as `'super_admin'`.
