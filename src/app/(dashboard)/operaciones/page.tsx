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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { usePlugins } from '@/contexts/PluginsContext';
import { generarAsientoAutomatico } from '@/services/asientos-auto';
import { obtenerFields } from '@/services/fields';
import { listOperationsByOrg } from '@/services/operations-registry';
import { obtenerPlots } from '@/services/plots';
import { obtenerTerceros } from '@/services/terceros';
import type {
  MedioPago,
  OperationRecord,
  Tercero,
  TipoInsumo,
  TipoOperacion,
} from '@/types/contabilidad-simple';
import { PLAN_CUENTAS_AGRO } from '@/types/contabilidad-simple';
import type { Field, Plot } from '@/types/sig-agro';

const defaultDate = () => new Date().toISOString().split('T')[0];

const CORE_TIPOS: TipoOperacion[] = [
  'compra_insumo',
  'aplicacion_insumo',
  'cosecha',
  'entrega_acopiador',
  'venta',
  'cobro',
  'pago',
];

const PLUGIN_TIPOS: TipoOperacion[] = [
  'gasto_general',
  'anticipo_cliente',
  'anticipo_proveedor',
  'cuota_financiacion',
  'transferencia_interna',
  'nota_credito',
  'nota_debito',
];

const TIPO_META: Record<TipoOperacion, { title: string; subtitle: string; submitLabel: string }> = {
  compra_insumo: {
    title: 'Compra de insumos',
    subtitle: 'Debe Insumos / Haber Proveedores',
    submitLabel: 'Registrar compra',
  },
  aplicacion_insumo: {
    title: 'Aplicacion de insumos',
    subtitle: 'Debe Cultivos / Haber Insumos',
    submitLabel: 'Registrar aplicacion',
  },
  cosecha: {
    title: 'Registro de cosecha',
    subtitle: 'Debe Stock granos / Haber Cultivos',
    submitLabel: 'Registrar cosecha',
  },
  entrega_acopiador: {
    title: 'Entrega a acopiador',
    subtitle: 'Consignacion o venta directa',
    submitLabel: 'Registrar entrega',
  },
  venta: {
    title: 'Venta',
    subtitle: 'Debe Clientes / Haber Ventas',
    submitLabel: 'Registrar venta',
  },
  cobro: {
    title: 'Cobro',
    subtitle: 'Debe Caja/Banco / Haber Clientes',
    submitLabel: 'Registrar cobro',
  },
  pago: {
    title: 'Pago',
    subtitle: 'Debe Proveedores / Haber Caja/Banco',
    submitLabel: 'Registrar pago',
  },
  gasto_general: {
    title: 'Gasto general',
    subtitle: 'Debe Gasto / Haber Caja-Banco',
    submitLabel: 'Registrar gasto',
  },
  anticipo_cliente: {
    title: 'Anticipo cliente',
    subtitle: 'Cobro anticipado de cliente',
    submitLabel: 'Registrar anticipo',
  },
  anticipo_proveedor: {
    title: 'Anticipo proveedor',
    subtitle: 'Pago anticipado a proveedor',
    submitLabel: 'Registrar anticipo',
  },
  cuota_financiacion: {
    title: 'Cuota financiacion',
    subtitle: 'Capital e interes',
    submitLabel: 'Registrar cuota',
  },
  transferencia_interna: {
    title: 'Transferencia interna',
    subtitle: 'Movimiento entre caja y banco',
    submitLabel: 'Registrar transferencia',
  },
  nota_credito: {
    title: 'Nota credito',
    subtitle: 'Ajuste a cliente',
    submitLabel: 'Registrar nota de credito',
  },
  nota_debito: {
    title: 'Nota debito',
    subtitle: 'Ajuste a proveedor',
    submitLabel: 'Registrar nota de debito',
  },
};

export default function OperacionesPage() {
  const { user, organization } = useAuth();
  const { isActive } = usePlugins();

  const [terceros, setTerceros] = useState<Tercero[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [operations, setOperations] = useState<OperationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [operacionActiva, setOperacionActiva] = useState<TipoOperacion | null>(null);
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
  const [formVenta, setFormVenta] = useState({
    terceroId: '',
    descripcion: '',
    monto: '',
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
  const [formGastoGeneral, setFormGastoGeneral] = useState({
    concepto: '',
    cuentaGastoId: '',
    monto: '',
    medioPago: 'transferencia' as MedioPago,
    terceroId: '',
    campaniaId: '',
    fecha: defaultDate(),
    observaciones: '',
  });
  const [formAnticipoCliente, setFormAnticipoCliente] = useState({
    terceroId: '',
    monto: '',
    medioPago: 'transferencia' as MedioPago,
    fecha: defaultDate(),
    observaciones: '',
  });
  const [formAnticipoProveedor, setFormAnticipoProveedor] = useState({
    terceroId: '',
    monto: '',
    medioPago: 'transferencia' as MedioPago,
    fecha: defaultDate(),
    observaciones: '',
  });
  const [formCuota, setFormCuota] = useState({
    entidadFinanciera: '',
    numeroCuota: '',
    totalCuotas: '',
    capital: '',
    interes: '',
    monto: '',
    medioPago: 'transferencia' as MedioPago,
    fecha: defaultDate(),
    observaciones: '',
  });
  const [formTransferencia, setFormTransferencia] = useState({
    origenId: '',
    destinoId: '',
    monto: '',
    fecha: defaultDate(),
    observaciones: '',
  });
  const [formNotaCredito, setFormNotaCredito] = useState({
    terceroId: '',
    monto: '',
    motivo: '',
    fecha: defaultDate(),
    observaciones: '',
  });
  const [formNotaDebito, setFormNotaDebito] = useState({
    terceroId: '',
    monto: '',
    motivo: '',
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

  function abrirDialog() {
    setOperacionActiva(null);
    setDialogOpen(true);
  }

  function cerrarDialog() {
    setDialogOpen(false);
    setOperacionActiva(null);
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
      cerrarDialog();
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
      setFormCompra({
        ...formCompra,
        terceroId: '',
        productoNombre: '',
        cantidad: '',
        precioUnitario: '',
        depositoId: '',
        fecha: defaultDate(),
        observaciones: '',
      });
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
      setFormAplicacion({
        ...formAplicacion,
        productoNombre: '',
        cantidad: '',
        valorUnitario: '',
        fecha: defaultDate(),
        observaciones: '',
      });
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
      setFormCosecha({
        ...formCosecha,
        cultivo: '',
        cantidad: '',
        siloDestinoId: '',
        fecha: defaultDate(),
        observaciones: '',
      });
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
      setFormEntrega({
        ...formEntrega,
        tipoGrano: '',
        cantidad: '',
        siloOrigenId: '',
        precioUnitario: '',
        cartaPorte: '',
        fecha: defaultDate(),
        observaciones: '',
      });
    }, 'Entrega registrada con asiento automatico');
  }

  async function handleVenta(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.organizationId) return;
    await ejecutar('venta', async () => {
      await generarAsientoAutomatico(
        user.organizationId,
        'venta',
        {
          terceroId: formVenta.terceroId,
          descripcion: formVenta.descripcion,
          monto: parseFloat(formVenta.monto || '0'),
          fecha: new Date(formVenta.fecha),
          observaciones: formVenta.observaciones,
        },
        `venta_${Date.now()}`,
        ctx('venta')
      );
      setFormVenta({
        terceroId: '',
        descripcion: '',
        monto: '',
        fecha: defaultDate(),
        observaciones: '',
      });
    }, 'Venta registrada');
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

  async function handleGastoGeneral(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.organizationId) return;
    const cuentaGasto = PLAN_CUENTAS_AGRO.find(cuenta => cuenta.id === formGastoGeneral.cuentaGastoId);
    await ejecutar('gasto_general', async () => {
      await generarAsientoAutomatico(
        user.organizationId,
        'gasto_general',
        {
          concepto: formGastoGeneral.concepto,
          cuentaGastoId: formGastoGeneral.cuentaGastoId,
          cuentaGastoNombre: cuentaGasto?.nombre || '',
          monto: parseFloat(formGastoGeneral.monto || '0'),
          medioPago: formGastoGeneral.medioPago,
          terceroId: formGastoGeneral.terceroId || undefined,
          campaniaId: formGastoGeneral.campaniaId || undefined,
          fecha: new Date(formGastoGeneral.fecha),
          observaciones: formGastoGeneral.observaciones,
        },
        `gasto_general_${Date.now()}`,
        ctx('gasto_general')
      );
      setFormGastoGeneral({
        concepto: '',
        cuentaGastoId: '',
        monto: '',
        medioPago: 'transferencia',
        terceroId: '',
        campaniaId: '',
        fecha: defaultDate(),
        observaciones: '',
      });
    }, 'Gasto general registrado');
  }

  async function handleAnticipoCliente(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.organizationId) return;
    await ejecutar('anticipo_cliente', async () => {
      await generarAsientoAutomatico(
        user.organizationId,
        'anticipo_cliente',
        {
          terceroId: formAnticipoCliente.terceroId,
          monto: parseFloat(formAnticipoCliente.monto || '0'),
          medioPago: formAnticipoCliente.medioPago,
          esCliente: true,
          fecha: new Date(formAnticipoCliente.fecha),
          observaciones: formAnticipoCliente.observaciones,
        },
        `anticipo_cliente_${Date.now()}`,
        ctx('anticipo_cliente')
      );
      setFormAnticipoCliente({
        terceroId: '',
        monto: '',
        medioPago: 'transferencia',
        fecha: defaultDate(),
        observaciones: '',
      });
    }, 'Anticipo de cliente registrado');
  }

  async function handleAnticipoProveedor(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.organizationId) return;
    await ejecutar('anticipo_proveedor', async () => {
      await generarAsientoAutomatico(
        user.organizationId,
        'anticipo_proveedor',
        {
          terceroId: formAnticipoProveedor.terceroId,
          monto: parseFloat(formAnticipoProveedor.monto || '0'),
          medioPago: formAnticipoProveedor.medioPago,
          esCliente: false,
          fecha: new Date(formAnticipoProveedor.fecha),
          observaciones: formAnticipoProveedor.observaciones,
        },
        `anticipo_proveedor_${Date.now()}`,
        ctx('anticipo_proveedor')
      );
      setFormAnticipoProveedor({
        terceroId: '',
        monto: '',
        medioPago: 'transferencia',
        fecha: defaultDate(),
        observaciones: '',
      });
    }, 'Anticipo a proveedor registrado');
  }

  async function handleCuotaFinanciacion(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.organizationId) return;
    await ejecutar('cuota_financiacion', async () => {
      await generarAsientoAutomatico(
        user.organizationId,
        'cuota_financiacion',
        {
          entidadFinanciera: formCuota.entidadFinanciera,
          numeroCuota: parseInt(formCuota.numeroCuota || '0', 10),
          totalCuotas: parseInt(formCuota.totalCuotas || '0', 10),
          capital: parseFloat(formCuota.capital || '0'),
          interes: parseFloat(formCuota.interes || '0'),
          monto: parseFloat(formCuota.monto || '0'),
          medioPago: formCuota.medioPago,
          fecha: new Date(formCuota.fecha),
          observaciones: formCuota.observaciones,
        },
        `cuota_financiacion_${Date.now()}`,
        ctx('cuota_financiacion')
      );
      setFormCuota({
        entidadFinanciera: '',
        numeroCuota: '',
        totalCuotas: '',
        capital: '',
        interes: '',
        monto: '',
        medioPago: 'transferencia',
        fecha: defaultDate(),
        observaciones: '',
      });
    }, 'Cuota de financiacion registrada');
  }

  async function handleTransferenciaInterna(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.organizationId) return;
    const origen = cuentasFinancieras.find(cuenta => cuenta.id === formTransferencia.origenId);
    const destino = cuentasFinancieras.find(cuenta => cuenta.id === formTransferencia.destinoId);
    await ejecutar('transferencia_interna', async () => {
      await generarAsientoAutomatico(
        user.organizationId,
        'transferencia_interna',
        {
          origen: origen?.id === '1.1.1' ? 'caja' : 'banco',
          origenId: formTransferencia.origenId,
          origenNombre: origen?.nombre || '',
          destino: destino?.id === '1.1.1' ? 'caja' : 'banco',
          destinoId: formTransferencia.destinoId,
          destinoNombre: destino?.nombre || '',
          monto: parseFloat(formTransferencia.monto || '0'),
          fecha: new Date(formTransferencia.fecha),
          observaciones: formTransferencia.observaciones,
        },
        `transferencia_interna_${Date.now()}`,
        ctx('transferencia_interna')
      );
      setFormTransferencia({
        origenId: '',
        destinoId: '',
        monto: '',
        fecha: defaultDate(),
        observaciones: '',
      });
    }, 'Transferencia interna registrada');
  }

  async function handleNotaCredito(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.organizationId) return;
    await ejecutar('nota_credito', async () => {
      await generarAsientoAutomatico(
        user.organizationId,
        'nota_credito',
        {
          terceroId: formNotaCredito.terceroId,
          monto: parseFloat(formNotaCredito.monto || '0'),
          motivo: formNotaCredito.motivo,
          fecha: new Date(formNotaCredito.fecha),
          observaciones: formNotaCredito.observaciones,
        },
        `nota_credito_${Date.now()}`,
        ctx('nota_credito')
      );
      setFormNotaCredito({
        terceroId: '',
        monto: '',
        motivo: '',
        fecha: defaultDate(),
        observaciones: '',
      });
    }, 'Nota de credito registrada');
  }

  async function handleNotaDebito(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.organizationId) return;
    await ejecutar('nota_debito', async () => {
      await generarAsientoAutomatico(
        user.organizationId,
        'nota_debito',
        {
          terceroId: formNotaDebito.terceroId,
          monto: parseFloat(formNotaDebito.monto || '0'),
          motivo: formNotaDebito.motivo,
          fecha: new Date(formNotaDebito.fecha),
          observaciones: formNotaDebito.observaciones,
        },
        `nota_debito_${Date.now()}`,
        ctx('nota_debito')
      );
      setFormNotaDebito({
        terceroId: '',
        monto: '',
        motivo: '',
        fecha: defaultDate(),
        observaciones: '',
      });
    }, 'Nota de debito registrada');
  }

  const proveedores = useMemo(
    () => terceros.filter(t => t.tipo === 'proveedor' || t.tipo === 'ambos'),
    [terceros]
  );
  const clientes = useMemo(
    () => terceros.filter(t => t.tipo === 'cliente' || t.tipo === 'ambos'),
    [terceros]
  );
  const cuentasGasto = useMemo(
    () => PLAN_CUENTAS_AGRO.filter(cuenta => cuenta.tipo === 'gasto' && cuenta.activa),
    []
  );
  const cuentasFinancieras = useMemo(
    () => PLAN_CUENTAS_AGRO.filter(cuenta => ['1.1.1', '1.1.2'].includes(cuenta.id)),
    []
  );
  const compraLotes = useMemo(
    () => plots.filter(plot => !formCompra.campoId || plot.fieldId === formCompra.campoId),
    [plots, formCompra.campoId]
  );
  const aplicacionLotes = useMemo(
    () => plots.filter(plot => !formAplicacion.campoId || plot.fieldId === formAplicacion.campoId),
    [plots, formAplicacion.campoId]
  );
  const cosechaLotes = useMemo(
    () => plots.filter(plot => !formCosecha.campoId || plot.fieldId === formCosecha.campoId),
    [plots, formCosecha.campoId]
  );
  const entregaLotes = useMemo(
    () => plots.filter(plot => !formEntrega.campoId || plot.fieldId === formEntrega.campoId),
    [plots, formEntrega.campoId]
  );
  const tiposDisponibles = useMemo<TipoOperacion[]>(
    () => [
      ...CORE_TIPOS,
      ...(isActive('operaciones_comerciales') ? PLUGIN_TIPOS : []),
    ],
    [isActive]
  );

  if (loading) {
    return (
      <PageShell title="Operaciones" subtitle="Registro operativo contable por formulario">
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
          Cargando...
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Operaciones" subtitle="Registro operativo contable por formulario">
      {mensaje && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            mensaje.tipo === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      <PageToolbar
        actions={<BaseButton onClick={abrirDialog}>Nueva operacion</BaseButton>}
      />

      <Section
        title="Registros operativos"
        description="Historial de operaciones para productor y organizacion activa."
      >
        <BaseCard>
          {operations.length === 0 ? (
            <div className="text-sm text-slate-500">Sin operaciones registradas.</div>
          ) : (
            <div className="space-y-2">
              {operations.slice(0, 20).map(op => (
                <div
                  key={op.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-900">{op.descripcion}</div>
                    <div className="text-xs text-slate-500">
                      {op.type} · {new Date(op.fecha).toLocaleString('es-AR')} · req {op.requestId}
                    </div>
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

      <Dialog
        open={dialogOpen}
        onOpenChange={open => {
          setDialogOpen(open);
          if (!open) setOperacionActiva(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {operacionActiva ? TIPO_META[operacionActiva].title : 'Nueva operacion'}
            </DialogTitle>
          </DialogHeader>

          {!operacionActiva ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Selecciona el tipo de operacion que queres registrar.
              </p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {tiposDisponibles.map(tipo => (
                  <ActionCard
                    key={tipo}
                    title={TIPO_META[tipo].title}
                    subtitle={TIPO_META[tipo].subtitle}
                    onClick={() => setOperacionActiva(tipo)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">{TIPO_META[operacionActiva].subtitle}</p>

              {operacionActiva === 'compra_insumo' && (
                <form onSubmit={handleCompra} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <SelectField
                      label="Proveedor"
                      value={formCompra.terceroId}
                      onChange={v => setFormCompra({ ...formCompra, terceroId: v })}
                      required
                    >
                      {proveedores.map(t => (
                        <BaseSelectItem key={t.id} value={t.id}>
                          {t.nombre}
                        </BaseSelectItem>
                      ))}
                    </SelectField>
                    <SelectField
                      label="Tipo insumo"
                      value={formCompra.tipoInsumo}
                      onChange={v => setFormCompra({ ...formCompra, tipoInsumo: v as TipoInsumo })}
                    >
                      <BaseSelectItem value="semilla">Semilla</BaseSelectItem>
                      <BaseSelectItem value="fertilizante">Fertilizante</BaseSelectItem>
                      <BaseSelectItem value="agroquimico">Agroquimico</BaseSelectItem>
                      <BaseSelectItem value="combustible">Combustible</BaseSelectItem>
                      <BaseSelectItem value="otro">Otro</BaseSelectItem>
                    </SelectField>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <InputField
                      label="Producto"
                      value={formCompra.productoNombre}
                      onChange={v => setFormCompra({ ...formCompra, productoNombre: v })}
                      required
                    />
                    <InputField
                      label="Cantidad"
                      type="number"
                      value={formCompra.cantidad}
                      onChange={v => setFormCompra({ ...formCompra, cantidad: v })}
                      required
                    />
                    <InputField
                      label="Precio unitario"
                      type="number"
                      value={formCompra.precioUnitario}
                      onChange={v => setFormCompra({ ...formCompra, precioUnitario: v })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <InputField
                      label="Deposito destino"
                      value={formCompra.depositoId}
                      onChange={v => setFormCompra({ ...formCompra, depositoId: v })}
                    />
                    <SelectField
                      label="Campo"
                      value={formCompra.campoId}
                      onChange={v => setFormCompra({ ...formCompra, campoId: v, loteId: '' })}
                    >
                      {fields.map(field => (
                        <BaseSelectItem key={field.id} value={field.id}>
                          {field.nombre}
                        </BaseSelectItem>
                      ))}
                    </SelectField>
                    <SelectField
                      label="Lote"
                      value={formCompra.loteId}
                      onChange={v => setFormCompra({ ...formCompra, loteId: v })}
                    >
                      {compraLotes.map(plot => (
                        <BaseSelectItem key={plot.id} value={plot.id}>
                          {plot.nombre}
                        </BaseSelectItem>
                      ))}
                    </SelectField>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InputField
                      label="Campana"
                      value={formCompra.campaniaId}
                      onChange={v => setFormCompra({ ...formCompra, campaniaId: v })}
                    />
                    <InputField
                      label="Fecha"
                      type="date"
                      value={formCompra.fecha}
                      onChange={v => setFormCompra({ ...formCompra, fecha: v })}
                      required
                    />
                  </div>
                  <DialogActions
                    guardando={guardando}
                    submitLabel={TIPO_META.compra_insumo.submitLabel}
                    onBack={() => setOperacionActiva(null)}
                    onCancel={cerrarDialog}
                  />
                </form>
              )}

              {operacionActiva === 'aplicacion_insumo' && (
                <form onSubmit={handleAplicacion} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <SelectField
                      label="Campo"
                      value={formAplicacion.campoId}
                      onChange={v => setFormAplicacion({ ...formAplicacion, campoId: v, loteId: '' })}
                      required
                    >
                      {fields.map(field => (
                        <BaseSelectItem key={field.id} value={field.id}>
                          {field.nombre}
                        </BaseSelectItem>
                      ))}
                    </SelectField>
                    <SelectField
                      label="Lote"
                      value={formAplicacion.loteId}
                      onChange={v => setFormAplicacion({ ...formAplicacion, loteId: v })}
                      required
                    >
                      {aplicacionLotes.map(plot => (
                        <BaseSelectItem key={plot.id} value={plot.id}>
                          {plot.nombre}
                        </BaseSelectItem>
                      ))}
                    </SelectField>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <InputField
                      label="Campana"
                      value={formAplicacion.campaniaId}
                      onChange={v => setFormAplicacion({ ...formAplicacion, campaniaId: v })}
                    />
                    <SelectField
                      label="Tipo insumo"
                      value={formAplicacion.tipoInsumo}
                      onChange={v =>
                        setFormAplicacion({ ...formAplicacion, tipoInsumo: v as TipoInsumo })
                      }
                    >
                      <BaseSelectItem value="semilla">Semilla</BaseSelectItem>
                      <BaseSelectItem value="fertilizante">Fertilizante</BaseSelectItem>
                      <BaseSelectItem value="agroquimico">Agroquimico</BaseSelectItem>
                      <BaseSelectItem value="combustible">Combustible</BaseSelectItem>
                      <BaseSelectItem value="otro">Otro</BaseSelectItem>
                    </SelectField>
                    <InputField
                      label="Producto"
                      value={formAplicacion.productoNombre}
                      onChange={v => setFormAplicacion({ ...formAplicacion, productoNombre: v })}
                      required
                    />
                    <InputField
                      label="Fecha"
                      type="date"
                      value={formAplicacion.fecha}
                      onChange={v => setFormAplicacion({ ...formAplicacion, fecha: v })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InputField
                      label="Cantidad"
                      type="number"
                      value={formAplicacion.cantidad}
                      onChange={v => setFormAplicacion({ ...formAplicacion, cantidad: v })}
                      required
                    />
                    <InputField
                      label="Valor unitario"
                      type="number"
                      value={formAplicacion.valorUnitario}
                      onChange={v => setFormAplicacion({ ...formAplicacion, valorUnitario: v })}
                      required
                    />
                  </div>
                  <DialogActions
                    guardando={guardando}
                    submitLabel={TIPO_META.aplicacion_insumo.submitLabel}
                    onBack={() => setOperacionActiva(null)}
                    onCancel={cerrarDialog}
                  />
                </form>
              )}

              {operacionActiva === 'cosecha' && (
                <form onSubmit={handleCosecha} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <SelectField
                      label="Campo"
                      value={formCosecha.campoId}
                      onChange={v => setFormCosecha({ ...formCosecha, campoId: v, loteId: '' })}
                      required
                    >
                      {fields.map(field => (
                        <BaseSelectItem key={field.id} value={field.id}>
                          {field.nombre}
                        </BaseSelectItem>
                      ))}
                    </SelectField>
                    <SelectField
                      label="Lote"
                      value={formCosecha.loteId}
                      onChange={v => setFormCosecha({ ...formCosecha, loteId: v })}
                      required
                    >
                      {cosechaLotes.map(plot => (
                        <BaseSelectItem key={plot.id} value={plot.id}>
                          {plot.nombre}
                        </BaseSelectItem>
                      ))}
                    </SelectField>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <InputField
                      label="Campana"
                      value={formCosecha.campaniaId}
                      onChange={v => setFormCosecha({ ...formCosecha, campaniaId: v })}
                    />
                    <InputField
                      label="Cultivo"
                      value={formCosecha.cultivo}
                      onChange={v => setFormCosecha({ ...formCosecha, cultivo: v })}
                      required
                    />
                    <InputField
                      label="Fecha"
                      type="date"
                      value={formCosecha.fecha}
                      onChange={v => setFormCosecha({ ...formCosecha, fecha: v })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <InputField
                      label="Cantidad"
                      type="number"
                      value={formCosecha.cantidad}
                      onChange={v => setFormCosecha({ ...formCosecha, cantidad: v })}
                      required
                    />
                    <SelectField
                      label="Unidad"
                      value={formCosecha.unidad}
                      onChange={v => setFormCosecha({ ...formCosecha, unidad: v as 'kg' | 'tn' })}
                    >
                      <BaseSelectItem value="kg">kg</BaseSelectItem>
                      <BaseSelectItem value="tn">tn</BaseSelectItem>
                    </SelectField>
                    <InputField
                      label="Silo destino"
                      value={formCosecha.siloDestinoId}
                      onChange={v => setFormCosecha({ ...formCosecha, siloDestinoId: v })}
                    />
                  </div>
                  <DialogActions
                    guardando={guardando}
                    submitLabel={TIPO_META.cosecha.submitLabel}
                    onBack={() => setOperacionActiva(null)}
                    onCancel={cerrarDialog}
                  />
                </form>
              )}

              {operacionActiva === 'entrega_acopiador' && (
                <form onSubmit={handleEntrega} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <SelectField
                      label="Destino"
                      value={formEntrega.terceroId}
                      onChange={v => setFormEntrega({ ...formEntrega, terceroId: v })}
                      required
                    >
                      {proveedores.map(t => (
                        <BaseSelectItem key={t.id} value={t.id}>
                          {t.nombre}
                        </BaseSelectItem>
                      ))}
                    </SelectField>
                    <InputField
                      label="Tipo grano"
                      value={formEntrega.tipoGrano}
                      onChange={v => setFormEntrega({ ...formEntrega, tipoGrano: v })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <InputField
                      label="Cantidad"
                      type="number"
                      value={formEntrega.cantidad}
                      onChange={v => setFormEntrega({ ...formEntrega, cantidad: v })}
                      required
                    />
                    <SelectField
                      label="Unidad"
                      value={formEntrega.unidad}
                      onChange={v => setFormEntrega({ ...formEntrega, unidad: v as 'kg' | 'tn' })}
                    >
                      <BaseSelectItem value="kg">kg</BaseSelectItem>
                      <BaseSelectItem value="tn">tn</BaseSelectItem>
                    </SelectField>
                    <InputField
                      label="Silo origen"
                      value={formEntrega.siloOrigenId}
                      onChange={v => setFormEntrega({ ...formEntrega, siloOrigenId: v })}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <SelectField
                      label="Campo"
                      value={formEntrega.campoId}
                      onChange={v => setFormEntrega({ ...formEntrega, campoId: v, loteId: '' })}
                    >
                      {fields.map(field => (
                        <BaseSelectItem key={field.id} value={field.id}>
                          {field.nombre}
                        </BaseSelectItem>
                      ))}
                    </SelectField>
                    <SelectField
                      label="Lote"
                      value={formEntrega.loteId}
                      onChange={v => setFormEntrega({ ...formEntrega, loteId: v })}
                    >
                      {entregaLotes.map(plot => (
                        <BaseSelectItem key={plot.id} value={plot.id}>
                          {plot.nombre}
                        </BaseSelectItem>
                      ))}
                    </SelectField>
                    <InputField
                      label="Campana"
                      value={formEntrega.campaniaId}
                      onChange={v => setFormEntrega({ ...formEntrega, campaniaId: v })}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <ToggleField
                      label="Es venta directa"
                      value={formEntrega.esVenta ? 'si' : 'no'}
                      onChange={v => setFormEntrega({ ...formEntrega, esVenta: v === 'si' })}
                    />
                    <InputField
                      label="Precio unitario"
                      type="number"
                      value={formEntrega.precioUnitario}
                      onChange={v => setFormEntrega({ ...formEntrega, precioUnitario: v })}
                    />
                    <InputField
                      label="Carta de porte"
                      value={formEntrega.cartaPorte}
                      onChange={v => setFormEntrega({ ...formEntrega, cartaPorte: v })}
                    />
                  </div>
                  <InputField
                    label="Fecha"
                    type="date"
                    value={formEntrega.fecha}
                    onChange={v => setFormEntrega({ ...formEntrega, fecha: v })}
                    required
                  />
                  <DialogActions
                    guardando={guardando}
                    submitLabel={TIPO_META.entrega_acopiador.submitLabel}
                    onBack={() => setOperacionActiva(null)}
                    onCancel={cerrarDialog}
                  />
                </form>
              )}

              {operacionActiva === 'venta' && (
                <form onSubmit={handleVenta} className="space-y-4">
                  <SelectField
                    label="Cliente"
                    value={formVenta.terceroId}
                    onChange={v => setFormVenta({ ...formVenta, terceroId: v })}
                    required
                  >
                    {clientes.map(t => (
                      <BaseSelectItem key={t.id} value={t.id}>
                        {t.nombre}
                      </BaseSelectItem>
                    ))}
                  </SelectField>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InputField
                      label="Descripcion"
                      value={formVenta.descripcion}
                      onChange={v => setFormVenta({ ...formVenta, descripcion: v })}
                      required
                    />
                    <InputField
                      label="Monto"
                      type="number"
                      value={formVenta.monto}
                      onChange={v => setFormVenta({ ...formVenta, monto: v })}
                      required
                    />
                  </div>
                  <InputField
                    label="Fecha"
                    type="date"
                    value={formVenta.fecha}
                    onChange={v => setFormVenta({ ...formVenta, fecha: v })}
                    required
                  />
                  <DialogActions
                    guardando={guardando}
                    submitLabel={TIPO_META.venta.submitLabel}
                    onBack={() => setOperacionActiva(null)}
                    onCancel={cerrarDialog}
                  />
                </form>
              )}

              {operacionActiva === 'cobro' && (
                <form onSubmit={handleCobro} className="space-y-4">
                  <SelectField
                    label="Cliente"
                    value={formCobro.terceroId}
                    onChange={v => setFormCobro({ ...formCobro, terceroId: v })}
                    required
                  >
                    {clientes.map(t => (
                      <BaseSelectItem key={t.id} value={t.id}>
                        {t.nombre}
                      </BaseSelectItem>
                    ))}
                  </SelectField>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InputField
                      label="Monto"
                      type="number"
                      value={formCobro.monto}
                      onChange={v => setFormCobro({ ...formCobro, monto: v })}
                      required
                    />
                    <MedioPagoField
                      value={formCobro.medioPago}
                      onChange={v => setFormCobro({ ...formCobro, medioPago: v })}
                    />
                  </div>
                  <InputField
                    label="Fecha"
                    type="date"
                    value={formCobro.fecha}
                    onChange={v => setFormCobro({ ...formCobro, fecha: v })}
                    required
                  />
                  <DialogActions
                    guardando={guardando}
                    submitLabel={TIPO_META.cobro.submitLabel}
                    onBack={() => setOperacionActiva(null)}
                    onCancel={cerrarDialog}
                  />
                </form>
              )}

              {operacionActiva === 'pago' && (
                <form onSubmit={handlePago} className="space-y-4">
                  <SelectField
                    label="Proveedor"
                    value={formPago.terceroId}
                    onChange={v => setFormPago({ ...formPago, terceroId: v })}
                    required
                  >
                    {proveedores.map(t => (
                      <BaseSelectItem key={t.id} value={t.id}>
                        {t.nombre}
                      </BaseSelectItem>
                    ))}
                  </SelectField>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InputField
                      label="Monto"
                      type="number"
                      value={formPago.monto}
                      onChange={v => setFormPago({ ...formPago, monto: v })}
                      required
                    />
                    <MedioPagoField
                      value={formPago.medioPago}
                      onChange={v => setFormPago({ ...formPago, medioPago: v })}
                    />
                  </div>
                  <InputField
                    label="Fecha"
                    type="date"
                    value={formPago.fecha}
                    onChange={v => setFormPago({ ...formPago, fecha: v })}
                    required
                  />
                  <DialogActions
                    guardando={guardando}
                    submitLabel={TIPO_META.pago.submitLabel}
                    onBack={() => setOperacionActiva(null)}
                    onCancel={cerrarDialog}
                  />
                </form>
              )}

              {operacionActiva === 'gasto_general' && (
                <form onSubmit={handleGastoGeneral} className="space-y-4">
                  <InputField
                    label="Concepto"
                    value={formGastoGeneral.concepto}
                    onChange={v => setFormGastoGeneral({ ...formGastoGeneral, concepto: v })}
                    required
                  />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <SelectField
                      label="Cuenta gasto"
                      value={formGastoGeneral.cuentaGastoId}
                      onChange={v =>
                        setFormGastoGeneral({ ...formGastoGeneral, cuentaGastoId: v })
                      }
                      required
                    >
                      {cuentasGasto.map(cuenta => (
                        <BaseSelectItem key={cuenta.id} value={cuenta.id}>
                          {cuenta.codigo} - {cuenta.nombre}
                        </BaseSelectItem>
                      ))}
                    </SelectField>
                    <InputField
                      label="Monto"
                      type="number"
                      value={formGastoGeneral.monto}
                      onChange={v => setFormGastoGeneral({ ...formGastoGeneral, monto: v })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <MedioPagoField
                      value={formGastoGeneral.medioPago}
                      onChange={v => setFormGastoGeneral({ ...formGastoGeneral, medioPago: v })}
                    />
                    <SelectField
                      label="Tercero"
                      value={formGastoGeneral.terceroId}
                      onChange={v => setFormGastoGeneral({ ...formGastoGeneral, terceroId: v })}
                    >
                      {terceros.map(t => (
                        <BaseSelectItem key={t.id} value={t.id}>
                          {t.nombre}
                        </BaseSelectItem>
                      ))}
                    </SelectField>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InputField
                      label="Campana"
                      value={formGastoGeneral.campaniaId}
                      onChange={v => setFormGastoGeneral({ ...formGastoGeneral, campaniaId: v })}
                    />
                    <InputField
                      label="Fecha"
                      type="date"
                      value={formGastoGeneral.fecha}
                      onChange={v => setFormGastoGeneral({ ...formGastoGeneral, fecha: v })}
                      required
                    />
                  </div>
                  <DialogActions
                    guardando={guardando}
                    submitLabel={TIPO_META.gasto_general.submitLabel}
                    onBack={() => setOperacionActiva(null)}
                    onCancel={cerrarDialog}
                  />
                </form>
              )}

              {operacionActiva === 'anticipo_cliente' && (
                <form onSubmit={handleAnticipoCliente} className="space-y-4">
                  <SelectField
                    label="Cliente"
                    value={formAnticipoCliente.terceroId}
                    onChange={v => setFormAnticipoCliente({ ...formAnticipoCliente, terceroId: v })}
                    required
                  >
                    {clientes.map(t => (
                      <BaseSelectItem key={t.id} value={t.id}>
                        {t.nombre}
                      </BaseSelectItem>
                    ))}
                  </SelectField>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InputField
                      label="Monto"
                      type="number"
                      value={formAnticipoCliente.monto}
                      onChange={v => setFormAnticipoCliente({ ...formAnticipoCliente, monto: v })}
                      required
                    />
                    <MedioPagoField
                      value={formAnticipoCliente.medioPago}
                      onChange={v =>
                        setFormAnticipoCliente({ ...formAnticipoCliente, medioPago: v })
                      }
                    />
                  </div>
                  <InputField
                    label="Fecha"
                    type="date"
                    value={formAnticipoCliente.fecha}
                    onChange={v => setFormAnticipoCliente({ ...formAnticipoCliente, fecha: v })}
                    required
                  />
                  <DialogActions
                    guardando={guardando}
                    submitLabel={TIPO_META.anticipo_cliente.submitLabel}
                    onBack={() => setOperacionActiva(null)}
                    onCancel={cerrarDialog}
                  />
                </form>
              )}

              {operacionActiva === 'anticipo_proveedor' && (
                <form onSubmit={handleAnticipoProveedor} className="space-y-4">
                  <SelectField
                    label="Proveedor"
                    value={formAnticipoProveedor.terceroId}
                    onChange={v =>
                      setFormAnticipoProveedor({ ...formAnticipoProveedor, terceroId: v })
                    }
                    required
                  >
                    {proveedores.map(t => (
                      <BaseSelectItem key={t.id} value={t.id}>
                        {t.nombre}
                      </BaseSelectItem>
                    ))}
                  </SelectField>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InputField
                      label="Monto"
                      type="number"
                      value={formAnticipoProveedor.monto}
                      onChange={v => setFormAnticipoProveedor({ ...formAnticipoProveedor, monto: v })}
                      required
                    />
                    <MedioPagoField
                      value={formAnticipoProveedor.medioPago}
                      onChange={v =>
                        setFormAnticipoProveedor({ ...formAnticipoProveedor, medioPago: v })
                      }
                    />
                  </div>
                  <InputField
                    label="Fecha"
                    type="date"
                    value={formAnticipoProveedor.fecha}
                    onChange={v => setFormAnticipoProveedor({ ...formAnticipoProveedor, fecha: v })}
                    required
                  />
                  <DialogActions
                    guardando={guardando}
                    submitLabel={TIPO_META.anticipo_proveedor.submitLabel}
                    onBack={() => setOperacionActiva(null)}
                    onCancel={cerrarDialog}
                  />
                </form>
              )}

              {operacionActiva === 'cuota_financiacion' && (
                <form onSubmit={handleCuotaFinanciacion} className="space-y-4">
                  <InputField
                    label="Entidad financiera"
                    value={formCuota.entidadFinanciera}
                    onChange={v => setFormCuota({ ...formCuota, entidadFinanciera: v })}
                    required
                  />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InputField
                      label="Numero cuota"
                      type="number"
                      value={formCuota.numeroCuota}
                      onChange={v => setFormCuota({ ...formCuota, numeroCuota: v })}
                      required
                    />
                    <InputField
                      label="Total cuotas"
                      type="number"
                      value={formCuota.totalCuotas}
                      onChange={v => setFormCuota({ ...formCuota, totalCuotas: v })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <InputField
                      label="Capital"
                      type="number"
                      value={formCuota.capital}
                      onChange={v => setFormCuota({ ...formCuota, capital: v })}
                      required
                    />
                    <InputField
                      label="Interes"
                      type="number"
                      value={formCuota.interes}
                      onChange={v => setFormCuota({ ...formCuota, interes: v })}
                      required
                    />
                    <InputField
                      label="Monto total"
                      type="number"
                      value={formCuota.monto}
                      onChange={v => setFormCuota({ ...formCuota, monto: v })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <MedioPagoField
                      value={formCuota.medioPago}
                      onChange={v => setFormCuota({ ...formCuota, medioPago: v })}
                    />
                    <InputField
                      label="Fecha"
                      type="date"
                      value={formCuota.fecha}
                      onChange={v => setFormCuota({ ...formCuota, fecha: v })}
                      required
                    />
                  </div>
                  <DialogActions
                    guardando={guardando}
                    submitLabel={TIPO_META.cuota_financiacion.submitLabel}
                    onBack={() => setOperacionActiva(null)}
                    onCancel={cerrarDialog}
                  />
                </form>
              )}

              {operacionActiva === 'transferencia_interna' && (
                <form onSubmit={handleTransferenciaInterna} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <SelectField
                      label="Origen"
                      value={formTransferencia.origenId}
                      onChange={v => setFormTransferencia({ ...formTransferencia, origenId: v })}
                      required
                    >
                      {cuentasFinancieras.map(cuenta => (
                        <BaseSelectItem key={cuenta.id} value={cuenta.id}>
                          {cuenta.nombre}
                        </BaseSelectItem>
                      ))}
                    </SelectField>
                    <SelectField
                      label="Destino"
                      value={formTransferencia.destinoId}
                      onChange={v => setFormTransferencia({ ...formTransferencia, destinoId: v })}
                      required
                    >
                      {cuentasFinancieras.map(cuenta => (
                        <BaseSelectItem key={cuenta.id} value={cuenta.id}>
                          {cuenta.nombre}
                        </BaseSelectItem>
                      ))}
                    </SelectField>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InputField
                      label="Monto"
                      type="number"
                      value={formTransferencia.monto}
                      onChange={v => setFormTransferencia({ ...formTransferencia, monto: v })}
                      required
                    />
                    <InputField
                      label="Fecha"
                      type="date"
                      value={formTransferencia.fecha}
                      onChange={v => setFormTransferencia({ ...formTransferencia, fecha: v })}
                      required
                    />
                  </div>
                  <DialogActions
                    guardando={guardando}
                    submitLabel={TIPO_META.transferencia_interna.submitLabel}
                    onBack={() => setOperacionActiva(null)}
                    onCancel={cerrarDialog}
                  />
                </form>
              )}

              {operacionActiva === 'nota_credito' && (
                <form onSubmit={handleNotaCredito} className="space-y-4">
                  <SelectField
                    label="Cliente"
                    value={formNotaCredito.terceroId}
                    onChange={v => setFormNotaCredito({ ...formNotaCredito, terceroId: v })}
                    required
                  >
                    {clientes.map(t => (
                      <BaseSelectItem key={t.id} value={t.id}>
                        {t.nombre}
                      </BaseSelectItem>
                    ))}
                  </SelectField>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InputField
                      label="Monto"
                      type="number"
                      value={formNotaCredito.monto}
                      onChange={v => setFormNotaCredito({ ...formNotaCredito, monto: v })}
                      required
                    />
                    <InputField
                      label="Motivo"
                      value={formNotaCredito.motivo}
                      onChange={v => setFormNotaCredito({ ...formNotaCredito, motivo: v })}
                      required
                    />
                  </div>
                  <InputField
                    label="Fecha"
                    type="date"
                    value={formNotaCredito.fecha}
                    onChange={v => setFormNotaCredito({ ...formNotaCredito, fecha: v })}
                    required
                  />
                  <DialogActions
                    guardando={guardando}
                    submitLabel={TIPO_META.nota_credito.submitLabel}
                    onBack={() => setOperacionActiva(null)}
                    onCancel={cerrarDialog}
                  />
                </form>
              )}

              {operacionActiva === 'nota_debito' && (
                <form onSubmit={handleNotaDebito} className="space-y-4">
                  <SelectField
                    label="Proveedor"
                    value={formNotaDebito.terceroId}
                    onChange={v => setFormNotaDebito({ ...formNotaDebito, terceroId: v })}
                    required
                  >
                    {proveedores.map(t => (
                      <BaseSelectItem key={t.id} value={t.id}>
                        {t.nombre}
                      </BaseSelectItem>
                    ))}
                  </SelectField>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InputField
                      label="Monto"
                      type="number"
                      value={formNotaDebito.monto}
                      onChange={v => setFormNotaDebito({ ...formNotaDebito, monto: v })}
                      required
                    />
                    <InputField
                      label="Motivo"
                      value={formNotaDebito.motivo}
                      onChange={v => setFormNotaDebito({ ...formNotaDebito, motivo: v })}
                      required
                    />
                  </div>
                  <InputField
                    label="Fecha"
                    type="date"
                    value={formNotaDebito.fecha}
                    onChange={v => setFormNotaDebito({ ...formNotaDebito, fecha: v })}
                    required
                  />
                  <DialogActions
                    guardando={guardando}
                    submitLabel={TIPO_META.nota_debito.submitLabel}
                    onBack={() => setOperacionActiva(null)}
                    onCancel={cerrarDialog}
                  />
                </form>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function ActionCard({
  title,
  subtitle,
  onClick,
}: {
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="text-left">
      <BaseCard>
        <div>
          <p className="font-semibold text-slate-900">{title}</p>
          <p className="text-sm text-slate-600">{subtitle}</p>
        </div>
      </BaseCard>
    </button>
  );
}

function DialogActions({
  guardando,
  submitLabel,
  onBack,
  onCancel,
}: {
  guardando: boolean;
  submitLabel: string;
  onBack: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <BaseButton type="button" variant="outline" onClick={onBack}>
        Volver
      </BaseButton>
      <BaseButton type="button" variant="outline" onClick={onCancel}>
        Cancelar
      </BaseButton>
      <BaseButton type="submit" disabled={guardando}>
        {guardando ? 'Guardando...' : submitLabel}
      </BaseButton>
    </div>
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
      <label className="text-sm font-medium text-slate-700">
        {label}
        {required ? ' *' : ''}
      </label>
      <BaseInput
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
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
      <label className="text-sm font-medium text-slate-700">
        {label}
        {required ? ' *' : ''}
      </label>
      <BaseSelect value={value} onValueChange={onChange}>
        <BaseSelectTrigger>
          <BaseSelectValue placeholder="Seleccionar..." />
        </BaseSelectTrigger>
        <BaseSelectContent>{children}</BaseSelectContent>
      </BaseSelect>
    </div>
  );
}

function MedioPagoField({
  value,
  onChange,
}: {
  value: MedioPago;
  onChange: (value: MedioPago) => void;
}) {
  return (
    <SelectField label="Medio de pago" value={value} onChange={v => onChange(v as MedioPago)}>
      <BaseSelectItem value="efectivo">Efectivo</BaseSelectItem>
      <BaseSelectItem value="transferencia">Transferencia</BaseSelectItem>
      <BaseSelectItem value="cheque">Cheque</BaseSelectItem>
    </SelectField>
  );
}

function ToggleField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: 'si' | 'no';
  onChange: (value: 'si' | 'no') => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <select
        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
        value={value}
        onChange={e => onChange(e.target.value as 'si' | 'no')}
      >
        <option value="no">No</option>
        <option value="si">Si</option>
      </select>
    </div>
  );
}
