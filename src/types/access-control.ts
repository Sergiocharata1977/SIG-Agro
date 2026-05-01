import type { UserRole } from './organization';

export type OrganizationRole = UserRole;

export type AgroFunctionalProfile =
    | 'productor_ejecutivo'
    | 'ing_agronomo'
    | 'operario_campo'
    | 'contador_agro'
    | 'auditor_externo'
    | 'admin_sistema';

export type AgroWorkspaceView =
    | 'ejecutiva'
    | 'operativa'
    | 'mobile';

export type AgroDataScope =
    | 'all_organizations'
    | 'organization'
    | 'assigned_fields'
    | 'assigned_plots';

export interface AgroEffectiveAccess {
    userId: string;
    organizationId: string;
    role: OrganizationRole;
    functionalProfile: AgroFunctionalProfile;
    workspaceView: AgroWorkspaceView;
    dataScope: AgroDataScope;
    enabledModules: string[];
    permissions: {
        canRead: boolean;
        canWrite: boolean;
        canDelete: boolean;
        canAdmin: boolean;
        canExport: boolean;
        canViewFinancials: boolean;
        canManageUsers: boolean;
    };
    fieldIds?: string[];
    plotIds?: string[];
}

export const ROLE_TO_DEFAULT_PROFILE: Record<OrganizationRole, AgroFunctionalProfile> = {
    super_admin: 'admin_sistema',
    owner: 'productor_ejecutivo',
    admin: 'admin_sistema',
    operator: 'operario_campo',
    viewer: 'auditor_externo',
};

export const PROFILE_TO_WORKSPACE: Record<AgroFunctionalProfile, AgroWorkspaceView> = {
    productor_ejecutivo: 'ejecutiva',
    ing_agronomo: 'operativa',
    operario_campo: 'mobile',
    contador_agro: 'ejecutiva',
    auditor_externo: 'ejecutiva',
    admin_sistema: 'operativa',
};

export const PROFILE_TO_MODULES: Record<AgroFunctionalProfile, string[]> = {
    productor_ejecutivo: [
        'dashboard',
        'mapa_gis',
        'campos',
        'campanias',
        'contabilidad',
        'documentos',
        'metricas',
        'reportes',
    ],
    ing_agronomo: [
        'dashboard',
        'mapa_gis',
        'campos',
        'campanias',
        'analisis_ia',
        'documentos',
        'metricas',
        'reportes',
    ],
    operario_campo: [
        'dashboard',
        'mapa_gis',
        'campos',
        'campanias',
        'documentos',
    ],
    contador_agro: [
        'dashboard',
        'contabilidad',
        'documentos',
        'metricas',
        'reportes',
    ],
    auditor_externo: [
        'dashboard',
        'documentos',
        'metricas',
        'reportes',
    ],
    admin_sistema: [
        'dashboard',
        'mapa_gis',
        'campos',
        'campanias',
        'contabilidad',
        'analisis_ia',
        'documentos',
        'metricas',
        'reportes',
        'admin',
    ],
};
