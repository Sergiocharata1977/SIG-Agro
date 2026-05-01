'use client';

import Link from 'next/link';
import { ArrowRight, Download, Eye, Filter, Pencil, Plus, Sprout, TrendingDown, TrendingUp } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';

const summaryCards = [
  { title: 'Total hectareas', value: '12,450 ha', detail: '+2.4% vs 23/24', tone: 'emerald', icon: TrendingUp },
  { title: 'Costo promedio', value: '342.50 USD/ha', detail: '+5.1% insumos', tone: 'red', icon: TrendingDown },
  { title: 'Rinde estimado', value: '3.8 Tn/ha', detail: 'En linea con objetivo', tone: 'emerald', icon: Sprout },
  { title: 'Salud de cultivos', value: 'Optima', detail: 'NDVI 0.82 prom.', tone: 'emerald', icon: Sprout },
];

const lots = [
  { name: 'El Milagro - Cuadro 4', crop: 'Soja', area: '150 ha', status: 'Crecimiento', cost: '$ 320.00', yield: '3.2 Tn' },
  { name: 'La Posta - Norte', crop: 'Maiz', area: '280 ha', status: 'Siembra', cost: '$ 410.50', yield: '9.5 Tn' },
  { name: 'Santa Rita - Lote 12', crop: 'Soja', area: '85 ha', status: 'Cosecha', cost: '$ 305.00', yield: '2.8 Tn' },
  { name: 'Don Pedro - Sector B', crop: 'Girasol', area: '112 ha', status: 'Crecimiento', cost: '$ 288.20', yield: '2.1 Tn' },
];

const tasks = [
  { title: 'Pulverizacion selectiva', detail: 'Lote: El Milagro | Hace 2 dias', tone: 'amber' },
  { title: 'Riego programado', detail: 'Lote: La Posta | En 12 horas', tone: 'blue' },
  { title: 'Vuelo de dron (IA)', detail: 'Lote: Santa Rita | En 2 dias', tone: 'emerald' },
];

function toneClass(tone: string) {
  if (tone === 'red') return 'text-red-600';
  return 'text-emerald-700';
}

function statusClass(status: string) {
  if (status === 'Siembra') return 'bg-blue-100 text-blue-700';
  if (status === 'Cosecha') return 'bg-amber-100 text-amber-700';
  return 'bg-emerald-100 text-emerald-700';
}

function taskClass(tone: string) {
  if (tone === 'amber') return 'border-amber-400 bg-amber-50';
  if (tone === 'blue') return 'border-blue-500 bg-blue-50';
  return 'border-emerald-500 bg-emerald-50';
}

export default function LotesPage() {
  return (
    <PageShell
      title="Gestion de lotes - Campana 2024/25"
      subtitle="Monitoreo de produccion y costos operativos en tiempo real."
      rightSlot={
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm">
            <Download className="h-4 w-4" />
            Descargar informe PDF
          </button>
          <button type="button" className="inline-flex items-center gap-2 rounded-2xl bg-[#0f2e21] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#174531]">
            <Plus className="h-4 w-4" />
            Nueva operacion
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-4 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-4">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Organizacion</span>
            <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none">
              <option>AgroCorp Norte</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Cultivo</span>
            <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none">
              <option>Todos los cultivos</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Estado de lote</span>
            <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none">
              <option>Cualquier estado</option>
            </select>
          </label>
          <div className="flex items-end">
            <button type="button" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
              <Filter className="h-4 w-4" />
              Aplicar filtros
            </button>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.title} className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-500">{card.title}</div>
                    <div className="mt-4 text-3xl font-semibold text-slate-950">{card.value}</div>
                    <div className={`mt-3 text-sm font-medium ${toneClass(card.tone)}`}>{card.detail}</div>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.6fr_0.7fr]">
          <article className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <h2 className="text-3xl font-semibold text-slate-950">Detalle de lotes</h2>
              <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-500">Total: 42 lotes</span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-50 text-sm text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Nombre del lote</th>
                    <th className="px-6 py-4 font-semibold">Cultivo</th>
                    <th className="px-6 py-4 font-semibold">Superficie</th>
                    <th className="px-6 py-4 font-semibold">Estado</th>
                    <th className="px-6 py-4 font-semibold">Costo / Ha</th>
                    <th className="px-6 py-4 font-semibold">Rinde est.</th>
                    <th className="px-6 py-4 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {lots.map((lot) => (
                    <tr key={lot.name} className="border-t border-slate-100 text-sm text-slate-700">
                      <td className="px-6 py-5 font-semibold text-slate-950">{lot.name}</td>
                      <td className="px-6 py-5">{lot.crop}</td>
                      <td className="px-6 py-5">{lot.area}</td>
                      <td className="px-6 py-5">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(lot.status)}`}>{lot.status}</span>
                      </td>
                      <td className="px-6 py-5">{lot.cost}</td>
                      <td className="px-6 py-5 font-medium text-emerald-700">{lot.yield}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3 text-slate-400">
                          <Eye className="h-4 w-4" />
                          <Pencil className="h-4 w-4" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 text-sm text-slate-500">Mostrando 4 de 42 lotes</div>
          </article>

          <div className="space-y-6">
            <article className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
              <div className="relative h-[24rem] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1400&q=80"
                  alt="NDVI"
                  className="h-full w-full object-cover"
                />
                <div className="absolute left-4 top-4 rounded-2xl bg-white/95 px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg">
                  NDVI capa activa
                </div>
              </div>
            </article>

            <article className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-3xl font-semibold text-slate-950">Proximas actividades</h2>
              <div className="mt-6 space-y-4">
                {tasks.map((task) => (
                  <div key={task.title} className={`rounded-2xl border-l-4 p-4 ${taskClass(task.tone)}`}>
                    <div className="font-semibold text-slate-900">{task.title}</div>
                    <div className="mt-1 text-sm text-slate-500">{task.detail}</div>
                  </div>
                ))}
              </div>
              <Link href="/operaciones" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-700">
                Ver agenda completa
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
