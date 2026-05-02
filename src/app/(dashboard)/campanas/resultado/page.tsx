'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, DollarSign, LandPlot, TrendingUp } from 'lucide-react';
import { BaseBadge, BaseCard, Section } from '@/components/design-system';
import { PageShell } from '@/components/layout/PageShell';
import { PluginGate } from '@/components/plugins/PluginGate';
import { useAuth } from '@/contexts/AuthContext';
import { usePlugins } from '@/contexts/PluginsContext';
import {
  obtenerResultadoCampana,
  obtenerResumenCampanas,
  type ResultadoCampana,
} from '@/services/resultado-campana';

type ResumenCampania = Awaited<ReturnType<typeof obtenerResumenCampanas>>[number];

export default function ResultadoCampanaPage() {
  const { organizationId } = useAuth();
  const { isActive, loading: pluginsLoading } = usePlugins();

  const [resumenes, setResumenes] = useState<ResumenCampania[]>([]);
  const [campaniaId, setCampaniaId] = useState('');
  const [resultado, setResultado] = useState<ResultadoCampana | null>(null);
  const [loadingResumenes, setLoadingResumenes] = useState(true);
  const [loadingResultado, setLoadingResultado] = useState(true);

  useEffect(() => {
    if (!organizationId || !isActive('agro_gestion')) {
      setResumenes([]);
      setCampaniaId('');
      setResultado(null);
      setLoadingResumenes(false);
      setLoadingResultado(false);
      return;
    }

    const loadResumenes = async () => {
      setLoadingResumenes(true);

      try {
        const data = await obtenerResumenCampanas(organizationId);
        setResumenes(data);
        setCampaniaId((prev) => (prev && data.some((item) => item.campaniaId === prev) ? prev : data[0]?.campaniaId || ''));
      } finally {
        setLoadingResumenes(false);
      }
    };

    void loadResumenes();
  }, [organizationId, isActive]);

  useEffect(() => {
    if (!organizationId || !campaniaId || !isActive('agro_gestion')) {
      setResultado(null);
      setLoadingResultado(false);
      return;
    }

    const loadResultado = async () => {
      setLoadingResultado(true);

      try {
        const data = await obtenerResultadoCampana(organizationId, campaniaId);
        setResultado(data);
      } finally {
        setLoadingResultado(false);
      }
    };

    void loadResultado();
  }, [organizationId, campaniaId, isActive]);

  const comparativa = useMemo(() => {
    if (!resultado) return [];

    const indexActual = resumenes.findIndex((item) => item.campaniaId === resultado.campaniaId);
    const anterior = indexActual >= 0 ? resumenes[indexActual + 1] : undefined;

    if (!anterior) return [];

    return [
      {
        concepto: 'Margen bruto',
        anterior: anterior.margenBruto,
        actual: resultado.margenBruto,
      },
      {
        concepto: 'Hectareas',
        anterior: anterior.hectareas || 0,
        actual: resultado.hectareas || 0,
        isArea: true,
      },
      {
        concepto: 'Margen por ha',
        anterior: anterior.hectareas ? anterior.margenBruto / anterior.hectareas : 0,
        actual: resultado.margenPorHectarea || 0,
      },
    ];
  }, [resultado, resumenes]);

  if (pluginsLoading || loadingResumenes) {
    return <div className="flex min-h-screen items-center justify-center text-slate-500">Cargando resultado de campana...</div>;
  }

  if (!isActive('agro_gestion')) {
    return <PluginGate pluginId="agro_gestion" isActive={false}>{null}</PluginGate>;
  }

  if (!organizationId) {
    return <div className="p-6 text-slate-600">Selecciona una organizacion para continuar.</div>;
  }

  return (
    <PageShell
      title="Resultado por campana"
      subtitle="Seguimiento economico consolidado por campana con desglose por concepto y por lote."
      rightSlot={(
        <label className="flex min-w-[240px] flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Campana</span>
          <select
            value={campaniaId}
            onChange={(event) => setCampaniaId(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-emerald-500"
          >
            {resumenes.map((item) => (
              <option key={item.campaniaId} value={item.campaniaId}>
                {item.campaniaNombre}
              </option>
            ))}
          </select>
        </label>
      )}
    >
      {!campaniaId || loadingResultado || !resultado ? (
        <BaseCard>
          <div className="py-10 text-center text-sm text-slate-500">
            {resumenes.length === 0 ? 'Todavia no hay campanas con asientos automaticos.' : 'Cargando resultado de la campana seleccionada...'}
          </div>
        </BaseCard>
      ) : (
        <>
          <Section>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              <KpiCard label="Total ingresos" value={formatCurrency(resultado.totalIngresos)} icon={ArrowUpRight} tone="emerald" />
              <KpiCard label="Total gastos" value={formatCurrency(resultado.totalGastos)} icon={ArrowDownRight} tone="red" />
              <KpiCard label="Margen bruto" value={formatCurrency(resultado.margenBruto)} icon={TrendingUp} tone={resultado.margenBruto >= 0 ? 'sky' : 'red'} />
              <KpiCard label="Costo / ha" value={resultado.costoPorHectarea !== undefined ? formatCurrency(resultado.costoPorHectarea) : 'N/D'} icon={LandPlot} tone="slate" />
              <KpiCard label="Margen / ha" value={resultado.margenPorHectarea !== undefined ? formatCurrency(resultado.margenPorHectarea) : 'N/D'} icon={DollarSign} tone={resultado.margenBruto >= 0 ? 'emerald' : 'red'} />
            </div>
          </Section>

          <Section title="Desglose por concepto" description={resultado.campaniaNombre}>
            <BaseCard className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Categoria</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Tipo</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600">Monto</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600">% del total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.desglose.map((item) => (
                      <tr key={`${item.tipo}-${item.categoria}`} className="border-t border-slate-100">
                        <td className="px-4 py-3 text-slate-900">{item.categoria}</td>
                        <td className="px-4 py-3">
                          <BaseBadge variant={item.tipo === 'ingreso' ? 'success' : 'destructive'} className="capitalize">
                            {item.tipo}
                          </BaseBadge>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(item.monto)}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{formatPercent(porcentajeSobreTotal(item.monto, resultado))}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50">
                    <tr className="border-t border-slate-200">
                      <td className="px-4 py-3 font-semibold text-slate-700">Total gastos</td>
                      <td />
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(resultado.totalGastos)}</td>
                      <td />
                    </tr>
                    <tr className="border-t border-slate-200">
                      <td className="px-4 py-3 font-semibold text-slate-700">Total ingresos</td>
                      <td />
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(resultado.totalIngresos)}</td>
                      <td />
                    </tr>
                    <tr className="border-t border-slate-200">
                      <td className="px-4 py-3 font-semibold text-slate-700">Margen bruto</td>
                      <td />
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(resultado.margenBruto)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </BaseCard>
          </Section>

          <Section title="Desglose por lote" description="Resultado consolidado de los lotes vinculados a la campana.">
            <BaseCard className="overflow-hidden">
              {resultado.porLote.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">No hay lotes asociados a esta campana.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-slate-600">Lote</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-600">Has</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-600">Ingresos</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-600">Gastos</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-600">Margen</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-600">$ / ha</th>
                        <th className="px-4 py-3 text-center font-medium text-slate-600">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultado.porLote.map((lote) => (
                        <tr key={lote.loteId} className="border-t border-slate-100">
                          <td className="px-4 py-3 font-medium text-slate-900">{lote.loteNombre}</td>
                          <td className="px-4 py-3 text-right text-slate-700">{formatNumber(lote.hectareas)}</td>
                          <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(lote.totalIngresos)}</td>
                          <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(lote.totalGastos)}</td>
                          <td className={`px-4 py-3 text-right font-semibold ${lote.margenBruto >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {formatCurrency(lote.margenBruto)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-700">{lote.margenPorHa !== undefined ? formatCurrency(lote.margenPorHa) : 'N/D'}</td>
                          <td className="px-4 py-3 text-center">
                            <BaseBadge variant={lote.margenBruto >= 0 ? 'success' : 'destructive'}>
                              {lote.margenBruto >= 0 ? 'Positivo' : 'Negativo'}
                            </BaseBadge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </BaseCard>
          </Section>

          {comparativa.length > 0 && (
            <Section title="Comparativa interanual" description="Referencia contra la campana anterior disponible.">
              <BaseCard className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-slate-600">Concepto</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-600">Anterior</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-600">Actual</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-600">Variacion %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparativa.map((fila) => {
                        const variacion = calcularVariacion(fila.actual, fila.anterior);

                        return (
                          <tr key={fila.concepto} className="border-t border-slate-100">
                            <td className="px-4 py-3 font-medium text-slate-900">{fila.concepto}</td>
                            <td className="px-4 py-3 text-right text-slate-700">{fila.isArea ? formatHectareas(fila.anterior) : formatCurrency(fila.anterior)}</td>
                            <td className="px-4 py-3 text-right text-slate-700">{fila.isArea ? formatHectareas(fila.actual) : formatCurrency(fila.actual)}</td>
                            <td className={`px-4 py-3 text-right font-semibold ${variacion >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {formatPercent(variacion)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </BaseCard>
            </Section>
          )}
        </>
      )}
    </PageShell>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof TrendingUp;
  tone: 'emerald' | 'red' | 'sky' | 'slate';
}) {
  const tones = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-950',
    red: 'border-rose-200 bg-rose-50 text-rose-950',
    sky: 'border-sky-200 bg-sky-50 text-sky-950',
    slate: 'border-slate-200 bg-white text-slate-900',
  };

  return (
    <BaseCard className={tones[tone]}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-current/65">{label}</p>
          <p className="mt-3 text-2xl font-semibold">{value}</p>
        </div>
        <div className="rounded-2xl bg-white/70 p-3">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </BaseCard>
  );
}

function porcentajeSobreTotal(monto: number, resultado: ResultadoCampana): number {
  const base = resultado.totalIngresos + resultado.totalGastos;
  return base > 0 ? (monto / base) * 100 : 0;
}

function calcularVariacion(actual: number, anterior: number): number {
  if (anterior === 0) {
    return actual === 0 ? 0 : 100;
  }

  return ((actual - anterior) / Math.abs(anterior)) * 100;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function formatPercent(value: number): string {
  return `${(value || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}%`;
}

function formatNumber(value?: number): string {
  if (value === undefined) return 'N/D';
  return value.toLocaleString('es-AR', { maximumFractionDigits: 2 });
}

function formatHectareas(value: number): string {
  return `${value.toLocaleString('es-AR', { maximumFractionDigits: 2 })} ha`;
}
