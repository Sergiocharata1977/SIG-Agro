'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { canPerformAction, resolveEffectiveAccess } from '@/lib/access-control/effectiveAccess';
import { CapabilityService } from '@/services/plugins/CapabilityService';
import type { AgroEffectiveAccess } from '@/types/access-control';

type EffectiveAccessAction = keyof AgroEffectiveAccess['permissions'];

interface UseEffectiveAccessResult {
    access: AgroEffectiveAccess | null;
    isLoading: boolean;
    can: (action: EffectiveAccessAction) => boolean;
    hasPlugin: (pluginSlug: string) => boolean;
}

export function useEffectiveAccess(orgId?: string): UseEffectiveAccessResult {
    const {
        user,
        loading: authLoading,
        activeOrgId,
        organizationId,
        effectiveAccess,
        enabledPlugins,
    } = useAuth();

    const targetOrgId = orgId ?? activeOrgId ?? organizationId ?? user?.organizationId ?? null;
    const usesActiveOrganization = !orgId || orgId === activeOrgId || orgId === organizationId;

    const [scopedAccess, setScopedAccess] = useState<AgroEffectiveAccess | null>(null);
    const [scopedPlugins, setScopedPlugins] = useState<string[]>([]);
    const [isScopedLoading, setIsScopedLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;

        if (usesActiveOrganization) {
            setScopedAccess(null);
            setScopedPlugins([]);
            setIsScopedLoading(false);
            return () => {
                cancelled = true;
            };
        }

        if (!user || !targetOrgId) {
            setScopedAccess(null);
            setScopedPlugins([]);
            setIsScopedLoading(false);
            return () => {
                cancelled = true;
            };
        }

        setIsScopedLoading(true);
        setScopedAccess(null);
        setScopedPlugins([]);
        CapabilityService.invalidateCache(targetOrgId);

        void CapabilityService.getEnabledPlugins(targetOrgId)
            .then(async (plugins) => {
                if (cancelled) {
                    return;
                }

                setScopedPlugins(plugins);
                const nextAccess = await resolveEffectiveAccess(user, targetOrgId, undefined, plugins);

                if (!cancelled) {
                    setScopedAccess(nextAccess);
                }
            })
            .catch((error: unknown) => {
                console.error('Error resolving scoped effective access:', error);
                if (!cancelled) {
                    setScopedAccess(null);
                    setScopedPlugins([]);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setIsScopedLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [targetOrgId, user, usesActiveOrganization]);

    const access = usesActiveOrganization ? effectiveAccess : scopedAccess;
    const pluginSlugs = usesActiveOrganization ? enabledPlugins : scopedPlugins;
    const isLoading = usesActiveOrganization
        ? authLoading || (Boolean(user) && Boolean(targetOrgId) && effectiveAccess === null)
        : isScopedLoading;

    const can = useMemo(
        () => (action: EffectiveAccessAction) => (access ? canPerformAction(access, action) : false),
        [access]
    );

    const hasPlugin = useMemo(
        () => (pluginSlug: string) => pluginSlugs.includes(pluginSlug),
        [pluginSlugs]
    );

    return {
        access,
        isLoading,
        can,
        hasPlugin,
    };
}
