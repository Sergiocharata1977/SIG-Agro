'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, PlusCircle } from 'lucide-react';
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

const DEFAULT_CAMPAIGN = '2025-2026';

export default function RiegoPage() {
  const { user, organizationId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [campaignId, setCampaignId] = useState(DEFAULT_CAMPAIGN);
  const [fields, setFields] = useState<Field[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [plans, setPlans] = useState<IrrigationPlan[]>([]);

  const [fieldId, setFieldId] = useState('');
  const [plotId, setPlotId] = useState('');
  const [targetMm, setTargetMm] = useState(20);
  const [method, setMethod] = useState<IrrigationPlan['method']>('pivot');

  const availablePlots = useMemo(
    () => plots.filter((plot) => !fieldId || plot.fieldId === fieldId),
    [plots, fieldId]
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

  const handleCreatePlan = async () => {
    if (!organizationId || !user || !fieldId || !plotId || targetMm <= 0) return;

    await crearPlanRiego(organizationId, {
      organizationId,
      campaignId,
      fieldId,
      plotId,
      planDate: new Date(),
      targetMm,
      executionStatus: 'planned',
      method,
      createdBy: user.id,
    });

    await loadAll();
  };

  const markCompleted = async (plan: IrrigationPlan) => {
    if (!organizationId) return;
    await actualizarPlanRiego(organizationId, plan.id, {
      executionStatus: 'completed',
      appliedMm: plan.targetMm,
      deviationMm: 0,
    });
    await loadAll();
  };

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

      <section className="rounded-xl border border-slate-200 bg-white p-4 grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
        <div>
          <label className="text-xs text-slate-600">Campana</label>
          <input value={campaignId} onChange={(e) => setCampaignId(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-slate-600">Campo</label>
          <select value={fieldId} onChange={(e) => { setFieldId(e.target.value); setPlotId(''); }} className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="">Seleccionar</option>
            {fields.map((field) => <option key={field.id} value={field.id}>{field.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-600">Lote</label>
          <select value={plotId} onChange={(e) => setPlotId(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="">Seleccionar</option>
            {availablePlots.map((plot) => <option key={plot.id} value={plot.id}>{plot.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-600">Objetivo (mm)</label>
          <input type="number" min={1} value={targetMm} onChange={(e) => setTargetMm(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-slate-600">Metodo</label>
          <select value={method} onChange={(e) => setMethod(e.target.value as IrrigationPlan['method'])} className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="pivot">Pivot</option>
            <option value="goteo">Goteo</option>
            <option value="aspersor">Aspersor</option>
            <option value="surco">Surco</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        <button onClick={() => void handleCreatePlan()} className="rounded-lg bg-emerald-600 text-white px-3 py-2 text-sm inline-flex items-center justify-center gap-2">
          <PlusCircle className="w-4 h-4" /> Crear plan
        </button>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-medium mb-3">Planes de riego</h2>
        {loading ? <p className="text-sm text-slate-500">Cargando...</p> : (
          <div className="space-y-2 max-h-[480px] overflow-auto">
            {plans.map((plan) => (
              <div key={plan.id} className="border border-slate-200 rounded-lg p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <p className="text-sm text-slate-800">
                    {plan.targetMm} mm · {plan.method || 'sin metodo'} · {plan.executionStatus}
                  </p>
                  <p className="text-xs text-slate-500">{new Date(plan.planDate).toLocaleString()}</p>
                </div>
                {plan.executionStatus === 'planned' && (
                  <button onClick={() => void markCompleted(plan)} className="rounded-lg border border-emerald-300 text-emerald-700 px-3 py-1.5 text-xs">
                    Marcar completado
                  </button>
                )}
              </div>
            ))}
            {plans.length === 0 && <p className="text-sm text-slate-500">Sin planes de riego.</p>}
          </div>
        )}
      </section>
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
