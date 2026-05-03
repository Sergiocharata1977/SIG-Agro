'use client';

import { useEffect, useMemo, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { PluginGate } from '@/components/plugins/PluginGate';
import { useAuth } from '@/contexts/AuthContext';
import { usePlugins } from '@/contexts/PluginsContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  actualizarEstadoChequeEmitido,
  actualizarEstadoChequeRecibido,
  crearChequeEmitido,
  crearChequeRecibido,
  obtenerChequesEmitidos,
  obtenerChequesRecibidos,
  obtenerResumenCheques,
} from '@/services/cheques';
import { obtenerCuentasBancarias } from '@/services/tesoreria';
import type {
  ChequeEmitido,
  ChequeRecibido,
  EstadoChequeEmitido,
  EstadoChequeRecibido,
  ResumenCheques,
} from '@/types/cheques';
import type { CuentaBancaria } from '@/types/tesoreria';

type Tab = 'emitidos' | 'recibidos';

const EMPTY_EMITIDO = {
  numeroCheque: '',
  banco: '',
  cuentaBancariaId: '',
  tipo: 'comun' as ChequeEmitido['tipo'],
  fechaEmision: new Date().toISOString().split('T')[0],
  fechaPago: new Date().toISOString().split('T')[0],
  monto: 0,
  beneficiario: '',
  concepto: '',
  notas: '',
};

const EMPTY_RECIBIDO = {
  numeroCheque: '',
  banco: '',
  tipo: 'comun' as ChequeRecibido['tipo'],
  fechaRecepcion: new Date().toISOString().split('T')[0],
  fechaPago: new Date().toISOString().split('T')[0],
  monto: 0,
  librador: '',
  concepto: '',
  notas: '',
};

export default function ChequesPage() {
  const { organizationId } = useAuth();
  const { isActive, loading: pluginsLoading } = usePlugins();

  const [tab, setTab] = useState<Tab>('emitidos');
  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState<ResumenCheques | null>(null);
  const [emitidos, setEmitidos] = useState<ChequeEmitido[]>([]);
  const [recibidos, setRecibidos] = useState<ChequeRecibido[]>([]);
  const [cuentas, setCuentas] = useState<CuentaBancaria[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [emitidoDialogOpen, setEmitidoDialogOpen] = useState(false);
  const [recibidoDialogOpen, setRecibidoDialogOpen] = useState(false);
  const [estadoDialogOpen, setEstadoDialogOpen] = useState(false);
  const [estadoTipo, setEstadoTipo] = useState<Tab>('emitidos');
  const [emitidoForm, setEmitidoForm] = useState(EMPTY_EMITIDO);
  const [recibidoForm, setRecibidoForm] = useState(EMPTY_RECIBIDO);
  const [estadoEmitido, setEstadoEmitido] = useState<EstadoChequeEmitido>('emitido');
  const [estadoRecibido, setEstadoRecibido] = useState<EstadoChequeRecibido>('en_cartera');
  const [estadoCuentaDepositoId, setEstadoCuentaDepositoId] = useState('');
  const [selectedEmitido, setSelectedEmitido] = useState<ChequeEmitido | null>(null);
  const [selectedRecibido, setSelectedRecibido] = useState<ChequeRecibido | null>(null);

  useEffect(() => {
    if (organizationId && isActive('tesoreria')) {
      void cargarDatos();
    }
  }, [organizationId, isActive]);

  async function cargarDatos() {
    if (!organizationId) return;
    setLoading(true);
    try {
      const [resumenData, emitidosData, recibidosData, cuentasData] = await Promise.all([
        obtenerResumenCheques(organizationId),
        obtenerChequesEmitidos(organizationId),
        obtenerChequesRecibidos(organizationId),
        obtenerCuentasBancarias(organizationId),
      ]);
      setResumen(resumenData);
      setEmitidos(emitidosData);
      setRecibidos(recibidosData);
      setCuentas(cuentasData);
    } finally {
      setLoading(false);
    }
  }

  async function handleCrearEmitido() {
    if (!organizationId || !emitidoForm.numeroCheque.trim() || !emitidoForm.cuentaBancariaId || emitidoForm.monto <= 0) {
      setError('Completa numero, cuenta y monto');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const cuenta = cuentas.find((item) => item.id === emitidoForm.cuentaBancariaId);
      await crearChequeEmitido(organizationId, {
        numeroCheque: emitidoForm.numeroCheque.trim(),
        banco: emitidoForm.banco.trim(),
        cuentaBancariaId: emitidoForm.cuentaBancariaId,
        cuentaBancariaNombre: cuenta?.banco || '',
        tipo: emitidoForm.tipo,
        fechaEmision: new Date(emitidoForm.fechaEmision),
        fechaPago: new Date(emitidoForm.fechaPago),
        monto: emitidoForm.monto,
        beneficiario: emitidoForm.beneficiario.trim(),
        concepto: emitidoForm.concepto.trim(),
        estado: 'emitido',
        notas: emitidoForm.notas.trim() || undefined,
      });
      setEmitidoDialogOpen(false);
      setEmitidoForm(EMPTY_EMITIDO);
      await cargarDatos();
    } finally {
      setGuardando(false);
    }
  }

  async function handleCrearRecibido() {
    if (!organizationId || !recibidoForm.numeroCheque.trim() || recibidoForm.monto <= 0) {
      setError('Completa numero y monto');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await crearChequeRecibido(organizationId, {
        numeroCheque: recibidoForm.numeroCheque.trim(),
        banco: recibidoForm.banco.trim(),
        tipo: recibidoForm.tipo,
        fechaRecepcion: new Date(recibidoForm.fechaRecepcion),
        fechaPago: new Date(recibidoForm.fechaPago),
        monto: recibidoForm.monto,
        librador: recibidoForm.librador.trim(),
        concepto: recibidoForm.concepto.trim(),
        estado: 'en_cartera',
        notas: recibidoForm.notas.trim() || undefined,
      });
      setRecibidoDialogOpen(false);
      setRecibidoForm(EMPTY_RECIBIDO);
      await cargarDatos();
    } finally {
      setGuardando(false);
    }
  }

  function abrirEstadoEmitido(item: ChequeEmitido) {
    setEstadoTipo('emitidos');
    setSelectedEmitido(item);
    setEstadoEmitido(item.estado);
    setError(null);
    setEstadoDialogOpen(true);
  }

  function abrirEstadoRecibido(item: ChequeRecibido) {
    setEstadoTipo('recibidos');
    setSelectedRecibido(item);
    setEstadoRecibido(item.estado);
    setEstadoCuentaDepositoId(item.cuentaDepositoId || '');
    setError(null);
    setEstadoDialogOpen(true);
  }

  async function handleCambiarEstado() {
    if (!organizationId) return;
    setGuardando(true);
    setError(null);
    try {
      if (estadoTipo === 'emitidos' && selectedEmitido) {
        await actualizarEstadoChequeEmitido(organizationId, selectedEmitido.id, estadoEmitido);
      }
      if (estadoTipo === 'recibidos' && selectedRecibido) {
        await actualizarEstadoChequeRecibido(
          organizationId,
          selectedRecibido.id,
          estadoRecibido,
          estadoRecibido === 'depositado' ? estadoCuentaDepositoId : undefined
        );
      }
      setEstadoDialogOpen(false);
      setSelectedEmitido(null);
      setSelectedRecibido(null);
      await cargarDatos();
    } finally {
      setGuardando(false);
    }
  }

  const vencenWarn = (resumen?.vencenEsta7Dias ?? 0) > 0;

  if (!organizationId) return <div className="p-6">Selecciona una organizacion para continuar.</div>;
  if (pluginsLoading) return <div className="p-6">Cargando cheques...</div>;

  return (
    <PluginGate pluginId="tesoreria" isActive={isActive('tesoreria')}>
      <PageShell title="Cheques" subtitle="Seguimiento de cheques emitidos y recibidos.">
        <div className="grid gap-4 md:grid-cols-3">
          <Kpi title="Emitidos pendientes" value={resumen?.emitidosPendientes ?? 0} subtitle={formatMoney(resumen?.emitidosMonto ?? 0)} />
          <Kpi title="En cartera" value={resumen?.recibidosEnCartera ?? 0} subtitle={formatMoney(resumen?.recibidosMonto ?? 0)} />
          <Kpi title="Vencen esta semana" value={resumen?.vencenEsta7Dias ?? 0} warn={vencenWarn} />
        </div>

        <section className="flex gap-2">
          <TabButton active={tab === 'emitidos'} onClick={() => setTab('emitidos')}>Emitidos</TabButton>
          <TabButton active={tab === 'recibidos'} onClick={() => setTab('recibidos')}>Recibidos</TabButton>
        </section>

        {tab === 'emitidos' ? (
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-4 flex justify-end">
              <button onClick={() => { setError(null); setEmitidoDialogOpen(true); }} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white inline-flex items-center gap-2">
                <PlusCircle className="w-4 h-4" /> Nuevo cheque emitido
              </button>
            </div>
            {loading ? <p className="text-sm text-slate-500">Cargando...</p> : (
              <table className="w-full text-sm">
                <thead className="text-left text-slate-500">
                  <tr>
                    <th className="pb-3">N° Cheque</th>
                    <th className="pb-3">Banco</th>
                    <th className="pb-3">Fecha pago</th>
                    <th className="pb-3">Beneficiario</th>
                    <th className="pb-3">Monto</th>
                    <th className="pb-3">Estado</th>
                    <th className="pb-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {emitidos.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="py-3">{item.numeroCheque}</td>
                      <td>{item.banco}</td>
                      <td>{new Date(item.fechaPago).toLocaleDateString('es-AR')}</td>
                      <td>{item.beneficiario}</td>
                      <td>{formatMoney(item.monto)}</td>
                      <td><BadgeEstado estado={item.estado} /></td>
                      <td><button onClick={() => abrirEstadoEmitido(item)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs">Cambiar estado</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        ) : (
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-4 flex justify-end">
              <button onClick={() => { setError(null); setRecibidoDialogOpen(true); }} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white inline-flex items-center gap-2">
                <PlusCircle className="w-4 h-4" /> Nuevo cheque recibido
              </button>
            </div>
            {loading ? <p className="text-sm text-slate-500">Cargando...</p> : (
              <table className="w-full text-sm">
                <thead className="text-left text-slate-500">
                  <tr>
                    <th className="pb-3">N° Cheque</th>
                    <th className="pb-3">Banco</th>
                    <th className="pb-3">Fecha pago</th>
                    <th className="pb-3">Librador</th>
                    <th className="pb-3">Monto</th>
                    <th className="pb-3">Estado</th>
                    <th className="pb-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {recibidos.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="py-3">{item.numeroCheque}</td>
                      <td>{item.banco}</td>
                      <td>{new Date(item.fechaPago).toLocaleDateString('es-AR')}</td>
                      <td>{item.librador}</td>
                      <td>{formatMoney(item.monto)}</td>
                      <td><BadgeEstado estado={item.estado} /></td>
                      <td><button onClick={() => abrirEstadoRecibido(item)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs">Cambiar estado</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        <Dialog open={emitidoDialogOpen} onOpenChange={setEmitidoDialogOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>Nuevo cheque emitido</DialogTitle></DialogHeader>
            <div className="space-y-4">
              {error ? <ErrorBox message={error} /> : null}
              <Field label="Numero cheque"><input value={emitidoForm.numeroCheque} onChange={(e) => setEmitidoForm((prev) => ({ ...prev, numeroCheque: e.target.value }))} className={fieldClassName} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Banco"><input value={emitidoForm.banco} onChange={(e) => setEmitidoForm((prev) => ({ ...prev, banco: e.target.value }))} className={fieldClassName} /></Field>
                <Field label="Cuenta bancaria"><select value={emitidoForm.cuentaBancariaId} onChange={(e) => setEmitidoForm((prev) => ({ ...prev, cuentaBancariaId: e.target.value }))} className={fieldClassName}><option value="">Seleccionar</option>{cuentas.map((cuenta) => <option key={cuenta.id} value={cuenta.id}>{cuenta.banco} - {cuenta.numeroCuenta}</option>)}</select></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tipo"><select value={emitidoForm.tipo} onChange={(e) => setEmitidoForm((prev) => ({ ...prev, tipo: e.target.value as ChequeEmitido['tipo'] }))} className={fieldClassName}><option value="comun">Comun</option><option value="diferido">Diferido</option></select></Field>
                <Field label="Monto"><input type="number" min={0} step="0.01" value={emitidoForm.monto} onChange={(e) => setEmitidoForm((prev) => ({ ...prev, monto: Number(e.target.value) }))} className={fieldClassName} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fecha emision"><input type="date" value={emitidoForm.fechaEmision} onChange={(e) => setEmitidoForm((prev) => ({ ...prev, fechaEmision: e.target.value }))} className={fieldClassName} /></Field>
                <Field label="Fecha pago"><input type="date" value={emitidoForm.fechaPago} onChange={(e) => setEmitidoForm((prev) => ({ ...prev, fechaPago: e.target.value }))} className={fieldClassName} /></Field>
              </div>
              <Field label="Beneficiario"><input value={emitidoForm.beneficiario} onChange={(e) => setEmitidoForm((prev) => ({ ...prev, beneficiario: e.target.value }))} className={fieldClassName} /></Field>
              <Field label="Concepto"><input value={emitidoForm.concepto} onChange={(e) => setEmitidoForm((prev) => ({ ...prev, concepto: e.target.value }))} className={fieldClassName} /></Field>
              <Field label="Notas"><textarea value={emitidoForm.notas} onChange={(e) => setEmitidoForm((prev) => ({ ...prev, notas: e.target.value }))} className={fieldClassName} rows={3} /></Field>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setEmitidoDialogOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Cancelar</button>
                <button type="button" onClick={() => void handleCrearEmitido()} disabled={guardando} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-60">{guardando ? 'Guardando...' : 'Crear cheque'}</button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={recibidoDialogOpen} onOpenChange={setRecibidoDialogOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>Nuevo cheque recibido</DialogTitle></DialogHeader>
            <div className="space-y-4">
              {error ? <ErrorBox message={error} /> : null}
              <Field label="Numero cheque"><input value={recibidoForm.numeroCheque} onChange={(e) => setRecibidoForm((prev) => ({ ...prev, numeroCheque: e.target.value }))} className={fieldClassName} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Banco"><input value={recibidoForm.banco} onChange={(e) => setRecibidoForm((prev) => ({ ...prev, banco: e.target.value }))} className={fieldClassName} /></Field>
                <Field label="Tipo"><select value={recibidoForm.tipo} onChange={(e) => setRecibidoForm((prev) => ({ ...prev, tipo: e.target.value as ChequeRecibido['tipo'] }))} className={fieldClassName}><option value="comun">Comun</option><option value="diferido">Diferido</option></select></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fecha recepcion"><input type="date" value={recibidoForm.fechaRecepcion} onChange={(e) => setRecibidoForm((prev) => ({ ...prev, fechaRecepcion: e.target.value }))} className={fieldClassName} /></Field>
                <Field label="Fecha pago"><input type="date" value={recibidoForm.fechaPago} onChange={(e) => setRecibidoForm((prev) => ({ ...prev, fechaPago: e.target.value }))} className={fieldClassName} /></Field>
              </div>
              <Field label="Monto"><input type="number" min={0} step="0.01" value={recibidoForm.monto} onChange={(e) => setRecibidoForm((prev) => ({ ...prev, monto: Number(e.target.value) }))} className={fieldClassName} /></Field>
              <Field label="Librador"><input value={recibidoForm.librador} onChange={(e) => setRecibidoForm((prev) => ({ ...prev, librador: e.target.value }))} className={fieldClassName} /></Field>
              <Field label="Concepto"><input value={recibidoForm.concepto} onChange={(e) => setRecibidoForm((prev) => ({ ...prev, concepto: e.target.value }))} className={fieldClassName} /></Field>
              <Field label="Notas"><textarea value={recibidoForm.notas} onChange={(e) => setRecibidoForm((prev) => ({ ...prev, notas: e.target.value }))} className={fieldClassName} rows={3} /></Field>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setRecibidoDialogOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Cancelar</button>
                <button type="button" onClick={() => void handleCrearRecibido()} disabled={guardando} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-60">{guardando ? 'Guardando...' : 'Crear cheque'}</button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={estadoDialogOpen} onOpenChange={setEstadoDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Cambiar estado</DialogTitle></DialogHeader>
            <div className="space-y-4">
              {error ? <ErrorBox message={error} /> : null}
              {estadoTipo === 'emitidos' ? (
                <Field label="Estado">
                  <select value={estadoEmitido} onChange={(e) => setEstadoEmitido(e.target.value as EstadoChequeEmitido)} className={fieldClassName}>
                    <option value="emitido">Emitido</option>
                    <option value="presentado">Presentado</option>
                    <option value="debitado">Debitado</option>
                    <option value="rechazado">Rechazado</option>
                    <option value="anulado">Anulado</option>
                  </select>
                </Field>
              ) : (
                <>
                  <Field label="Estado">
                    <select value={estadoRecibido} onChange={(e) => setEstadoRecibido(e.target.value as EstadoChequeRecibido)} className={fieldClassName}>
                      <option value="en_cartera">En cartera</option>
                      <option value="depositado">Depositado</option>
                      <option value="al_cobro">Al cobro</option>
                      <option value="cobrado">Cobrado</option>
                      <option value="rechazado">Rechazado</option>
                      <option value="endosado">Endosado</option>
                      <option value="anulado">Anulado</option>
                    </select>
                  </Field>
                  {estadoRecibido === 'depositado' && (
                    <Field label="Cuenta destino">
                      <select value={estadoCuentaDepositoId} onChange={(e) => setEstadoCuentaDepositoId(e.target.value)} className={fieldClassName}>
                        <option value="">Seleccionar cuenta</option>
                        {cuentas.map((cuenta) => <option key={cuenta.id} value={cuenta.id}>{cuenta.banco} - {cuenta.numeroCuenta}</option>)}
                      </select>
                    </Field>
                  )}
                </>
              )}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setEstadoDialogOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Cancelar</button>
                <button type="button" onClick={() => void handleCambiarEstado()} disabled={guardando} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-60">Confirmar</button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </PageShell>
    </PluginGate>
  );
}

function Kpi({ title, value, subtitle, warn = false }: { title: string; value: number; subtitle?: string; warn?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${warn ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-white'}`}>
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
      {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={`rounded-lg px-3 py-2 text-sm ${active ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'}`}>{children}</button>;
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

function BadgeEstado({ estado }: { estado: string }) {
  const className =
    estado === 'emitido' || estado === 'en_cartera'
      ? 'bg-blue-100 text-blue-700'
      : estado === 'debitado' || estado === 'cobrado' || estado === 'depositado'
        ? 'bg-emerald-100 text-emerald-700'
        : estado === 'rechazado'
          ? 'bg-rose-100 text-rose-700'
          : 'bg-slate-100 text-slate-700';
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>{estado}</span>;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value || 0);
}

const fieldClassName = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm';
