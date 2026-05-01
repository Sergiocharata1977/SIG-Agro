import type {
  AgroEffectiveAccess,
  AgroFunctionalProfile,
  OrganizationRole,
} from '@/types/access-control';
import type { User, OrganizationMember } from '@/types/organization';
import { ROLE_TO_DEFAULT_PROFILE, PROFILE_TO_WORKSPACE } from '@/types/access-control';
import { AGRO_PROFILE_CONFIGS } from './profiles';

export async function resolveEffectiveAccess(
  user: User,
  orgId: string,
  member: OrganizationMember,
  enabledPlugins: string[]
): Promise<AgroEffectiveAccess> {
  const role = member.role;
  const profile = (member.functionalProfile ?? user.functionalProfile ?? ROLE_TO_DEFAULT_PROFILE[role]) as AgroFunctionalProfile;
  const config = AGRO_PROFILE_CONFIGS[profile] ?? AGRO_PROFILE_CONFIGS[ROLE_TO_DEFAULT_PROFILE[role]];

  const permissions = resolveAccessSync(
    role,
    profile,
    user.permissionOverrides,
    enabledPlugins
  );

  const enabledModules = config.enabledModules.filter(m => {
    // Los módulos base siempre están, los premium requieren plugin habilitado
    const premiumModules = ['analisis_ia', 'scouting'];
    if (premiumModules.includes(m)) return enabledPlugins.includes(m);
    return true;
  });

  return {
    userId: user.id,
    organizationId: orgId,
    role,
    functionalProfile: profile,
    workspaceView: PROFILE_TO_WORKSPACE[profile],
    dataScope: config.defaultDataScope,
    enabledModules,
    permissions,
    fieldIds: member.assignedFieldIds,
    plotIds: member.assignedPlotIds,
  };
}

export function resolveAccessSync(
  role: OrganizationRole,
  functionalProfile: AgroFunctionalProfile | undefined,
  overrides: User['permissionOverrides'],
  enabledPlugins: string[]
): AgroEffectiveAccess['permissions'] {
  const profile = functionalProfile ?? ROLE_TO_DEFAULT_PROFILE[role];
  const config = AGRO_PROFILE_CONFIGS[profile] ?? AGRO_PROFILE_CONFIGS['auditor_externo'];

  const base = { ...config.permissions };

  // Super admin y owner siempre tienen acceso completo
  if (role === 'super_admin' || role === 'owner') {
    base.canRead = true;
    base.canWrite = true;
    base.canDelete = true;
    base.canAdmin = role === 'super_admin';
    base.canExport = true;
    base.canViewFinancials = true;
    base.canManageUsers = true;
  }

  // Aplicar overrides del usuario
  if (overrides?.allow) {
    for (const perm of overrides.allow) {
      if (perm in base) (base as Record<string, boolean>)[perm] = true;
    }
  }
  if (overrides?.deny) {
    for (const perm of overrides.deny) {
      if (perm in base) (base as Record<string, boolean>)[perm] = false;
    }
  }

  // Módulos financieros requieren plugin de contabilidad habilitado
  if (!enabledPlugins.includes('contabilidad')) {
    base.canViewFinancials = false;
  }

  return base;
}

export function canPerformAction(
  access: AgroEffectiveAccess,
  action: keyof AgroEffectiveAccess['permissions']
): boolean {
  return access.permissions[action] === true;
}
