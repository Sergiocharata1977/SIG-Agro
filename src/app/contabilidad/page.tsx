'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
      subtitle={`${cuentas.length} cuentas · ${asientos.length} asientos`}
      rightSlot={<Link href="/contabilidad/asiento"><BaseButton>Nuevo asiento</BaseButton></Link>}
    >
      <Section>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <BaseCard><p className="text-sm text-slate-500">Cuentas</p><p className="text-2xl font-semibold">{cuentas.length}</p></BaseCard>
          <BaseCard><p className="text-sm text-slate-500">Asientos</p><p className="text-2xl font-semibold">{asientos.length}</p></BaseCard>
          <BaseCard><p className="text-sm text-slate-500">Balance lineas</p><p className="text-2xl font-semibold">{balance.length}</p></BaseCard>
        </div>
      </Section>

      <Section title="Ultimos asientos">
        <ListTable
          data={asientos.slice(0, 10)}
          keyExtractor={item => item.id}
          emptyState={<div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">Sin asientos cargados.</div>}
          columns={[
            { header: 'Numero', cell: item => item.numero },
            { header: 'Fecha', cell: item => new Date(item.fecha).toLocaleDateString('es-AR') },
            { header: 'Concepto', accessorKey: 'concepto' },
            { header: 'Debe', className: 'text-right', cell: item => `$ ${item.totalDebe.toLocaleString('es-AR')}` },
            { header: 'Haber', className: 'text-right', cell: item => `$ ${item.totalHaber.toLocaleString('es-AR')}` },
          ]}
        />
      </Section>

      <Section title="Balance de comprobacion">
        <ListTable
          data={balance}
          keyExtractor={item => item.cuentaCodigo}
          emptyState={<div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">Sin movimientos.</div>}
          columns={[
            { header: 'Codigo', accessorKey: 'cuentaCodigo' },
            { header: 'Cuenta', accessorKey: 'cuentaNombre' },
            { header: 'Debe', className: 'text-right', cell: item => `$ ${item.debe.toLocaleString('es-AR')}` },
            { header: 'Haber', className: 'text-right', cell: item => `$ ${item.haber.toLocaleString('es-AR')}` },
            { header: 'Saldo', className: 'text-right', cell: item => `$ ${item.saldo.toLocaleString('es-AR')}` },
          ]}
        />
      </Section>
    </PageShell>
  );
}
