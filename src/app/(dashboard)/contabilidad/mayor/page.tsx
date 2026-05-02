'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Download, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlugins } from '@/contexts/PluginsContext';
import { PluginGate } from '@/components/plugins/PluginGate';
import {
  BaseButton,
  BaseCard,
  BaseInput,
  BaseSelect,
  BaseSelectContent,
  BaseSelectItem,
  BaseSelectTrigger,
  BaseSelectValue,
  Section,
} from '@/components/design-system';
import { PageShell } from '@/components/layout/PageShell';
import { obtenerAsientos, obtenerCuentas } from '@/services/contabilidad';
import { exportarMayorCuenta } from '@/services/exportacion';
import type { AsientoContable, CuentaContable, TipoAsiento } from '@/types';

type FiltroTipo = 'todos' | TipoAsiento;

interface MayorRow {
  id: string;
  fecha: Date;
  asientoNumero: number;
  concepto: string;
  tipo: TipoAsiento;
  debe: number;
  haber: number;
  saldoAcumulado: number;
}

const TIPOS_ASIENTO: Array<{ value: FiltroTipo; label: string }> = [
  { value: 'todos', label: 'Todos los tipos' },
  { value: 'apertura', label: 'Apertura' },
  { value: 'operativo', label: 'Operativo' },
  { value: 'ajuste', label: 'Ajuste' },
  { value: 'cierre', label: 'Cierre' },
  { value: 'automatico', label: 'Automatico' },
];

export default function MayorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { firebaseUser, organization, loading: authLoading } = useAuth();
  const { isActive, loading: pluginsLoading } = usePlugins();

  const [cuentas, setCuentas] = useState<CuentaContable[]>([]);
  const [asientos, setAsientos] = useState<AsientoContable[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCuenta, setSelectedCuenta] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<FiltroTipo>('todos');

  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.push('/auth/login');
      return;
    }

    if (!firebaseUser) return;

    const cargarDatos = async () => {
      setLoading(true);
      try {
        const [cuentasData, asientosData] = await Promise.all([
          obtenerCuentas(firebaseUser.uid),
          obtenerAsientos(firebaseUser.uid),
        ]);
        setCuentas(cuentasData.filter(cuenta => cuenta.admiteMovimientos));
        setAsientos(asientosData);
      } finally {
        setLoading(false);
      }
    };

    void cargarDatos();
  }, [authLoading, firebaseUser, router]);

  useEffect(() => {
    const cuentaQuery = searchParams.get('cuenta');
    if (!cuentaQuery || !cuentas.length || selectedCuenta) return;

    const cuenta = cuentas.find(item => item.codigo === cuentaQuery || item.id === cuentaQuery);
    if (cuenta) {
      setSelectedCuenta(cuenta.codigo);
    }
  }, [cuentas, searchParams, selectedCuenta]);

  const cuentaSeleccionada = useMemo(
    () => cuentas.find(cuenta => cuenta.codigo === selectedCuenta || cuenta.id === selectedCuenta) ?? null,
    [cuentas, selectedCuenta]
  );

  const movimientosCuenta = useMemo(() => {
    if (!cuentaSeleccionada) return [];

    const rows: MayorRow[] = [];
    const cuentaIds = new Set([cuentaSeleccionada.id, cuentaSeleccionada.codigo]);
    const signo = cuentaSeleccionada.tipo === 'activo' || cuentaSeleccionada.tipo === 'gasto' ? 1 : -1;

    const asientosOrdenados = [...asientos].sort((a, b) => {
      const fechaDiff = new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
      if (fechaDiff !== 0) return fechaDiff;
      return a.numero - b.numero;
    });

    let saldoAcumulado = 0;

    for (const asiento of asientosOrdenados) {
      for (const linea of asiento.lineas) {
        if (!cuentaIds.has(linea.cuentaId) && !cuentaIds.has(linea.cuentaCodigo)) continue;

        saldoAcumulado += signo * (linea.debe - linea.haber);

        rows.push({
          id: `${asiento.id}-${linea.cuentaCodigo}-${rows.length}`,
          fecha: new Date(asiento.fecha),
          asientoNumero: asiento.numero,
          concepto: asiento.concepto,
          tipo: asiento.tipo,
          debe: linea.debe,
          haber: linea.haber,
          saldoAcumulado,
        });
      }
    }

    return rows;
  }, [asientos, cuentaSeleccionada]);

  const movimientosFiltrados = useMemo(() => {
    return movimientosCuenta.filter(movimiento => {
      const fecha = movimiento.fecha;
      const cumpleDesde = !fechaDesde || fecha >= new Date(`${fechaDesde}T00:00:00`);
      const cumpleHasta = !fechaHasta || fecha <= new Date(`${fechaHasta}T23:59:59`);
      const cumpleTipo = tipoFiltro === 'todos' || movimiento.tipo === tipoFiltro;

      return cumpleDesde && cumpleHasta && cumpleTipo;
    });
  }, [fechaDesde, fechaHasta, movimientosCuenta, tipoFiltro]);

  const totales = useMemo(() => {
    return movimientosFiltrados.reduce(
      (acc, movimiento) => {
        acc.debe += movimiento.debe;
        acc.haber += movimiento.haber;
        acc.saldoFinal = movimiento.saldoAcumulado;
        return acc;
      },
      { debe: 0, haber: 0, saldoFinal: 0 }
    );
  }, [movimientosFiltrados]);

  const saldoActual = movimientosCuenta.at(-1)?.saldoAcumulado ?? 0;
  const ultimoMovimiento = movimientosFiltrados.at(-1) ?? movimientosCuenta.at(-1) ?? null;
  const esActivo = cuentaSeleccionada?.tipo === 'activo';

  function handleExportarMayor() {
    if (!cuentaSeleccionada || movimientosFiltrados.length === 0) return;

    exportarMayorCuenta(
      `${cuentaSeleccionada.codigo} - ${cuentaSeleccionada.nombre}`,
      movimientosFiltrados,
      organization?.name ?? 'Organizacion'
    );
  }

  if (authLoading || loading || pluginsLoading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Cargando mayor contable...</div>;
  }

  if (!isActive('contabilidad_avanzada')) {
    return <PluginGate pluginId="contabilidad_avanzada" isActive={false}>{null}</PluginGate>;
  }

  return (
    <PageShell
      title="Mayor por cuenta"
      subtitle="Consulta detallada de movimientos contables, filtros por periodo y saldo acumulado."
      rightSlot={(
        <>
          <BaseButton
            variant="outline"
            className="gap-2"
            onClick={handleExportarMayor}
            disabled={!cuentaSeleccionada || movimientosFiltrados.length === 0}
          >
            <Download className="h-4 w-4" />
            Exportar
          </BaseButton>
          <Link href="/contabilidad">
            <BaseButton variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver a contabilidad
            </BaseButton>
          </Link>
        </>
      )}
    >
      <Section>
        <BaseCard className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Cuenta contable</span>
              <BaseSelect value={selectedCuenta} onValueChange={setSelectedCuenta}>
                <BaseSelectTrigger>
                  <BaseSelectValue placeholder="Seleccionar cuenta" />
                </BaseSelectTrigger>
                <BaseSelectContent>
                  {cuentas.map(cuenta => (
                    <BaseSelectItem key={cuenta.id} value={cuenta.codigo}>
                      {cuenta.codigo} - {cuenta.nombre}
                    </BaseSelectItem>
                  ))}
                </BaseSelectContent>
              </BaseSelect>
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Fecha desde</span>
              <BaseInput type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Fecha hasta</span>
              <BaseInput type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Tipo de asiento</span>
              <BaseSelect value={tipoFiltro} onValueChange={value => setTipoFiltro(value as FiltroTipo)}>
                <BaseSelectTrigger>
                  <BaseSelectValue placeholder="Todos los tipos" />
                </BaseSelectTrigger>
                <BaseSelectContent>
                  {TIPOS_ASIENTO.map(tipo => (
                    <BaseSelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </BaseSelectItem>
                  ))}
                </BaseSelectContent>
              </BaseSelect>
            </label>
          </div>
        </BaseCard>
      </Section>

      {cuentaSeleccionada ? (
        <>
          <Section title={cuentaSeleccionada.nombre} description={`${cuentaSeleccionada.codigo} · ${cuentaSeleccionada.tipo}`}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <KpiCard
                label="Saldo actual"
                value={formatCurrency(saldoActual)}
                tone={saldoActual < 0 && esActivo ? 'red' : 'emerald'}
                icon={Wallet}
              />
              <KpiCard
                label="Movimientos en periodo"
                value={String(movimientosFiltrados.length)}
                tone="sky"
                icon={TrendingUp}
              />
              <KpiCard
                label="Ultimo movimiento"
                value={ultimoMovimiento ? formatDate(ultimoMovimiento.fecha) : 'Sin movimientos'}
                tone="slate"
                icon={TrendingDown}
              />
            </div>
          </Section>

          <Section title="Detalle del mayor">
            {!movimientosFiltrados.length ? (
              <BaseCard>
                <div className="py-10 text-center text-sm text-slate-500">
                  No hay movimientos para los filtros seleccionados.
                </div>
              </BaseCard>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Fecha</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">N° Asiento</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Concepto</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Tipo</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600">Debe</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600">Haber</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600">Saldo acumulado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientosFiltrados.map(movimiento => {
                      const saldoNegativoActivo = esActivo && movimiento.saldoAcumulado < 0;

                      return (
                        <tr
                          key={movimiento.id}
                          className={saldoNegativoActivo ? 'border-t border-red-100 bg-red-50/80' : 'border-t border-slate-100'}
                        >
                          <td className="px-4 py-3 text-slate-700">{formatDate(movimiento.fecha)}</td>
                          <td className="px-4 py-3 text-slate-700">{movimiento.asientoNumero}</td>
                          <td className="px-4 py-3 text-slate-700">{movimiento.concepto}</td>
                          <td className="px-4 py-3 capitalize text-slate-700">{movimiento.tipo}</td>
                          <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(movimiento.debe)}</td>
                          <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(movimiento.haber)}</td>
                          <td className={saldoNegativoActivo ? 'px-4 py-3 text-right font-medium text-red-700' : 'px-4 py-3 text-right font-medium text-slate-900'}>
                            {formatCurrency(movimiento.saldoAcumulado)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50">
                    <tr className="border-t border-slate-200">
                      <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-slate-700">Totales</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(totales.debe)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(totales.haber)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(totales.saldoFinal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </Section>
        </>
      ) : (
        <Section>
          <BaseCard>
            <div className="py-10 text-center text-sm text-slate-500">
              Selecciona una cuenta para ver su mayor.
            </div>
          </BaseCard>
        </Section>
      )}
    </PageShell>
  );
}

function KpiCard({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  tone: 'emerald' | 'sky' | 'slate' | 'red';
  icon: typeof Wallet;
}) {
  const tones = {
    emerald: 'border-emerald-200 bg-emerald-50/80 text-emerald-900',
    sky: 'border-sky-200 bg-sky-50 text-sky-900',
    slate: 'border-slate-200 bg-white text-slate-900',
    red: 'border-red-200 bg-red-50 text-red-900',
  };

  return (
    <BaseCard className={tones[tone]}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-current/80">{label}</p>
          <p className="mt-3 text-2xl font-semibold">{value}</p>
        </div>
        <div className="rounded-2xl bg-white/70 p-3">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </BaseCard>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('es-AR').format(new Date(value));
}
