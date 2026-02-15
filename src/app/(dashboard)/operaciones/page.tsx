'use client';

import { useEffect, useMemo, useState } from 'react';
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
  PageToolbar,
  Section,
} from '@/components/design-system';
import { PageShell } from '@/components/layout/PageShell';
import { useAuth } from '@/contexts/AuthContext';
import { obtenerTerceros } from '@/services/terceros';
import { generarAsientoAutomatico } from '@/services/asientos-auto';
import type { MedioPago, Tercero, TipoInsumo } from '@/types/contabilidad-simple';

type OperacionActiva = 'compra' | 'cobro' | 'pago' | null;

export default function OperacionesPage() {
  const { user } = useAuth();

  const [terceros, setTerceros] = useState<Tercero[]>([]);
  const [loading, setLoading] = useState(true);
  const [operacionActiva, setOperacionActiva] = useState<OperacionActiva>(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  const [formCompra, setFormCompra] = useState({
    terceroId: '',
    tipoInsumo: 'fertilizante' as TipoInsumo,
    productoNombre: '',
    cantidad: '',
    precioUnitario: '',
    fecha: new Date().toISOString().split('T')[0],
    observaciones: '',
  });

  const [formCobro, setFormCobro] = useState({
    terceroId: '',
    monto: '',
    medioPago: 'transferencia' as MedioPago,
    fecha: new Date().toISOString().split('T')[0],
    observaciones: '',
  });

  const [formPago, setFormPago] = useState({
    terceroId: '',
    monto: '',
    medioPago: 'transferencia' as MedioPago,
    fecha: new Date().toISOString().split('T')[0],
    observaciones: '',
  });

  useEffect(() => {
    if (user?.organizationId) {
      void cargarTerceros();
    }
  }, [user]);

  async function cargarTerceros() {
    if (!user?.organizationId) return;
    try {
      setLoading(true);
      const data = await obtenerTerceros(user.organizationId);
      setTerceros(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  function mostrarMensaje(tipo: 'success' | 'error', texto: string) {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 4000);
  }

  async function handleCompra(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.organizationId) return;

    setGuardando(true);
    try {
      const operacionId = `compra_${Date.now()}`;
      await generarAsientoAutomatico(
        user.organizationId,
        'compra_insumo',
        {
          terceroId: formCompra.terceroId,
          tipoInsumo: formCompra.tipoInsumo,
          productoNombre: formCompra.productoNombre,
          cantidad: parseFloat(formCompra.cantidad || '0'),
          precioUnitario: parseFloat(formCompra.precioUnitario || '0'),
          fecha: new Date(formCompra.fecha),
          observaciones: formCompra.observaciones,
        },
        operacionId
      );

      mostrarMensaje('success', 'Compra registrada correctamente');
      setOperacionActiva(null);
      setFormCompra({
        terceroId: '',
        tipoInsumo: 'fertilizante',
        productoNombre: '',
        cantidad: '',
        precioUnitario: '',
        fecha: new Date().toISOString().split('T')[0],
        observaciones: '',
      });
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('error', 'Error al registrar la compra');
    } finally {
      setGuardando(false);
    }
  }

  async function handleCobro(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.organizationId) return;

    setGuardando(true);
    try {
      const operacionId = `cobro_${Date.now()}`;
      await generarAsientoAutomatico(
        user.organizationId,
        'cobro',
        {
          terceroId: formCobro.terceroId,
          monto: parseFloat(formCobro.monto || '0'),
          medioPago: formCobro.medioPago,
          fecha: new Date(formCobro.fecha),
          observaciones: formCobro.observaciones,
        },
        operacionId
      );

      mostrarMensaje('success', 'Cobro registrado correctamente');
      setOperacionActiva(null);
      setFormCobro({
        terceroId: '',
        monto: '',
        medioPago: 'transferencia',
        fecha: new Date().toISOString().split('T')[0],
        observaciones: '',
      });
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('error', 'Error al registrar el cobro');
    } finally {
      setGuardando(false);
    }
  }

  async function handlePago(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.organizationId) return;

    setGuardando(true);
    try {
      const operacionId = `pago_${Date.now()}`;
      await generarAsientoAutomatico(
        user.organizationId,
        'pago',
        {
          terceroId: formPago.terceroId,
          monto: parseFloat(formPago.monto || '0'),
          medioPago: formPago.medioPago,
          fecha: new Date(formPago.fecha),
          observaciones: formPago.observaciones,
        },
        operacionId
      );

      mostrarMensaje('success', 'Pago registrado correctamente');
      setOperacionActiva(null);
      setFormPago({
        terceroId: '',
        monto: '',
        medioPago: 'transferencia',
        fecha: new Date().toISOString().split('T')[0],
        observaciones: '',
      });
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('error', 'Error al registrar el pago');
    } finally {
      setGuardando(false);
    }
  }

  const proveedores = useMemo(
    () => terceros.filter(t => t.tipo === 'proveedor' || t.tipo === 'ambos'),
    [terceros]
  );
  const clientes = useMemo(
    () => terceros.filter(t => t.tipo === 'cliente' || t.tipo === 'ambos'),
    [terceros]
  );

  if (loading) {
    return (
      <PageShell title="Operaciones" subtitle="Registrar compras, cobros y pagos">
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Cargando...</div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Operaciones" subtitle="Registrar compras, cobros y pagos">
      {mensaje && (
        <div className={`rounded-lg px-4 py-3 text-sm ${mensaje.tipo === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
          {mensaje.texto}
        </div>
      )}

      <PageToolbar
        actions={
          operacionActiva ? (
            <BaseButton variant="outline" onClick={() => setOperacionActiva(null)}>
              Volver al menu
            </BaseButton>
          ) : null
        }
      />

      {!operacionActiva && (
        <Section title="Tipos de operacion" description="Selecciona el flujo contable que queres registrar.">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ActionCard title="Compra de insumos" subtitle="Debe Insumos / Haber Proveedores" icon="🛒" onClick={() => setOperacionActiva('compra')} />
            <ActionCard title="Cobro a cliente" subtitle="Debe Caja-Banco / Haber Clientes" icon="💰" onClick={() => setOperacionActiva('cobro')} />
            <ActionCard title="Pago a proveedor" subtitle="Debe Proveedores / Haber Caja-Banco" icon="💸" onClick={() => setOperacionActiva('pago')} />
          </div>
        </Section>
      )}

      {operacionActiva === 'compra' && (
        <Section title="Compra de insumos" description="Registro operativo con asiento automatico.">
          <BaseCard>
            <form onSubmit={handleCompra} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField label="Proveedor" value={formCompra.terceroId} onChange={value => setFormCompra({ ...formCompra, terceroId: value })} required>
                  {proveedores.map(t => <BaseSelectItem key={t.id} value={t.id}>{t.nombre}</BaseSelectItem>)}
                </SelectField>

                <SelectField label="Tipo de insumo" value={formCompra.tipoInsumo} onChange={value => setFormCompra({ ...formCompra, tipoInsumo: value as TipoInsumo })}>
                  <BaseSelectItem value="semilla">Semilla</BaseSelectItem>
                  <BaseSelectItem value="fertilizante">Fertilizante</BaseSelectItem>
                  <BaseSelectItem value="agroquimico">Agroquimico</BaseSelectItem>
                  <BaseSelectItem value="combustible">Combustible</BaseSelectItem>
                  <BaseSelectItem value="otro">Otro</BaseSelectItem>
                </SelectField>
              </div>

              <InputField label="Producto" value={formCompra.productoNombre} onChange={value => setFormCompra({ ...formCompra, productoNombre: value })} required placeholder="Ej: Urea granulada" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputField label="Cantidad" type="number" min={0} step="0.01" value={formCompra.cantidad} onChange={value => setFormCompra({ ...formCompra, cantidad: value })} required />
                <InputField label="Precio unitario" type="number" min={0} step="0.01" value={formCompra.precioUnitario} onChange={value => setFormCompra({ ...formCompra, precioUnitario: value })} required />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Total</label>
                  <div className="h-10 rounded-md border border-slate-200 bg-slate-50 px-3 flex items-center text-sm font-semibold text-slate-800">
                    $ {((parseFloat(formCompra.cantidad || '0') || 0) * (parseFloat(formCompra.precioUnitario || '0') || 0)).toLocaleString('es-AR')}
                  </div>
                </div>
              </div>

              <InputField label="Fecha" type="date" value={formCompra.fecha} onChange={value => setFormCompra({ ...formCompra, fecha: value })} required />

              <div className="flex justify-end gap-2 pt-1">
                <BaseButton type="button" variant="outline" onClick={() => setOperacionActiva(null)}>Cancelar</BaseButton>
                <BaseButton type="submit" disabled={guardando}>{guardando ? 'Guardando...' : 'Registrar compra'}</BaseButton>
              </div>
            </form>
          </BaseCard>
        </Section>
      )}

      {operacionActiva === 'cobro' && (
        <Section title="Cobro a cliente" description="Registro de ingreso y asiento automatico.">
          <BaseCard>
            <form onSubmit={handleCobro} className="space-y-4">
              <SelectField label="Cliente" value={formCobro.terceroId} onChange={value => setFormCobro({ ...formCobro, terceroId: value })} required>
                {clientes.map(t => <BaseSelectItem key={t.id} value={t.id}>{t.nombre}</BaseSelectItem>)}
              </SelectField>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Monto" type="number" min={0} step="0.01" value={formCobro.monto} onChange={value => setFormCobro({ ...formCobro, monto: value })} required />

                <SelectField label="Medio de pago" value={formCobro.medioPago} onChange={value => setFormCobro({ ...formCobro, medioPago: value as MedioPago })}>
                  <BaseSelectItem value="efectivo">Efectivo</BaseSelectItem>
                  <BaseSelectItem value="transferencia">Transferencia</BaseSelectItem>
                  <BaseSelectItem value="cheque">Cheque</BaseSelectItem>
                </SelectField>
              </div>

              <InputField label="Fecha" type="date" value={formCobro.fecha} onChange={value => setFormCobro({ ...formCobro, fecha: value })} required />

              <div className="flex justify-end gap-2 pt-1">
                <BaseButton type="button" variant="outline" onClick={() => setOperacionActiva(null)}>Cancelar</BaseButton>
                <BaseButton type="submit" disabled={guardando}>{guardando ? 'Guardando...' : 'Registrar cobro'}</BaseButton>
              </div>
            </form>
          </BaseCard>
        </Section>
      )}

      {operacionActiva === 'pago' && (
        <Section title="Pago a proveedor" description="Registro de egreso y asiento automatico.">
          <BaseCard>
            <form onSubmit={handlePago} className="space-y-4">
              <SelectField label="Proveedor" value={formPago.terceroId} onChange={value => setFormPago({ ...formPago, terceroId: value })} required>
                {proveedores.map(t => <BaseSelectItem key={t.id} value={t.id}>{t.nombre}</BaseSelectItem>)}
              </SelectField>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Monto" type="number" min={0} step="0.01" value={formPago.monto} onChange={value => setFormPago({ ...formPago, monto: value })} required />

                <SelectField label="Medio de pago" value={formPago.medioPago} onChange={value => setFormPago({ ...formPago, medioPago: value as MedioPago })}>
                  <BaseSelectItem value="efectivo">Efectivo</BaseSelectItem>
                  <BaseSelectItem value="transferencia">Transferencia</BaseSelectItem>
                  <BaseSelectItem value="cheque">Cheque</BaseSelectItem>
                </SelectField>
              </div>

              <InputField label="Fecha" type="date" value={formPago.fecha} onChange={value => setFormPago({ ...formPago, fecha: value })} required />

              <div className="flex justify-end gap-2 pt-1">
                <BaseButton type="button" variant="outline" onClick={() => setOperacionActiva(null)}>Cancelar</BaseButton>
                <BaseButton type="submit" disabled={guardando}>{guardando ? 'Guardando...' : 'Registrar pago'}</BaseButton>
              </div>
            </form>
          </BaseCard>
        </Section>
      )}
    </PageShell>
  );
}

function ActionCard({ title, subtitle, icon, onClick }: { title: string; subtitle: string; icon: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-left">
      <BaseCard>
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center text-2xl">{icon}</div>
          <div>
            <p className="font-semibold text-slate-900">{title}</p>
            <p className="text-sm text-slate-600">{subtitle}</p>
          </div>
        </div>
      </BaseCard>
    </button>
  );
}

function InputField({
  label,
  value,
  onChange,
  required,
  type = 'text',
  placeholder,
  min,
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
  min?: number;
  step?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}{required ? ' *' : ''}</label>
      <BaseInput
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        min={min}
        step={step}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  required,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}{required ? ' *' : ''}</label>
      <BaseSelect value={value} onValueChange={onChange}>
        <BaseSelectTrigger>
          <BaseSelectValue placeholder="Seleccionar..." />
        </BaseSelectTrigger>
        <BaseSelectContent>{children}</BaseSelectContent>
      </BaseSelect>
    </div>
  );
}
