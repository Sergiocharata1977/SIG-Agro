'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  CloudSun,
  Layers3,
  Sparkles,
  Tractor,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PageShell } from '@/components/layout/PageShell';

const MapaGeneral = dynamic(() => import('@/components/mapa/MapaGeneral'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[28rem] items-center justify-center rounded-[28px] bg-slate-100 text-sm text-slate-500">
      Cargando mapa...
    </div>
  ),
});

const kpis = [
  {
    title: 'NDVI promedio',
    value: '0.82',
    detail: '+4.2% vs mes anterior',
    icon: Layers3,
    accent: 'from-emerald-500/15 to-lime-200/40',
  },
  {
    title: 'Alertas IA',
    value: '3 nuevas',
    detail: 'Anomalias detectadas en lotes priorizados',
    icon: AlertTriangle,
    accent: 'from-red-500/10 to-orange-100/50',
  },
  {
    title: 'Clima Charata',
    value: '28°C',
    detail: 'Soleado · Viento SE 12 km/h',
    icon: CloudSun,
    accent: 'from-amber-400/10 to-yellow-100/60',
  },
  {
    title: 'Hectareas activas',
    value: '1,250 ha',
    detail: '12 lotes bajo gestion',
    icon: Tractor,
    accent: 'from-sky-500/10 to-sky-100/60',
  },
];

const timeline = [
  {
    title: 'Siembra en Lote 12 finalizada',
    description: 'Maiz tardio · 450 ha procesadas con precision de 2 cm.',
    tone: 'emerald',
  },
  {
    title: 'Riego programado Lote 4',
    description: 'Ciclo profundo iniciado por Pivot Central.',
    tone: 'blue',
  },
  {
    title: 'Reporte de scouting generado',
    description: 'Se cargo evidencia de cogollero y recomendacion de seguimiento.',
    tone: 'amber',
  },
  {
    title: 'Sincronizacion de maquinaria',
    description: 'Datos de telemetria recibidos del tractor JD 7230J.',
    tone: 'slate',
  },
];

function toneClass(tone: string) {
  if (tone === 'emerald') return 'bg-emerald-100 text-emerald-700';
  if (tone === 'blue') return 'bg-blue-100 text-blue-700';
  if (tone === 'amber') return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-700';
}

export default function DashboardPage() {
  const { organization, user } = useAuth();
  const firstName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Productor';

  return (
    <PageShell
      title={`Bienvenido, ${firstName}`}
      subtitle={organization?.name || 'Resumen operativo del establecimiento'}
      rightSlot={
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            <Bell className="h-5 w-5" />
          </button>
          <Link
            href="/analisis-ia"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#0f2e21] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#174531]"
          >
            Abrir IA
            <Sparkles className="h-4 w-4" />
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-4 xl:grid-cols-4">
          {kpis.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className={`rounded-[28px] border border-slate-200 bg-gradient-to-br ${item.accent} p-6 shadow-sm`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-500">{item.title}</div>
                    <div className="mt-6 text-4xl font-semibold text-slate-950">{item.value}</div>
                    <div className="mt-2 text-sm text-slate-600">{item.detail}</div>
                  </div>
                  <div className="rounded-2xl bg-white/80 p-3 text-emerald-700 shadow-sm">
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.6fr_0.7fr]">
          <article className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-3xl font-semibold text-slate-950">Vista rapida del campo</h2>
                <p className="mt-1 text-sm text-slate-500">Mapa base con lectura visual de lotes y seguimiento satelital.</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
                  NDVI
                </button>
                <button type="button" className="rounded-xl bg-[#476d0c] px-4 py-2 text-sm font-semibold text-white shadow-sm">
                  Satelite
                </button>
              </div>
            </div>
            <div className="relative h-[28rem] bg-slate-100">
              <MapaGeneral />
              <div className="pointer-events-none absolute right-5 top-5 rounded-3xl border border-white/60 bg-white/92 p-4 shadow-xl backdrop-blur-sm">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-800">
                    <span className="h-3 w-3 rounded-full bg-[#5a8107]" />
                    Lote 12 - Optimo
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-800">
                    <span className="h-3 w-3 rounded-full bg-amber-400" />
                    Lote 4 - Estres hidrico
                  </div>
                  <div className="text-xs text-slate-500">Ultima actualizacion: hace 4 horas via Sentinel-2</div>
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-[30px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-3xl font-semibold text-slate-950">Actividades recientes</h2>
            </div>
            <div className="space-y-6 px-6 py-6">
              {timeline.map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className={`mt-1 flex h-10 w-10 items-center justify-center rounded-full ${toneClass(item.tone)}`}>
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-slate-950">{item.title}</div>
                    <div className="mt-1 text-sm leading-6 text-slate-600">{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-200 px-6 py-5">
              <Link href="/operaciones" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-700">
                Ver todo el historial
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </article>
        </section>
      </div>
    </PageShell>
  );
}
