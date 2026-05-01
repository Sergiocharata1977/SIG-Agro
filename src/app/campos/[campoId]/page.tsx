'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import type { Campo, Lote } from '@/types/agro';
import { obtenerCampo, obtenerLotes } from '@/services/campos';
import { BaseBadge, BaseButton, BaseCard, ListGrid, Section } from '@/components/design-system';
import { PageShell } from '@/components/layout/PageShell';

export default function CampoDetallePage() {
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const campoId = params.campoId as string;

  const [campo, setCampo] = useState<Campo | null>(null);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.organizationId || !campoId) return;
      setLoading(true);
      try {
        const [campoData, lotesData] = await Promise.all([
          obtenerCampo(user.organizationId, campoId),
          obtenerLotes(user.organizationId, campoId),
        ]);
        setCampo(campoData);
        setLotes(lotesData);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user?.organizationId) {
      void loadData();
    }
  }, [authLoading, user?.organizationId, campoId]);

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Cargando campo...</div>;

  if (!campo) {
    return (
      <PageShell title="Campo" subtitle="No encontrado">
        <Link href="/campos"><BaseButton variant="outline">Volver a campos</BaseButton></Link>
      </PageShell>
    );
  }

  return (
    <PageShell title={campo.nombre} subtitle={`${campo.departamento}, ${campo.provincia} · ${campo.superficieTotal} ha · ficha de establecimiento`}>
      <Section>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <BaseCard><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Lotes</p><p className="mt-3 text-2xl font-semibold">{lotes.length}</p></BaseCard>
          <BaseCard><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Superficie en lotes</p><p className="mt-3 text-2xl font-semibold">{lotes.reduce((acc, l) => acc + (l.superficie || 0), 0)} ha</p></BaseCard>
          <BaseCard><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Sembrados</p><p className="mt-3 text-2xl font-semibold">{lotes.filter(l => l.estado === 'sembrado').length}</p></BaseCard>
          <BaseCard><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Con cultivo</p><p className="mt-3 text-2xl font-semibold">{lotes.filter(l => l.cultivoActual).length}</p></BaseCard>
        </div>
      </Section>

      <Section title="Vista general">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#102d20,#1b4332)] p-6 text-white shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-lime-200">Poligono GIS</p>
            <h3 className="mt-3 text-2xl font-semibold">Mapa y geometria del establecimiento</h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/72">
              Esta vista concentra ubicacion, superficie y contexto del campo para seguir lotes asociados, historial y futuras capas GIS.
            </p>
          </div>
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Estado general</p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>Campana activa: <span className="font-semibold text-slate-900">2025/26</span></p>
              <p>Superficie util: <span className="font-semibold text-slate-900">{campo.superficieAgricola || campo.superficieTotal} ha</span></p>
              <p>Cultivos activos: <span className="font-semibold text-slate-900">{lotes.filter(l => l.cultivoActual).length}</span></p>
            </div>
          </div>
        </div>
      </Section>

      <Section
        title="Lotes"
        actions={<Link href={`/campos/${campoId}/lotes/nuevo`}><BaseButton>Nuevo lote</BaseButton></Link>}
      >
        <ListGrid
          data={lotes}
          keyExtractor={item => item.id}
          columns={3}
          emptyState={<div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">No hay lotes para este campo.</div>}
          renderItem={lote => (
            <Link href={`/campos/${campoId}/lotes/${lote.id}`}>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">{lote.nombre}</h3>
                  <BaseBadge variant={lote.estado === 'sembrado' ? 'success' : 'outline'}>{lote.estado}</BaseBadge>
                </div>
                <p className="text-sm text-slate-600 mt-2">{lote.superficie} ha</p>
                {lote.cultivoActual && <p className="text-sm text-slate-600">Cultivo: {lote.cultivoActual}</p>}
              </div>
            </Link>
          )}
        />
      </Section>

      <Section>
        <Link href={`/dashboard?campoId=${campoId}`}>
          <BaseButton variant="outline">Ver en mapa GIS</BaseButton>
        </Link>
      </Section>
    </PageShell>
  );
}
