import type { AgroFunctionalProfile, AgroWorkspaceView, AgroDataScope, AgroEffectiveAccess } from '@/types/access-control';
import type { OrganizationRole } from '@/types/access-control';

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
    description: 'Dueño del campo — visión macro, métricas y contabilidad.',
    defaultWorkspace: 'ejecutiva',
    defaultDataScope: 'organization',
    enabledModules: ['dashboard', 'mapa_gis', 'campos', 'campanias', 'contabilidad', 'documentos', 'metricas', 'reportes'],
    permissions: {
      canRead: true,
      canWrite: false,
      canDelete: false,
      canAdmin: false,
      canExport: true,
      canViewFinancials: true,
      canManageUsers: false,
    },
    allowedRoles: ['owner'],
  },

  ing_agronomo: {
    profile: 'ing_agronomo',
    label: 'Ingeniero Agrónomo',
    description: 'Técnico con acceso operativo completo incluyendo IA y scouting.',
    defaultWorkspace: 'operativa',
    defaultDataScope: 'organization',
    enabledModules: ['dashboard', 'mapa_gis', 'campos', 'campanias', 'analisis_ia', 'scouting', 'documentos', 'metricas', 'reportes'],
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
    description: 'Acceso reducido a tareas operativas en campo asignado.',
    defaultWorkspace: 'mobile',
    defaultDataScope: 'assigned_fields',
    enabledModules: ['dashboard', 'mapa_gis', 'campos', 'campanias', 'scouting'],
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
    description: 'Acceso financiero y de documentos, sin datos de campo operativo.',
    defaultWorkspace: 'ejecutiva',
    defaultDataScope: 'organization',
    enabledModules: ['dashboard', 'contabilidad', 'documentos', 'metricas', 'reportes'],
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
    description: 'Solo lectura de documentos y métricas, sin datos sensibles.',
    defaultWorkspace: 'ejecutiva',
    defaultDataScope: 'organization',
    enabledModules: ['dashboard', 'documentos', 'metricas', 'reportes'],
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
    description: 'Acceso total incluyendo gestión de usuarios y configuración.',
    defaultWorkspace: 'operativa',
    defaultDataScope: 'all_organizations',
    enabledModules: [
      'dashboard', 'mapa_gis', 'campos', 'campanias', 'contabilidad',
      'analisis_ia', 'scouting', 'documentos', 'metricas', 'reportes', 'admin',
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
