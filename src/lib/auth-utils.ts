import { UserRole } from '@/types/organization';

/**
 * Normaliza un string de rol a uno de los tipos validos de UserRole.
 * Maneja variantes como 'super_admin', 'super-admin', 'superadmin', etc.
 */
export function normalizeRole(value: unknown): UserRole {
    if (typeof value !== 'string') return 'viewer';

    const normalized = value.trim().toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');

    if (normalized === 'superadmin' || normalized === 'super_admin') return 'super_admin';
    if (normalized === 'owner') return 'owner';
    if (normalized === 'admin') return 'admin';
    if (normalized === 'operator') return 'operator';
    if (normalized === 'viewer') return 'viewer';

    return 'viewer'; // Fallback seguro
}

/**
 * Resuelve el rol del usuario basándose en claims del token y datos de Firestore.
 * Prioridad:
 * 1. Claim del token (la verdad absoluta del servidor)
 * 2. Campo 'role' en userData
 * 3. Campo 'rol' en userData (legacy)
 */
export function resolveUserRole(userData: any, tokenClaims: any): UserRole {
    // 1. Prioridad: Claim del token
    const claimRole = tokenClaims?.role || tokenClaims?.rol;
    if (claimRole) {
        return normalizeRole(claimRole);
    }

    // 2. Campo 'role' en Firestore
    if (userData?.role) {
        return normalizeRole(userData.role);
    }

    // 3. Campo 'rol' en Firestore (legacy fallback)
    if (userData?.rol) {
        return normalizeRole(userData.rol);
    }

    return 'viewer'; // Fallback por defecto
}
