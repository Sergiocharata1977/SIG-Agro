'use client';

import { useEffect, useMemo, useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { PluginGate } from '@/components/plugins/PluginGate';
import { useAuth } from '@/contexts/AuthContext';
import { usePlugins } from '@/contexts/PluginsContext';
import { exportarFlujoCaja } from '@/services/exportacion';
import { obtenerMovimientos, obtenerResumenTesoreria } from '@/services/tesoreria';
import type { MovimientoTesoreria } from '@/types/tesoreria';

type Periodo = 'mes_actual' | 'mes_anterior' | 'personalizado';

export default function FlujoCajaPage() {
  const { organizationId, organization } = useAuth();
  const { isActive, loading: pluginsLoading } = usePlugins();
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<Periodo>('mes_actual');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [movimientos, setMovimientos] = useState<MovimientoTesoreria[]>([]);
  const [saldoInicialActual, setSaldoInicialActual] = useState(0);

  useEffect(() => {
    if (organizationId && isActive('tesoreria')) {
      void cargarDatos();
    }
  }, [organizationId, isActive]);

  async function cargarDatos() {
    if (!organizationId) return;
    setLoading(true);
    try {
      const [movs, resumen] = await Promise.all([
        obtenerMovimientos(organizationId),
        obtenerResumenTesoreria(organizationId),
      ]);
      setMovimientos(movs);
      setSaldoInicialActual(resumen.totalGeneral);
    } finally {
      setLoading(false);
    }
  }

  const { fechaDesde, fechaHasta } = useMemo(() => {
    const hoy = new Date();
    if (periodo === 'mes_anterior') {
      const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
      const fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0, 23, 59, 59, 999);
      return { fechaDesde: inicio, fechaHasta: fin };
    }
    if (periodo === 'personalizado') {
      return {
        fechaDesde: desde ? new Date(desde) : new Date(hoy.getFullYear(), hoy.getMonth(), 1),
        fechaHasta: hasta ? new Date(`${hasta}T23:59:59`) : hoy,
      };
    }
    return {
      fechaDesde: new Date(hoy.getFullYear(), hoy.getMonth(), 1),
      fechaHasta: hoy,
    };
  }, [periodo, desde, hasta]);

  const flujo = useMemo(() => {
    const filtrados = movimientos
      .filter((item) => item.fecha >= fechaDesde && item.fecha <= fechaHasta)
      .sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

    const ingresos = filtrados.filter((item) => item.tipo === 'ingreso').reduce((acc, item) => acc + item.monto, 0);
    const egresos = filtrados.filter((item) => item.tipo === 'egreso').reduce((acc, item) => acc + item.monto, 0);

    const saldoPrevio = movimientos.reduce((acc, item) => {
      if (item.fecha >= fechaDesde) return acc;
      if (item.tipo === 'ingreso') return acc + item.monto;
      if (item.tipo === 'egreso') return acc - item.monto;
      return acc;
    }, 0);

    const saldoInicial = saldoInicialActual - saldoPrevio - ingresos + egresos;
    let saldoAcumulado = saldoInicial;

    const filas = filtrados.map((item) => {
      if (item.tipo === 'ingreso') saldoAcumulado += item.monto;
      if (item.tipo === 'egreso') saldoAcumulado -= item.monto;
      return { ...item, saldoAcumulado };
    });

    return {
      filas,
      saldoInicial,
      ingresos,
      egresos,
      saldoFinal: saldoInicial + ingresos - egresos,
      neto: ingresos - egresos,
    };
  }, [movimientos, fechaDesde, fechaHasta, saldoInicialActual]);

  if (!organizationId) return <div className="p-6">Selecciona una organizacion para continuar.</div>;
  if (pluginsLoading) return <div className="p-6">Cargando flujo de caja...</div>;

  return (
    <PluginGate pluginId="tesoreria" isActive={isActive('tesoreria')}>
      <PageShell title="Flujo de Caja" subtitle="Ingresos y egresos por periodo con saldo acumulado.">
        <section className="rounded-xl border border-slate-200 bg-white p-4 grid gap-3 md:grid-cols-4">
          <select value={periodo} onChange={(e) => setPeriodo(e.target.value as Periodo)} className={fieldClassName}>
            <option value="mes_actual">Mes actual</option>
            <option value="mes_anterior">Mes anterior</option>
            <option value="personalizado">Personalizado</option>
          </select>
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className={fieldClassName} disabled={periodo !== 'personalizado'} />
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className={fieldClassName} disabled={periodo !== 'personalizado'} />
          {isActive('exportacion') ? (
            <button
              onClick={() => exportarFlujoCaja({
                periodo: `${fechaDesde.toLocaleDateString('es-AR')} - ${fechaHasta.toLocaleDateString('es-AR')}`,
                ingresos: flujo.ingresos,
                egresos: flujo.egresos,
                neto: flujo.neto,
              }, organization?.name ?? '')}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white"
            >
              Exportar PDF/Excel
            </button>
          ) : <div />}
        </section>

        <div className="grid gap-4 md:grid-cols-4">
          <Kpi title="Saldo inicial" value={flujo.saldoInicial} />
          <Kpi title="Ingresos" value={flujo.ingresos} />
          <Kpi title="Egresos" value={flujo.egresos} />
          <Kpi title="Saldo final" value={flujo.saldoFinal} />
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          {loading ? <p className="text-sm text-slate-500">Cargando...</p> : (
            <>
              <table className="w-full text-sm">
                <thead className="text-left text-slate-500">
                  <tr>
                    <th className="pb-3">Fecha</th>
                    <th className="pb-3">Concepto</th>
                    <th className="pb-3">Tipo</th>
                    <th className="pb-3">Cuenta</th>
                    <th className="pb-3">Monto</th>
                    <th className="pb-3">Saldo acumulado</th>
                  </tr>
                </thead>
                <tbody>
                  {flujo.filas.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="py-3">{new Date(item.fecha).toLocaleDateString('es-AR')}</td>
                      <td>{item.concepto}</td>
                      <td><BadgeTipo tipo={item.tipo} /></td>
                      <td>{item.cuentaOrigenNombre}</td>
                      <td>{formatMoney(item.monto)}</td>
                      <td>{formatMoney(item.saldoAcumulado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 flex flex-wrap gap-6 border-t border-slate-100 pt-4 text-sm font-medium text-slate-700">
                <span>Total ingresos: {formatMoney(flujo.ingresos)}</span>
                <span>Total egresos: {formatMoney(flujo.egresos)}</span>
                <span>Resultado neto: {formatMoney(flujo.neto)}</span>
              </div>
            </>
          )}
        </section>
      </PageShell>
    </PluginGate>
  );
}

function Kpi({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{formatMoney(value)}</p>
    </div>
  );
}

function BadgeTipo({ tipo }: { tipo: MovimientoTesoreria['tipo'] }) {
  const className =
    tipo === 'ingreso'
      ? 'bg-emerald-100 text-emerald-700'
      : tipo === 'egreso'
        ? 'bg-rose-100 text-rose-700'
        : 'bg-blue-100 text-blue-700';
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>{tipo}</span>;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value || 0);
}

const fieldClassName = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm';
