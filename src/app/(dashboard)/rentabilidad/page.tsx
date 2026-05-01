'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getCampaniaActual } from '@/services/crops';
import { obtenerComparativaInteranual, obtenerResumenRentabilidad, type RentabilidadResumen } from '@/services/profitability';
import { PageShell } from '@/components/layout/PageShell';

function campaignAnterior(campaign: string): string {
  const [start, end] = campaign.split('/').map((x) => Number(x));
  if (!start || !end) return campaign;
  return `${start - 1}/${end - 1}`;
}

export default function RentabilidadPage() {
  const { organizationId } = useAuth();
  const [campaignId, setCampaignId] = useState(getCampaniaActual());
  const [resumen, setResumen] = useState<RentabilidadResumen | null>(null);
  const [comparativa, setComparativa] = useState<{ deltaMarginPercent: number; deltaRoiPercent: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!organizationId) return;

      setLoading(true);
      try {
        const [actual, comp] = await Promise.all([
          obtenerResumenRentabilidad(organizationId, campaignId),
          obtenerComparativaInteranual(organizationId, campaignId, campaignAnterior(campaignId)),
        ]);

        setResumen(actual);
        setComparativa({
          deltaMarginPercent: comp.deltaMarginPercent,
          deltaRoiPercent: comp.deltaRoiPercent,
        });
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [organizationId, campaignId]);

  return (
    <PageShell
      title="Rentabilidad Productiva"
      subtitle="Margen bruto por campana, costos, ingresos y comparativa interanual."
      rightSlot={(
        <input
          value={campaignId}
          onChange={(e) => setCampaignId(e.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm"
        />
      )}
    >
      {loading || !resumen ? (
        <div className="app-panel p-5 text-sm text-slate-500">Cargando rentabilidad...</div>
      ) : (
        <div className="space-y-4">
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Kpi title="Ingresos" value={formatMoney(resumen.kpis.totalRevenueARS)} />
            <Kpi title="Costos" value={formatMoney(resumen.kpis.totalCostsARS)} />
            <Kpi title="Margen Bruto" value={formatMoney(resumen.kpis.grossMarginARS)} highlight />
            <Kpi title="ROI" value={`${resumen.kpis.roiPercent}%`} />
            <Kpi title="Costo/ha" value={formatMoney(resumen.kpis.costPerHaARS)} />
            <Kpi title="Margen/ha" value={formatMoney(resumen.kpis.marginPerHaARS)} />
            <Kpi title="Area" value={`${resumen.kpis.totalAreaHa} ha`} />
            <Kpi title="Campana" value={resumen.campaignId} />
          </section>

          {comparativa && (
            <section className="rounded-[28px] border border-slate-200 bg-white p-5 text-sm text-slate-700 flex flex-col md:flex-row gap-2 md:gap-6 shadow-sm">
              <span>Delta margen vs campana anterior: <b>{comparativa.deltaMarginPercent}%</b></span>
              <span>Delta ROI vs campana anterior: <b>{comparativa.deltaRoiPercent}%</b></span>
            </section>
          )}

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-medium mb-3">Por cultivo</h2>
            <div className="space-y-2">
              {resumen.byCrop.map((row) => (
                <div key={row.cultivo} className="rounded-2xl border border-slate-200 bg-[#fbfcff] p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <b className="capitalize">{row.cultivo}</b>
                    <span>ROI: {row.roiPercent}%</span>
                  </div>
                  <div className="text-slate-600 mt-1">
                    Ingreso {formatMoney(row.revenueARS)} · Costo {formatMoney(row.costsARS)} · Margen {formatMoney(row.marginARS)} · {row.areaHa} ha
                  </div>
                </div>
              ))}
              {resumen.byCrop.length === 0 && <p className="text-sm text-slate-500">Sin datos para la campana seleccionada.</p>}
            </div>
          </section>
        </div>
      )}
    </PageShell>
  );
}

function Kpi({ title, value, highlight = false }: { title: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-[28px] border p-4 shadow-sm ${highlight ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{title}</p>
      <p className="mt-3 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function formatMoney(value: number): string {
  return `$ ${Number(value || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
}
