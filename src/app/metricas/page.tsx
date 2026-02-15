'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BaseButton, BaseCard, Section } from '@/components/design-system';
import { PageShell } from '@/components/layout/PageShell';
import { useAuth } from '@/contexts/AuthContext';

export default function MetricasPage() {
  const { firebaseUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !firebaseUser) router.push('/auth/login');
  }, [firebaseUser, loading, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Cargando metricas...</div>;
  }

  if (!firebaseUser) return null;

  return (
    <PageShell title="Metricas" subtitle="Resumen operativo rapido">
      <Section>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Kpi title="Campos" value="1" />
          <Kpi title="Lotes" value="2" />
          <Kpi title="Ha Totales" value="200" />
          <Kpi title="Campana Activa" value="2025/26" />
        </div>
      </Section>

      <Section title="Accesos directos" description="Navegacion principal del productor.">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Quick title="Mapa GIS" href="/dashboard" desc="Visualizacion geoespacial y monitoreo" />
          <Quick title="Campos" href="/campos" desc="ABM de establecimientos" />
          <Quick title="Campanas" href="/campanias" desc="Gestion por cultivo y ciclo" />
          <Quick title="Contabilidad" href="/contabilidad" desc="Cuentas, asientos y balance" />
          <Quick title="Scouting" href="/scouting" desc="Observaciones georreferenciadas" />
          <Quick title="Analisis IA" href="/analisis-ia" desc="Alertas y recomendaciones" />
        </div>
      </Section>
    </PageShell>
  );
}

function Kpi({ title, value }: { title: string; value: string }) {
  return (
    <BaseCard>
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-3xl font-semibold text-slate-900">{value}</p>
    </BaseCard>
  );
}

function Quick({ title, href, desc }: { title: string; href: string; desc: string }) {
  return (
    <BaseCard>
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-600">{desc}</p>
        </div>
        <Link href={href}>
          <BaseButton variant="outline" size="sm">Abrir</BaseButton>
        </Link>
      </div>
    </BaseCard>
  );
}
