/**
 * Tipos para el sistema Multi-Tenant de SIG Agro
 * Basado en la estructura de 9001app-firebase
 */

// ============================================
// ORGANIZACIÓN (EMPRESA AGROPECUARIA)
// ============================================

export type OrganizationPlan = 'free' | 'professional' | 'enterprise';
export type OrganizationStatus = 'active' | 'suspended' | 'trial';

/**
 * Features/Módulos disponibles para la organización
 * Checklist de funcionalidades habilitadas
 */
export interface OrganizationFeatures {
    // Módulos principales
    mapa_gis: boolean;           // Mapa GIS con lotes y campos
    campanias: boolean;          // Gestión de campañas
    contabilidad: boolean;       // Módulo de contabilidad
    analisis_ia: boolean;        // Don Cándido IA
    documentos: boolean;         // Gestión de documentos
    reportes: boolean;           // Reportes y estadísticas
    metricas: boolean;           // Dashboard de métricas

    // Límites
    max_usuarios: number;        // Máximo de usuarios
    max_campos: number;          // Máximo de campos
    max_hectareas: number;       // Máximo de hectáreas totales
}

/**
 * Configuración de la organización
 */
export interface OrganizationSettings {
    timezone: string;            // "America/Argentina/Buenos_Aires"
    currency: string;            // "ARS"
    language: string;            // "es"
}

/**
 * Organización/Empresa
 */
export interface Organization {
    id: string;

    // Identificación
    name: string;                // "Los Algarrobos S.A."
    slug: string;                // "los-algarrobos-sa" (único)

    // Datos fiscales
    cuit?: string;
    razonSocial?: string;

    // Contacto
    email: string;
    phone?: string;

    // Ubicación
    address?: string;
    city?: string;
    province: string;            // "Chaco"

    // Plan y estado
    plan: OrganizationPlan;
    status: OrganizationStatus;

    // Configuración
    settings: OrganizationSettings;
    features: OrganizationFeatures;

    // Metadatos
    createdBy: string;           // userId del creador
    createdAt: Date;
    updatedAt: Date;
}

// ============================================
// USUARIO
// ============================================

export type UserRole = 'super_admin' | 'owner' | 'admin' | 'operator' | 'viewer';
export type UserStatus = 'active' | 'pending' | 'disabled';

/**
 * Módulos del sistema que pueden ser habilitados por usuario
 * Similar a modulos_habilitados de 9001app
 */
export type UserModule =
    | 'dashboard'
    | 'mapa_gis'
    | 'campos'
    | 'campanias'
    | 'contabilidad'
    | 'analisis_ia'
    | 'documentos'
    | 'metricas'
    | 'admin';

export const USER_MODULES: { id: UserModule; nombre: string; descripcion: string }[] = [
    { id: 'dashboard', nombre: 'Dashboard', descripcion: 'Panel principal de resumen' },
    { id: 'mapa_gis', nombre: 'Mapa GIS', descripcion: 'Visualización de campos y lotes en mapa' },
    { id: 'campos', nombre: 'Mis Campos', descripcion: 'Gestión de campos y lotes' },
    { id: 'campanias', nombre: 'Campañas', descripcion: 'Gestión de campañas agrícolas' },
    { id: 'contabilidad', nombre: 'Contabilidad', descripcion: 'Gestión económica' },
    { id: 'analisis_ia', nombre: 'Análisis IA', descripcion: 'Don Cándido asistente IA' },
    { id: 'documentos', nombre: 'Documentos', descripcion: 'Gestión de documentos y evidencias' },
    { id: 'metricas', nombre: 'Métricas', descripcion: 'Dashboard de métricas y KPIs' },
    { id: 'admin', nombre: 'Administración', descripcion: 'Configuración y usuarios' },
];

/**
 * Usuario del sistema
 */
export interface User {
    id: string;                  // Firebase Auth UID
    email: string;
    displayName: string;

    // Vinculación con organización
    organizationId: string;      // ID de la organización

    // Rol y permisos
    role: UserRole;
    status: UserStatus;

    // Módulos habilitados (checklist)
    // null = acceso completo
    // [] = sin acceso
    // ['mapa_gis', 'campos'] = acceso específico
    modulosHabilitados: UserModule[] | null;

    // Datos de invitación
    invitedBy?: string;          // userId de quien lo invitó
    joinedAt?: Date;

    // Metadatos
    createdAt: Date;
    updatedAt: Date;
    lastLogin?: Date;
}

/**
 * Usuario con datos de organización (para contexto)
 */
export interface UserWithOrganization extends User {
    organization: Organization;
}

// ============================================
// MIEMBRO DE ORGANIZACIÓN (Para gestión)
// ============================================

/**
 * Miembro dentro de la subcolección de organización
 * organizations/{orgId}/members/{memberId}
 */
export interface OrganizationMember {
    userId: string;              // ID de Firebase Auth
    email: string;
    displayName: string;
    role: UserRole;
    status: UserStatus;
    modulosHabilitados: UserModule[] | null;
    invitedBy: string;
    joinedAt: Date;
}

// ============================================
// INVITACIÓN
// ============================================

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

export interface Invitation {
    id: string;
    organizationId: string;
    email: string;
    role: UserRole;
    invitedBy: string;
    invitedByName: string;
    status: InvitationStatus;
    expiresAt: Date;
    createdAt: Date;
    acceptedAt?: Date;
}

// ============================================
// DEFAULTS Y HELPERS
// ============================================

/**
 * Features por defecto para plan gratuito
 */
export const DEFAULT_FREE_FEATURES: OrganizationFeatures = {
    mapa_gis: true,
    campanias: true,
    contabilidad: true,
    analisis_ia: true,
    documentos: true,
    reportes: true,
    metricas: true,
    max_usuarios: 10,
    max_campos: 5,
    max_hectareas: 1000,
};

/**
 * Settings por defecto
 */
export const DEFAULT_SETTINGS: OrganizationSettings = {
    timezone: 'America/Argentina/Buenos_Aires',
    currency: 'ARS',
    language: 'es',
};

/**
 * Rol descriptions
 */
export const ROLE_CONFIG: Record<UserRole, { label: string; description: string; color: string }> = {
    super_admin: {
        label: 'Super Admin',
        description: 'Administrador global del sistema',
        color: 'bg-red-100 text-red-700'
    },
    owner: {
        label: 'Propietario',
        description: 'Acceso total, puede eliminar la organización',
        color: 'bg-purple-100 text-purple-700'
    },
    admin: {
        label: 'Administrador',
        description: 'Gestiona usuarios y configuración',
        color: 'bg-blue-100 text-blue-700'
    },
    operator: {
        label: 'Operador',
        description: 'Puede crear y editar registros',
        color: 'bg-green-100 text-green-700'
    },
    viewer: {
        label: 'Visualizador',
        description: 'Solo puede ver información',
        color: 'bg-gray-100 text-gray-700'
    },
};
