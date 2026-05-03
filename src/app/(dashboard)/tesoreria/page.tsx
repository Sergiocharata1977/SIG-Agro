'use client';

import { useEffect, useMemo, useState } from 'react';
import { Pencil, PlusCircle } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { PluginGate } from '@/components/plugins/PluginGate';
import { useAuth } from '@/contexts/AuthContext';
import { usePlugins } from '@/contexts/PluginsContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  actualizarCajaChica,
  actualizarCuentaBancaria,
  crearCajaChica,
  crearCuentaBancaria,
  obtenerCajasChicas,
  obtenerCuentasBancarias,
  obtenerMovimientos,
  obtenerResumenTesoreria,
  registrarMovimiento,
} from '@/services/tesoreria';
import type {
  CajaChica,
  CuentaBancaria,
  MovimientoTesoreria,
  ResumenTesoreria,
  TipoCuenta,
} from '@/types/tesoreria';

type Tab = 'bancos' | 'cajas' | 'movimientos';

const EMPTY_CUENTA = {
  banco: '',
  numeroCuenta: '',
  titular: '',
  tipoCuenta: 'corriente' as CuentaBancaria['tipoCuenta'],
  moneda: 'ARS' as CuentaBancaria['moneda'],
  saldoInicial: 0,
  notas: '',
  estado: 'activo' as CuentaBancaria['estado'],
};

const EMPTY_CAJA = {
  nombre: '',
  responsable: '',
  saldoInicial: 0,
  moneda: 'ARS' as CajaChica['moneda'],
  notas: '',
  estado: 'activo' as CajaChica['estado'],
};

const EMPTY_MOVIMIENTO = {
  tipo: 'ingreso' as MovimientoTesoreria['tipo'],
  cuentaOrigenTipo: 'banco' as TipoCuenta,
  cuentaOrigenId: '',
  cuentaDestinoTipo: 'banco' as TipoCuenta,
  cuentaDestinoId: '',
  fecha: new Date().toISOString().split('T')[0],
  concepto: '',
  monto: 0,
  terceroNombre: '',
  notas: '',
};

export default function TesoreriaPage() {
  const { organizationId } = useAuth();
  const { isActive, loading: pluginsLoading } = usePlugins();

  const [tab, setTab] = useState<Tab>('bancos');
  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState<ResumenTesoreria | null>(null);
  const [cuentas, setCuentas] = useState<CuentaBancaria[]>([]);
  const [cajas, setCajas] = useState<CajaChica[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoTesoreria[]>([]);

  const [cuentaDialogOpen, setCuentaDialogOpen] = useState(false);
  const [cajaDialogOpen, setCajaDialogOpen] = useState(false);
  const [movimientoDialogOpen, setMovimientoDialogOpen] = useState(false);
  const [editandoCuenta, setEditandoCuenta] = useState<CuentaBancaria | null>(null);
  const [editandoCaja, setEditandoCaja] = useState<CajaChica | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cuentaForm, setCuentaForm] = useState(EMPTY_CUENTA);
  const [cajaForm, setCajaForm] = useState(EMPTY_CAJA);
  const [movimientoForm, setMovimientoForm] = useState(EMPTY_MOVIMIENTO);
  const [filtroTipo, setFiltroTipo] = useState<'todos' | MovimientoTesoreria['tipo']>('todos');
  const [filtroCuenta, setFiltroCuenta] = useState('');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');

  useEffect(() => {
    if (organizationId && isActive('tesoreria')) {
      void cargarDatos();
    }
  }, [organizationId, isActive]);

  async function cargarDatos() {
    if (!organizationId) return;
    setLoading(true);
    try {
      const [resumenData, cuentasData, cajasData, movimientosData] = await Promise.all([
        obtenerResumenTesoreria(organizationId),
        obtenerCuentasBancarias(organizationId),
        obtenerCajasChicas(organizationId),
        obtenerMovimientos(organizationId),
      ]);
      setResumen(resumenData);
      setCuentas(cuentasData);
      setCajas(cajasData);
      setMovimientos(movimientosData);
    } finally {
      setLoading(false);
    }
  }

  function abrirCuentaDialog(cuenta?: CuentaBancaria) {
    if (cuenta) {
      setEditandoCuenta(cuenta);
      setCuentaForm({
        banco: cuenta.banco,
        numeroCuenta: cuenta.numeroCuenta,
        titular: cuenta.titular,
        tipoCuenta: cuenta.tipoCuenta,
        moneda: cuenta.moneda,
        saldoInicial: cuenta.saldoInicial,
        notas: cuenta.notas || '',
        estado: cuenta.estado,
      });
    } else {
      setEditandoCuenta(null);
      setCuentaForm(EMPTY_CUENTA);
    }
    setError(null);
    setCuentaDialogOpen(true);
  }

  function abrirCajaDialog(caja?: CajaChica) {
    if (caja) {
      setEditandoCaja(caja);
      setCajaForm({
        nombre: caja.nombre,
        responsable: caja.responsable || '',
        saldoInicial: caja.saldoInicial,
        moneda: caja.moneda,
        notas: caja.notas || '',
        estado: caja.estado,
      });
    } else {
      setEditandoCaja(null);
      setCajaForm(EMPTY_CAJA);
    }
    setError(null);
    setCajaDialogOpen(true);
  }

  async function handleSaveCuenta() {
    if (!organizationId || !cuentaForm.banco.trim() || !cuentaForm.numeroCuenta.trim()) {
      setError('Completa banco y numero de cuenta');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const payload = {
        ...cuentaForm,
        banco: cuentaForm.banco.trim(),
        numeroCuenta: cuentaForm.numeroCuenta.trim(),
        titular: cuentaForm.titular.trim(),
        saldo: editandoCuenta?.saldo ?? cuentaForm.saldoInicial,
      };
      if (editandoCuenta) {
        await actualizarCuentaBancaria(organizationId, editandoCuenta.id, payload);
      } else {
        await crearCuentaBancaria(organizationId, payload);
      }
      setCuentaDialogOpen(false);
      setCuentaForm(EMPTY_CUENTA);
      await cargarDatos();
    } finally {
      setGuardando(false);
    }
  }

  async function handleSaveCaja() {
    if (!organizationId || !cajaForm.nombre.trim()) {
      setError('Completa el nombre de la caja');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const payload = {
        ...cajaForm,
        nombre: cajaForm.nombre.trim(),
        responsable: cajaForm.responsable.trim() || undefined,
        saldo: editandoCaja?.saldo ?? cajaForm.saldoInicial,
      };
      if (editandoCaja) {
        await actualizarCajaChica(organizationId, editandoCaja.id, payload);
      } else {
        await crearCajaChica(organizationId, payload);
      }
      setCajaDialogOpen(false);
      setCajaForm(EMPTY_CAJA);
      await cargarDatos();
    } finally {
      setGuardando(false);
    }
  }

  async function handleRegistrarMovimiento() {
    if (!organizationId || !movimientoForm.cuentaOrigenId || !movimientoForm.concepto.trim() || movimientoForm.monto <= 0) {
      setError('Completa cuenta origen, concepto y monto');
      return;
    }
    if (movimientoForm.tipo === 'transferencia' && !movimientoForm.cuentaDestinoId) {
      setError('Selecciona una cuenta destino para la transferencia');
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      const origen = obtenerCuentaNombre(movimientoForm.cuentaOrigenTipo, movimientoForm.cuentaOrigenId, cuentas, cajas);
      const destino = movimientoForm.tipo === 'transferencia'
        ? obtenerCuentaNombre(movimientoForm.cuentaDestinoTipo, movimientoForm.cuentaDestinoId, cuentas, cajas)
        : undefined;

      await registrarMovimiento(organizationId, {
        tipo: movimientoForm.tipo,
        cuentaOrigenTipo: movimientoForm.cuentaOrigenTipo,
        cuentaOrigenId: movimientoForm.cuentaOrigenId,
        cuentaOrigenNombre: origen,
        cuentaDestinoTipo: movimientoForm.tipo === 'transferencia' ? movimientoForm.cuentaDestinoTipo : undefined,
        cuentaDestinoId: movimientoForm.tipo === 'transferencia' ? movimientoForm.cuentaDestinoId : undefined,
        cuentaDestinoNombre: movimientoForm.tipo === 'transferencia' ? destino : undefined,
        fecha: new Date(movimientoForm.fecha),
        concepto: movimientoForm.concepto.trim(),
        monto: movimientoForm.monto,
        terceroNombre: movimientoForm.terceroNombre.trim() || undefined,
        notas: movimientoForm.notas.trim() || undefined,
      });

      setMovimientoDialogOpen(false);
      setMovimientoForm(EMPTY_MOVIMIENTO);
      await cargarDatos();
    } finally {
      setGuardando(false);
    }
  }

  const cuentasOrigenDisponibles = movimientoForm.cuentaOrigenTipo === 'banco' ? cuentas : cajas;
  const cuentasDestinoDisponibles = movimientoForm.cuentaDestinoTipo === 'banco' ? cuentas : cajas;

  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter((item) => {
      if (filtroTipo !== 'todos' && item.tipo !== filtroTipo) return false;
      if (filtroCuenta && item.cuentaOrigenId !== filtroCuenta && item.cuentaDestinoId !== filtroCuenta) return false;
      if (filtroDesde && item.fecha < new Date(filtroDesde)) return false;
      if (filtroHasta && item.fecha > new Date(filtroHasta)) return false;
      return true;
    });
  }, [movimientos, filtroTipo, filtroCuenta, filtroDesde, filtroHasta]);

  if (!organizationId) return <div className="p-6">Selecciona una organizacion para continuar.</div>;
  if (pluginsLoading) return <div className="p-6">Cargando tesoreria...</div>;

  return (
    <PluginGate pluginId="tesoreria" isActive={isActive('tesoreria')}>
      <PageShell title="Tesoreria" subtitle="Cuentas bancarias, cajas y movimientos de fondos.">
        <div className="grid gap-4 md:grid-cols-4">
          <Kpi title="Total bancos" value={resumen?.totalBancos ?? 0} />
          <Kpi title="Total cajas" value={resumen?.totalCajas ?? 0} />
          <Kpi title="Total general" value={resumen?.totalGeneral ?? 0} />
          <Kpi title="Ingresos del mes" value={resumen?.ingresosMes ?? 0} />
        </div>

        <section className="flex gap-2">
          <TabButton active={tab === 'bancos'} onClick={() => setTab('bancos')}>Cuentas bancarias</TabButton>
          <TabButton active={tab === 'cajas'} onClick={() => setTab('cajas')}>Cajas chicas</TabButton>
          <TabButton active={tab === 'movimientos'} onClick={() => setTab('movimientos')}>Movimientos</TabButton>
        </section>

        {tab === 'bancos' && (
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-4 flex justify-end">
              <button onClick={() => abrirCuentaDialog()} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white inline-flex items-center gap-2">
                <PlusCircle className="w-4 h-4" /> Nueva cuenta
              </button>
            </div>
            {loading ? <p className="text-sm text-slate-500">Cargando...</p> : (
              <table className="w-full text-sm">
                <thead className="text-left text-slate-500">
                  <tr>
                    <th className="pb-3">Banco</th>
                    <th className="pb-3">N° Cuenta</th>
                    <th className="pb-3">Titular</th>
                    <th className="pb-3">Tipo</th>
                    <th className="pb-3">Saldo</th>
                    <th className="pb-3">Estado</th>
                    <th className="pb-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cuentas.map((cuenta) => (
                    <tr key={cuenta.id} className="border-t border-slate-100">
                      <td className="py-3">{cuenta.banco}</td>
                      <td>{cuenta.numeroCuenta}</td>
                      <td>{cuenta.titular}</td>
                      <td>{cuenta.tipoCuenta}</td>
                      <td>{formatMoney(cuenta.saldo)}</td>
                      <td>{cuenta.estado}</td>
                      <td>
                        <button onClick={() => abrirCuentaDialog(cuenta)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs inline-flex items-center gap-1">
                          <Pencil className="w-3.5 h-3.5" /> Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {tab === 'cajas' && (
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-4 flex justify-end">
              <button onClick={() => abrirCajaDialog()} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white inline-flex items-center gap-2">
                <PlusCircle className="w-4 h-4" /> Nueva caja
              </button>
            </div>
            {loading ? <p className="text-sm text-slate-500">Cargando...</p> : (
              <table className="w-full text-sm">
                <thead className="text-left text-slate-500">
                  <tr>
                    <th className="pb-3">Nombre</th>
                    <th className="pb-3">Responsable</th>
                    <th className="pb-3">Saldo</th>
                    <th className="pb-3">Moneda</th>
                    <th className="pb-3">Estado</th>
                    <th className="pb-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cajas.map((caja) => (
                    <tr key={caja.id} className="border-t border-slate-100">
                      <td className="py-3">{caja.nombre}</td>
                      <td>{caja.responsable || '-'}</td>
                      <td>{formatMoney(caja.saldo)}</td>
                      <td>{caja.moneda}</td>
                      <td>{caja.estado}</td>
                      <td>
                        <button onClick={() => abrirCajaDialog(caja)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs inline-flex items-center gap-1">
                          <Pencil className="w-3.5 h-3.5" /> Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {tab === 'movimientos' && (
          <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
            <div className="grid gap-3 md:grid-cols-5">
              <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value as typeof filtroTipo)} className={fieldClassName}>
                <option value="todos">Todos los tipos</option>
                <option value="ingreso">Ingreso</option>
                <option value="egreso">Egreso</option>
                <option value="transferencia">Transferencia</option>
              </select>
              <select value={filtroCuenta} onChange={(e) => setFiltroCuenta(e.target.value)} className={fieldClassName}>
                <option value="">Todas las cuentas</option>
                {[...cuentas.map((item) => ({ id: item.id, nombre: item.banco })), ...cajas.map((item) => ({ id: item.id, nombre: item.nombre }))].map((item) => (
                  <option key={item.id} value={item.id}>{item.nombre}</option>
                ))}
              </select>
              <input type="date" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)} className={fieldClassName} />
              <input type="date" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)} className={fieldClassName} />
              <div className="flex justify-end">
                <button onClick={() => { setError(null); setMovimientoDialogOpen(true); }} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white inline-flex items-center gap-2">
                  <PlusCircle className="w-4 h-4" /> Registrar movimiento
                </button>
              </div>
            </div>

            {loading ? <p className="text-sm text-slate-500">Cargando...</p> : (
              <table className="w-full text-sm">
                <thead className="text-left text-slate-500">
                  <tr>
                    <th className="pb-3">Fecha</th>
                    <th className="pb-3">Cuenta</th>
                    <th className="pb-3">Tipo</th>
                    <th className="pb-3">Concepto</th>
                    <th className="pb-3">Tercero</th>
                    <th className="pb-3">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientosFiltrados.map((mov) => (
                    <tr key={mov.id} className="border-t border-slate-100">
                      <td className="py-3">{new Date(mov.fecha).toLocaleDateString('es-AR')}</td>
                      <td>{mov.cuentaOrigenNombre}</td>
                      <td><BadgeTipo tipo={mov.tipo} /></td>
                      <td>{mov.concepto}</td>
                      <td>{mov.terceroNombre || '-'}</td>
                      <td>{formatMoney(mov.monto)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        <Dialog open={cuentaDialogOpen} onOpenChange={setCuentaDialogOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>{editandoCuenta ? 'Editar cuenta bancaria' : 'Nueva cuenta bancaria'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              {error ? <ErrorBox message={error} /> : null}
              <Field label="Banco"><input value={cuentaForm.banco} onChange={(e) => setCuentaForm((prev) => ({ ...prev, banco: e.target.value }))} className={fieldClassName} /></Field>
              <Field label="Numero de cuenta"><input value={cuentaForm.numeroCuenta} onChange={(e) => setCuentaForm((prev) => ({ ...prev, numeroCuenta: e.target.value }))} className={fieldClassName} /></Field>
              <Field label="Titular"><input value={cuentaForm.titular} onChange={(e) => setCuentaForm((prev) => ({ ...prev, titular: e.target.value }))} className={fieldClassName} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tipo"><select value={cuentaForm.tipoCuenta} onChange={(e) => setCuentaForm((prev) => ({ ...prev, tipoCuenta: e.target.value as CuentaBancaria['tipoCuenta'] }))} className={fieldClassName}><option value="corriente">Corriente</option><option value="ahorro">Ahorro</option><option value="caja_ahorro">Caja de ahorro</option></select></Field>
                <Field label="Moneda"><select value={cuentaForm.moneda} onChange={(e) => setCuentaForm((prev) => ({ ...prev, moneda: e.target.value as CuentaBancaria['moneda'] }))} className={fieldClassName}><option value="ARS">ARS</option><option value="USD">USD</option></select></Field>
              </div>
              <Field label="Saldo inicial"><input type="number" min={0} step="0.01" value={cuentaForm.saldoInicial} onChange={(e) => setCuentaForm((prev) => ({ ...prev, saldoInicial: Number(e.target.value) }))} className={fieldClassName} /></Field>
              <Field label="Notas"><textarea value={cuentaForm.notas} onChange={(e) => setCuentaForm((prev) => ({ ...prev, notas: e.target.value }))} className={fieldClassName} rows={3} /></Field>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setCuentaDialogOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Cancelar</button>
                <button type="button" onClick={() => void handleSaveCuenta()} disabled={guardando} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-60">{guardando ? 'Guardando...' : editandoCuenta ? 'Guardar cambios' : 'Crear cuenta'}</button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={cajaDialogOpen} onOpenChange={setCajaDialogOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>{editandoCaja ? 'Editar caja chica' : 'Nueva caja chica'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              {error ? <ErrorBox message={error} /> : null}
              <Field label="Nombre"><input value={cajaForm.nombre} onChange={(e) => setCajaForm((prev) => ({ ...prev, nombre: e.target.value }))} className={fieldClassName} /></Field>
              <Field label="Responsable"><input value={cajaForm.responsable} onChange={(e) => setCajaForm((prev) => ({ ...prev, responsable: e.target.value }))} className={fieldClassName} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Saldo inicial"><input type="number" min={0} step="0.01" value={cajaForm.saldoInicial} onChange={(e) => setCajaForm((prev) => ({ ...prev, saldoInicial: Number(e.target.value) }))} className={fieldClassName} /></Field>
                <Field label="Moneda"><select value={cajaForm.moneda} onChange={(e) => setCajaForm((prev) => ({ ...prev, moneda: e.target.value as CajaChica['moneda'] }))} className={fieldClassName}><option value="ARS">ARS</option><option value="USD">USD</option></select></Field>
              </div>
              <Field label="Notas"><textarea value={cajaForm.notas} onChange={(e) => setCajaForm((prev) => ({ ...prev, notas: e.target.value }))} className={fieldClassName} rows={3} /></Field>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setCajaDialogOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Cancelar</button>
                <button type="button" onClick={() => void handleSaveCaja()} disabled={guardando} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-60">{guardando ? 'Guardando...' : editandoCaja ? 'Guardar cambios' : 'Crear caja'}</button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={movimientoDialogOpen} onOpenChange={setMovimientoDialogOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>Registrar movimiento</DialogTitle></DialogHeader>
            <div className="space-y-4">
              {error ? <ErrorBox message={error} /> : null}
              <Field label="Tipo">
                <select value={movimientoForm.tipo} onChange={(e) => setMovimientoForm((prev) => ({ ...prev, tipo: e.target.value as MovimientoTesoreria['tipo'] }))} className={fieldClassName}>
                  <option value="ingreso">Ingreso</option>
                  <option value="egreso">Egreso</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tipo cuenta origen">
                  <select value={movimientoForm.cuentaOrigenTipo} onChange={(e) => setMovimientoForm((prev) => ({ ...prev, cuentaOrigenTipo: e.target.value as TipoCuenta, cuentaOrigenId: '' }))} className={fieldClassName}>
                    <option value="banco">Banco</option>
                    <option value="caja_chica">Caja chica</option>
                  </select>
                </Field>
                <Field label="Cuenta origen">
                  <select value={movimientoForm.cuentaOrigenId} onChange={(e) => setMovimientoForm((prev) => ({ ...prev, cuentaOrigenId: e.target.value }))} className={fieldClassName}>
                    <option value="">Seleccionar</option>
                    {cuentasOrigenDisponibles.map((item) => (
                      <option key={item.id} value={item.id}>{'banco' in item ? item.banco : item.nombre}</option>
                    ))}
                  </select>
                </Field>
              </div>
              {movimientoForm.tipo === 'transferencia' && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tipo cuenta destino">
                    <select value={movimientoForm.cuentaDestinoTipo} onChange={(e) => setMovimientoForm((prev) => ({ ...prev, cuentaDestinoTipo: e.target.value as TipoCuenta, cuentaDestinoId: '' }))} className={fieldClassName}>
                      <option value="banco">Banco</option>
                      <option value="caja_chica">Caja chica</option>
                    </select>
                  </Field>
                  <Field label="Cuenta destino">
                    <select value={movimientoForm.cuentaDestinoId} onChange={(e) => setMovimientoForm((prev) => ({ ...prev, cuentaDestinoId: e.target.value }))} className={fieldClassName}>
                      <option value="">Seleccionar</option>
                      {cuentasDestinoDisponibles.map((item) => (
                        <option key={item.id} value={item.id}>{'banco' in item ? item.banco : item.nombre}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fecha"><input type="date" value={movimientoForm.fecha} onChange={(e) => setMovimientoForm((prev) => ({ ...prev, fecha: e.target.value }))} className={fieldClassName} /></Field>
                <Field label="Monto"><input type="number" min={0} step="0.01" value={movimientoForm.monto} onChange={(e) => setMovimientoForm((prev) => ({ ...prev, monto: Number(e.target.value) }))} className={fieldClassName} /></Field>
              </div>
              <Field label="Concepto"><input value={movimientoForm.concepto} onChange={(e) => setMovimientoForm((prev) => ({ ...prev, concepto: e.target.value }))} className={fieldClassName} /></Field>
              <Field label="Tercero"><input value={movimientoForm.terceroNombre} onChange={(e) => setMovimientoForm((prev) => ({ ...prev, terceroNombre: e.target.value }))} className={fieldClassName} /></Field>
              <Field label="Notas"><textarea value={movimientoForm.notas} onChange={(e) => setMovimientoForm((prev) => ({ ...prev, notas: e.target.value }))} className={fieldClassName} rows={3} /></Field>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setMovimientoDialogOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Cancelar</button>
                <button type="button" onClick={() => void handleRegistrarMovimiento()} disabled={guardando} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-60">{guardando ? 'Guardando...' : 'Registrar'}</button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`rounded-lg px-3 py-2 text-sm ${active ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'}`}>
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-slate-700">{label}</Label>
      {children}
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{message}</div>;
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

function obtenerCuentaNombre(tipo: TipoCuenta, id: string, cuentas: CuentaBancaria[], cajas: CajaChica[]) {
  return tipo === 'banco'
    ? cuentas.find((item) => item.id === id)?.banco || ''
    : cajas.find((item) => item.id === id)?.nombre || '';
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value || 0);
}

const fieldClassName = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm';
