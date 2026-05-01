'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ComponentType } from 'react';
import { ArrowUpRight, Download, Landmark, NotebookPen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  inicializarPlanCuentas,
  obtenerAsientos,
  obtenerBalanceComprobacion,
  obtenerCuentas,
  tienePlanCuentas,
} from '@/services/contabilidad';
import type { AsientoContable, CuentaContable } from '@/types';
import { BaseButton, BaseCard, ListTable, Section } from '@/components/design-system';
import { PageShell } from '@/components/layout/PageShell';

export default function ContabilidadPage() {
  const router = useRouter();
  const { firebaseUser, loading: authLoading } = useAuth();

  const [cuentas, setCuentas] = useState<CuentaContable[]>([]);
  const [asientos, setAsientos] = useState<AsientoContable[]>([]);
  const [balance, setBalance] = useState<Array<{ cuentaCodigo: string; cuentaNombre: string; debe: number; haber: number; saldo: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [inicializando, setInicializando] = useState(false);
  const [planReady, setPlanReady] = useState(false);

  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.push('/auth/login');
      return;
    }

    if (firebaseUser) {
      void cargarDatos();
    }
  }, [firebaseUser, authLoading, router]);

  async function cargarDatos() {
    if (!firebaseUser) return;
    setLoading(true);
    try {
      const tiene = await tienePlanCuentas(firebaseUser.uid);
      setPlanReady(tiene);

      if (tiene) {
        const [cuentasData, asientosData, balanceData] = await Promise.all([
          obtenerCuentas(firebaseUser.uid),
          obtenerAsientos(firebaseUser.uid),
          obtenerBalanceComprobacion(firebaseUser.uid),
        ]);
        setCuentas(cuentasData);
        setAsientos(asientosData);
        setBalance(balanceData);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleInicializar() {
    if (!firebaseUser) return;
    setInicializando(true);
    try {
      await inicializarPlanCuentas(firebaseUser.uid);
      await cargarDatos();
    } finally {
      setInicializando(false);
    }
  }

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Cargando contabilidad...</div>;
  }

  if (!planReady) {
    return (
      <PageShell title="Contabilidad" subtitle="Configuracion inicial requerida">
        <Section>
          <BaseCard>
            <div className="space-y-4">
              <p className="text-slate-700">No hay plan de cuentas cargado para esta organizacion.</p>
              <p className="text-sm text-slate-500">Inicializa el plan base agro para comenzar a registrar asientos.</p>
              <div className="flex gap-2">
                <BaseButton onClick={handleInicializar} disabled={inicializando}>{inicializando ? 'Inicializando...' : 'Inicializar plan'}</BaseButton>
                <Link href="/dashboard"><BaseButton variant="outline">Volver</BaseButton></Link>
              </div>
            </div>
          </BaseCard>
        </Section>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Contabilidad"
      subtitle="Libro diario agricola con resumen ejecutivo, balance y movimientos recientes."
      rightSlot={(
        <>
          <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Download className="h-4 w-4" />
            Exportar
          </button>
          <Link href="/contabilidad/asiento"><BaseButton>Nuevo asiento</BaseButton></Link>
        </>
      )}
    >
      <Section>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Cuentas activas" value={String(cuentas.length)} tone="emerald" icon={Landmark} />
          <MetricCard label="Asientos cargados" value={String(asientos.length)} tone="slate" icon={NotebookPen} />
          <MetricCard label="Lineas de balance" value={String(balance.length)} tone="sky" icon={ArrowUpRight} />
          <MetricCard
            label="Balance neto"
            value={`$ ${balance.reduce((acc, item) => acc + item.saldo, 0).toLocaleString('es-AR')}`}
            tone="lime"
            icon={ArrowUpRight}
          />
        </div>
      </Section>

      <Section title="Ultimos asientos">
        <div className="app-panel overflow-hidden">
          <ListTable
            data={asientos.slice(0, 10)}
            keyExtractor={item => item.id}
            emptyState={<div className="p-8 text-center text-slate-500">Sin asientos cargados.</div>}
            columns={[
              { header: 'Numero', cell: item => item.numero },
              { header: 'Fecha', cell: item => new Date(item.fecha).toLocaleDateString('es-AR') },
              { header: 'Concepto', accessorKey: 'concepto' },
              { header: 'Debe', className: 'text-right', cell: item => `$ ${item.totalDebe.toLocaleString('es-AR')}` },
              { header: 'Haber', className: 'text-right', cell: item => `$ ${item.totalHaber.toLocaleString('es-AR')}` },
            ]}
          />
        </div>
      </Section>

      <Section title="Balance de comprobacion">
        <div className="app-panel overflow-hidden">
          <ListTable
            data={balance}
            keyExtractor={item => item.cuentaCodigo}
            emptyState={<div className="p-8 text-center text-slate-500">Sin movimientos.</div>}
            columns={[
              { header: 'Codigo', accessorKey: 'cuentaCodigo' },
              { header: 'Cuenta', accessorKey: 'cuentaNombre' },
              { header: 'Debe', className: 'text-right', cell: item => `$ ${item.debe.toLocaleString('es-AR')}` },
              { header: 'Haber', className: 'text-right', cell: item => `$ ${item.haber.toLocaleString('es-AR')}` },
              { header: 'Saldo', className: 'text-right', cell: item => `$ ${item.saldo.toLocaleString('es-AR')}` },
            ]}
          />
        </div>
      </Section>
    </PageShell>
  );
}

function MetricCard({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  tone: 'emerald' | 'slate' | 'sky' | 'lime';
  icon: ComponentType<{ className?: string }>;
}) {
  const tones = {
    emerald: 'border-emerald-200 bg-emerald-50/80 text-emerald-900',
    slate: 'border-slate-200 bg-white text-slate-900',
    sky: 'border-sky-200 bg-sky-50 text-sky-900',
    lime: 'border-lime-200 bg-lime-50 text-lime-900',
  };

  return (
    <article className={`rounded-[28px] border p-5 shadow-sm ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/80">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </article>
  );
}
