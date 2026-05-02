'use client';

import { useEffect, useMemo, useState } from 'react';
import { Building2, Layers3, Loader2, Save, Sparkles } from 'lucide-react';
import {
  BaseButton,
  BaseCard,
  BaseInput,
  BaseSelect,
  BaseSelectContent,
  BaseSelectItem,
  BaseSelectTrigger,
  BaseSelectValue,
} from '@/components/design-system';
import { PageShell } from '@/components/layout/PageShell';
import { PluginCard } from '@/components/plugins/PluginCard';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/config';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import {
  activarPlugin,
  desactivarPlugin,
  obtenerPluginsActivos,
  setPluginsActivos,
} from '@/services/plugins';
import { CATALOGO_PLUGINS, type PluginId } from '@/types/plugins';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type OrganizationOption = {
  id: string;
  name: string;
  plan?: string;
  status?: string;
};

type PresetRecord = {
  id: string;
  name: string;
  plugins: PluginId[];
  updatedBy: string;
  updatedAt: Date | null;
};

type PresetsDocument = {
  items?: Record<
    string,
    {
      name?: unknown;
      plugins?: unknown;
      updatedBy?: unknown;
      updatedAt?: unknown;
    }
  >;
};

const PRESETS_DOC_REF = doc(db, 'superadmin', 'presets');

function readPluginIds(value: unknown): PluginId[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(value.filter((pluginId): pluginId is PluginId => typeof pluginId === 'string'))
  );
}

function readPresetTimestamp(value: unknown): Date | null {
  if (value instanceof Timestamp) {
    return value.toDate();
  }

  return value instanceof Date ? value : null;
}

function slugifyPresetName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function SuperAdminPluginsPage() {
  const { user } = useAuth();

  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [pluginsActivos, setPluginsActivosState] = useState<PluginId[]>([]);
  const [presets, setPresets] = useState<PresetRecord[]>([]);
  const [presetName, setPresetName] = useState('');

  const [loadingOrganizations, setLoadingOrganizations] = useState(true);
  const [loadingPlugins, setLoadingPlugins] = useState(false);
  const [loadingPresets, setLoadingPresets] = useState(false);
  const [savingPreset, setSavingPreset] = useState(false);
  const [applyingPresetId, setApplyingPresetId] = useState<string | null>(null);
  const [processingPluginId, setProcessingPluginId] = useState<PluginId | null>(null);

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedOrganization = useMemo(
    () => organizations.find((organization) => organization.id === selectedOrgId) ?? null,
    [organizations, selectedOrgId]
  );

  useEffect(() => {
    void cargarOrganizaciones();
    void cargarPresets();
  }, []);

  useEffect(() => {
    if (!selectedOrgId) {
      setPluginsActivosState([]);
      return;
    }

    void cargarPlugins(selectedOrgId);
  }, [selectedOrgId]);

  async function cargarOrganizaciones() {
    try {
      setLoadingOrganizations(true);
      setError(null);

      const response = await fetch('/api/super-admin/organizations', {
        method: 'GET',
        cache: 'no-store',
      });

      if (response.ok) {
        const payload = (await response.json()) as {
          organizations?: Array<Record<string, unknown>>;
        };
        const orgs = (payload.organizations ?? [])
          .map((organization) => ({
            id: typeof organization.id === 'string' ? organization.id : '',
            name:
              typeof organization.name === 'string' && organization.name.length > 0
                ? organization.name
                : typeof organization.slug === 'string'
                  ? organization.slug
                  : 'Organizacion sin nombre',
            plan: typeof organization.plan === 'string' ? organization.plan : undefined,
            status: typeof organization.status === 'string' ? organization.status : undefined,
          }))
          .filter((organization) => organization.id.length > 0);

        setOrganizations(orgs);
        setSelectedOrgId((current) => current || orgs[0]?.id || '');
        return;
      }

      throw new Error('La API no pudo devolver organizaciones.');
    } catch (apiError) {
      console.warn('Fallo la API de organizaciones, usando Firestore directo.', apiError);

      try {
        const snapshot = await getDocs(collection(db, 'organizations'));
        const orgs = snapshot.docs
          .map((docSnapshot) => {
            const data = docSnapshot.data() as Record<string, unknown>;

            return {
              id: docSnapshot.id,
              name:
                typeof data.name === 'string' && data.name.length > 0
                  ? data.name
                  : typeof data.slug === 'string'
                    ? data.slug
                    : docSnapshot.id,
              plan: typeof data.plan === 'string' ? data.plan : undefined,
              status: typeof data.status === 'string' ? data.status : undefined,
            };
          })
          .sort((a, b) => a.name.localeCompare(b.name, 'es'));

        setOrganizations(orgs);
        setSelectedOrgId((current) => current || orgs[0]?.id || '');
      } catch (firestoreError) {
        console.error('Error cargando organizaciones:', firestoreError);
        setError('No se pudieron cargar las organizaciones.');
      }
    } finally {
      setLoadingOrganizations(false);
    }
  }

  async function cargarPlugins(orgId: string) {
    try {
      setLoadingPlugins(true);
      setError(null);
      const activos = await obtenerPluginsActivos(orgId);
      setPluginsActivosState(activos);
    } catch (loadError) {
      console.error('Error cargando plugins activos:', loadError);
      setError('No se pudieron cargar los plugins activos de la organizacion.');
    } finally {
      setLoadingPlugins(false);
    }
  }

  async function cargarPresets() {
    try {
      setLoadingPresets(true);

      const snapshot = await getDoc(PRESETS_DOC_REF);
      if (!snapshot.exists()) {
        setPresets([]);
        return;
      }

      const data = snapshot.data() as PresetsDocument;
      const items = data.items ?? {};

      const nextPresets = Object.entries(items)
        .map(([id, preset]) => ({
          id,
          name: typeof preset.name === 'string' ? preset.name : id,
          plugins: readPluginIds(preset.plugins),
          updatedBy: typeof preset.updatedBy === 'string' ? preset.updatedBy : '',
          updatedAt: readPresetTimestamp(preset.updatedAt),
        }))
        .sort((a, b) => a.name.localeCompare(b.name, 'es'));

      setPresets(nextPresets);
    } catch (loadError) {
      console.error('Error cargando presets:', loadError);
      setError('No se pudieron cargar los presets guardados.');
    } finally {
      setLoadingPresets(false);
    }
  }

  async function handleTogglePlugin(pluginId: PluginId, activo: boolean) {
    if (!selectedOrgId || !user?.id) {
      setError('Selecciona una organizacion valida antes de modificar plugins.');
      return;
    }

    try {
      setProcessingPluginId(pluginId);
      setFeedback(null);
      setError(null);

      if (activo) {
        await desactivarPlugin(selectedOrgId, pluginId, user.id);
      } else {
        await activarPlugin(selectedOrgId, pluginId, user.id);
      }

      await cargarPlugins(selectedOrgId);
      setFeedback(
        `${activo ? 'Se desactivo' : 'Se activo'} ${pluginId} para ${selectedOrganization?.name || selectedOrgId}.`
      );
    } catch (toggleError) {
      console.error('Error actualizando plugin:', toggleError);
      setError(`No se pudo ${activo ? 'desactivar' : 'activar'} el plugin ${pluginId}.`);
    } finally {
      setProcessingPluginId(null);
    }
  }

  async function handleGuardarPreset() {
    const trimmedName = presetName.trim();
    const presetId = slugifyPresetName(trimmedName);

    if (!trimmedName || !presetId) {
      setError('Ingresa un nombre valido para el preset.');
      return;
    }

    if (!user?.id) {
      setError('No se pudo identificar el usuario actual.');
      return;
    }

    try {
      setSavingPreset(true);
      setError(null);
      setFeedback(null);

      await setDoc(
        PRESETS_DOC_REF,
        {
          items: {
            [presetId]: {
              name: trimmedName,
              plugins: pluginsActivos,
              updatedAt: Timestamp.now(),
              updatedBy: user.id,
            },
          },
        },
        { merge: true }
      );

      await cargarPresets();
      setPresetName('');
      setSaveDialogOpen(false);
      setFeedback(`Preset "${trimmedName}" guardado correctamente.`);
    } catch (saveError) {
      console.error('Error guardando preset:', saveError);
      setError('No se pudo guardar el preset.');
    } finally {
      setSavingPreset(false);
    }
  }

  async function handleAplicarPreset(preset: PresetRecord) {
    if (!selectedOrgId || !user?.id) {
      setError('Selecciona una organizacion antes de aplicar un preset.');
      return;
    }

    try {
      setApplyingPresetId(preset.id);
      setError(null);
      setFeedback(null);

      await setPluginsActivos(selectedOrgId, preset.plugins, user.id);
      await cargarPlugins(selectedOrgId);
      setApplyDialogOpen(false);
      setFeedback(`Preset "${preset.name}" aplicado a ${selectedOrganization?.name || selectedOrgId}.`);
    } catch (applyError) {
      console.error('Error aplicando preset:', applyError);
      setError(`No se pudo aplicar el preset "${preset.name}".`);
    } finally {
      setApplyingPresetId(null);
    }
  }

  return (
    <PageShell
      title="Plugins por organizacion"
      subtitle="Activa o desactiva modulos de plan por organizacion y reutiliza presets comerciales desde el panel super-admin."
      rightSlot={
        <>
          <BaseButton
            variant="outline"
            disabled={!selectedOrgId || loadingPlugins}
            onClick={() => setApplyDialogOpen(true)}
          >
            <Layers3 className="mr-2 h-4 w-4" />
            Aplicar preset
          </BaseButton>
          <BaseButton
            disabled={!selectedOrgId || loadingPlugins}
            onClick={() => setSaveDialogOpen(true)}
          >
            <Save className="mr-2 h-4 w-4" />
            Guardar preset
          </BaseButton>
        </>
      }
    >
      {feedback ? (
        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
          {feedback}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(320px,420px)_1fr]">
        <BaseCard>
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Seleccion de organizacion</h2>
                <p className="text-sm text-slate-600">
                  Cambia de empresa para administrar su combinacion de plugins.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="organization-selector">
                Organizacion
              </label>
              <BaseSelect
                disabled={loadingOrganizations || organizations.length === 0}
                value={selectedOrgId}
                onValueChange={setSelectedOrgId}
              >
                <BaseSelectTrigger id="organization-selector">
                  <BaseSelectValue
                    placeholder={
                      loadingOrganizations ? 'Cargando organizaciones...' : 'Selecciona una organizacion'
                    }
                  />
                </BaseSelectTrigger>
                <BaseSelectContent>
                  {organizations.map((organization) => (
                    <BaseSelectItem key={organization.id} value={organization.id}>
                      {organization.name}
                    </BaseSelectItem>
                  ))}
                </BaseSelectContent>
              </BaseSelect>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <MetricCard
                label="Plugins activos"
                value={pluginsActivos.length}
                detail="Cantidad habilitada hoy para la org seleccionada."
              />
              <MetricCard
                label="Catalogo total"
                value={CATALOGO_PLUGINS.length}
                detail="Opciones administrables desde este panel."
              />
              <MetricCard
                label="Presets guardados"
                value={presets.length}
                detail="Plantillas reutilizables para altas o cambios de plan."
              />
            </div>

            {selectedOrganization ? (
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <div className="font-medium text-slate-900">{selectedOrganization.name}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedOrganization.plan ? (
                    <span className="rounded-full bg-white px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                      Plan {selectedOrganization.plan}
                    </span>
                  ) : null}
                  {selectedOrganization.status ? (
                    <span className="rounded-full bg-white px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                      {selectedOrganization.status}
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </BaseCard>

        <BaseCard>
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Catalogo administrable</h2>
                <p className="text-sm text-slate-600">
                  Usa Activar o Desactivar para escribir en
                  {' '}
                  <code>organizations/{'{orgId}'}/settings/plugins</code>.
                </p>
              </div>

              {loadingPlugins ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sincronizando
                </div>
              ) : null}
            </div>

            {!selectedOrgId && !loadingOrganizations ? (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                Selecciona una organizacion para cargar sus plugins activos.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
                {CATALOGO_PLUGINS.map((plugin) => {
                  const activo = pluginsActivos.includes(plugin.id);
                  const loading = processingPluginId === plugin.id;

                  return (
                    <PluginCard
                      key={plugin.id}
                      plugin={plugin}
                      activo={activo}
                      loading={loading}
                      modoAdmin
                      onActivar={() => void handleTogglePlugin(plugin.id, false)}
                      onDesactivar={() => void handleTogglePlugin(plugin.id, true)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </BaseCard>
      </div>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Guardar preset</DialogTitle>
            <DialogDescription>
              Guarda la combinacion actual para reutilizarla en otras organizaciones.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              {selectedOrganization?.name || 'Sin organizacion seleccionada'}
              <div className="mt-1 text-xs text-slate-500">
                {pluginsActivos.length} plugin(s) activos en esta combinacion.
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="preset-name">
                Nombre del preset
              </label>
              <BaseInput
                id="preset-name"
                placeholder="Ej: Plan Basico"
                value={presetName}
                onChange={(event) => setPresetName(event.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2">
              <BaseButton
                type="button"
                variant="outline"
                onClick={() => setSaveDialogOpen(false)}
              >
                Cancelar
              </BaseButton>
              <BaseButton
                type="button"
                disabled={savingPreset}
                onClick={() => void handleGuardarPreset()}
              >
                {savingPreset ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Guardar
              </BaseButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Aplicar preset</DialogTitle>
            <DialogDescription>
              Selecciona una combinacion guardada y aplicala en un click a la organizacion actual.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {loadingPresets ? (
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-6 text-sm text-slate-500">
                Cargando presets guardados...
              </div>
            ) : presets.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
                Todavia no hay presets guardados.
              </div>
            ) : (
              <div className="grid gap-3">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-slate-950">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        <span className="font-semibold">{preset.name}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {preset.plugins.length} plugin(s):
                        {' '}
                        {preset.plugins.join(', ') || 'sin plugins'}
                      </p>
                    </div>

                    <BaseButton
                      type="button"
                      disabled={applyingPresetId === preset.id}
                      onClick={() => void handleAplicarPreset(preset)}
                    >
                      {applyingPresetId === preset.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Aplicar
                    </BaseButton>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-slate-950">{value}</div>
      <div className="mt-1 text-sm leading-6 text-slate-600">{detail}</div>
    </div>
  );
}
