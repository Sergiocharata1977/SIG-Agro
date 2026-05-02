'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import {
  BaseBadge,
  BaseButton,
  BaseCard,
  BaseInput,
  BaseSelect,
  BaseSelectContent,
  BaseSelectItem,
  BaseSelectTrigger,
  BaseSelectValue,
  ListTable,
  PageToolbar,
  Section,
} from '@/components/design-system';
import { PageShell } from '@/components/layout/PageShell';
import { PluginGate } from '@/components/plugins/PluginGate';
import { useAuth } from '@/contexts/AuthContext';
import { usePlugins } from '@/contexts/PluginsContext';
import { exportarCuentaCorriente } from '@/services/exportacion';
import { obtenerMovimientosTercero, obtenerTercero } from '@/services/terceros';
import type { MovimientoTercero, Tercero, TipoOperacion } from '@/types/contabilidad-simple';

type MovimientoConSaldos = MovimientoTercero & {
  cargoCliente: number;
  abonoCliente: number;
  saldoClienteAcumulado: number;
  cargoProveedor: number;
  abonoProveedor: number;
  saldoProveedorAcumulado: number;
};

type MoraItem = {
  movimientoId: string;
  fecha: Date;
  descripcion: string;
  montoPendiente: number;
  diasVencidos: number;
};

const DATE_FORMATTER = new Intl.DateTimeFormat('es-AR');

function formatCurrency(value: number) {
  return `$ ${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(value?: Date | null) {
  if (!value) return '-';
  return DATE_FORMATTER.format(value);
}

function getTipoBadgeVariant(tipo: TipoOperacion) {
  switch (tipo) {
    case 'venta':
    case 'cobro':
      return 'success' as const;
    case 'compra_insumo':
    case 'pago':
      return 'destructive' as const;
    case 'entrega_acopiador':
    case 'cosecha':
      return 'secondary' as const;
    default:
      return 'outline' as const;
  }
}

export default function CuentaCorrientePage() {
  const { isActive, loading: pluginsLoading } = usePlugins();
  const { user, organization, loading: authLoading } = useAuth();
  const params = useParams();
  const id = params.id as string;

  const [tercero, setTercero] = useState<Tercero | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoTercero[]>([]);
  const [loading, setLoading] = useState(true);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [tipoOperacion, setTipoOperacion] = useState<'todos' | TipoOperacion>('todos');

  const pluginActive = isActive('contabilidad_avanzada');

  useEffect(() => {
    async function cargarDatos() {
      if (!user?.organizationId || !id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [terceroData, movimientosData] = await Promise.all([
          obtenerTercero(user.organizationId, id),
          obtenerMovimientosTercero(user.organizationId, id),
        ]);

        setTercero(terceroData);
        setMovimientos(movimientosData);
      } catch (error) {
        console.error('Error cargando cuenta corriente del tercero:', error);
        setTercero(null);
        setMovimientos([]);
      } finally {
        setLoading(false);
      }
    }

    if (authLoading || pluginsLoading || !pluginActive) return;

    void cargarDatos();
  }, [authLoading, id, pluginActive, pluginsLoading, user?.organizationId]);

  const tiposOperacionDisponibles = useMemo(() => {
    return Array.from(new Set(movimientos.map(movimiento => movimiento.tipoOperacion)));
  }, [movimientos]);

  const movimientosProcesados = useMemo<MovimientoConSaldos[]>(() => {
    const ordenadosAsc = [...movimientos].sort((a, b) => {
      const byDate = a.fecha.getTime() - b.fecha.getTime();
      if (byDate !== 0) return byDate;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    let saldoCliente = 0;
    let saldoProveedor = 0;

    return ordenadosAsc.map(movimiento => {
      const cargoCliente = movimiento.montoCliente > 0 ? movimiento.montoCliente : 0;
      const abonoCliente = movimiento.montoCliente < 0 ? Math.abs(movimiento.montoCliente) : 0;
      const cargoProveedor = movimiento.montoProveedor > 0 ? movimiento.montoProveedor : 0;
      const abonoProveedor = movimiento.montoProveedor < 0 ? Math.abs(movimiento.montoProveedor) : 0;

      saldoCliente += movimiento.montoCliente;
      saldoProveedor += movimiento.montoProveedor;

      return {
        ...movimiento,
        cargoCliente,
        abonoCliente,
        saldoClienteAcumulado: saldoCliente,
        cargoProveedor,
        abonoProveedor,
        saldoProveedorAcumulado: saldoProveedor,
      };
    });
  }, [movimientos]);

  const movimientosFiltrados = useMemo(() => {
    const desde = fechaDesde ? new Date(`${fechaDesde}T00:00:00`) : null;
    const hasta = fechaHasta ? new Date(`${fechaHasta}T23:59:59.999`) : null;

    return movimientosProcesados
      .filter(movimiento => {
        if (tipoOperacion !== 'todos' && movimiento.tipoOperacion !== tipoOperacion) return false;
        if (desde && movimiento.fecha < desde) return false;
        if (hasta && movimiento.fecha > hasta) return false;
        return true;
      })
      .sort((a, b) => {
        const byDate = b.fecha.getTime() - a.fecha.getTime();
        if (byDate !== 0) return byDate;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  }, [fechaDesde, fechaHasta, movimientosProcesados, tipoOperacion]);

  const totalesFiltrados = useMemo(() => {
    return movimientosFiltrados.reduce(
      (acc, movimiento) => ({
        cargoCliente: acc.cargoCliente + movimiento.cargoCliente,
        abonoCliente: acc.abonoCliente + movimiento.abonoCliente,
        cargoProveedor: acc.cargoProveedor + movimiento.cargoProveedor,
        abonoProveedor: acc.abonoProveedor + movimiento.abonoProveedor,
      }),
      { cargoCliente: 0, abonoCliente: 0, cargoProveedor: 0, abonoProveedor: 0 }
    );
  }, [movimientosFiltrados]);

  const ultimoMovimiento = useMemo(() => {
    return movimientos.length
      ? [...movimientos].sort((a, b) => b.fecha.getTime() - a.fecha.getTime())[0]
      : null;
  }, [movimientos]);

  const itemsMora = useMemo<MoraItem[]>(() => {
    const pendientes = movimientosProcesados
      .filter(movimiento => movimiento.cargoCliente > 0)
      .map(movimiento => ({
        movimientoId: movimiento.id,
        fecha: movimiento.fecha,
        descripcion: movimiento.descripcion,
        montoPendiente: movimiento.cargoCliente,
      }));

    for (const movimiento of movimientosProcesados) {
      if (movimiento.abonoCliente <= 0) continue;

      let restante = movimiento.abonoCliente;

      for (const pendiente of pendientes) {
        if (pendiente.fecha > movimiento.fecha || restante <= 0) break;
        if (pendiente.montoPendiente <= 0) continue;

        const aplicado = Math.min(pendiente.montoPendiente, restante);
        pendiente.montoPendiente -= aplicado;
        restante -= aplicado;
      }
    }

    const now = new Date();

    return pendientes
      .map(pendiente => ({
        ...pendiente,
        diasVencidos: Math.floor((now.getTime() - pendiente.fecha.getTime()) / (1000 * 60 * 60 * 24)),
      }))
      .filter(pendiente => pendiente.montoPendiente > 0 && pendiente.diasVencidos > 30)
      .sort((a, b) => b.diasVencidos - a.diasVencidos);
  }, [movimientosProcesados]);

  const saldoExportable = useMemo(() => {
    if (!tercero) return 0;
    return tercero.saldoCliente - tercero.saldoProveedor;
  }, [tercero]);

  function handleExportarCuentaCorriente() {
    if (!tercero || movimientosFiltrados.length === 0) return;

    exportarCuentaCorriente(
      tercero.nombre,
      movimientosFiltrados,
      saldoExportable,
      organization?.name ?? 'Organizacion'
    );
  }

  if (!pluginsLoading && !pluginActive) {
    return (
      <PluginGate pluginId="contabilidad_avanzada" isActive={false}>
        {null}
      </PluginGate>
    );
  }

  if (authLoading || pluginsLoading || loading) {
    return (
      <PageShell title="Cuenta corriente" subtitle="Trazabilidad comercial del tercero">
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
          Cargando cuenta corriente...
        </div>
      </PageShell>
    );
  }

  if (!tercero) {
    return (
      <PageShell
        title="Cuenta corriente"
        subtitle="No encontramos el tercero solicitado."
        rightSlot={
          <Link href="/terceros">
            <BaseButton variant="outline">← Volver a Terceros</BaseButton>
          </Link>
        }
      >
        <BaseCard>
          <p className="text-sm text-slate-500">El tercero no existe o ya no esta disponible para esta organizacion.</p>
        </BaseCard>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={tercero.nombre}
      subtitle={`${tercero.cuit || 'Sin CUIT'} · ${tercero.localidad || 'Sin localidad'} · estado de cuenta completo`}
      rightSlot={
        <Link href="/terceros">
          <BaseButton variant="outline">← Volver a Terceros</BaseButton>
        </Link>
      }
    >
      <Section>
        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
          <BaseCard>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Ficha del tercero</p>
                <h2 className="text-2xl font-semibold text-slate-950">{tercero.nombre}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <BaseBadge variant={tercero.tipo === 'ambos' ? 'success' : tercero.tipo === 'cliente' ? 'secondary' : 'outline'}>
                    {tercero.tipo}
                  </BaseBadge>
                  <span className="text-sm text-slate-600">CUIT: {tercero.cuit || 'Sin informar'}</span>
                </div>
              </div>
              <div className="space-y-1 text-sm text-slate-600">
                <p>Localidad: <span className="font-medium text-slate-900">{tercero.localidad || '-'}</span></p>
                <p>Provincia: <span className="font-medium text-slate-900">{tercero.provincia || '-'}</span></p>
                <p>Telefono: <span className="font-medium text-slate-900">{tercero.telefono || '-'}</span></p>
              </div>
            </div>
          </BaseCard>
          <BaseCard>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Resumen</p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>Email: <span className="font-medium text-slate-900">{tercero.email || '-'}</span></p>
              <p>Direccion: <span className="font-medium text-slate-900">{tercero.direccion || '-'}</span></p>
              <p>Actualizado: <span className="font-medium text-slate-900">{formatDate(tercero.updatedAt)}</span></p>
            </div>
          </BaseCard>
        </div>
      </Section>

      <Section>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <BaseCard>
            <p className="text-sm text-slate-500">Saldo cliente</p>
            <p className={`text-2xl font-semibold ${tercero.saldoCliente > 0 ? 'text-emerald-700' : 'text-slate-900'}`}>
              {formatCurrency(tercero.saldoCliente)}
            </p>
          </BaseCard>
          <BaseCard>
            <p className="text-sm text-slate-500">Saldo proveedor</p>
            <p className={`text-2xl font-semibold ${tercero.saldoProveedor > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
              {formatCurrency(tercero.saldoProveedor)}
            </p>
          </BaseCard>
          <BaseCard>
            <p className="text-sm text-slate-500">Total movimientos</p>
            <p className="text-2xl font-semibold text-slate-900">{movimientos.length}</p>
          </BaseCard>
          <BaseCard>
            <p className="text-sm text-slate-500">Ultimo movimiento</p>
            <p className="text-2xl font-semibold text-slate-900">{formatDate(ultimoMovimiento?.fecha)}</p>
          </BaseCard>
        </div>
      </Section>

      <PageToolbar
        filters={
          <>
            <BaseInput
              type="date"
              value={fechaDesde}
              onChange={e => setFechaDesde(e.target.value)}
              className="w-full md:w-44"
            />
            <BaseInput
              type="date"
              value={fechaHasta}
              onChange={e => setFechaHasta(e.target.value)}
              className="w-full md:w-44"
            />
            <BaseSelect value={tipoOperacion} onValueChange={value => setTipoOperacion(value as 'todos' | TipoOperacion)}>
              <BaseSelectTrigger className="w-full md:w-52">
                <BaseSelectValue placeholder="Tipo de operacion" />
              </BaseSelectTrigger>
              <BaseSelectContent>
                <BaseSelectItem value="todos">Todos los tipos</BaseSelectItem>
                {tiposOperacionDisponibles.map(tipo => (
                  <BaseSelectItem key={tipo} value={tipo}>
                    {tipo}
                  </BaseSelectItem>
                ))}
              </BaseSelectContent>
            </BaseSelect>
          </>
        }
        actions={(
          <BaseButton
            variant="outline"
            className="gap-2"
            onClick={handleExportarCuentaCorriente}
            disabled={!movimientosFiltrados.length}
          >
            <Download className="h-4 w-4" />
            Exportar CC
          </BaseButton>
        )}
      />

      <Section
        title="Movimientos"
        description="Historial ordenado del mas reciente al mas antiguo con saldos acumulados calculados desde el origen."
      >
        <ListTable
          data={movimientosFiltrados}
          keyExtractor={item => item.id}
          emptyState={
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
              No hay movimientos para los filtros seleccionados.
            </div>
          }
          columns={[
            { header: 'Fecha', cell: item => formatDate(item.fecha) },
            {
              header: 'Tipo',
              cell: item => (
                <BaseBadge variant={getTipoBadgeVariant(item.tipoOperacion)}>
                  {item.tipoOperacion}
                </BaseBadge>
              ),
            },
            {
              header: 'Descripcion',
              cell: item => <span className="font-medium text-slate-900">{item.descripcion}</span>,
            },
            {
              header: 'Cargo cliente',
              className: 'text-right',
              cell: item => (item.cargoCliente > 0 ? formatCurrency(item.cargoCliente) : '-'),
            },
            {
              header: 'Abono cliente',
              className: 'text-right',
              cell: item => (item.abonoCliente > 0 ? formatCurrency(item.abonoCliente) : '-'),
            },
            {
              header: 'Saldo cliente',
              className: 'text-right',
              cell: item => formatCurrency(item.saldoClienteAcumulado),
            },
            {
              header: 'Cargo proveedor',
              className: 'text-right',
              cell: item => (item.cargoProveedor > 0 ? formatCurrency(item.cargoProveedor) : '-'),
            },
            {
              header: 'Abono proveedor',
              className: 'text-right',
              cell: item => (item.abonoProveedor > 0 ? formatCurrency(item.abonoProveedor) : '-'),
            },
            {
              header: 'Saldo proveedor',
              className: 'text-right',
              cell: item => formatCurrency(item.saldoProveedorAcumulado),
            },
          ]}
        />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          <BaseCard>
            <p className="text-sm text-slate-500">Total cargos cliente</p>
            <p className="text-xl font-semibold text-slate-900">{formatCurrency(totalesFiltrados.cargoCliente)}</p>
          </BaseCard>
          <BaseCard>
            <p className="text-sm text-slate-500">Total abonos cliente</p>
            <p className="text-xl font-semibold text-slate-900">{formatCurrency(totalesFiltrados.abonoCliente)}</p>
          </BaseCard>
          <BaseCard>
            <p className="text-sm text-slate-500">Total cargos proveedor</p>
            <p className="text-xl font-semibold text-slate-900">{formatCurrency(totalesFiltrados.cargoProveedor)}</p>
          </BaseCard>
          <BaseCard>
            <p className="text-sm text-slate-500">Total abonos proveedor</p>
            <p className="text-xl font-semibold text-slate-900">{formatCurrency(totalesFiltrados.abonoProveedor)}</p>
          </BaseCard>
        </div>
      </Section>

      <Section
        title="Mora"
        description="Movimientos cliente con mas de 30 dias y saldo pendiente luego de imputar cobros posteriores."
      >
        {itemsMora.length === 0 ? (
          <BaseCard>
            <p className="text-sm text-slate-500">No hay deuda cliente vencida segun la regla simple de mora.</p>
          </BaseCard>
        ) : (
          <div className="grid gap-4">
            {itemsMora.map(item => (
              <BaseCard key={item.movimientoId}>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.descripcion}</p>
                    <p className="text-sm text-slate-500">
                      {formatDate(item.fecha)} · {item.diasVencidos} dias vencidos
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <BaseBadge variant="destructive">En mora</BaseBadge>
                    <p className="text-lg font-semibold text-rose-700">{formatCurrency(item.montoPendiente)}</p>
                  </div>
                </div>
              </BaseCard>
            ))}
          </div>
        )}
      </Section>
    </PageShell>
  );
}
