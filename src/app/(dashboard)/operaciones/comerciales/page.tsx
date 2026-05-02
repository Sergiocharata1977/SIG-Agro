'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Cog,
  Package,
  Plus,
  ReceiptText,
  Tractor,
} from 'lucide-react';
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
import { PluginGate } from '@/components/plugins/PluginGate';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { usePlugins } from '@/contexts/PluginsContext';
import {
  actualizarEstadoOperacion,
  actualizarOperacionComercial,
  crearOperacionComercial,
  obtenerOperacionesComerciales,
} from '@/services/operaciones-comerciales';
import { obtenerTerceros } from '@/services/terceros';
import type { Tercero } from '@/types/contabilidad-simple';
import type {
  CondicionVenta,
  EstadoOperacionComercial,
  LineaOperacionComercial,
  NuevaOperacionComercial,
  OperacionComercial,
  TipoOperacionComercial,
} from '@/types/operaciones-comerciales';

type FormState = {
  tipo: TipoOperacionComercial | null;
  fecha: string;
  numeroDocumento: string;
  terceroId: string;
  condicionVenta: CondicionVenta;
  lineas: LineaOperacionComercial[];
  descuentoGlobal: number;
  iva: number;
  medioCobro: string;
  maquinaId: string;
  ordenServicioId: string;
  maquinaVendidaDescripcion: string;
  marcaMaquina: string;
  modeloMaquina: string;
  anioMaquina: string;
  notas: string;
};

type EstadoDialogState = {
  open: boolean;
  operacion: OperacionComercial | null;
  estado: EstadoOperacionComercial;
  observacion: string;
  saving: boolean;
};

const DATE_FORMATTER = new Intl.DateTimeFormat('es-AR');

const TIPO_OPTIONS: Array<{
  value: TipoOperacionComercial;
  title: string;
  description: string;
  icon: typeof Cog;
  accent: string;
}> = [
  {
    value: 'servicio_tecnico',
    title: 'Servicio Tecnico',
    description: 'Ordenes de trabajo, mano de obra, repuestos y cierre comercial.',
    icon: Cog,
    accent: 'from-emerald-500/15 to-emerald-100',
  },
  {
    value: 'venta_repuesto',
    title: 'Venta Repuestos',
    description: 'Mostrador, kits y piezas con trazabilidad de items y descuentos.',
    icon: Package,
    accent: 'from-amber-500/15 to-amber-100',
  },
  {
    value: 'venta_maquinaria',
    title: 'Venta Maquinaria',
    description: 'Equipos, usados o nuevos, con datos tecnicos y comerciales.',
    icon: Tractor,
    accent: 'from-sky-500/15 to-sky-100',
  },
];

const ESTADO_LABELS: Record<EstadoOperacionComercial, string> = {
  borrador: 'Borrador',
  pendiente: 'Pendiente',
  facturado: 'Facturado',
  cobrado: 'Cobrado',
  anulado: 'Anulado',
};

const CONDICION_LABELS: Record<CondicionVenta, string> = {
  contado: 'Contado',
  credito_30: 'Credito 30',
  credito_60: 'Credito 60',
  credito_90: 'Credito 90',
  financiado: 'Financiado',
};

const EMPTY_LINE: LineaOperacionComercial = {
  descripcion: '',
  cantidad: 1,
  precioUnitario: 0,
  descuento: 0,
  subtotal: 0,
};

const EMPTY_FORM: FormState = {
  tipo: null,
  fecha: new Date().toISOString().slice(0, 10),
  numeroDocumento: '',
  terceroId: '',
  condicionVenta: 'contado',
  lineas: [{ ...EMPTY_LINE }],
  descuentoGlobal: 0,
  iva: 21,
  medioCobro: '',
  maquinaId: '',
  ordenServicioId: '',
  maquinaVendidaDescripcion: '',
  marcaMaquina: '',
  modeloMaquina: '',
  anioMaquina: '',
  notas: '',
};

function formatCurrency(value: number) {
  return `$ ${value.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value?: Date | null) {
  if (!value) return '-';
  return DATE_FORMATTER.format(value);
}

function getTipoLabel(tipo: TipoOperacionComercial) {
  return TIPO_OPTIONS.find((item) => item.value === tipo)?.title || tipo;
}

function getEstadoVariant(estado: EstadoOperacionComercial) {
  switch (estado) {
    case 'cobrado':
      return 'success' as const;
    case 'anulado':
      return 'destructive' as const;
    case 'facturado':
      return 'secondary' as const;
    default:
      return 'outline' as const;
  }
}

function getTipoVariant(tipo: TipoOperacionComercial) {
  switch (tipo) {
    case 'servicio_tecnico':
      return 'secondary' as const;
    case 'venta_repuesto':
      return 'outline' as const;
    case 'venta_maquinaria':
      return 'success' as const;
    default:
      return 'default' as const;
  }
}

function calcularLinea(linea: LineaOperacionComercial) {
  const cantidad = Number.isFinite(linea.cantidad) ? linea.cantidad : 0;
  const precioUnitario = Number.isFinite(linea.precioUnitario) ? linea.precioUnitario : 0;
  const descuento = Number.isFinite(linea.descuento) ? linea.descuento : 0;
  const subtotal = cantidad * precioUnitario * (1 - descuento / 100);

  return {
    ...linea,
    subtotal: Number(subtotal.toFixed(2)),
  };
}

function calcularTotales(
  lineas: LineaOperacionComercial[],
  descuentoGlobal: number,
  iva: number
) {
  const subtotalLineas = lineas.reduce((acc, linea) => acc + calcularLinea(linea).subtotal, 0);
  const subtotalConDescuento = subtotalLineas * (1 - descuentoGlobal / 100);
  const montoIVA = subtotalConDescuento * (iva / 100);
  const total = subtotalConDescuento + montoIVA;

  return {
    subtotal: Number(subtotalConDescuento.toFixed(2)),
    montoIVA: Number(montoIVA.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
}

function sanitizeText(value: string) {
  const next = value.trim();
  return next.length ? next : undefined;
}

function mapOperacionToForm(operacion: OperacionComercial): FormState {
  return {
    tipo: operacion.tipo,
    fecha: operacion.fecha.toISOString().slice(0, 10),
    numeroDocumento: operacion.numeroDocumento || '',
    terceroId: operacion.terceroId,
    condicionVenta: operacion.condicionVenta,
    lineas: operacion.lineas.length ? operacion.lineas.map((linea) => ({ ...linea })) : [{ ...EMPTY_LINE }],
    descuentoGlobal: operacion.descuentoGlobal,
    iva: operacion.iva,
    medioCobro: operacion.medioCobro || '',
    maquinaId: operacion.maquinaId || '',
    ordenServicioId: operacion.ordenServicioId || '',
    maquinaVendidaDescripcion: operacion.maquinaVendidaDescripcion || '',
    marcaMaquina: operacion.marcaMaquina || '',
    modeloMaquina: operacion.modeloMaquina || '',
    anioMaquina: operacion.anioMaquina ? String(operacion.anioMaquina) : '',
    notas: operacion.notas || '',
  };
}

function buildPayload(
  form: FormState,
  terceroNombre: string,
  creadoPor: string,
  estado: EstadoOperacionComercial
): NuevaOperacionComercial {
  const lineas = form.lineas.map(calcularLinea);
  const { subtotal, montoIVA, total } = calcularTotales(lineas, form.descuentoGlobal, form.iva);

  return {
    tipo: form.tipo || 'servicio_tecnico',
    estado,
    fecha: new Date(`${form.fecha}T12:00:00`),
    numeroDocumento: sanitizeText(form.numeroDocumento),
    terceroId: form.terceroId,
    terceroNombre,
    lineas,
    subtotal,
    descuentoGlobal: form.descuentoGlobal,
    iva: form.iva,
    montoIVA,
    total,
    condicionVenta: form.condicionVenta,
    medioCobro: sanitizeText(form.medioCobro),
    maquinaId: sanitizeText(form.maquinaId),
    ordenServicioId: sanitizeText(form.ordenServicioId),
    maquinaVendidaDescripcion: sanitizeText(form.maquinaVendidaDescripcion),
    marcaMaquina: sanitizeText(form.marcaMaquina),
    modeloMaquina: sanitizeText(form.modeloMaquina),
    anioMaquina: sanitizeText(form.anioMaquina)
      ? Number(form.anioMaquina)
      : undefined,
    asientoId: undefined,
    notas: sanitizeText(form.notas),
    creadoPor,
  };
}

export default function OperacionesComercialesPage() {
  const { isActive, loading: pluginsLoading } = usePlugins();
  const { user, loading: authLoading } = useAuth();
  const pluginActive = isActive('operaciones_comerciales');

  const [operaciones, setOperaciones] = useState<OperacionComercial[]>([]);
  const [terceros, setTerceros] = useState<Tercero[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | TipoOperacionComercial>('todos');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | EstadoOperacionComercial>('todos');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [editing, setEditing] = useState<OperacionComercial | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [estadoDialog, setEstadoDialog] = useState<EstadoDialogState>({
    open: false,
    operacion: null,
    estado: 'pendiente',
    observacion: '',
    saving: false,
  });

  useEffect(() => {
    async function cargarDatos() {
      if (!user?.organizationId || !pluginActive) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [operacionesData, tercerosData] = await Promise.all([
          obtenerOperacionesComerciales(user.organizationId),
          obtenerTerceros(user.organizationId, 'cliente'),
        ]);

        setOperaciones(operacionesData);
        setTerceros(tercerosData);
      } catch (error) {
        console.error('Error cargando operaciones comerciales:', error);
        setOperaciones([]);
        setTerceros([]);
      } finally {
        setLoading(false);
      }
    }

    if (authLoading || pluginsLoading || !pluginActive) return;

    void cargarDatos();
  }, [authLoading, pluginActive, pluginsLoading, user?.organizationId]);

  const tercerosMap = useMemo(() => {
    return new Map(terceros.map((tercero) => [tercero.id, tercero.nombre]));
  }, [terceros]);

  const operacionesFiltradas = useMemo(() => {
    const desde = filtroDesde ? new Date(`${filtroDesde}T00:00:00`) : null;
    const hasta = filtroHasta ? new Date(`${filtroHasta}T23:59:59.999`) : null;
    const query = search.trim().toLowerCase();

    return operaciones.filter((operacion) => {
      if (filtroTipo !== 'todos' && operacion.tipo !== filtroTipo) return false;
      if (filtroEstado !== 'todos' && operacion.estado !== filtroEstado) return false;
      if (desde && operacion.fecha < desde) return false;
      if (hasta && operacion.fecha > hasta) return false;
      if (!query) return true;

      return [
        operacion.numeroDocumento,
        operacion.terceroNombre,
        ESTADO_LABELS[operacion.estado],
        getTipoLabel(operacion.tipo),
      ]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [filtroDesde, filtroEstado, filtroHasta, filtroTipo, operaciones, search]);

  const kpis = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return operaciones.reduce(
      (acc, operacion) => {
        const enMes = operacion.fecha >= monthStart && operacion.fecha < nextMonthStart;

        if (enMes && (operacion.estado === 'facturado' || operacion.estado === 'cobrado')) {
          acc.facturadoMes += operacion.total;
        }

        if (enMes && operacion.estado === 'cobrado') {
          acc.cobradoMes += operacion.total;
        }

        if (operacion.estado === 'pendiente' || operacion.estado === 'facturado') {
          acc.pendienteCobro += operacion.total;
        }

        if (operacion.estado !== 'cobrado' && operacion.estado !== 'anulado') {
          acc.abiertas += 1;
        }

        return acc;
      },
      {
        facturadoMes: 0,
        cobradoMes: 0,
        pendienteCobro: 0,
        abiertas: 0,
      }
    );
  }, [operaciones]);

  const resumenFormulario = useMemo(() => {
    return calcularTotales(form.lineas, form.descuentoGlobal, form.iva);
  }, [form.descuentoGlobal, form.iva, form.lineas]);

  function toggleExpanded(id: string) {
    setExpandedRows((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  function openCreateDialog() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setWizardStep(1);
    setDialogOpen(true);
  }

  function openEditDialog(operacion: OperacionComercial) {
    setEditing(operacion);
    setForm(mapOperacionToForm(operacion));
    setWizardStep(4);
    setDialogOpen(true);
  }

  function openEstadoDialog(operacion: OperacionComercial) {
    setEstadoDialog({
      open: true,
      operacion,
      estado: operacion.estado,
      observacion: '',
      saving: false,
    });
  }

  function closeWizard() {
    setDialogOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setWizardStep(1);
    setSaving(false);
  }

  function updateLinea(
    index: number,
    patch: Partial<LineaOperacionComercial>
  ) {
    setForm((current) => ({
      ...current,
      lineas: current.lineas.map((linea, lineaIndex) =>
        lineaIndex === index ? calcularLinea({ ...linea, ...patch }) : linea
      ),
    }));
  }

  function removeLinea(index: number) {
    setForm((current) => ({
      ...current,
      lineas:
        current.lineas.length === 1
          ? [{ ...EMPTY_LINE }]
          : current.lineas.filter((_, lineaIndex) => lineaIndex !== index),
    }));
  }

  async function reloadData() {
    if (!user?.organizationId) return;
    const [operacionesData, tercerosData] = await Promise.all([
      obtenerOperacionesComerciales(user.organizationId),
      obtenerTerceros(user.organizationId, 'cliente'),
    ]);
    setOperaciones(operacionesData);
    setTerceros(tercerosData);
  }

  async function handleGuardar(estado: EstadoOperacionComercial) {
    if (!user?.organizationId || !user?.id || !form.tipo || !form.terceroId) return;

    setSaving(true);
    try {
      const terceroNombre = tercerosMap.get(form.terceroId) || 'Cliente sin nombre';
      const payload = buildPayload(form, terceroNombre, user.id, estado);

      if (editing) {
        await actualizarOperacionComercial(user.organizationId, editing.id, payload);
      } else {
        await crearOperacionComercial(user.organizationId, payload);
      }

      await reloadData();
      closeWizard();
    } catch (error) {
      console.error('Error guardando operacion comercial:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleCambiarEstado() {
    if (!user?.organizationId || !estadoDialog.operacion) return;

    setEstadoDialog((current) => ({ ...current, saving: true }));
    try {
      await actualizarEstadoOperacion(
        user.organizationId,
        estadoDialog.operacion.id,
        estadoDialog.estado,
        estadoDialog.operacion.asientoId
      );

      if (estadoDialog.observacion.trim()) {
        const notaActual = estadoDialog.operacion.notas?.trim();
        const auditLine = `[Estado ${ESTADO_LABELS[estadoDialog.estado]} - ${formatDate(new Date())}] ${estadoDialog.observacion.trim()}`;

        await actualizarOperacionComercial(user.organizationId, estadoDialog.operacion.id, {
          notas: notaActual ? `${notaActual}\n${auditLine}` : auditLine,
        });
      }

      await reloadData();
      setEstadoDialog({
        open: false,
        operacion: null,
        estado: 'pendiente',
        observacion: '',
        saving: false,
      });
    } catch (error) {
      console.error('Error actualizando estado:', error);
      setEstadoDialog((current) => ({ ...current, saving: false }));
    }
  }

  const canContinueGeneral = form.tipo && form.terceroId && form.fecha;
  const canContinueLineas = form.lineas.some((linea) => linea.descripcion.trim());

  if (!pluginsLoading && !pluginActive) {
    return (
      <PluginGate pluginId="operaciones_comerciales" isActive={false}>
        {null}
      </PluginGate>
    );
  }

  if (authLoading || pluginsLoading || loading) {
    return (
      <PageShell
        title="Operaciones comerciales"
        subtitle="Servicio tecnico, repuestos y maquinaria en una sola vista."
      >
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
          Cargando operaciones comerciales...
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Operaciones comerciales"
      subtitle="ABM operativo con wizard comercial, estado de cobro y detalle expandible por documento."
    >
      <Section>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <BaseCard>
            <p className="text-sm text-slate-500">Facturado mes</p>
            <p className="text-2xl font-semibold text-slate-900">
              {formatCurrency(kpis.facturadoMes)}
            </p>
          </BaseCard>
          <BaseCard>
            <p className="text-sm text-slate-500">Cobrado mes</p>
            <p className="text-2xl font-semibold text-emerald-700">
              {formatCurrency(kpis.cobradoMes)}
            </p>
          </BaseCard>
          <BaseCard>
            <p className="text-sm text-slate-500">Pendiente cobro</p>
            <p className="text-2xl font-semibold text-amber-700">
              {formatCurrency(kpis.pendienteCobro)}
            </p>
          </BaseCard>
          <BaseCard>
            <p className="text-sm text-slate-500">Operaciones abiertas</p>
            <p className="text-2xl font-semibold text-sky-700">{kpis.abiertas}</p>
          </BaseCard>
        </div>
      </Section>

      <PageToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por cliente, numero o estado..."
        filters={
          <>
            <BaseSelect
              value={filtroTipo}
              onValueChange={(value) =>
                setFiltroTipo(value as 'todos' | TipoOperacionComercial)
              }
            >
              <BaseSelectTrigger className="w-full md:w-48">
                <BaseSelectValue placeholder="Tipo" />
              </BaseSelectTrigger>
              <BaseSelectContent>
                <BaseSelectItem value="todos">Todos los tipos</BaseSelectItem>
                {TIPO_OPTIONS.map((tipo) => (
                  <BaseSelectItem key={tipo.value} value={tipo.value}>
                    {tipo.title}
                  </BaseSelectItem>
                ))}
              </BaseSelectContent>
            </BaseSelect>

            <BaseSelect
              value={filtroEstado}
              onValueChange={(value) =>
                setFiltroEstado(value as 'todos' | EstadoOperacionComercial)
              }
            >
              <BaseSelectTrigger className="w-full md:w-44">
                <BaseSelectValue placeholder="Estado" />
              </BaseSelectTrigger>
              <BaseSelectContent>
                <BaseSelectItem value="todos">Todos los estados</BaseSelectItem>
                {Object.entries(ESTADO_LABELS).map(([value, label]) => (
                  <BaseSelectItem key={value} value={value}>
                    {label}
                  </BaseSelectItem>
                ))}
              </BaseSelectContent>
            </BaseSelect>

            <BaseInput
              type="date"
              value={filtroDesde}
              onChange={(event) => setFiltroDesde(event.target.value)}
              className="w-full md:w-40"
            />
            <BaseInput
              type="date"
              value={filtroHasta}
              onChange={(event) => setFiltroHasta(event.target.value)}
              className="w-full md:w-40"
            />
          </>
        }
        actions={
          <BaseButton onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva operacion
          </BaseButton>
        }
      />

      <Section
        title="Documentos comerciales"
        description="Hace click en una fila para ver las lineas completas del documento."
      >
        {operacionesFiltradas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
            No hay operaciones para los filtros seleccionados.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="w-12 px-4 py-3 text-left font-medium text-slate-600" />
                    <th className="px-4 py-3 text-left font-medium text-slate-600">N° Doc</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Fecha</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Tipo</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Cliente</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-600">Total</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Estado</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {operacionesFiltradas.map((operacion) => {
                    const expanded = expandedRows.includes(operacion.id);

                    return (
                      <Fragment key={operacion.id}>
                        <tr
                          className="cursor-pointer border-t border-slate-100 transition-colors hover:bg-slate-50"
                          onClick={() => toggleExpanded(operacion.id)}
                        >
                          <td className="px-4 py-3 text-slate-500">
                            {expanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {operacion.numeroDocumento || `OC-${operacion.id.slice(0, 6)}`}
                          </td>
                          <td className="px-4 py-3 text-slate-700">{formatDate(operacion.fecha)}</td>
                          <td className="px-4 py-3">
                            <BaseBadge variant={getTipoVariant(operacion.tipo)}>
                              {getTipoLabel(operacion.tipo)}
                            </BaseBadge>
                          </td>
                          <td className="px-4 py-3 text-slate-700">{operacion.terceroNombre}</td>
                          <td className="px-4 py-3 text-right font-medium text-slate-900">
                            {formatCurrency(operacion.total)}
                          </td>
                          <td className="px-4 py-3">
                            <BaseBadge variant={getEstadoVariant(operacion.estado)}>
                              {ESTADO_LABELS[operacion.estado]}
                            </BaseBadge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <BaseButton
                                size="sm"
                                variant="outline"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openEstadoDialog(operacion);
                                }}
                              >
                                Editar estado
                              </BaseButton>
                              <BaseButton
                                size="sm"
                                variant="outline"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openEditDialog(operacion);
                                }}
                              >
                                Ver detalle
                              </BaseButton>
                            </div>
                          </td>
                        </tr>
                        {expanded ? (
                          <tr key={`${operacion.id}-expanded`} className="border-t border-slate-100 bg-slate-50/70">
                            <td colSpan={8} className="px-4 py-4">
                              <div className="space-y-4">
                                <div className="grid gap-3 md:grid-cols-4">
                                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                                      Condicion
                                    </p>
                                    <p className="mt-1 font-medium text-slate-900">
                                      {CONDICION_LABELS[operacion.condicionVenta]}
                                    </p>
                                  </div>
                                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                                      IVA
                                    </p>
                                    <p className="mt-1 font-medium text-slate-900">
                                      {operacion.iva}%
                                    </p>
                                  </div>
                                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                                      Descuento global
                                    </p>
                                    <p className="mt-1 font-medium text-slate-900">
                                      {operacion.descuentoGlobal}%
                                    </p>
                                  </div>
                                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                                      Medio cobro
                                    </p>
                                    <p className="mt-1 font-medium text-slate-900">
                                      {operacion.medioCobro || '-'}
                                    </p>
                                  </div>
                                </div>

                                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                                  <table className="min-w-full text-sm">
                                    <thead className="bg-slate-50">
                                      <tr>
                                        <th className="px-4 py-3 text-left font-medium text-slate-600">
                                          Descripcion
                                        </th>
                                        <th className="px-4 py-3 text-right font-medium text-slate-600">
                                          Qty
                                        </th>
                                        <th className="px-4 py-3 text-right font-medium text-slate-600">
                                          Precio
                                        </th>
                                        <th className="px-4 py-3 text-right font-medium text-slate-600">
                                          Desc.
                                        </th>
                                        <th className="px-4 py-3 text-right font-medium text-slate-600">
                                          Subtotal
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {operacion.lineas.map((linea, index) => (
                                        <tr key={`${operacion.id}-${index}`} className="border-t border-slate-100">
                                          <td className="px-4 py-3 text-slate-900">
                                            {linea.descripcion}
                                          </td>
                                          <td className="px-4 py-3 text-right text-slate-700">
                                            {linea.cantidad}
                                          </td>
                                          <td className="px-4 py-3 text-right text-slate-700">
                                            {formatCurrency(linea.precioUnitario)}
                                          </td>
                                          <td className="px-4 py-3 text-right text-slate-700">
                                            {linea.descuento}%
                                          </td>
                                          <td className="px-4 py-3 text-right font-medium text-slate-900">
                                            {formatCurrency(linea.subtotal)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>

                                {operacion.notas ? (
                                  <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600">
                                    {operacion.notas}
                                  </div>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Section>

      <Dialog open={dialogOpen} onOpenChange={(open) => (!open ? closeWizard() : setDialogOpen(true))}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Detalle de operacion comercial' : 'Nueva operacion comercial'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid gap-2 md:grid-cols-4">
              {[1, 2, 3, 4].map((step) => (
                <button
                  key={step}
                  type="button"
                  className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                    wizardStep === step
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                  onClick={() => setWizardStep(step)}
                >
                  <p className="text-xs uppercase tracking-[0.2em]">Paso {step}</p>
                  <p className="mt-1 text-sm font-medium">
                    {step === 1
                      ? 'Tipo'
                      : step === 2
                        ? 'Datos generales'
                        : step === 3
                          ? 'Lineas'
                          : 'Totales'}
                  </p>
                </button>
              ))}
            </div>

            {wizardStep === 1 ? (
              <div className="grid gap-4 lg:grid-cols-3">
                {TIPO_OPTIONS.map((tipo) => {
                  const Icon = tipo.icon;
                  const selected = form.tipo === tipo.value;

                  return (
                    <button
                      key={tipo.value}
                      type="button"
                      onClick={() => {
                        setForm((current) => ({ ...current, tipo: tipo.value }));
                        setWizardStep(2);
                      }}
                      className={`rounded-[28px] border p-6 text-left transition-all ${
                        selected
                          ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                          : 'border-slate-200 bg-white hover:-translate-y-1 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${
                          selected ? 'from-white/20 to-white/10' : tipo.accent
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <p className="text-lg font-semibold">{tipo.title}</p>
                      <p className={`mt-2 text-sm ${selected ? 'text-slate-100' : 'text-slate-600'}`}>
                        {tipo.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {wizardStep === 2 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Cliente" required>
                  <BaseSelect
                    value={form.terceroId || undefined}
                    onValueChange={(value) => setForm((current) => ({ ...current, terceroId: value }))}
                  >
                    <BaseSelectTrigger>
                      <BaseSelectValue placeholder="Seleccionar cliente" />
                    </BaseSelectTrigger>
                    <BaseSelectContent>
                      {terceros.map((tercero) => (
                        <BaseSelectItem key={tercero.id} value={tercero.id}>
                          {tercero.nombre}
                        </BaseSelectItem>
                      ))}
                    </BaseSelectContent>
                  </BaseSelect>
                </Field>

                <Field label="Fecha" required>
                  <BaseInput
                    type="date"
                    value={form.fecha}
                    onChange={(event) => setForm((current) => ({ ...current, fecha: event.target.value }))}
                  />
                </Field>

                <Field label="Condicion de venta" required>
                  <BaseSelect
                    value={form.condicionVenta}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        condicionVenta: value as CondicionVenta,
                      }))
                    }
                  >
                    <BaseSelectTrigger>
                      <BaseSelectValue />
                    </BaseSelectTrigger>
                    <BaseSelectContent>
                      {Object.entries(CONDICION_LABELS).map(([value, label]) => (
                        <BaseSelectItem key={value} value={value}>
                          {label}
                        </BaseSelectItem>
                      ))}
                    </BaseSelectContent>
                  </BaseSelect>
                </Field>

                <Field label="N° documento">
                  <BaseInput
                    value={form.numeroDocumento}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        numeroDocumento: event.target.value,
                      }))
                    }
                    placeholder="Ej. FC-000123"
                  />
                </Field>
              </div>
            ) : null}

            {wizardStep === 3 ? (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-slate-600">
                          Descripcion
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-slate-600">Qty</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-600">
                          Precio
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-slate-600">
                          Desc. %
                        </th>
                        <th className="px-4 py-3 text-center font-medium text-slate-600">
                          Flags
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-slate-600">
                          Subtotal
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-slate-600" />
                      </tr>
                    </thead>
                    <tbody>
                      {form.lineas.map((linea, index) => (
                        <tr key={index} className="border-t border-slate-100">
                          <td className="min-w-[260px] px-4 py-3">
                            <BaseInput
                              value={linea.descripcion}
                              onChange={(event) =>
                                updateLinea(index, { descripcion: event.target.value })
                              }
                              placeholder="Descripcion del item o servicio"
                            />
                          </td>
                          <td className="w-28 px-4 py-3">
                            <BaseInput
                              type="number"
                              min="0"
                              step="0.01"
                              value={linea.cantidad}
                              onChange={(event) =>
                                updateLinea(index, { cantidad: Number(event.target.value) })
                              }
                            />
                          </td>
                          <td className="w-36 px-4 py-3">
                            <BaseInput
                              type="number"
                              min="0"
                              step="0.01"
                              value={linea.precioUnitario}
                              onChange={(event) =>
                                updateLinea(index, {
                                  precioUnitario: Number(event.target.value),
                                })
                              }
                            />
                          </td>
                          <td className="w-28 px-4 py-3">
                            <BaseInput
                              type="number"
                              min="0"
                              step="0.01"
                              value={linea.descuento}
                              onChange={(event) =>
                                updateLinea(index, { descuento: Number(event.target.value) })
                              }
                            />
                          </td>
                          <td className="min-w-[180px] px-4 py-3">
                            <div className="flex flex-col gap-2">
                              <label className="flex items-center gap-2 text-xs text-slate-600">
                                <Checkbox
                                  checked={linea.esRepuesto || false}
                                  onCheckedChange={(checked) =>
                                    updateLinea(index, { esRepuesto: checked === true })
                                  }
                                />
                                Repuesto
                              </label>
                              <label className="flex items-center gap-2 text-xs text-slate-600">
                                <Checkbox
                                  checked={linea.esManoObra || false}
                                  onCheckedChange={(checked) =>
                                    updateLinea(index, { esManoObra: checked === true })
                                  }
                                />
                                Mano de obra
                              </label>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-slate-900">
                            {formatCurrency(calcularLinea(linea).subtotal)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <BaseButton
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => removeLinea(index)}
                            >
                              Quitar
                            </BaseButton>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <BaseButton
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      lineas: [...current.lineas, { ...EMPTY_LINE }],
                    }))
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar linea
                </BaseButton>
              </div>
            ) : null}

            {wizardStep === 4 ? (
              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="IVA %">
                      <BaseInput
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.iva}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            iva: Number(event.target.value),
                          }))
                        }
                      />
                    </Field>

                    <Field label="Descuento global %">
                      <BaseInput
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.descuentoGlobal}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            descuentoGlobal: Number(event.target.value),
                          }))
                        }
                      />
                    </Field>

                    <Field label="Medio de cobro">
                      <BaseInput
                        value={form.medioCobro}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            medioCobro: event.target.value,
                          }))
                        }
                        placeholder="Transferencia, cheque, contado..."
                      />
                    </Field>

                    <Field label="ID maquina / activo">
                      <BaseInput
                        value={form.maquinaId}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            maquinaId: event.target.value,
                          }))
                        }
                      />
                    </Field>
                  </div>

                  {form.tipo === 'servicio_tecnico' ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Orden de servicio">
                        <BaseInput
                          value={form.ordenServicioId}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              ordenServicioId: event.target.value,
                            }))
                          }
                        />
                      </Field>
                    </div>
                  ) : null}

                  {form.tipo === 'venta_maquinaria' ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Descripcion maquinaria">
                        <BaseInput
                          value={form.maquinaVendidaDescripcion}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              maquinaVendidaDescripcion: event.target.value,
                            }))
                          }
                        />
                      </Field>
                      <Field label="Marca">
                        <BaseInput
                          value={form.marcaMaquina}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              marcaMaquina: event.target.value,
                            }))
                          }
                        />
                      </Field>
                      <Field label="Modelo">
                        <BaseInput
                          value={form.modeloMaquina}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              modeloMaquina: event.target.value,
                            }))
                          }
                        />
                      </Field>
                      <Field label="Anio">
                        <BaseInput
                          type="number"
                          min="1900"
                          max="2100"
                          value={form.anioMaquina}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              anioMaquina: event.target.value,
                            }))
                          }
                        />
                      </Field>
                    </div>
                  ) : null}

                  <Field label="Notas">
                    <textarea
                      value={form.notas}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          notas: event.target.value,
                        }))
                      }
                      rows={5}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400"
                      placeholder="Observaciones comerciales, condiciones especiales o acuerdos con el cliente."
                    />
                  </Field>
                </div>

                <BaseCard
                  title="Totales"
                  description="Resumen de cierre del documento antes de guardarlo."
                >
                  <div className="space-y-4">
                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex items-center justify-between">
                        <span>Subtotal</span>
                        <span className="font-medium text-slate-900">
                          {formatCurrency(resumenFormulario.subtotal)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>IVA</span>
                        <span className="font-medium text-slate-900">
                          {formatCurrency(resumenFormulario.montoIVA)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base">
                        <span className="font-semibold text-slate-900">Total</span>
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(resumenFormulario.total)}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                      <p className="font-medium text-slate-900">
                        {form.tipo ? getTipoLabel(form.tipo) : 'Tipo pendiente'}
                      </p>
                      <p className="mt-1">
                        Cliente:{' '}
                        <span className="font-medium text-slate-900">
                          {tercerosMap.get(form.terceroId) || 'Sin seleccionar'}
                        </span>
                      </p>
                      <p className="mt-1">
                        Documento:{' '}
                        <span className="font-medium text-slate-900">
                          {form.numeroDocumento || 'Sin numero'}
                        </span>
                      </p>
                    </div>
                  </div>
                </BaseCard>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <BaseButton
                  type="button"
                  variant="outline"
                  onClick={() => setWizardStep((current) => Math.max(1, current - 1))}
                  disabled={wizardStep === 1}
                >
                  Anterior
                </BaseButton>
                <BaseButton
                  type="button"
                  variant="outline"
                  onClick={() => setWizardStep((current) => Math.min(4, current + 1))}
                  disabled={
                    (wizardStep === 1 && !form.tipo) ||
                    (wizardStep === 2 && !canContinueGeneral) ||
                    (wizardStep === 3 && !canContinueLineas) ||
                    wizardStep === 4
                  }
                >
                  Siguiente
                </BaseButton>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <BaseButton type="button" variant="outline" onClick={closeWizard}>
                  Cancelar
                </BaseButton>
                <BaseButton
                  type="button"
                  variant="secondary"
                  disabled={!canContinueGeneral || !canContinueLineas || saving}
                  onClick={() => handleGuardar('borrador')}
                >
                  {saving && editing ? 'Guardando...' : 'Borrador'}
                </BaseButton>
                <BaseButton
                  type="button"
                  disabled={!canContinueGeneral || !canContinueLineas || saving}
                  onClick={() => handleGuardar('facturado')}
                >
                  <ReceiptText className="mr-2 h-4 w-4" />
                  {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Facturar'}
                </BaseButton>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={estadoDialog.open}
        onOpenChange={(open) =>
          setEstadoDialog((current) =>
            open
              ? current
              : {
                  open: false,
                  operacion: null,
                  estado: 'pendiente',
                  observacion: '',
                  saving: false,
                }
          )
        }
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Cambiar estado</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Field label="Estado" required>
              <BaseSelect
                value={estadoDialog.estado}
                onValueChange={(value) =>
                  setEstadoDialog((current) => ({
                    ...current,
                    estado: value as EstadoOperacionComercial,
                  }))
                }
              >
                <BaseSelectTrigger>
                  <BaseSelectValue />
                </BaseSelectTrigger>
                <BaseSelectContent>
                  {Object.entries(ESTADO_LABELS).map(([value, label]) => (
                    <BaseSelectItem key={value} value={value}>
                      {label}
                    </BaseSelectItem>
                  ))}
                </BaseSelectContent>
              </BaseSelect>
            </Field>

            <Field label="Observacion">
              <textarea
                value={estadoDialog.observacion}
                onChange={(event) =>
                  setEstadoDialog((current) => ({
                    ...current,
                    observacion: event.target.value,
                  }))
                }
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400"
                placeholder="Detalle del cambio de estado."
              />
            </Field>

            <div className="flex justify-end gap-2">
              <BaseButton
                type="button"
                variant="outline"
                onClick={() =>
                  setEstadoDialog({
                    open: false,
                    operacion: null,
                    estado: 'pendiente',
                    observacion: '',
                    saving: false,
                  })
                }
              >
                Cancelar
              </BaseButton>
              <BaseButton
                type="button"
                disabled={estadoDialog.saving}
                onClick={handleCambiarEstado}
              >
                {estadoDialog.saving ? 'Guardando...' : 'Guardar estado'}
              </BaseButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-slate-700">
        {label}
        {required ? ' *' : ''}
      </Label>
      {children}
    </div>
  );
}
