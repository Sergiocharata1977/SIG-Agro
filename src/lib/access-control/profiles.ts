import type {
    AgroDataScope,
    AgroEffectiveAccess,
    AgroFunctionalProfile,
    OrganizationRole,
    AgroWorkspaceView,
} from '@/types/access-control';

export interface AgroProfileConfig {
    profile: AgroFunctionalProfile;
    label: string;
    description: string;
    defaultWorkspace: AgroWorkspaceView;
    defaultDataScope: AgroDataScope;
    enabledModules: string[];
    permissions: AgroEffectiveAccess['permissions'];
    allowedRoles: OrganizationRole[];
}

export const AGRO_PROFILE_CONFIGS: Record<AgroFunctionalProfile, AgroProfileConfig> = {
    productor_ejecutivo: {
        profile: 'productor_ejecutivo',
        label: 'Productor Ejecutivo',
        description: 'Vision ejecutiva del negocio con foco en metricas, documentos y gestion economica.',
        defaultWorkspace: 'ejecutiva',
        defaultDataScope: 'organization',
        enabledModules: ['dashboard', 'metricas', 'contabilidad', 'documentos'],
        permissions: {
            canRead: true,
            canWrite: false,
            canDelete: false,
            canAdmin: false,
            canExport: true,
            canViewFinancials: true,
            canManageUsers: false,
        },
        allowedRoles: ['owner', 'admin'],
    },
    ing_agronomo: {
        profile: 'ing_agronomo',
        label: 'Ingeniero Agronomo',
        description: 'Perfil tecnico-operativo con acceso transversal a campo, campanas, mapas, IA y analisis.',
        defaultWorkspace: 'operativa',
        defaultDataScope: 'organization',
        enabledModules: [
            'dashboard',
            'mapa_gis',
            'campos',
            'campanias',
            'contabilidad',
            'analisis_ia',
            'documentos',
            'metricas',
            'reportes',
            'scouting',
        ],
        permissions: {
            canRead: true,
            canWrite: true,
            canDelete: false,
            canAdmin: false,
            canExport: true,
            canViewFinancials: false,
            canManageUsers: false,
        },
        allowedRoles: ['admin', 'operator'],
    },
    operario_campo: {
        profile: 'operario_campo',
        label: 'Operario de Campo',
        description: 'Ejecucion operativa en campo con acceso restringido a los lotes o campos asignados.',
        defaultWorkspace: 'operativa',
        defaultDataScope: 'assigned_fields',
        enabledModules: ['campos', 'campanias', 'scouting', 'mapa_gis'],
        permissions: {
            canRead: true,
            canWrite: true,
            canDelete: false,
            canAdmin: false,
            canExport: false,
            canViewFinancials: false,
            canManageUsers: false,
        },
        allowedRoles: ['operator'],
    },
    contador_agro: {
        profile: 'contador_agro',
        label: 'Contador Agro',
        description: 'Gestion financiera, documental y de metricas economicas con alcance organizacional.',
        defaultWorkspace: 'ejecutiva',
        defaultDataScope: 'organization',
        enabledModules: ['contabilidad', 'documentos', 'metricas'],
        permissions: {
            canRead: true,
            canWrite: true,
            canDelete: false,
            canAdmin: false,
            canExport: true,
            canViewFinancials: true,
            canManageUsers: false,
        },
        allowedRoles: ['admin', 'operator'],
    },
    auditor_externo: {
        profile: 'auditor_externo',
        label: 'Auditor Externo',
        description: 'Acceso de solo lectura a documentacion y metricas para auditorias o control externo.',
        defaultWorkspace: 'ejecutiva',
        defaultDataScope: 'organization',
        enabledModules: ['documentos', 'metricas'],
        permissions: {
            canRead: true,
            canWrite: false,
            canDelete: false,
            canAdmin: false,
            canExport: false,
            canViewFinancials: false,
            canManageUsers: false,
        },
        allowedRoles: ['viewer'],
    },
    admin_sistema: {
        profile: 'admin_sistema',
        label: 'Administrador del Sistema',
        description: 'Gobierno total del tenant con acceso administrativo, operativo y multi-organizacion.',
        defaultWorkspace: 'ejecutiva',
        defaultDataScope: 'all_organizations',
        enabledModules: [
            'dashboard',
            'mapa_gis',
            'campos',
            'campanias',
            'contabilidad',
            'analisis_ia',
            'documentos',
            'metricas',
            'reportes',
            'scouting',
            'admin',
        ],
        permissions: {
            canRead: true,
            canWrite: true,
            canDelete: true,
            canAdmin: true,
            canExport: true,
            canViewFinancials: true,
            canManageUsers: true,
        },
        allowedRoles: ['super_admin', 'owner', 'admin'],
    },
};

export function isAgroFunctionalProfile(value: unknown): value is AgroFunctionalProfile {
    return typeof value === 'string' && value in AGRO_PROFILE_CONFIGS;
}

export function getAgroProfileConfig(profile: AgroFunctionalProfile): AgroProfileConfig {
    return AGRO_PROFILE_CONFIGS[profile];
}
