'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { BarChart3, Pencil, Plus, Wallet } from 'lucide-react';
import { BaseButton, BaseCard, BaseInput } from '@/components/design-system';
import { PageShell } from '@/components/layout/PageShell';
import { PluginGate } from '@/components/plugins/PluginGate';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { usePlugins } from '@/contexts/PluginsContext';
import { obtenerCampanias } from '@/services/campanias';
import { obtenerCampos } from '@/services/campos';
import { obtenerLotes } from '@/services/lotes';
import {
  actualizarPresupuesto,
  crearPresupuesto,
  obtenerPresupuestos,
} from '@/services/presupuesto';
import type { Campo, Campania, Lote } from '@/types';
import type {
  CategoriaPresupuesto,
  LineaPresupuesto,
  Presupuesto,
  TipoPresupuesto,
} from '@/types/presupuesto';

type LineaEnriquecida = LineaPresupuesto & {
  presupuestoSafe: number;
  realSafe: number;
};

const CATEGORY_OPTIONS: Array<{
  value: CategoriaPresupuesto;
  label: string;
  type: TipoPresupuesto;
}> = [
  { value: 'semillas', label: 'Semillas', type: 'gasto' },
  { value: 'fertilizantes', label: 'Fertilizantes', type: 'gasto' },
  { value: 'agroquimicos', label: 'Agroquimicos', type: 'gasto' },
  { value: 'combustible', label: 'Combustible', type: 'gasto' },
  { value: 'labores', label: 'Labores', type: 'gasto' },
  { value: 'fletes', label: 'Fletes', type: 'gasto' },
  { value: 'seguros', label: 'Seguros', type: 'gasto' },
  { value: 'arrendamientos', label: 'Arrendamientos', type: 'gasto' },
  { value: 'cosecha', label: 'Cosecha', type: 'gasto' },
  { value: 'mano_obra', label: 'Mano de obra', type: 'gasto' },
  { value: 'servicios_tecnicos', label: 'Servicios tecnicos', type: 'gasto' },
  { value: 'repuestos', label: 'Repuestos', type: 'gasto' },
  { value: 'gastos_admin', label: 'Gastos administrativos', type: 'gasto' },
  { value: 'gastos_comerciales', label: 'Gastos comerciales', type: 'gasto' },
  { value: 'financiamiento', label: 'Financiamiento', type: 'gasto' },
  { value: 'otros_gastos', label: 'Otros gastos', type: 'gasto' },
  { value: 'venta_granos', label: 'Venta de granos', type: 'ingreso' },
  { value: 'otros_ingresos', label: 'Otros ingresos', type: 'ingreso' },
];

const EMPTY_BUDGET_FORM = {
  nombre: '',
  campaniaId: '',
  campoId: '',
  loteId: '',
  cultivo: '',
  hectareas: '',
  anio: String(new Date().getFullYear()),
};

const EMPTY_LINE_FORM = {
  categoria: CATEGORY_OPTIONS[0].value,
  descripcion: '',
  tipo: CATEGORY_OPTIONS[0].type,
  montoPresupuestado: '',
};

const EMPTY_REAL_FORM = {
  montoReal: '',
};

function formatCurrency(value: number) {
  return value.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  });
}

function formatPercent(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function isLineaFavorable(linea: LineaEnriquecida) {
  if (linea.tipo === 'gasto') {
    return linea.realSafe <= linea.presupuestoSafe;
  }

  return linea.realSafe >= linea.presupuestoSafe;
}

function sanitizeAmount(value: string) {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

function enrichLinea(linea: LineaPresupuesto): LineaEnriquecida {
  const presupuestoSafe = Number(linea.montoPresupuestado) || 0;
  const realSafe = Number(linea.montoReal) || 0;

  return {
    ...linea,
    presupuestoSafe,
    realSafe,
  };
}

function getCategoryLabel(categoria: CategoriaPresupuesto) {
  return CATEGORY_OPTIONS.find((item) => item.value === categoria)?.label || categoria;
}

function getCampaignName(campanias: Campania[], campaniaId?: string) {
  return campanias.find((item) => item.id === campaniaId)?.nombre || 'Sin campana';
}

function getCampoName(campos: Campo[], campoId?: string) {
  return campos.find((item) => item.id === campoId)?.nombre || 'Sin campo';
}

function getLoteName(lotes: Lote[], loteId?: string) {
  return lotes.find((item) => item.id === loteId)?.nombre || 'Sin lote';
}

export default function PresupuestoPage() {
  const { user, loading: authLoading } = useAuth();
  const { isActive, loading: pluginsLoading } = usePlugins();
  const pluginActive = isActive('presupuesto_control');

  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [campanias, setCampanias] = useState<Campania[]>([]);
  const [campos, setCampos] = useState<Campo[]>([]);
  const [lotesPorCampo, setLotesPorCampo] = useState<Record<string, Lote[]>>({});
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [newBudgetOpen, setNewBudgetOpen] = useState(false);
  const [newLineOpen, setNewLineOpen] = useState(false);
  const [editRealOpen, setEditRealOpen] = useState(false);

  const [budgetForm, setBudgetForm] = useState(EMPTY_BUDGET_FORM);
  const [lineForm, setLineForm] = useState(EMPTY_LINE_FORM);
  const [realForm, setRealForm] = useState(EMPTY_REAL_FORM);
  const [editingLineaId, setEditingLineaId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!user?.organizationId || !pluginActive) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [presupuestosData, campaniasData, camposData] = await Promise.all([
          obtenerPresupuestos(user.organizationId),
          obtenerCampanias(user.id),
          obtenerCampos(user.organizationId),
        ]);

        setPresupuestos(presupuestosData);
        setCampanias(campaniasData);
        setCampos(camposData);
        setSelectedId((current) => current || presupuestosData[0]?.id || '');

        const lotesEntries = await Promise.all(
          camposData.map(async (campo) => [campo.id, await obtenerLotes(user.organizationId, campo.id)] as const)
        );
        setLotesPorCampo(Object.fromEntries(lotesEntries));
      } catch (loadError) {
        console.error('Error cargando presupuestos:', loadError);
        setError('No pudimos cargar los presupuestos de la organizacion.');
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && !pluginsLoading) {
      void loadData();
    }
  }, [authLoading, pluginActive, pluginsLoading, user?.id, user?.organizationId]);

  useEffect(() => {
    if (!budgetForm.campoId || !user?.organizationId || lotesPorCampo[budgetForm.campoId]) {
      return;
    }

    obtenerLotes(user.organizationId, budgetForm.campoId)
      .then((items) => {
        setLotesPorCampo((current) => ({ ...current, [budgetForm.campoId]: items }));
      })
      .catch(() => {
        setLotesPorCampo((current) => ({ ...current, [budgetForm.campoId]: [] }));
      });
  }, [budgetForm.campoId, lotesPorCampo, user?.organizationId]);

  const selectedPresupuesto = useMemo(
    () => presupuestos.find((item) => item.id === selectedId) || null,
    [presupuestos, selectedId]
  );

  const selectedLineas = useMemo(
    () => (selectedPresupuesto?.lineas || []).map(enrichLinea),
    [selectedPresupuesto]
  );

  const selectedCampoLotes = budgetForm.campoId ? lotesPorCampo[budgetForm.campoId] || [] : [];
  const maxBarValue = useMemo(() => {
    const values = selectedLineas.flatMap((linea) => [linea.presupuestoSafe, linea.realSafe]);
    return Math.max(...values, 1);
  }, [selectedLineas]);

  const marginDelta = selectedPresupuesto
    ? selectedPresupuesto.margenReal - selectedPresupuesto.margenPresupuestado
    : 0;

  const editingLinea = selectedPresupuesto?.lineas.find((linea) => linea.id === editingLineaId) || null;

  async function refreshPresupuestos(nextSelectedId?: string) {
    if (!user?.organizationId) return;
    const data = await obtenerPresupuestos(user.organizationId);
    setPresupuestos(data);
    setSelectedId(nextSelectedId || data[0]?.id || '');
  }

  async function handleCreateBudget(event: FormEvent) {
    event.preventDefault();
    if (!user?.organizationId) return;

    setSaving(true);
    setError(null);

    try {
      const newId = await crearPresupuesto(user.organizationId, {
        nombre: budgetForm.nombre.trim(),
        campaniaId: budgetForm.campaniaId || undefined,
        campoId: budgetForm.campoId || undefined,
        loteId: budgetForm.loteId || undefined,
        cultivo: budgetForm.cultivo.trim() || undefined,
        hectareas: budgetForm.hectareas ? sanitizeAmount(budgetForm.hectareas) : undefined,
        año: Number(budgetForm.anio),
        lineas: [],
        estado: 'borrador',
        notas: undefined,
      });

      await refreshPresupuestos(newId);
      setNewBudgetOpen(false);
      setBudgetForm(EMPTY_BUDGET_FORM);
    } catch (createError) {
      console.error('Error creando presupuesto:', createError);
      setError('No pudimos crear el presupuesto.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddLine(event: FormEvent) {
    event.preventDefault();
    if (!user?.organizationId || !selectedPresupuesto) return;

    setSaving(true);
    setError(null);

    try {
      const nextLine: LineaPresupuesto = {
        id: crypto.randomUUID(),
        categoria: lineForm.categoria,
        descripcion: lineForm.descripcion.trim(),
        tipo: lineForm.tipo,
        montoPresupuestado: sanitizeAmount(lineForm.montoPresupuestado),
        montoReal: 0,
        diferencia: 0,
        variacionPct: 0,
      };

      await actualizarPresupuesto(user.organizationId, selectedPresupuesto.id, {
        lineas: [...selectedPresupuesto.lineas, nextLine],
      });

      await refreshPresupuestos(selectedPresupuesto.id);
      setNewLineOpen(false);
      setLineForm(EMPTY_LINE_FORM);
    } catch (lineError) {
      console.error('Error agregando linea:', lineError);
      setError('No pudimos agregar la linea al presupuesto.');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateReal(event: FormEvent) {
    event.preventDefault();
    if (!user?.organizationId || !selectedPresupuesto || !editingLinea) return;

    setSaving(true);
    setError(null);

    try {
      const lineasActualizadas = selectedPresupuesto.lineas.map((linea) =>
        linea.id === editingLinea.id
          ? {
              ...linea,
              montoReal: sanitizeAmount(realForm.montoReal),
            }
          : linea
      );

      await actualizarPresupuesto(user.organizationId, selectedPresupuesto.id, {
        lineas: lineasActualizadas,
      });

      await refreshPresupuestos(selectedPresupuesto.id);
      setEditRealOpen(false);
      setEditingLineaId(null);
      setRealForm(EMPTY_REAL_FORM);
    } catch (updateError) {
      console.error('Error actualizando real:', updateError);
      setError('No pudimos actualizar el monto real de la linea.');
    } finally {
      setSaving(false);
    }
  }

  function openEditDialog(linea: LineaPresupuesto) {
    setEditingLineaId(linea.id);
    setRealForm({ montoReal: String(linea.montoReal) });
    setEditRealOpen(true);
  }

  if (!pluginsLoading && !pluginActive) {
    return (
      <PluginGate pluginId="presupuesto_control" isActive={false}>
        {null}
      </PluginGate>
    );
  }

  if (authLoading || pluginsLoading || loading) {
    return (
      <PageShell
        title="Presupuesto vs real"
        subtitle="Seguimiento economico por campana, campo y lote."
      >
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Cargando presupuestos...
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Presupuesto vs real"
      subtitle="Compara lo planificado con la ejecucion real y ajusta cada linea desde una sola vista."
      rightSlot={
        <BaseButton
          type="button"
          className="gap-2"
          onClick={() => {
            setError(null);
            setNewBudgetOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Nuevo presupuesto
        </BaseButton>
      }
    >
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Presupuesto seleccionado</label>
          <select
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            className={fieldClassName}
          >
            <option value="">Seleccionar presupuesto</option>
            {presupuestos.map((presupuesto) => (
              <option key={presupuesto.id} value={presupuesto.id}>
                {presupuesto.nombre}
              </option>
            ))}
          </select>
        </div>

        {selectedPresupuesto ? (
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
            <div className="font-semibold text-slate-900">{selectedPresupuesto.nombre}</div>
            <div className="mt-1">
              {getCampaignName(campanias, selectedPresupuesto.campaniaId)} | {getCampoName(campos, selectedPresupuesto.campoId)} | {getLoteName(lotesPorCampo[selectedPresupuesto.campoId || ''] || [], selectedPresupuesto.loteId)}
            </div>
            <div className="mt-1">
              {selectedPresupuesto.cultivo || 'Cultivo sin definir'} | {selectedPresupuesto.hectareas || 0} ha | Año {selectedPresupuesto.año}
            </div>
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500">
            Crea un presupuesto para empezar a comparar.
          </div>
        )}
      </section>

      {selectedPresupuesto ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title="Gastos presupuestados"
              value={formatCurrency(selectedPresupuesto.totalPresupuestadoGastos)}
              tone="slate"
            />
            <KpiCard
              title="Gastos reales"
              value={formatCurrency(selectedPresupuesto.totalRealGastos)}
              tone="amber"
            />
            <KpiCard
              title="Ingresos presupuestados"
              value={formatCurrency(selectedPresupuesto.totalPresupuestadoIngresos)}
              tone="sky"
            />
            <KpiCard
              title="Ingresos reales"
              value={formatCurrency(selectedPresupuesto.totalRealIngresos)}
              tone={marginDelta >= 0 ? 'emerald' : 'rose'}
              helper={`Margen real ${formatCurrency(selectedPresupuesto.margenReal)} | vs plan ${formatCurrency(marginDelta)}`}
            />
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Lineas del presupuesto</h2>
                <p className="text-sm text-slate-500">
                  Verde indica resultado favorable; rojo marca desvio desfavorable.
                </p>
              </div>
              <BaseButton
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => {
                  setError(null);
                  setNewLineOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Agregar linea
              </BaseButton>
            </div>

            {selectedLineas.length ? (
              <div className="overflow-x-auto rounded-[24px] border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Categoria</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Tipo</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600">Presupuestado</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600">Real</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600">Diferencia</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600">Variacion %</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600" />
                    </tr>
                  </thead>
                  <tbody>
                    {selectedLineas.map((linea) => {
                      const favorable = isLineaFavorable(linea);
                      const toneClass = favorable ? 'text-emerald-700' : 'text-rose-700';

                      return (
                        <tr key={linea.id} className="border-t border-slate-100">
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900">{getCategoryLabel(linea.categoria)}</div>
                            <div className="text-xs text-slate-500">{linea.descripcion || 'Sin descripcion'}</div>
                          </td>
                          <td className="px-4 py-3 capitalize text-slate-700">{linea.tipo}</td>
                          <td className="px-4 py-3 text-right text-slate-700">
                            {formatCurrency(linea.presupuestoSafe)}
                          </td>
                          <td className={`px-4 py-3 text-right font-medium ${toneClass}`}>
                            {formatCurrency(linea.realSafe)}
                          </td>
                          <td className={`px-4 py-3 text-right font-medium ${toneClass}`}>
                            {formatCurrency(linea.diferencia)}
                          </td>
                          <td className={`px-4 py-3 text-right font-medium ${toneClass}`}>
                            {formatPercent(linea.variacionPct)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <BaseButton
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="gap-2"
                              onClick={() => openEditDialog(linea)}
                            >
                              <Pencil className="h-4 w-4" />
                              Editar
                            </BaseButton>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
                Este presupuesto todavia no tiene lineas. Agrega la primera para comenzar el control.
              </div>
            )}
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Barras comparativas</h2>
                <p className="text-sm text-slate-500">Comparacion visual por categoria sin librerias externas.</p>
              </div>
            </div>

            <div className="space-y-4">
              {selectedLineas.length ? (
                selectedLineas.map((linea) => (
                  <div key={`bar-${linea.id}`} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-medium text-slate-900">{getCategoryLabel(linea.categoria)}</div>
                        <div className="text-xs text-slate-500">{linea.descripcion || linea.tipo}</div>
                      </div>
                      <div className="text-xs text-slate-500">
                        {formatCurrency(linea.presupuestoSafe)} vs {formatCurrency(linea.realSafe)}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <BarRow
                        label="Presupuestado"
                        color="bg-slate-700"
                        width={(linea.presupuestoSafe / maxBarValue) * 100}
                      />
                      <BarRow
                        label="Real"
                        color={isLineaFavorable(linea) ? 'bg-emerald-500' : 'bg-rose-500'}
                        width={(linea.realSafe / maxBarValue) * 100}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
                  Las barras apareceran cuando agregues lineas al presupuesto.
                </div>
              )}
            </div>
          </section>
        </>
      ) : (
        <BaseCard className="rounded-[28px] border-dashed p-10 text-center text-slate-500">
          <Wallet className="mx-auto mb-3 h-8 w-8 text-slate-400" />
          Selecciona un presupuesto existente o crea uno nuevo para ver KPIs, lineas y comparativas.
        </BaseCard>
      )}

      <Dialog open={newBudgetOpen} onOpenChange={setNewBudgetOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nuevo presupuesto</DialogTitle>
            <DialogDescription>
              Define el alcance productivo y luego agrega las lineas de gastos e ingresos.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateBudget} className="space-y-5 pt-2">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nombre">
                <BaseInput
                  value={budgetForm.nombre}
                  onChange={(event) =>
                    setBudgetForm((current) => ({ ...current, nombre: event.target.value }))
                  }
                  placeholder="Ej. Presupuesto soja norte"
                  required
                />
              </Field>

              <Field label="Campana">
                <select
                  value={budgetForm.campaniaId}
                  onChange={(event) =>
                    setBudgetForm((current) => ({ ...current, campaniaId: event.target.value }))
                  }
                  className={fieldClassName}
                >
                  <option value="">Sin asociar</option>
                  {campanias.map((campania) => (
                    <option key={campania.id} value={campania.id}>
                      {campania.nombre}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Campo">
                <select
                  value={budgetForm.campoId}
                  onChange={(event) =>
                    setBudgetForm((current) => ({
                      ...current,
                      campoId: event.target.value,
                      loteId: '',
                    }))
                  }
                  className={fieldClassName}
                >
                  <option value="">Sin asociar</option>
                  {campos.map((campo) => (
                    <option key={campo.id} value={campo.id}>
                      {campo.nombre}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Lote">
                <select
                  value={budgetForm.loteId}
                  onChange={(event) =>
                    setBudgetForm((current) => ({ ...current, loteId: event.target.value }))
                  }
                  className={fieldClassName}
                >
                  <option value="">{budgetForm.campoId ? 'Seleccionar lote' : 'Primero elige un campo'}</option>
                  {selectedCampoLotes.map((lote) => (
                    <option key={lote.id} value={lote.id}>
                      {lote.nombre}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Cultivo">
                <BaseInput
                  value={budgetForm.cultivo}
                  onChange={(event) =>
                    setBudgetForm((current) => ({ ...current, cultivo: event.target.value }))
                  }
                  placeholder="Soja, maiz, trigo..."
                />
              </Field>

              <Field label="Hectareas">
                <BaseInput
                  type="number"
                  min="0"
                  step="0.01"
                  value={budgetForm.hectareas}
                  onChange={(event) =>
                    setBudgetForm((current) => ({ ...current, hectareas: event.target.value }))
                  }
                  placeholder="0.00"
                />
              </Field>

              <Field label="Ano">
                <BaseInput
                  type="number"
                  min="2020"
                  max="2100"
                  value={budgetForm.anio}
                  onChange={(event) =>
                    setBudgetForm((current) => ({ ...current, anio: event.target.value }))
                  }
                  required
                />
              </Field>
            </div>

            <DialogFooter>
              <BaseButton type="button" variant="outline" onClick={() => setNewBudgetOpen(false)}>
                Cancelar
              </BaseButton>
              <BaseButton type="submit" disabled={saving}>
                {saving ? 'Guardando...' : 'Crear presupuesto'}
              </BaseButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={newLineOpen} onOpenChange={setNewLineOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Agregar linea</DialogTitle>
            <DialogDescription>
              Incorpora una nueva categoria al presupuesto seleccionado.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddLine} className="space-y-5 pt-2">
            <Field label="Categoria">
              <select
                value={lineForm.categoria}
                onChange={(event) => {
                  const option = CATEGORY_OPTIONS.find((item) => item.value === event.target.value);
                  setLineForm((current) => ({
                    ...current,
                    categoria: event.target.value as CategoriaPresupuesto,
                    tipo: option?.type || current.tipo,
                  }));
                }}
                className={fieldClassName}
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Tipo">
                <select
                  value={lineForm.tipo}
                  onChange={(event) =>
                    setLineForm((current) => ({
                      ...current,
                      tipo: event.target.value as TipoPresupuesto,
                    }))
                  }
                  className={fieldClassName}
                >
                  <option value="gasto">Gasto</option>
                  <option value="ingreso">Ingreso</option>
                </select>
              </Field>

              <Field label="Monto presupuestado">
                <BaseInput
                  type="number"
                  min="0"
                  step="0.01"
                  value={lineForm.montoPresupuestado}
                  onChange={(event) =>
                    setLineForm((current) => ({
                      ...current,
                      montoPresupuestado: event.target.value,
                    }))
                  }
                  required
                />
              </Field>
            </div>

            <Field label="Descripcion">
              <BaseInput
                value={lineForm.descripcion}
                onChange={(event) =>
                  setLineForm((current) => ({ ...current, descripcion: event.target.value }))
                }
                placeholder="Detalle operativo o comercial"
                required
              />
            </Field>

            <DialogFooter>
              <BaseButton type="button" variant="outline" onClick={() => setNewLineOpen(false)}>
                Cancelar
              </BaseButton>
              <BaseButton type="submit" disabled={saving}>
                {saving ? 'Guardando...' : 'Agregar linea'}
              </BaseButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editRealOpen} onOpenChange={setEditRealOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Actualizar monto real</DialogTitle>
            <DialogDescription>
              Ajusta la ejecucion real de la linea seleccionada para recalcular margenes y variaciones.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateReal} className="space-y-5 pt-2">
            {editingLinea ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <div className="font-medium text-slate-900">{getCategoryLabel(editingLinea.categoria)}</div>
                <div>{editingLinea.descripcion || 'Sin descripcion'}</div>
                <div className="mt-1">Presupuestado: {formatCurrency(editingLinea.montoPresupuestado)}</div>
              </div>
            ) : null}

            <Field label="Monto real">
              <BaseInput
                type="number"
                min="0"
                step="0.01"
                value={realForm.montoReal}
                onChange={(event) =>
                  setRealForm({
                    montoReal: event.target.value,
                  })
                }
                required
              />
            </Field>

            <DialogFooter>
              <BaseButton type="button" variant="outline" onClick={() => setEditRealOpen(false)}>
                Cancelar
              </BaseButton>
              <BaseButton type="submit" disabled={saving}>
                {saving ? 'Guardando...' : 'Actualizar real'}
              </BaseButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function KpiCard({
  title,
  value,
  helper,
  tone,
}: {
  title: string;
  value: string;
  helper?: string;
  tone: 'slate' | 'amber' | 'sky' | 'emerald' | 'rose';
}) {
  const toneClasses: Record<typeof tone, string> = {
    slate: 'bg-slate-100 text-slate-900',
    amber: 'bg-amber-100 text-amber-900',
    sky: 'bg-sky-100 text-sky-900',
    emerald: 'bg-emerald-100 text-emerald-900',
    rose: 'bg-rose-100 text-rose-900',
  };

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${toneClasses[tone]}`}>
        KPI
      </div>
      <p className="mt-4 text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
      {helper ? <p className="mt-2 text-xs leading-5 text-slate-500">{helper}</p> : null}
    </div>
  );
}

function BarRow({
  label,
  color,
  width,
}: {
  label: string;
  color: string;
  width: number;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[110px_minmax(0,1fr)] sm:items-center">
      <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="h-4 overflow-hidden rounded-full bg-white shadow-inner">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.max(width, 3)}%` }}
        />
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

const fieldClassName =
  'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
