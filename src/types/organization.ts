/**
 * Tipos para el sistema Multi-Tenant de SIG Agro
 * Basado en la estructura de 9001app-firebase
 */

// ============================================
// ORGANIZACIÃ“N (EMPRESA AGROPECUARIA)
// ============================================

export type OrganizationPlan = 'free' | 'professional' | 'enterprise';
export type OrganizationStatus = 'active' | 'suspended' | 'trial';

/**
 * Features/MÃ³dulos disponibles para la organizaciÃ³n
 * Checklist de funcionalidades habilitadas
 */
export interface OrganizationFeatures {
    // MÃ³dulos principales
    mapa_gis: boolean;           // Mapa GIS con lotes y campos
    campanias: boolean;          // GestiÃ³n de campaÃ±as
    contabilidad: boolean;       // MÃ³dulo de contabilidad
    analisis_ia: boolean;        // Don CÃ¡ndido IA
    documentos: boolean;         // GestiÃ³n de documentos
    reportes: boolean;           // Reportes y estadÃ­sticas
    metricas: boolean;           // Dashboard de mÃ©tricas

    // LÃ­mites
    max_usuarios: number;        // MÃ¡ximo de usuarios
    max_campos: number;          // MÃ¡ximo de campos
    max_hectareas: number;       // MÃ¡ximo de hectÃ¡reas totales
}

/**
 * ConfiguraciÃ³n de la organizaciÃ³n
 */
export interface OrganizationSettings {
    timezone: string;            // "America/Argentina/Buenos_Aires"
    currency: string;            // "ARS"
    language: string;            // "es"
}

/**
 * OrganizaciÃ³n/Empresa
 */
export interface Organization {
    id: string;

    // IdentificaciÃ³n
    name: string;                // "Los Algarrobos S.A."
    slug: string;                // "los-algarrobos-sa" (Ãºnico)

    // Datos fiscales
    cuit?: string;
    razonSocial?: string;

    // Contacto
    email: string;
    phone?: string;

    // UbicaciÃ³n
    address?: string;
    city?: string;
    province: string;            // "Chaco"

    // Plan y estado
    plan: OrganizationPlan;
    status: OrganizationStatus;

    // ConfiguraciÃ³n
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
 * MÃ³dulos del sistema que pueden ser habilitados por usuario
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
    { id: 'mapa_gis', nombre: 'Mapa GIS', descripcion: 'VisualizaciÃ³n de campos y lotes en mapa' },
    { id: 'campos', nombre: 'Mis Campos', descripcion: 'GestiÃ³n de campos y lotes' },
    { id: 'campanias', nombre: 'CampaÃ±as', descripcion: 'GestiÃ³n de campaÃ±as agrÃ­colas' },
    { id: 'contabilidad', nombre: 'Contabilidad', descripcion: 'GestiÃ³n econÃ³mica' },
    { id: 'analisis_ia', nombre: 'AnÃ¡lisis IA', descripcion: 'Don CÃ¡ndido asistente IA' },
    { id: 'documentos', nombre: 'Documentos', descripcion: 'GestiÃ³n de documentos y evidencias' },
    { id: 'metricas', nombre: 'MÃ©tricas', descripcion: 'Dashboard de mÃ©tricas y KPIs' },
    { id: 'admin', nombre: 'AdministraciÃ³n', descripcion: 'ConfiguraciÃ³n y usuarios' },
];

/**
 * Usuario del sistema
 */
export interface User {
    id: string;                  // Firebase Auth UID
    email: string;
    displayName: string;

    // VinculaciÃ³n con organizaciÃ³n
    organizationId: string;      // ID de la organizaciÃ³n
    organizationIds?: string[];          // Organizaciones habilitadas explicitamente
    accessAllOrganizations?: boolean;    // true = acceso por defecto a todas las organizaciones del productor

    // Rol y permisos
    role: UserRole;
    status: UserStatus;

    // MÃ³dulos habilitados (checklist)
    // null = acceso completo
    // [] = sin acceso
    // ['mapa_gis', 'campos'] = acceso especÃ­fico
    modulosHabilitados: UserModule[] | null;

    // Datos de invitaciÃ³n
    invitedBy?: string;          // userId de quien lo invitÃ³
    joinedAt?: Date;

    // Metadatos
    createdAt: Date;
    updatedAt: Date;
    lastLogin?: Date;
}

/**
 * Usuario con datos de organizaciÃ³n (para contexto)
 */
export interface UserWithOrganization extends User {
    organization: Organization;
}

// ============================================
// MIEMBRO DE ORGANIZACIÃ“N (Para gestiÃ³n)
// ============================================

/**
 * Miembro dentro de la subcolecciÃ³n de organizaciÃ³n
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
// INVITACIÃ“N
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
        description: 'Acceso total, puede eliminar la organizaciÃ³n',
        color: 'bg-purple-100 text-purple-700'
    },
    admin: {
        label: 'Administrador',
        description: 'Gestiona usuarios y configuraciÃ³n',
        color: 'bg-blue-100 text-blue-700'
    },
    operator: {
        label: 'Operador',
        description: 'Puede crear y editar registros',
        color: 'bg-green-100 text-green-700'
    },
    viewer: {
        label: 'Visualizador',
        description: 'Solo puede ver informaciÃ³n',
        color: 'bg-gray-100 text-gray-700'
    },
};


