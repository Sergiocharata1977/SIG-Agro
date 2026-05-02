'use client';

import type { ReactNode } from 'react';
import {
  BarChart3,
  Bot,
  ClipboardList,
  ExternalLink,
  FileText,
  Landmark,
  Lock,
  Map,
  MapPin,
  Puzzle,
  Sparkles,
  Wheat,
  type LucideIcon,
} from 'lucide-react';
import { BaseButton, BaseCard } from '@/components/design-system';
import { AGRO_PLUGINS } from '@/config/plugins';
import type { AgroPluginManifest as PluginDefinicion } from '@/types/plugins';

type PluginId = PluginDefinicion['identity']['plugin_id'];

interface PluginGateProps {
  pluginId: PluginId;
  isActive: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

const CATALOGO_PLUGINS = AGRO_PLUGINS;

const PLUGIN_ICON_MAP: Record<string, LucideIcon> = {
  BarChart3,
  Bot,
  ClipboardList,
  FileText,
  Landmark,
  Map,
  MapPin,
  Wheat,
};

function getPluginIcon(plugin: PluginDefinicion | undefined) {
  const iconName = plugin?.routes.navigation[0]?.icon;
  return (iconName && PLUGIN_ICON_MAP[iconName]) || Puzzle;
}

export function PluginGate({ pluginId, isActive, children, fallback }: PluginGateProps) {
  if (isActive) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const plugin = CATALOGO_PLUGINS.find(item => item.identity.plugin_id === pluginId);
  const PluginIcon = getPluginIcon(plugin);

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-slate-100/80 px-4 py-10">
      <BaseCard className="w-full max-w-2xl border-slate-200 bg-white shadow-lg">
        <div
          className="flex flex-col items-center gap-6 text-center"
          data-testid={`plugin-gate-${pluginId}`}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-sm">
              <Lock className="h-8 w-8" />
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 shadow-sm">
              <PluginIcon className="h-8 w-8" />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-slate-950">
              {plugin?.identity.display_name || 'Modulo no disponible'}
            </h2>
            <p className="mx-auto max-w-xl text-sm leading-6 text-slate-600">
              {plugin?.identity.summary ||
                'Este modulo todavia no fue configurado para tu organizacion.'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-700">
            <div className="flex items-center justify-center gap-2 font-medium text-slate-900">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Este modulo no esta activo en tu plan</span>
            </div>
          </div>

          <BaseButton
            className="gap-2"
            onClick={() => {
              window.location.href = 'mailto:info@donjuangis.com';
            }}
          >
            Contactar para activar
            <ExternalLink className="h-4 w-4" />
          </BaseButton>
        </div>
      </BaseCard>
    </div>
  );
}
