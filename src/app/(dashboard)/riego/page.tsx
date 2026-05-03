'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Pencil, PlusCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PageShell } from '@/components/layout/PageShell';
import type { Field, Plot } from '@/types/sig-agro';
import type { IrrigationPlan } from '@/types/domain-model';
import { obtenerFields } from '@/services/fields';
import { obtenerPlots } from '@/services/plots';
import {
  actualizarPlanRiego,
  calcularResumenRiego,
  crearPlanRiego,
  generarAlertasRiego,
  obtenerPlanesRiego,
} from '@/services/irrigation-plans';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const DEFAULT_CAMPAIGN = '2025-2026';
const EMPTY_FORM = {
  fieldId: '',
  plotId: '',
  targetMm: 20,
  method: 'pivot' as IrrigationPlan['method'],
  planDate: new Date().toISOString().split('T')[0],
};

export default function RiegoPage() {
  const { user, organizationId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [campaignId, setCampaignId] = useState(DEFAULT_CAMPAIGN);
  const [fields, setFields] = useState<Field[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [plans, setPlans] = useState<IrrigationPlan[]>([]);

  const [fieldId, setFieldId] = useState('');
  const [plotId, setPlotId] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<IrrigationPlan | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const availablePlots = useMemo(
    () => plots.filter((plot) => !fieldId || plot.fieldId === fieldId),
    [plots, fieldId]
  );
  const dialogPlots = useMemo(
    () => plots.filter((plot) => !formData.fieldId || plot.fieldId === formData.fieldId),
    [plots, formData.fieldId]
  );

  const summary = useMemo(() => calcularResumenRiego(plans), [plans]);
  const alerts = useMemo(() => generarAlertasRiego(plans), [plans]);

  async function loadAll() {
    if (!organizationId) return;

    setLoading(true);
    try {
      const [f, p, rp] = await Promise.all([
        obtenerFields(organizationId, { activo: true }),
        obtenerPlots(organizationId, { activo: true }),
        obtenerPlanesRiego(organizationId, { campaignId }),
      ]);

      setFields(f);
      setPlots(p);
      setPlans(rp);
      if (!fieldId && f[0]) setFieldId(f[0].id);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, campaignId]);

  function abrirDialog(plan?: IrrigationPlan) {
    if (plan) {
      setEditando(plan);
      setFormData({
        fieldId: plan.fieldId,
        plotId: plan.plotId,
        targetMm: plan.targetMm,
        method: plan.method || 'pivot',
        planDate: new Date(plan.planDate).toISOString().split('T')[0],
      });
    } else {
      setEditando(null);
      setFormData({
        ...EMPTY_FORM,
        fieldId,
        plotId: plotId || '',
      });
    }
    setError(null);
    setDialogOpen(true);
  }

  async function handleSavePlan() {
    if (!organizationId || !user || !formData.fieldId || !formData.plotId || formData.targetMm <= 0) {
      setError('Completa campo, lote y objetivo');
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      const payload = {
        organizationId,
        campaignId,
        fieldId: formData.fieldId,
        plotId: formData.plotId,
        planDate: new Date(formData.planDate),
        targetMm: formData.targetMm,
        executionStatus: editando?.executionStatus || 'planned',
        method: formData.method,
        createdBy: editando?.createdBy || user.id,
      };

      if (editando) {
        await actualizarPlanRiego(organizationId, editando.id, payload);
      } else {
        await crearPlanRiego(organizationId, payload);
      }

      setDialogOpen(false);
      setEditando(null);
      setFormData(EMPTY_FORM);
      await loadAll();
    } finally {
      setGuardando(false);
    }
  }

  const markCompleted = async (plan: IrrigationPlan) => {
    if (!organizationId) return;
    await actualizarPlanRiego(organizationId, plan.id, {
      executionStatus: 'completed',
      appliedMm: plan.targetMm,
      deviationMm: 0,
    });
    await loadAll();
  };

  const filteredPlans = useMemo(
    () => plans.filter((plan) => (!fieldId || plan.fieldId === fieldId) && (!plotId || plan.plotId === plotId)),
    [plans, fieldId, plotId]
  );

  if (!organizationId) return <div className="p-6">Selecciona una organizacion para continuar.</div>;

  return (
    <PageShell
      title="Planificacion de Riego"
      subtitle="Plan vs ejecucion con KPIs de eficiencia y alertas de ventana."
    >
      <section className="rounded-xl border border-slate-200 bg-white p-4 grid grid-cols-2 md:grid-cols-6 gap-3">
        <Kpi title="Planes" value={summary.totalPlans} />
        <Kpi title="Objetivo mm" value={summary.totalTargetMm} />
        <Kpi title="Aplicado mm" value={summary.totalAppliedMm} />
        <Kpi title="Desvio mm" value={summary.averageDeviationMm} />
        <Kpi title="Eficiencia" value={`${summary.efficiencyPercent}%`} />
        <Kpi title="Fuera ventana" value={summary.overduePlans} warn={summary.overduePlans > 0} />
      </section>

      {alerts.length > 0 && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-1">
          {alerts.map((alert) => (
            <p key={alert} className="text-sm text-amber-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {alert}
            </p>
          ))}
        </section>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-4 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <div>
          <label className="text-xs text-slate-600">Campana</label>
          <input value={campaignId} onChange={(e) => setCampaignId(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-slate-600">Campo</label>
          <select value={fieldId} onChange={(e) => { setFieldId(e.target.value); setPlotId(''); }} className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="">Todos</option>
            {fields.map((field) => <option key={field.id} value={field.id}>{field.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-600">Lote</label>
          <select value={plotId} onChange={(e) => setPlotId(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="">Todos</option>
            {availablePlots.map((plot) => <option key={plot.id} value={plot.id}>{plot.nombre}</option>)}
          </select>
        </div>
        <div className="md:col-span-2 flex justify-end">
          <button onClick={() => abrirDialog()} className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm inline-flex items-center gap-2">
            <PlusCircle className="w-4 h-4" /> Nuevo plan de riego
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-medium mb-3">Planes de riego</h2>
        {loading ? <p className="text-sm text-slate-500">Cargando...</p> : (
          <div className="space-y-2 max-h-[480px] overflow-auto">
            {filteredPlans.map((plan) => (
              <div key={plan.id} className="border border-slate-200 rounded-lg p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <p className="text-sm text-slate-800">
                    {plan.targetMm} mm · {plan.method || 'sin metodo'} · {plan.executionStatus}
                  </p>
                  <p className="text-xs text-slate-500">{new Date(plan.planDate).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => abrirDialog(plan)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs inline-flex items-center gap-1">
                    <Pencil className="w-3.5 h-3.5" /> Editar
                  </button>
                  {plan.executionStatus === 'planned' && (
                    <button onClick={() => void markCompleted(plan)} className="rounded-lg border border-emerald-300 text-emerald-700 px-3 py-1.5 text-xs">
                      Marcar completado
                    </button>
                  )}
                </div>
              </div>
            ))}
            {filteredPlans.length === 0 && <p className="text-sm text-slate-500">Sin planes de riego.</p>}
          </div>
        )}
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar plan de riego' : 'Nuevo plan de riego'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
            <Field label="Campo">
              <select value={formData.fieldId} onChange={(e) => setFormData((prev) => ({ ...prev, fieldId: e.target.value, plotId: '' }))} className={fieldClassName}>
                <option value="">Seleccionar</option>
                {fields.map((field) => <option key={field.id} value={field.id}>{field.nombre}</option>)}
              </select>
            </Field>
            <Field label="Lote">
              <select value={formData.plotId} onChange={(e) => setFormData((prev) => ({ ...prev, plotId: e.target.value }))} className={fieldClassName}>
                <option value="">Seleccionar</option>
                {dialogPlots.map((plot) => <option key={plot.id} value={plot.id}>{plot.nombre}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Objetivo (mm)">
                <input type="number" min={1} value={formData.targetMm} onChange={(e) => setFormData((prev) => ({ ...prev, targetMm: Number(e.target.value) }))} className={fieldClassName} />
              </Field>
              <Field label="Fecha">
                <input type="date" value={formData.planDate} onChange={(e) => setFormData((prev) => ({ ...prev, planDate: e.target.value }))} className={fieldClassName} />
              </Field>
            </div>
            <Field label="Metodo">
              <select value={formData.method} onChange={(e) => setFormData((prev) => ({ ...prev, method: e.target.value as IrrigationPlan['method'] }))} className={fieldClassName}>
                <option value="pivot">Pivot</option>
                <option value="goteo">Goteo</option>
                <option value="aspersor">Aspersor</option>
                <option value="surco">Surco</option>
                <option value="otro">Otro</option>
              </select>
            </Field>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setDialogOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Cancelar</button>
              <button type="button" onClick={() => void handleSavePlan()} disabled={guardando} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-60">
                {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear plan'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function Kpi({ title, value, warn = false }: { title: string; value: string | number; warn?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${warn ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
      <p className="text-xs text-slate-600">{title}</p>
      <p className="text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

const fieldClassName = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-slate-700">{label}</Label>
      {children}
    </div>
  );
}
