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
import { listOperationsByOrg } from '@/services/operations-registry';
import { obtenerFields } from '@/services/fields';
import { obtenerPlots } from '@/services/plots';
import type { Field, Plot } from '@/types/sig-agro';
import type { MedioPago, OperationRecord, Tercero, TipoInsumo } from '@/types/contabilidad-simple';

type OperacionActiva = 'compra' | 'aplicacion' | 'cosecha' | 'entrega' | 'cobro' | 'pago' | null;

const defaultDate = () => new Date().toISOString().split('T')[0];

export default function OperacionesPage() {
  const { user, organization } = useAuth();

  const [terceros, setTerceros] = useState<Tercero[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [operations, setOperations] = useState<OperationRecord[]>([]);
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
    depositoId: '',
    campaniaId: '',
    campoId: '',
    loteId: '',
    fecha: defaultDate(),
    observaciones: '',
  });

  const [formAplicacion, setFormAplicacion] = useState({
    campoId: '',
    loteId: '',
    campaniaId: '',
    tipoInsumo: 'fertilizante' as TipoInsumo,
    productoNombre: '',
    cantidad: '',
    valorUnitario: '',
    fecha: defaultDate(),
    observaciones: '',
  });

  const [formCosecha, setFormCosecha] = useState({
    campoId: '',
    loteId: '',
    campaniaId: '',
    cultivo: '',
    cantidad: '',
    unidad: 'tn' as 'kg' | 'tn',
    siloDestinoId: '',
    fecha: defaultDate(),
    observaciones: '',
  });

  const [formEntrega, setFormEntrega] = useState({
    terceroId: '',
    tipoGrano: '',
    cantidad: '',
    unidad: 'tn' as 'kg' | 'tn',
    siloOrigenId: '',
    campaniaId: '',
    campoId: '',
    loteId: '',
    esVenta: false,
    precioUnitario: '',
    cartaPorte: '',
    fecha: defaultDate(),
    observaciones: '',
  });

  const [formCobro, setFormCobro] = useState({
    terceroId: '',
    monto: '',
    medioPago: 'transferencia' as MedioPago,
    fecha: defaultDate(),
    observaciones: '',
  });

  const [formPago, setFormPago] = useState({
    terceroId: '',
    monto: '',
    medioPago: 'transferencia' as MedioPago,
    fecha: defaultDate(),
    observaciones: '',
  });

  const productorId = organization?.createdBy || user?.id || user?.email || 'unknown';

  useEffect(() => {
    if (user?.organizationId) {
      void cargarDatosBase();
    }
  }, [user?.organizationId]);

  async function cargarDatosBase() {
    if (!user?.organizationId) return;
    try {
      setLoading(true);
      const [tercerosData, fieldsData, plotsData, operationsData] = await Promise.all([
        obtenerTerceros(user.organizationId),
        obtenerFields(user.organizationId, { activo: true }),
        obtenerPlots(user.organizationId, { activo: true }),
        listOperationsByOrg(user.organizationId, 40),
      ]);
      setTerceros(tercerosData);
      setFields(fieldsData);
      setPlots(plotsData);
      setOperations(operationsData);
    } catch (error) {
      console.error(error);
      mostrarMensaje('error', 'Error cargando datos base');
    } finally {
      setLoading(false);
    }
  }

  function mostrarMensaje(tipo: 'success' | 'error', texto: string) {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 5000);
  }

  function ctx(tipo: string) {
    return {
      productorId,
      userId: user?.id || user?.email || 'system',
      requestId: `${tipo}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    };
  }

  async function ejecutar(tipo: string, cb: () => Promise<void>, okMessage: string) {
    setGuardando(true);
    try {
      await cb();
      mostrarMensaje('success', okMessage);
      setOperacionActiva(null);
      await cargarDatosBase();
    } catch (error) {
      console.error(error);
      mostrarMensaje('error', error instanceof Error ? error.message : 'Error registrando operacion');
    } finally {
      setGuardando(false);
    }
  }

  async function handleCompra(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.organizationId) return;
    await ejecutar('compra', async () => {
      await generarAsientoAutomatico(
        user.organizationId,
        'compra_insumo',
        {
          terceroId: formCompra.terceroId,
          tipoInsumo: formCompra.tipoInsumo,
          productoNombre: formCompra.productoNombre,
          cantidad: parseFloat(formCompra.cantidad || '0'),
          precioUnitario: parseFloat(formCompra.precioUnitario || '0'),
          depositoId: formCompra.depositoId || undefined,
          campaniaId: formCompra.campaniaId || undefined,
          campoId: formCompra.campoId || undefined,
          loteId: formCompra.loteId || undefined,
          fecha: new Date(formCompra.fecha),
          observaciones: formCompra.observaciones,
        },
        `compra_${Date.now()}`,
        ctx('compra_insumo')
      );
      setFormCompra({ ...formCompra, terceroId: '', productoNombre: '', cantidad: '', precioUnitario: '', depositoId: '', fecha: defaultDate(), observaciones: '' });
    }, 'Compra registrada con asiento automatico');
  }

  async function handleAplicacion(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.organizationId) return;
    await ejecutar('aplicacion', async () => {
      await generarAsientoAutomatico(
        user.organizationId,
        'aplicacion_insumo',
        {
          campoId: formAplicacion.campoId,
          loteId: formAplicacion.loteId,
          campaniaId: formAplicacion.campaniaId || undefined,
          tipoInsumo: formAplicacion.tipoInsumo,
          productoNombre: formAplicacion.productoNombre,
          cantidad: parseFloat(formAplicacion.cantidad || '0'),
          valorUnitario: parseFloat(formAplicacion.valorUnitario || '0'),
          fecha: new Date(formAplicacion.fecha),
          observaciones: formAplicacion.observaciones,
        },
        `aplicacion_${Date.now()}`,
        ctx('aplicacion_insumo')
      );
      setFormAplicacion({ ...formAplicacion, productoNombre: '', cantidad: '', valorUnitario: '', fecha: defaultDate(), observaciones: '' });
    }, 'Aplicacion registrada con asiento automatico');
  }

  async function handleCosecha(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.organizationId) return;
    await ejecutar('cosecha', async () => {
      await generarAsientoAutomatico(
        user.organizationId,
        'cosecha',
        {
          campoId: formCosecha.campoId,
          loteId: formCosecha.loteId,
          campaniaId: formCosecha.campaniaId || undefined,
          cultivo: formCosecha.cultivo,
          cantidad: parseFloat(formCosecha.cantidad || '0'),
          unidad: formCosecha.unidad,
          siloDestinoId: formCosecha.siloDestinoId || undefined,
          fecha: new Date(formCosecha.fecha),
          observaciones: formCosecha.observaciones,
        },
        `cosecha_${Date.now()}`,
        ctx('cosecha')
      );
      setFormCosecha({ ...formCosecha, cultivo: '', cantidad: '', siloDestinoId: '', fecha: defaultDate(), observaciones: '' });
    }, 'Cosecha registrada con asiento automatico');
  }

  async function handleEntrega(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.organizationId) return;
    await ejecutar('entrega', async () => {
      await generarAsientoAutomatico(
        user.organizationId,
        'entrega_acopiador',
        {
          terceroId: formEntrega.terceroId,
          tipoGrano: formEntrega.tipoGrano,
          cantidad: parseFloat(formEntrega.cantidad || '0'),
          unidad: formEntrega.unidad,
          siloOrigenId: formEntrega.siloOrigenId || undefined,
          campaniaId: formEntrega.campaniaId || undefined,
          campoId: formEntrega.campoId || undefined,
          loteId: formEntrega.loteId || undefined,
          esVenta: formEntrega.esVenta,
          precioUnitario: formEntrega.esVenta ? parseFloat(formEntrega.precioUnitario || '0') : undefined,
          fecha: new Date(formEntrega.fecha),
          cartaPorte: formEntrega.cartaPorte || undefined,
          observaciones: formEntrega.observaciones,
        },
        `entrega_${Date.now()}`,
        ctx('entrega_acopiador')
      );
      setFormEntrega({ ...formEntrega, tipoGrano: '', cantidad: '', siloOrigenId: '', precioUnitario: '', cartaPorte: '', fecha: defaultDate(), observaciones: '' });
    }, 'Entrega registrada con asiento automatico');
  }

  async function handleCobro(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.organizationId) return;
    await ejecutar('cobro', async () => {
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
        `cobro_${Date.now()}`,
        ctx('cobro')
      );
      setFormCobro({ ...formCobro, terceroId: '', monto: '', fecha: defaultDate(), observaciones: '' });
    }, 'Cobro registrado');
  }

  async function handlePago(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.organizationId) return;
    await ejecutar('pago', async () => {
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
        `pago_${Date.now()}`,
        ctx('pago')
      );
      setFormPago({ ...formPago, terceroId: '', monto: '', fecha: defaultDate(), observaciones: '' });
    }, 'Pago registrado');
  }

  const proveedores = useMemo(() => terceros.filter(t => t.tipo === 'proveedor' || t.tipo === 'ambos'), [terceros]);
  const clientes = useMemo(() => terceros.filter(t => t.tipo === 'cliente' || t.tipo === 'ambos'), [terceros]);
  const acopiadores = proveedores;

  const compraLotes = useMemo(() => plots.filter(p => !formCompra.campoId || p.fieldId === formCompra.campoId), [plots, formCompra.campoId]);
  const aplicacionLotes = useMemo(() => plots.filter(p => !formAplicacion.campoId || p.fieldId === formAplicacion.campoId), [plots, formAplicacion.campoId]);
  const cosechaLotes = useMemo(() => plots.filter(p => !formCosecha.campoId || p.fieldId === formCosecha.campoId), [plots, formCosecha.campoId]);
  const entregaLotes = useMemo(() => plots.filter(p => !formEntrega.campoId || p.fieldId === formEntrega.campoId), [plots, formEntrega.campoId]);

  if (loading) {
    return (
      <PageShell title="Operaciones" subtitle="Formularios agro + contabilidad automatica">
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Cargando...</div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Operaciones" subtitle="Registro operativo contable por formulario">
      {mensaje && (
        <div className={`rounded-lg px-4 py-3 text-sm ${mensaje.tipo === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
          {mensaje.texto}
        </div>
      )}

      <PageToolbar actions={operacionActiva ? <BaseButton variant="outline" onClick={() => setOperacionActiva(null)}>Volver al menu</BaseButton> : null} />

      {!operacionActiva && (
        <Section title="Formularios operativos" description="Cada registro genera automaticamente doble partida y trazabilidad por organizacion/productor.">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ActionCard title="Compra de insumos" subtitle="Debe Insumos / Haber Proveedores" onClick={() => setOperacionActiva('compra')} />
            <ActionCard title="Aplicacion de insumos" subtitle="Debe Cultivo en preparacion / Haber Insumos" onClick={() => setOperacionActiva('aplicacion')} />
            <ActionCard title="Registro de cosecha" subtitle="Debe Stock granos / Haber Cultivos en preparacion" onClick={() => setOperacionActiva('cosecha')} />
            <ActionCard title="Entrega a acopiador" subtitle="Consignacion o venta directa" onClick={() => setOperacionActiva('entrega')} />
            <ActionCard title="Cobro" subtitle="Debe Caja/Banco / Haber Clientes" onClick={() => setOperacionActiva('cobro')} />
            <ActionCard title="Pago" subtitle="Debe Proveedores / Haber Caja/Banco" onClick={() => setOperacionActiva('pago')} />
          </div>
        </Section>
      )}

      {operacionActiva === 'compra' && (
        <Section title="Compra de insumos" description="Registro de compra con deposito destino.">
          <BaseCard><form onSubmit={handleCompra} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField label="Proveedor" value={formCompra.terceroId} onChange={v => setFormCompra({ ...formCompra, terceroId: v })} required>{proveedores.map(t => <BaseSelectItem key={t.id} value={t.id}>{t.nombre}</BaseSelectItem>)}</SelectField>
              <SelectField label="Tipo insumo" value={formCompra.tipoInsumo} onChange={v => setFormCompra({ ...formCompra, tipoInsumo: v as TipoInsumo })}><BaseSelectItem value="semilla">Semilla</BaseSelectItem><BaseSelectItem value="fertilizante">Fertilizante</BaseSelectItem><BaseSelectItem value="agroquimico">Agroquimico</BaseSelectItem><BaseSelectItem value="combustible">Combustible</BaseSelectItem><BaseSelectItem value="otro">Otro</BaseSelectItem></SelectField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField label="Producto" value={formCompra.productoNombre} onChange={v => setFormCompra({ ...formCompra, productoNombre: v })} required />
              <InputField label="Cantidad" type="number" value={formCompra.cantidad} onChange={v => setFormCompra({ ...formCompra, cantidad: v })} required />
              <InputField label="Precio unitario" type="number" value={formCompra.precioUnitario} onChange={v => setFormCompra({ ...formCompra, precioUnitario: v })} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField label="Deposio destino" value={formCompra.depositoId} onChange={v => setFormCompra({ ...formCompra, depositoId: v })} placeholder="deposito-insumos-1" />
              <SelectField label="Campo" value={formCompra.campoId} onChange={v => setFormCompra({ ...formCompra, campoId: v, loteId: '' })}>{fields.map(f => <BaseSelectItem key={f.id} value={f.id}>{f.nombre}</BaseSelectItem>)}</SelectField>
              <SelectField label="Lote" value={formCompra.loteId} onChange={v => setFormCompra({ ...formCompra, loteId: v })}>{compraLotes.map(l => <BaseSelectItem key={l.id} value={l.id}>{l.nombre}</BaseSelectItem>)}</SelectField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Campana" value={formCompra.campaniaId} onChange={v => setFormCompra({ ...formCompra, campaniaId: v })} placeholder="2025/2026" />
              <InputField label="Fecha" type="date" value={formCompra.fecha} onChange={v => setFormCompra({ ...formCompra, fecha: v })} required />
            </div>
            <div className="flex justify-end"><BaseButton type="submit" disabled={guardando}>{guardando ? 'Guardando...' : 'Registrar compra'}</BaseButton></div>
          </form></BaseCard>
        </Section>
      )}

      {operacionActiva === 'aplicacion' && (
        <Section title="Aplicacion de insumos" description="Imputa costo al cultivo y descuenta insumo.">
          <BaseCard><form onSubmit={handleAplicacion} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField label="Campo" value={formAplicacion.campoId} onChange={v => setFormAplicacion({ ...formAplicacion, campoId: v, loteId: '' })} required>{fields.map(f => <BaseSelectItem key={f.id} value={f.id}>{f.nombre}</BaseSelectItem>)}</SelectField>
              <SelectField label="Lote" value={formAplicacion.loteId} onChange={v => setFormAplicacion({ ...formAplicacion, loteId: v })} required>{aplicacionLotes.map(l => <BaseSelectItem key={l.id} value={l.id}>{l.nombre}</BaseSelectItem>)}</SelectField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <InputField label="Campana" value={formAplicacion.campaniaId} onChange={v => setFormAplicacion({ ...formAplicacion, campaniaId: v })} placeholder="2025/2026" />
              <SelectField label="Tipo insumo" value={formAplicacion.tipoInsumo} onChange={v => setFormAplicacion({ ...formAplicacion, tipoInsumo: v as TipoInsumo })}><BaseSelectItem value="semilla">Semilla</BaseSelectItem><BaseSelectItem value="fertilizante">Fertilizante</BaseSelectItem><BaseSelectItem value="agroquimico">Agroquimico</BaseSelectItem><BaseSelectItem value="combustible">Combustible</BaseSelectItem><BaseSelectItem value="otro">Otro</BaseSelectItem></SelectField>
              <InputField label="Producto" value={formAplicacion.productoNombre} onChange={v => setFormAplicacion({ ...formAplicacion, productoNombre: v })} required />
              <InputField label="Fecha" type="date" value={formAplicacion.fecha} onChange={v => setFormAplicacion({ ...formAplicacion, fecha: v })} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Cantidad" type="number" value={formAplicacion.cantidad} onChange={v => setFormAplicacion({ ...formAplicacion, cantidad: v })} required />
              <InputField label="Valor unitario" type="number" value={formAplicacion.valorUnitario} onChange={v => setFormAplicacion({ ...formAplicacion, valorUnitario: v })} required />
            </div>
            <div className="flex justify-end"><BaseButton type="submit" disabled={guardando}>{guardando ? 'Guardando...' : 'Registrar aplicacion'}</BaseButton></div>
          </form></BaseCard>
        </Section>
      )}

      {operacionActiva === 'cosecha' && (
        <Section title="Registro de cosecha" description="Transforma costo acumulado en stock de granos.">
          <BaseCard><form onSubmit={handleCosecha} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField label="Campo" value={formCosecha.campoId} onChange={v => setFormCosecha({ ...formCosecha, campoId: v, loteId: '' })} required>{fields.map(f => <BaseSelectItem key={f.id} value={f.id}>{f.nombre}</BaseSelectItem>)}</SelectField>
              <SelectField label="Lote" value={formCosecha.loteId} onChange={v => setFormCosecha({ ...formCosecha, loteId: v })} required>{cosechaLotes.map(l => <BaseSelectItem key={l.id} value={l.id}>{l.nombre}</BaseSelectItem>)}</SelectField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField label="Campana" value={formCosecha.campaniaId} onChange={v => setFormCosecha({ ...formCosecha, campaniaId: v })} placeholder="2025/2026" />
              <InputField label="Cultivo" value={formCosecha.cultivo} onChange={v => setFormCosecha({ ...formCosecha, cultivo: v })} required />
              <InputField label="Fecha" type="date" value={formCosecha.fecha} onChange={v => setFormCosecha({ ...formCosecha, fecha: v })} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField label="Cantidad" type="number" value={formCosecha.cantidad} onChange={v => setFormCosecha({ ...formCosecha, cantidad: v })} required />
              <SelectField label="Unidad" value={formCosecha.unidad} onChange={v => setFormCosecha({ ...formCosecha, unidad: v as 'kg' | 'tn' })}><BaseSelectItem value="kg">kg</BaseSelectItem><BaseSelectItem value="tn">tn</BaseSelectItem></SelectField>
              <InputField label="Silo destino" value={formCosecha.siloDestinoId} onChange={v => setFormCosecha({ ...formCosecha, siloDestinoId: v })} placeholder="silo-central" />
            </div>
            <div className="flex justify-end"><BaseButton type="submit" disabled={guardando}>{guardando ? 'Guardando...' : 'Registrar cosecha'}</BaseButton></div>
          </form></BaseCard>
        </Section>
      )}

      {operacionActiva === 'entrega' && (
        <Section title="Entrega de grano" description="Salida a acopiador/puerto con opcion de venta directa.">
          <BaseCard><form onSubmit={handleEntrega} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField label="Destino (acopiador)" value={formEntrega.terceroId} onChange={v => setFormEntrega({ ...formEntrega, terceroId: v })} required>{acopiadores.map(t => <BaseSelectItem key={t.id} value={t.id}>{t.nombre}</BaseSelectItem>)}</SelectField>
              <InputField label="Tipo grano" value={formEntrega.tipoGrano} onChange={v => setFormEntrega({ ...formEntrega, tipoGrano: v })} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField label="Cantidad" type="number" value={formEntrega.cantidad} onChange={v => setFormEntrega({ ...formEntrega, cantidad: v })} required />
              <SelectField label="Unidad" value={formEntrega.unidad} onChange={v => setFormEntrega({ ...formEntrega, unidad: v as 'kg' | 'tn' })}><BaseSelectItem value="kg">kg</BaseSelectItem><BaseSelectItem value="tn">tn</BaseSelectItem></SelectField>
              <InputField label="Silo origen" value={formEntrega.siloOrigenId} onChange={v => setFormEntrega({ ...formEntrega, siloOrigenId: v })} placeholder="silo-central" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SelectField label="Campo" value={formEntrega.campoId} onChange={v => setFormEntrega({ ...formEntrega, campoId: v, loteId: '' })}>{fields.map(f => <BaseSelectItem key={f.id} value={f.id}>{f.nombre}</BaseSelectItem>)}</SelectField>
              <SelectField label="Lote" value={formEntrega.loteId} onChange={v => setFormEntrega({ ...formEntrega, loteId: v })}>{entregaLotes.map(l => <BaseSelectItem key={l.id} value={l.id}>{l.nombre}</BaseSelectItem>)}</SelectField>
              <InputField label="Campana" value={formEntrega.campaniaId} onChange={v => setFormEntrega({ ...formEntrega, campaniaId: v })} placeholder="2025/2026" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Es venta directa</label>
                <select className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={formEntrega.esVenta ? 'si' : 'no'} onChange={e => setFormEntrega({ ...formEntrega, esVenta: e.target.value === 'si' })}>
                  <option value="no">No</option>
                  <option value="si">Si</option>
                </select>
              </div>
              <InputField label="Precio unitario" type="number" value={formEntrega.precioUnitario} onChange={v => setFormEntrega({ ...formEntrega, precioUnitario: v })} />
              <InputField label="Carta de porte" value={formEntrega.cartaPorte} onChange={v => setFormEntrega({ ...formEntrega, cartaPorte: v })} />
            </div>
            <InputField label="Fecha" type="date" value={formEntrega.fecha} onChange={v => setFormEntrega({ ...formEntrega, fecha: v })} required />
            <div className="flex justify-end"><BaseButton type="submit" disabled={guardando}>{guardando ? 'Guardando...' : 'Registrar entrega'}</BaseButton></div>
          </form></BaseCard>
        </Section>
      )}

      {operacionActiva === 'cobro' && (
        <Section title="Cobro a cliente" description="Registro financiero automatico.">
          <BaseCard><form onSubmit={handleCobro} className="space-y-4">
            <SelectField label="Cliente" value={formCobro.terceroId} onChange={v => setFormCobro({ ...formCobro, terceroId: v })} required>{clientes.map(t => <BaseSelectItem key={t.id} value={t.id}>{t.nombre}</BaseSelectItem>)}</SelectField>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><InputField label="Monto" type="number" value={formCobro.monto} onChange={v => setFormCobro({ ...formCobro, monto: v })} required /><SelectField label="Medio de pago" value={formCobro.medioPago} onChange={v => setFormCobro({ ...formCobro, medioPago: v as MedioPago })}><BaseSelectItem value="efectivo">Efectivo</BaseSelectItem><BaseSelectItem value="transferencia">Transferencia</BaseSelectItem><BaseSelectItem value="cheque">Cheque</BaseSelectItem></SelectField></div>
            <InputField label="Fecha" type="date" value={formCobro.fecha} onChange={v => setFormCobro({ ...formCobro, fecha: v })} required />
            <div className="flex justify-end"><BaseButton type="submit" disabled={guardando}>{guardando ? 'Guardando...' : 'Registrar cobro'}</BaseButton></div>
          </form></BaseCard>
        </Section>
      )}

      {operacionActiva === 'pago' && (
        <Section title="Pago a proveedor" description="Registro financiero automatico.">
          <BaseCard><form onSubmit={handlePago} className="space-y-4">
            <SelectField label="Proveedor" value={formPago.terceroId} onChange={v => setFormPago({ ...formPago, terceroId: v })} required>{proveedores.map(t => <BaseSelectItem key={t.id} value={t.id}>{t.nombre}</BaseSelectItem>)}</SelectField>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><InputField label="Monto" type="number" value={formPago.monto} onChange={v => setFormPago({ ...formPago, monto: v })} required /><SelectField label="Medio de pago" value={formPago.medioPago} onChange={v => setFormPago({ ...formPago, medioPago: v as MedioPago })}><BaseSelectItem value="efectivo">Efectivo</BaseSelectItem><BaseSelectItem value="transferencia">Transferencia</BaseSelectItem><BaseSelectItem value="cheque">Cheque</BaseSelectItem></SelectField></div>
            <InputField label="Fecha" type="date" value={formPago.fecha} onChange={v => setFormPago({ ...formPago, fecha: v })} required />
            <div className="flex justify-end"><BaseButton type="submit" disabled={guardando}>{guardando ? 'Guardando...' : 'Registrar pago'}</BaseButton></div>
          </form></BaseCard>
        </Section>
      )}

      <Section title="Registros operativos" description="Historial de operaciones para productor y organizacion activa.">
        <BaseCard>
          {operations.length === 0 ? (
            <div className="text-sm text-slate-500">Sin operaciones registradas.</div>
          ) : (
            <div className="space-y-2">
              {operations.slice(0, 20).map(op => (
                <div key={op.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2">
                  <div>
                    <div className="text-sm font-medium text-slate-900">{op.descripcion}</div>
                    <div className="text-xs text-slate-500">{op.type} · {new Date(op.fecha).toLocaleString('es-AR')} · req {op.requestId}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <BaseBadge variant="outline">{op.productorId}</BaseBadge>
                    <BaseBadge variant="outline">{op.organizationId}</BaseBadge>
                    <BaseBadge variant="success">${op.amount.toLocaleString('es-AR')}</BaseBadge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </BaseCard>
      </Section>
    </PageShell>
  );
}

function ActionCard({ title, subtitle, onClick }: { title: string; subtitle: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-left">
      <BaseCard>
        <div>
          <p className="font-semibold text-slate-900">{title}</p>
          <p className="text-sm text-slate-600">{subtitle}</p>
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}{required ? ' *' : ''}</label>
      <BaseInput type={type} value={value} onChange={e => onChange(e.target.value)} required={required} placeholder={placeholder} />
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

