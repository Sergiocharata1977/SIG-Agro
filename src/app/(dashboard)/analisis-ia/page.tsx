'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, BarChart3, Bot, RefreshCcw, Sparkles, Target } from 'lucide-react';
import { PluginGuard } from '@/components/PluginGuard';
import { PageShell } from '@/components/layout/PageShell';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardIAService } from '@/services/dashboard-ia';
import type { AlertaIA, DashboardIAData, RecomendacionIA } from '@/types/dashboard-ia';

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof BarChart3;
}) {
  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-medium text-slate-500">{title}</div>
          <div className="mt-5 text-4xl font-semibold text-slate-950">{value}</div>
          <div className="mt-2 text-sm text-slate-600">{description}</div>
        </div>
        <div className="rounded-2xl bg-lime-100 p-3 text-[#0f2e21]">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </article>
  );
}

function AlertRow({ alerta }: { alerta: AlertaIA }) {
  return (
    <div className="rounded-[24px] border border-red-200 bg-red-50/60 p-5">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-red-100 p-3 text-red-600">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <div className="text-lg font-semibold text-slate-950">{alerta.loteName}</div>
          <div className="mt-2 text-sm leading-6 text-slate-600">{alerta.data.descripcion}</div>
        </div>
      </div>
    </div>
  );
}

function RecommendationRow({ recomendacion }: { recomendacion: RecomendacionIA }) {
  return (
    <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/60 p-5">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-lime-200 p-3 text-[#0f2e21]">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <div className="text-lg font-semibold text-slate-950">{recomendacion.data.titulo}</div>
          <div className="mt-2 text-sm leading-6 text-slate-600">{recomendacion.data.descripcion}</div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardIAPage() {
  const [data, setData] = useState<DashboardIAData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'resumen' | 'alertas' | 'recomendaciones' | 'predicciones'>('resumen');
  const { organization } = useAuth();

  useEffect(() => {
    void loadData();
  }, [organization]);

  async function loadData() {
    try {
      setLoading(true);
      const result = await dashboardIAService.getDashboardData(organization?.id || '');
      setData(result);
    } catch (error) {
      console.error('Error loading dashboard IA data:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PluginGuard pluginSlug="analisis_ia">
      <div data-testid="analisis-ia-page">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="rounded-full border border-lime-300/30 bg-lime-50 px-5 py-3 text-sm font-medium text-[#0f2e21]">
              Cargando analisis IA...
            </div>
          </div>
        ) : !data ? (
          <div className="py-16 text-center text-slate-500">
            No hay datos de IA disponibles todavia.
          </div>
        ) : (
          <PageShell
            title="Dashboard de analisis IA"
            subtitle="Alertas, recomendaciones y proyecciones sobre tus cultivos."
            rightSlot={
              <button
                type="button"
                onClick={() => void loadData()}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#0f2e21] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#174531]"
              >
                <RefreshCcw className="h-4 w-4" />
                Actualizar
              </button>
            }
          >
            <div className="space-y-6">
              <section className="grid gap-4 xl:grid-cols-4">
                <SummaryCard
                  title="Analisis totales"
                  value={String(data.resumen.totalAnalisis)}
                  description="Eventos procesados por IA"
                  icon={BarChart3}
                />
                <SummaryCard
                  title="Alertas activas"
                  value={String(data.resumen.alertasActivas)}
                  description="Requieren validacion tecnica"
                  icon={AlertTriangle}
                />
                <SummaryCard
                  title="Predicciones"
                  value={String(data.resumen.prediccionesRecientes)}
                  description="Estimaciones recientes"
                  icon={Target}
                />
                <SummaryCard
                  title="Confianza promedio"
                  value={`${(data.resumen.confianzaPromedio * 100).toFixed(0)}%`}
                  description="Nivel medio de certeza"
                  icon={Bot}
                />
              </section>

              <section className="rounded-[30px] border border-slate-200 bg-white p-2 shadow-sm">
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'resumen', label: 'Resumen' },
                    { key: 'alertas', label: `Alertas (${data.alertas.length})` },
                    { key: 'recomendaciones', label: `Recomendaciones (${data.recomendaciones.length})` },
                    { key: 'predicciones', label: `Predicciones (${data.predicciones.length})` },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key as typeof activeTab)}
                      className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                        activeTab === tab.key ? 'bg-[#0f2e21] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </section>

              {activeTab === 'resumen' ? (
                <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                  <article className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-2xl font-semibold text-slate-950">Tendencia NDVI</h2>
                    <p className="mt-1 text-sm text-slate-500">Lectura sintetica de los ultimos 30 dias.</p>
                    <div className="mt-8 flex h-64 items-end gap-2">
                      {data.tendenciasNDVI.map((point, index) => (
                        <div
                          key={`${point.fecha}-${index}`}
                          className="flex-1 rounded-t-2xl bg-gradient-to-t from-emerald-700 to-lime-300"
                          style={{ height: `${Math.max(point.promedio * 100, 10)}%` }}
                          title={`${point.fecha}: ${point.promedio.toFixed(2)}`}
                        />
                      ))}
                    </div>
                  </article>

                  <article className="rounded-[30px] border border-slate-200 bg-[#123524] p-6 text-white shadow-sm">
                    <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/20 bg-lime-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-lime-200">
                      <Bot className="h-4 w-4" />
                      Don Juan GIS IA
                    </div>
                    <h2 className="mt-6 text-2xl font-semibold">Lectura ejecutiva del sistema</h2>
                    <p className="mt-4 text-sm leading-7 text-white/75">
                      Hay foco en lotes con alertas activas y oportunidades claras para priorizar monitoreo, revisar humedad y ajustar la ventana operativa.
                    </p>
                    <div className="mt-8 space-y-4">
                      {data.analisisRecientes.slice(0, 3).map((item) => (
                        <div key={item.id} className="rounded-2xl border border-white/10 bg-white/6 p-4">
                          <div className="font-semibold text-white">{item.loteName}</div>
                          <div className="mt-1 text-sm text-white/68">
                            {new Date(item.timestamp).toLocaleString('es-AR')}
                          </div>
                          <div className="mt-3 text-sm text-lime-200">
                            Confianza {(item.confidence * 100).toFixed(0)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                </section>
              ) : null}

              {activeTab === 'alertas' ? (
                <section className="space-y-4">
                  {data.alertas.map((alerta) => (
                    <AlertRow key={alerta.id} alerta={alerta} />
                  ))}
                </section>
              ) : null}

              {activeTab === 'recomendaciones' ? (
                <section className="space-y-4">
                  {data.recomendaciones.map((recomendacion) => (
                    <RecommendationRow key={recomendacion.id} recomendacion={recomendacion} />
                  ))}
                </section>
              ) : null}

              {activeTab === 'predicciones' ? (
                <section className="grid gap-4 lg:grid-cols-2">
                  {data.predicciones.map((pred) => (
                    <article key={pred.id} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-slate-950">{pred.loteName}</h3>
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                          {pred.data.cultivo}
                        </span>
                      </div>
                      <div className="mt-6 text-5xl font-semibold text-emerald-700">
                        {pred.data.rendimientoEstimado.toLocaleString()}
                      </div>
                      <div className="mt-2 text-sm text-slate-500">kg/ha estimado</div>
                      <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                        Rango: {pred.data.rendimientoMinimo.toLocaleString()} - {pred.data.rendimientoMaximo.toLocaleString()} kg/ha
                        <br />
                        Cosecha estimada: {pred.data.fechaEstimada}
                      </div>
                    </article>
                  ))}
                </section>
              ) : null}
            </div>
          </PageShell>
        )}
      </div>
    </PluginGuard>
  );
}
