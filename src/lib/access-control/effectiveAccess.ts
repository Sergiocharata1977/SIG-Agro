import { db } from '@/firebase/config';
import { normalizeRole } from '@/lib/auth-utils';
import {
    ROLE_TO_DEFAULT_PROFILE,
} from '@/types/access-control';
import type {
    AgroDataScope,
    AgroEffectiveAccess,
    AgroFunctionalProfile,
    OrganizationRole,
} from '@/types/access-control';
import type { OrganizationMember, User } from '@/types/organization';
import { doc, getDoc } from 'firebase/firestore';
import {
    AGRO_PROFILE_CONFIGS,
    getAgroProfileConfig,
    isAgroFunctionalProfile,
} from './profiles';

const OPTIONAL_PLUGIN_MODULES = new Set([
    'analisis_ia',
    'contabilidad',
    'documentos',
    'metricas',
    'scouting',
]);

const ROLE_PERMISSION_BASES: Record<OrganizationRole, AgroEffectiveAccess['permissions']> = {
    super_admin: {
        canRead: true,
        canWrite: true,
        canDelete: true,
        canAdmin: true,
        canExport: true,
        canViewFinancials: true,
        canManageUsers: true,
    },
    owner: {
        canRead: true,
        canWrite: true,
        canDelete: true,
        canAdmin: true,
        canExport: true,
        canViewFinancials: true,
        canManageUsers: true,
    },
    admin: {
        canRead: true,
        canWrite: true,
        canDelete: true,
        canAdmin: true,
        canExport: true,
        canViewFinancials: true,
        canManageUsers: true,
    },
    operator: {
        canRead: true,
        canWrite: true,
        canDelete: false,
        canAdmin: false,
        canExport: false,
        canViewFinancials: false,
        canManageUsers: false,
    },
    viewer: {
        canRead: true,
        canWrite: false,
        canDelete: false,
        canAdmin: false,
        canExport: false,
        canViewFinancials: false,
        canManageUsers: false,
    },
};

function isDataScope(value: unknown): value is AgroDataScope {
    return value === 'all_organizations'
        || value === 'organization'
        || value === 'assigned_fields'
        || value === 'assigned_plots';
}

function resolveRequestedProfile(
    role: OrganizationRole,
    requestedProfile?: string
): AgroFunctionalProfile {
    const fallbackProfile = ROLE_TO_DEFAULT_PROFILE[role];

    if (!isAgroFunctionalProfile(requestedProfile)) {
        return fallbackProfile;
    }

    const requestedConfig = AGRO_PROFILE_CONFIGS[requestedProfile];
    return requestedConfig.allowedRoles.includes(role) ? requestedProfile : fallbackProfile;
}

function mergePermissions(
    role: OrganizationRole,
    profile: AgroFunctionalProfile
): AgroEffectiveAccess['permissions'] {
    const rolePermissions = ROLE_PERMISSION_BASES[role];
    const profilePermissions = getAgroProfileConfig(profile).permissions;

    return {
        canRead: rolePermissions.canRead || profilePermissions.canRead,
        canWrite: rolePermissions.canWrite || profilePermissions.canWrite,
        canDelete: rolePermissions.canDelete || profilePermissions.canDelete,
        canAdmin: rolePermissions.canAdmin || profilePermissions.canAdmin,
        canExport: rolePermissions.canExport || profilePermissions.canExport,
        canViewFinancials:
            rolePermissions.canViewFinancials || profilePermissions.canViewFinancials,
        canManageUsers:
            rolePermissions.canManageUsers || profilePermissions.canManageUsers,
    };
}

function resolveModuleRestriction(
    member: Pick<OrganizationMember, 'modulosHabilitados'> | null | undefined,
    user: Pick<User, 'modulosHabilitados'>
): string[] | null {
    if (member?.modulosHabilitados !== undefined) {
        return member.modulosHabilitados;
    }

    return user.modulosHabilitados;
}

function resolveEffectiveScope(
    member: Pick<OrganizationMember, 'dataScope' | 'assignedFieldIds' | 'assignedPlotIds'> | null | undefined,
    fallbackScope: AgroDataScope
): AgroDataScope {
    if (isDataScope(member?.dataScope)) {
        return member.dataScope;
    }

    if (fallbackScope === 'assigned_fields' && !member?.assignedFieldIds?.length && member?.assignedPlotIds?.length) {
        return 'assigned_plots';
    }

    return fallbackScope;
}

function filterEnabledModules(
    requestedModules: string[],
    enabledPlugins: string[],
    restrictedModules: string[] | null
): string[] {
    const pluginSet = new Set(enabledPlugins);
    const hasPluginInfo = pluginSet.size > 0;
    const restrictedSet = restrictedModules ? new Set(restrictedModules) : null;

    return requestedModules.filter((moduleId) => {
        if (restrictedSet && !restrictedSet.has(moduleId)) {
            return false;
        }

        if (!OPTIONAL_PLUGIN_MODULES.has(moduleId)) {
            return true;
        }

        if (!hasPluginInfo) {
            return false;
        }

        return pluginSet.has(moduleId);
    });
}

function applyPermissionOverrides(
    permissions: AgroEffectiveAccess['permissions'],
    overrides: User['permissionOverrides']
): AgroEffectiveAccess['permissions'] {
    const nextPermissions: AgroEffectiveAccess['permissions'] = { ...permissions };

    for (const permission of overrides?.allow ?? []) {
        if (permission in nextPermissions) {
            nextPermissions[permission as keyof AgroEffectiveAccess['permissions']] = true;
        }
    }

    for (const permission of overrides?.deny ?? []) {
        if (permission in nextPermissions) {
            nextPermissions[permission as keyof AgroEffectiveAccess['permissions']] = false;
        }
    }

    return nextPermissions;
}

async function loadOrganizationMember(userId: string, orgId: string): Promise<OrganizationMember | null> {
    const snapshot = await getDoc(doc(db, 'organizations', orgId, 'members', userId));

    if (!snapshot.exists()) {
        return null;
    }

    const data = snapshot.data() as Partial<OrganizationMember>;

    return {
        userId: snapshot.id,
        email: data.email ?? '',
        displayName: data.displayName ?? '',
        role: data.role ?? 'viewer',
        status: data.status ?? 'pending',
        functionalProfile: data.functionalProfile,
        dataScope: data.dataScope,
        assignedFieldIds: data.assignedFieldIds,
        assignedPlotIds: data.assignedPlotIds,
        modulosHabilitados: data.modulosHabilitados ?? null,
        invitedBy: data.invitedBy ?? '',
        joinedAt: data.joinedAt instanceof Date ? data.joinedAt : new Date(),
    };
}

export async function resolveEffectiveAccess(
    user: User,
    orgId: string,
    member?: OrganizationMember | null,
    enabledPlugins: string[] = []
): Promise<AgroEffectiveAccess> {
    const resolvedMember = member ?? await loadOrganizationMember(user.id, orgId);
    const role = normalizeRole(resolvedMember?.role ?? user.role) as OrganizationRole;
    const functionalProfile = resolveRequestedProfile(
        role,
        resolvedMember?.functionalProfile ?? user.functionalProfile
    );
    const profileConfig = getAgroProfileConfig(functionalProfile);
    const permissions = resolveAccessSync(
        role,
        functionalProfile,
        user.permissionOverrides,
        enabledPlugins
    );
    const moduleRestriction = resolveModuleRestriction(resolvedMember, user);
    const enabledModules = filterEnabledModules(
        profileConfig.enabledModules,
        enabledPlugins,
        moduleRestriction
    );

    return {
        userId: user.id,
        organizationId: orgId,
        role,
        functionalProfile,
        workspaceView: profileConfig.defaultWorkspace,
        dataScope: resolveEffectiveScope(resolvedMember, profileConfig.defaultDataScope),
        enabledModules,
        permissions,
        fieldIds: resolvedMember?.assignedFieldIds,
        plotIds: resolvedMember?.assignedPlotIds,
    };
}

export function resolveAccessSync(
    role: OrganizationRole,
    functionalProfile: AgroFunctionalProfile | undefined,
    overrides: User['permissionOverrides'],
    enabledPlugins: string[]
): AgroEffectiveAccess['permissions'] {
    const normalizedRole = normalizeRole(role) as OrganizationRole;
    const resolvedProfile = resolveRequestedProfile(normalizedRole, functionalProfile);
    const basePermissions = mergePermissions(normalizedRole, resolvedProfile);

    if (!enabledPlugins.includes('contabilidad')) {
        basePermissions.canViewFinancials = false;
    }

    return applyPermissionOverrides(basePermissions, overrides);
}

export function canPerformAction(
    access: AgroEffectiveAccess,
    action: keyof AgroEffectiveAccess['permissions']
): boolean {
    return Boolean(access.permissions[action]);
}
