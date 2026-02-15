'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { obtenerCampanias } from '@/services/campanias';
import type { Campania } from '@/types';
import { BaseBadge, BaseButton, ListGrid, PageToolbar, Section } from '@/components/design-system';
import { PageShell } from '@/components/layout/PageShell';

export default function CampaniasPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [campanias, setCampanias] = useState<Campania[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todas' | 'en_curso' | 'finalizadas'>('todas');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      void cargarCampanias();
    }
  }, [user, authLoading, router]);

  async function cargarCampanias() {
    if (!user) return;

    try {
      setLoading(true);
      const data = await obtenerCampanias(user.id);
      setCampanias(data);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const byEstado = campanias.filter(c => {
      if (filtro === 'todas') return true;
      if (filtro === 'en_curso') return c.estado === 'en_curso' || c.estado === 'planificada';
      return c.estado === 'finalizada';
    });

    const q = search.toLowerCase().trim();
    if (!q) return byEstado;

    return byEstado.filter(c => `${c.nombre} ${c.cultivo} ${c.estado}`.toLowerCase().includes(q));
  }, [campanias, filtro, search]);

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Cargando campanas...</div>;
  }

  return (
    <PageShell title="Campanas" subtitle={`${campanias.length} campanas registradas`}>
      <PageToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nombre o cultivo"
        filters={
          <div className="flex gap-2">
            <BaseButton size="sm" variant={filtro === 'todas' ? 'default' : 'outline'} onClick={() => setFiltro('todas')}>Todas</BaseButton>
            <BaseButton size="sm" variant={filtro === 'en_curso' ? 'default' : 'outline'} onClick={() => setFiltro('en_curso')}>En curso</BaseButton>
            <BaseButton size="sm" variant={filtro === 'finalizadas' ? 'default' : 'outline'} onClick={() => setFiltro('finalizadas')}>Finalizadas</BaseButton>
          </div>
        }
        actions={<Link href="/campanias/nueva"><BaseButton>Nueva campana</BaseButton></Link>}
      />

      <Section title="Listado">
        <ListGrid
          data={filtered}
          keyExtractor={item => item.id}
          columns={3}
          emptyState={<div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">No hay campanas para el filtro seleccionado.</div>}
          renderItem={campania => (
            <Link href={`/campanias/${campania.id}`}>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-900">{campania.nombre}</h3>
                    <p className="text-sm text-slate-600">{campania.cultivo}</p>
                  </div>
                  <BaseBadge variant={campania.estado === 'finalizada' ? 'outline' : campania.estado === 'en_curso' ? 'success' : 'secondary'}>{campania.estado}</BaseBadge>
                </div>
                <p className="text-xs text-slate-500 mt-3">Inicio: {new Date(campania.fechaInicio).toLocaleDateString('es-AR')}</p>
              </div>
            </Link>
          )}
        />
      </Section>
    </PageShell>
  );
}
