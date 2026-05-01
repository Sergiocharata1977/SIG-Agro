'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, PlugZap, RefreshCcw } from 'lucide-react';
import { AGRO_PLUGINS, BASE_PLUGINS } from '@/config/plugins';
import { PageShell } from '@/components/layout/PageShell';
import { useAuth } from '@/contexts/AuthContext';
import {
  PluginAlreadyInstalledError,
  PluginLifecycleService,
  type InstalledPlugin,
} from '@/services/plugins/PluginLifecycleService';

type InstalledPluginMap = Record<string, InstalledPlugin>;

export default function PluginsMarketplacePage() {
  const {
    activeOrgId,
    organization,
    refreshPluginCapabilities,
    user,
    canPerformAction,
  } = useAuth();
  const [installedPlugins, setInstalledPlugins] = useState<InstalledPluginMap>({});
  const [loading, setLoading] = useState(true);
  const [syncingPluginId, setSyncingPluginId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canManagePlugins = canPerformAction('admin');

  const cards = useMemo(
    () =>
      AGRO_PLUGINS.map((plugin) => {
        const installed = installedPlugins[plugin.identity.plugin_id];

        return {
          manifest: plugin,
          installed,
          isEnabled: installed?.enabled === true,
          isInstalled: Boolean(installed),
        };
      }),
    [installedPlugins]
  );

  useEffect(() => {
    void loadInstalledPlugins();
  }, [activeOrgId, canManagePlugins, user?.id]);

  async function ensureBasePluginsInstalled(orgId: string, installedBy: string) {
    for (const manifest of BASE_PLUGINS) {
      try {
        await PluginLifecycleService.installPlugin(orgId, manifest, installedBy);
      } catch (err) {
        if (!(err instanceof PluginAlreadyInstalledError)) {
          throw err;
        }
      }
    }
  }

  async function loadInstalledPlugins() {
    if (!activeOrgId || !user?.id) {
      setInstalledPlugins({});
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      if (canManagePlugins) {
        await ensureBasePluginsInstalled(activeOrgId, user.id);
      }
      const installed = await PluginLifecycleService.getInstalledPlugins(activeOrgId);

      setInstalledPlugins(
        Object.fromEntries(installed.map((plugin) => [plugin.pluginId, plugin]))
      );
      await refreshPluginCapabilities(activeOrgId);
    } catch (err) {
      const nextError =
        err instanceof Error ? err.message : 'No se pudo cargar el marketplace de plugins.';
      setError(nextError);
    } finally {
      setLoading(false);
    }
  }

  async function handleEnable(pluginId: string) {
    if (!activeOrgId || !user?.id) {
      return;
    }

    const plugin = AGRO_PLUGINS.find(
      (manifest) => manifest.identity.plugin_id === pluginId
    );

    if (!plugin) {
      setError(`No se encontro el manifest para ${pluginId}.`);
      return;
    }

    try {
      setSyncingPluginId(pluginId);
      setError(null);
      setMessage(null);

      if (installedPlugins[pluginId]) {
        await PluginLifecycleService.enablePlugin(activeOrgId, pluginId);
      } else {
        await PluginLifecycleService.installPlugin(activeOrgId, plugin, user.id);
      }

      await loadInstalledPlugins();
      setMessage(`${plugin.identity.display_name} quedo habilitado para ${organization?.name || 'la organizacion activa'}.`);
    } catch (err) {
      const nextError =
        err instanceof Error ? err.message : 'No se pudo habilitar el plugin.';
      setError(nextError);
    } finally {
      setSyncingPluginId(null);
    }
  }

  return (
    <PageShell
      title="Marketplace interno de plugins"
      subtitle="Activa capacidades premium por organizacion y deja listos los plugins base requeridos."
      rightSlot={
        <button
          type="button"
          onClick={() => void loadInstalledPlugins()}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <RefreshCcw className="h-4 w-4" />
          Recargar
        </button>
      }
    >
      {message ? (
        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      {!activeOrgId ? (
        <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-8 text-sm text-slate-600 shadow-sm">
          Selecciona una organizacion activa para administrar plugins.
        </div>
      ) : null}

      {activeOrgId ? (
        <section className="grid gap-5 lg:grid-cols-2">
          {cards.map(({ manifest, isEnabled, isInstalled }) => {
            const isSyncing = syncingPluginId === manifest.identity.plugin_id;
            const buttonLabel = isEnabled ? 'Habilitado' : 'Habilitar';

            return (
              <article
                key={manifest.identity.plugin_id}
                data-testid={`plugin-card-${manifest.identity.slug}`}
                className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {manifest.identity.tier}
                    </div>
                    <h2 className="mt-4 text-2xl font-semibold text-slate-950">
                      {manifest.identity.display_name}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {manifest.identity.summary}
                    </p>
                  </div>

                  <div className={`rounded-2xl p-3 ${
                    isEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {isEnabled ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      <PlugZap className="h-6 w-6" />
                    )}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    slug: {manifest.identity.slug}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    version: {manifest.versioning.plugin_version}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    estado: {isEnabled ? 'activo' : isInstalled ? 'instalado' : 'disponible'}
                  </span>
                </div>

                <div className="mt-6 flex items-center justify-between gap-3">
                  <div className="text-sm text-slate-500">
                    {manifest.compatibility.required_capabilities.length > 0
                      ? `Depende de: ${manifest.compatibility.required_capabilities.join(', ')}`
                      : 'Sin dependencias requeridas'}
                  </div>

                  <button
                    type="button"
                    data-testid={`plugin-enable-${manifest.identity.slug}`}
                    disabled={!canManagePlugins || isEnabled || isSyncing || loading}
                    onClick={() => void handleEnable(manifest.identity.plugin_id)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#0f2e21] px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {buttonLabel}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      ) : null}
    </PageShell>
  );
}
