'use client';

import {
  BarChart3,
  Bot,
  BookOpen,
  ClipboardList,
  Download,
  ExternalLink,
  Landmark,
  Lock,
  FileText,
  Map,
  MapPin,
  Puzzle,
  ShieldCheck,
  ShoppingCart,
  Sprout,
  Wheat,
  Check,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import { BaseBadge, BaseButton, BaseCard } from '@/components/design-system';
import type {
  AgroPluginManifest,
  Plugin as LegacyPluginDefinicion,
} from '@/types/plugins';

type PluginDefinicion = AgroPluginManifest | LegacyPluginDefinicion;

interface PluginCardProps {
  plugin: PluginDefinicion;
  activo: boolean;
  onActivar?: () => void;
  onDesactivar?: () => void;
  modoAdmin?: boolean;
  loading?: boolean;
}

const PLUGIN_ICON_MAP: Record<string, LucideIcon> = {
  BarChart3,
  Bot,
  BookOpen,
  ClipboardList,
  Download,
  FileText,
  Landmark,
  Map,
  MapPin,
  ShieldCheck,
  ShoppingCart,
  Sprout,
  Wheat,
};

function getPluginIcon(plugin: PluginDefinicion) {
  const iconName =
    'routes' in plugin ? plugin.routes.navigation[0]?.icon : plugin.icono;
  return (iconName && PLUGIN_ICON_MAP[iconName]) || Puzzle;
}

function getPluginTitle(plugin: PluginDefinicion) {
  return 'identity' in plugin ? plugin.identity.display_name : plugin.nombre;
}

function getPluginSlug(plugin: PluginDefinicion) {
  return 'identity' in plugin ? plugin.identity.slug : plugin.id;
}

function getPluginSummary(plugin: PluginDefinicion) {
  return 'identity' in plugin ? plugin.identity.summary : plugin.descripcion;
}

function getPluginTier(plugin: PluginDefinicion) {
  return 'identity' in plugin ? plugin.identity.tier : plugin.categoria;
}

export function PluginCard({
  plugin,
  activo,
  onActivar,
  onDesactivar,
  modoAdmin = false,
  loading = false,
}: PluginCardProps) {
  const PluginIcon = getPluginIcon(plugin);
  const actionLabel = activo ? 'Desactivar' : 'Activar';
  const handleAction = activo ? onDesactivar : onActivar;

  return (
    <BaseCard
      className="h-full border-slate-200 bg-white transition-shadow hover:shadow-md"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
            {getPluginTier(plugin)}
          </span>

          {modoAdmin ? (
            <BaseButton
              className={activo ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}
              disabled={!handleAction || loading}
              onClick={handleAction}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? 'Procesando...' : actionLabel}
            </BaseButton>
          ) : !activo ? (
            <BaseButton
              variant="outline"
              className="gap-2"
              onClick={() => {
                window.location.href = 'mailto:info@donjuangis.com';
              }}
            >
              Mas informacion
              <ExternalLink className="h-4 w-4" />
            </BaseButton>
          ) : null}
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <PluginIcon className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-slate-950">
                {getPluginTitle(plugin)}
              </h3>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                {getPluginSlug(plugin)}
              </p>
            </div>
          </div>

          <BaseBadge
            variant={activo ? 'success' : 'outline'}
            className="inline-flex items-center gap-1.5"
          >
            {activo ? <Check className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
            {activo ? 'Activo' : 'Disponible'}
          </BaseBadge>
        </div>

        <p className="text-sm leading-6 text-slate-600">{getPluginSummary(plugin)}</p>
      </div>
    </BaseCard>
  );
}
