'use client';

import { useState } from 'react';
import { Bot, List, Map, Plus, Sparkles } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ScoutingForm from '@/components/scouting/ScoutingForm';
import ScoutingList from '@/components/scouting/ScoutingList';
import { useAuth } from '@/contexts/AuthContext';

export default function ScoutingPage() {
  const { user, organizationId } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    setShowForm(false);
    setRefreshKey((value) => value + 1);
  };

  if (!user || !organizationId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-slate-500">Cargando scouting...</p>
      </div>
    );
  }

  return (
    <PageShell
      title="Scouting e IA"
      subtitle="Observaciones de campo, seguimiento georreferenciado y asistencia operativa."
      rightSlot={
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setView('list')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                view === 'list' ? 'bg-[#0f2e21] text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <List className="h-4 w-4" />
              Lista
            </button>
            <button
              type="button"
              onClick={() => setView('map')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                view === 'map' ? 'bg-[#0f2e21] text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Map className="h-4 w-4" />
              Mapa
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-lime-300 px-5 py-3 text-sm font-semibold text-[#0c2418] transition hover:bg-lime-200"
          >
            <Plus className="h-4 w-4" />
            Nueva observacion
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <article className="overflow-hidden rounded-[30px] border border-slate-200 bg-[#123524] p-7 text-white shadow-sm">
            <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/20 bg-lime-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-lime-200">
              <Sparkles className="h-4 w-4" />
              Scouting asistido
            </div>
            <h2 className="mt-6 text-3xl font-semibold">Monitorea, documenta y detecta desvio antes.</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/72">
              Carga offline, fotos geolocalizadas, clasificacion por severidad y contexto tecnico listo para el equipo a campo.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {['Carga offline', 'Fotos georreferenciadas', 'Prioridad por severidad'].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/6 px-4 py-4 text-sm text-white/85">
                  {item}
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-lime-300/20 p-3 text-[#0f2e21]">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <div className="text-lg font-semibold text-slate-950">Don Candido IA</div>
                <div className="text-sm text-slate-500">Interpretacion rapida de observaciones</div>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                "Detectamos mayor probabilidad de estres hidrico en lotes con observaciones recurrentes y menor vigor satelital."
              </div>
              <div className="rounded-2xl border border-lime-300/30 bg-lime-50 p-4 text-sm leading-6 text-[#19422f]">
                Recomendacion: priorizar lote con observaciones urgentes, validar humedad en suelo y disparar seguimiento fotografico en 48 horas.
              </div>
            </div>
          </article>
        </section>

        {view === 'list' ? (
          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <ScoutingList key={refreshKey} orgId={organizationId} maxItems={25} />
          </section>
        ) : (
          <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
            <div className="relative h-[34rem]">
              <img
                src="https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?auto=format&fit=crop&w=1600&q=80"
                alt="Mapa de scouting"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0b2418]/65 via-transparent to-[#0b2418]/20" />
              <div className="absolute left-6 top-6 max-w-sm rounded-[26px] border border-white/20 bg-white/92 p-5 shadow-xl backdrop-blur-sm">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Lote priorizado</div>
                <div className="mt-2 text-2xl font-semibold text-slate-950">Lote Norte 04</div>
                <div className="mt-3 text-sm leading-6 text-slate-600">
                  Evidencia reciente de maleza en rebrote y alerta por desuniformidad de vigor en sector noreste.
                </div>
              </div>
              <div className="absolute right-6 top-6 w-80 rounded-[26px] border border-[#5a8107]/20 bg-white/95 p-5 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-lime-300/25 p-3 text-[#476d0c]">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-slate-950">Anomalia detectada</div>
                    <div className="text-sm text-slate-500">Estres hidrico en sector noreste</div>
                  </div>
                </div>
                <div className="mt-4 text-sm leading-6 text-slate-600">
                  Probable falla de riego o menor infiltracion. Conviene verificar humedad y cobertura antes de escalar insumos.
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Nueva observacion de campo</DialogTitle>
          </DialogHeader>
          <ScoutingForm orgId={organizationId} onSuccess={handleSuccess} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
