'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Pencil, Plus } from 'lucide-react';
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
import { useAuth } from '@/contexts/AuthContext';
import { usePlugins } from '@/contexts/PluginsContext';
import { obtenerCampanias } from '@/services/campanias';
import {
  actualizarCentroCosto,
  crearCentroCosto,
  obtenerCentrosCosto,
  obtenerMovimientosCentroCosto,
  obtenerResumenesCentrosCosto,
} from '@/services/centros-costo';
import type {
  CentroCosto,
  MovimientoCentroCosto,
  ResumenCentroCosto,
  TipoCentroCosto,
} from '@/types/centros-costo';
import type { Campania } from '@/types/campania';

type FormState = {
  codigo: string;
  nombre: string;
  tipo: TipoCentroCosto;
  descripcion: string;
  campaniaId: string;
};

type MovimientosState = Record<string, MovimientoCentroCosto[]>;
type LoadingRowsState = Record<string, boolean>;
type MovimientoFiltersState = Record<string, string>;

const DATE_FORMATTER = new Intl.DateTimeFormat('es-AR');

const TIPO_OPTIONS: Array<{ value: TipoCentroCosto; label: string; variant: 'default' | 'secondary' | 'outline' | 'success' }> = [
  { value: 'administracion', label: 'Administracion', variant: 'secondary' },
  { value: 'ventas', label: 'Ventas', variant: 'success' },
  { value: 'repuestos', label: 'Repuestos', variant: 'outline' },
  { value: 'servicios_tecnicos', label: 'Servicios tecnicos', variant: 'default' },
  { value: 'taller', label: 'Taller', variant: 'outline' },
  { value: 'campo', label: 'Campo', variant: 'success' },
  { value: 'maquinaria', label: 'Maquinaria', variant: 'secondary' },
  { value: 'sucursal', label: 'Sucursal', variant: 'default' },
  { value: 'campana', label: 'Campana', variant: 'success' },
  { value: 'lote', label: 'Lote', variant: 'secondary' },
  { value: 'cultivo', label: 'Cultivo', variant: 'outline' },
  { value: 'otro', label: 'Otro', variant: 'default' },
];

const EMPTY_FORM: FormState = {
  codigo: '',
  nombre: '',
  tipo: 'administracion',
  descripcion: '',
  campaniaId: '',
};

function formatCurrency(value: number) {
  return `$ ${value.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value?: Date) {
  if (!value) return '-';
  return DATE_FORMATTER.format(value);
}

function getTipoMeta(tipo: TipoCentroCosto) {
  return TIPO_OPTIONS.find((item) => item.value === tipo) ?? TIPO_OPTIONS[0];
}

function getSaldoClass(value: number) {
  if (value < 0) return 'text-red-700';
  if (value > 0) return 'text-emerald-700';
  return 'text-slate-900';
}

function mapCentroToForm(centro: CentroCosto): FormState {
  return {
    codigo: centro.codigo,
    nombre: centro.nombre,
    tipo: centro.tipo,
    descripcion: centro.descripcion || '',
    campaniaId: centro.campaniaId || '',
  };
}

export default function CentrosCostoPage() {
  const { user, loading: authLoading, organizationId } = useAuth();
  const { isActive, loading: pluginsLoading } = usePlugins();

  const [centros, setCentros] = useState<CentroCosto[]>([]);
  const [resumenes, setResumenes] = useState<ResumenCentroCosto[]>([]);
  const [campanias, setCampanias] = useState<Campania[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [editando, setEditando] = useState<CentroCosto | null>(null);
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [movimientosByCentro, setMovimientosByCentro] = useState<MovimientosState>({});
  const [loadingMovimientos, setLoadingMovimientos] = useState<LoadingRowsState>({});
  const [movimientoFilters, setMovimientoFilters] = useState<MovimientoFiltersState>({});

  useEffect(() => {
    if (organizationId) {
      void cargarDatos();
    } else {
      setLoading(false);
    }
  }, [organizationId]);

  async function cargarDatos() {
    if (!organizationId) return;

    try {
      setLoading(true);
      const [centrosData, resumenesData, campaniasData] = await Promise.all([
        obtenerCentrosCosto(organizationId),
        obtenerResumenesCentrosCosto(organizationId),
        user?.id ? obtenerCampanias(user.id).catch(() => []) : Promise.resolve([]),
      ]);

      setCentros(centrosData);
      setResumenes(resumenesData);
      setCampanias(campaniasData);
    } catch (error) {
      console.error('Error cargando centros de costo:', error);
    } finally {
      setLoading(false);
    }
  }

  function abrirDialog(centro?: CentroCosto) {
    if (centro) {
      setEditando(centro);
      setFormData(mapCentroToForm(centro));
    } else {
      setEditando(null);
      setFormData(EMPTY_FORM);
    }

    setDialogOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!organizationId || !formData.codigo.trim() || !formData.nombre.trim()) {
      return;
    }

    setGuardando(true);

    try {
      const payload = {
        codigo: formData.codigo.trim(),
        nombre: formData.nombre.trim(),
        tipo: formData.tipo,
        descripcion: formData.descripcion.trim() || undefined,
        campaniaId: formData.campaniaId || undefined,
        activo: editando?.activo ?? true,
      };

      if (editando) {
        await actualizarCentroCosto(organizationId, editando.id, payload);
      } else {
        await crearCentroCosto(organizationId, payload);
      }

      setDialogOpen(false);
      setEditando(null);
      setFormData(EMPTY_FORM);
      await cargarDatos();
    } catch (error) {
      console.error('Error guardando centro de costo:', error);
    } finally {
      setGuardando(false);
    }
  }

  async function toggleExpanded(centroId: string) {
    const expanded = expandedRows.includes(centroId);

    if (expanded) {
      setExpandedRows((prev) => prev.filter((item) => item !== centroId));
      return;
    }

    setExpandedRows((prev) => [...prev, centroId]);

    if (!organizationId || movimientosByCentro[centroId]) {
      return;
    }

    try {
      setLoadingMovimientos((prev) => ({ ...prev, [centroId]: true }));
      const movimientos = await obtenerMovimientosCentroCosto(organizationId, centroId);
      setMovimientosByCentro((prev) => ({ ...prev, [centroId]: movimientos }));
    } catch (error) {
      console.error('Error cargando movimientos del centro de costo:', error);
      setMovimientosByCentro((prev) => ({ ...prev, [centroId]: [] }));
    } finally {
      setLoadingMovimientos((prev) => ({ ...prev, [centroId]: false }));
    }
  }

  const resumenByCentro = useMemo(
    () => new Map(resumenes.map((item) => [item.centroCostoId, item])),
    [resumenes]
  );

  const centrosFiltrados = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return centros;

    return centros.filter((centro) =>
      [centro.codigo, centro.nombre, centro.tipo, centro.descripcion]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [centros, search]);

  const kpis = useMemo(() => {
    const activos = centros.filter((centro) => centro.activo).length;
    const mayorGasto = resumenes.reduce<ResumenCentroCosto | null>((current, item) => {
      if (!current || item.totalCargos > current.totalCargos) return item;
      return current;
    }, null);
    const negativos = resumenes.filter((item) => item.saldo < 0).length;

    return {
      activos,
      mayorGasto,
      negativos,
    };
  }, [centros, resumenes]);

  if (authLoading || pluginsLoading || loading) {
    return (
      <PageShell
        title="Centros de costo"
        subtitle="Control operativo por unidad, campana y estructura interna"
      >
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
          Cargando centros de costo...
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Centros de costo"
      subtitle="Administra centros de costo y sigue sus movimientos contables"
    >
      <PluginGate pluginId="presupuesto_control" isActive={isActive('presupuesto_control')}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <KpiCard
              label="Total CC activos"
              value={String(kpis.activos)}
              detail="Centros habilitados para imputacion y seguimiento."
              tone="text-emerald-700"
            />
            <KpiCard
              label="CC con mayor gasto"
              value={kpis.mayorGasto ? kpis.mayorGasto.nombre : 'Sin datos'}
              detail={
                kpis.mayorGasto
                  ? `${formatCurrency(kpis.mayorGasto.totalCargos)} en cargos acumulados`
                  : 'Aun no hay movimientos registrados.'
              }
              tone="text-slate-900"
            />
            <KpiCard
              label="CC en negativo"
              value={String(kpis.negativos)}
              detail="Centros con saldo neto inferior a cero."
              tone="text-red-700"
            />
          </div>

          <Section
            title="ABM de centros"
            description="Crea, edita y revisa movimientos por centro de costo desde una sola vista."
          >
            <PageToolbar
              searchValue={search}
              searchPlaceholder="Buscar por codigo, nombre, tipo o descripcion"
              onSearchChange={setSearch}
              actions={
                <BaseButton onClick={() => abrirDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo CC
                </BaseButton>
              }
            />

            {!centrosFiltrados.length ? (
              <BaseCard>
                <div className="py-10 text-center text-sm text-slate-500">
                  No hay centros de costo para los filtros seleccionados.
                </div>
              </BaseCard>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="w-12 px-4 py-3 text-left font-medium text-slate-600" />
                        <th className="px-4 py-3 text-left font-medium text-slate-600">Codigo</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-600">Nombre</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-600">Tipo</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-600">Total cargos</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-600">Total abonos</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-600">Saldo</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-600">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {centrosFiltrados.map((centro) => {
                        const expanded = expandedRows.includes(centro.id);
                        const resumen = resumenByCentro.get(centro.id);
                        const tipoMeta = getTipoMeta(centro.tipo);
                        const filtroMovimiento = movimientoFilters[centro.id]?.trim().toLowerCase() || '';
                        const movimientos = (movimientosByCentro[centro.id] || []).filter((movimiento) =>
                          [movimiento.concepto, movimiento.tipoOperacion, movimiento.centroCostoNombre]
                            .join(' ')
                            .toLowerCase()
                            .includes(filtroMovimiento)
                        );

                        return (
                          <Fragment key={centro.id}>
                            <tr
                              className="cursor-pointer border-t border-slate-100 transition-colors hover:bg-slate-50"
                              onClick={() => void toggleExpanded(centro.id)}
                            >
                              <td className="px-4 py-3 text-slate-500">
                                {expanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </td>
                              <td className="px-4 py-3 font-medium text-slate-900">{centro.codigo}</td>
                              <td className="px-4 py-3 text-slate-700">{centro.nombre}</td>
                              <td className="px-4 py-3">
                                <BaseBadge variant={tipoMeta.variant}>{tipoMeta.label}</BaseBadge>
                              </td>
                              <td className="px-4 py-3 text-right text-slate-700">
                                {formatCurrency(resumen?.totalCargos || 0)}
                              </td>
                              <td className="px-4 py-3 text-right text-slate-700">
                                {formatCurrency(resumen?.totalAbonos || 0)}
                              </td>
                              <td className={`px-4 py-3 text-right font-medium ${getSaldoClass(resumen?.saldo || 0)}`}>
                                {formatCurrency(resumen?.saldo || 0)}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <BaseButton
                                    size="sm"
                                    variant="outline"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      abrirDialog(centro);
                                    }}
                                  >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                  </BaseButton>
                                  <BaseButton
                                    size="sm"
                                    variant="outline"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      void toggleExpanded(centro.id);
                                    }}
                                  >
                                    Ver movimientos
                                  </BaseButton>
                                </div>
                              </td>
                            </tr>
                            {expanded ? (
                              <tr className="border-t border-slate-100 bg-slate-50/70">
                                <td colSpan={8} className="px-4 py-4">
                                  <div className="space-y-4">
                                    <div className="grid gap-3 md:grid-cols-4">
                                      <ResumenMiniCard
                                        label="Movimientos"
                                        value={String(resumen?.cantidadMovimientos || 0)}
                                      />
                                      <ResumenMiniCard
                                        label="Campana"
                                        value={
                                          campanias.find((item) => item.id === centro.campaniaId)?.nombre ||
                                          'Sin asignar'
                                        }
                                      />
                                      <ResumenMiniCard
                                        label="Estado"
                                        value={centro.activo ? 'Activo' : 'Inactivo'}
                                      />
                                      <ResumenMiniCard
                                        label="Descripcion"
                                        value={centro.descripcion || 'Sin descripcion'}
                                      />
                                    </div>

                                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                                      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div>
                                          <h3 className="text-sm font-semibold text-slate-900">
                                            Movimientos del centro
                                          </h3>
                                          <p className="text-sm text-slate-500">
                                            Filtra por concepto o tipo de operacion.
                                          </p>
                                        </div>
                                        <div className="md:w-80">
                                          <BaseInput
                                            value={movimientoFilters[centro.id] || ''}
                                            onChange={(event) =>
                                              setMovimientoFilters((prev) => ({
                                                ...prev,
                                                [centro.id]: event.target.value,
                                              }))
                                            }
                                            placeholder="Filtrar movimientos"
                                          />
                                        </div>
                                      </div>

                                      {loadingMovimientos[centro.id] ? (
                                        <div className="py-8 text-center text-sm text-slate-500">
                                          Cargando movimientos...
                                        </div>
                                      ) : !movimientos.length ? (
                                        <div className="py-8 text-center text-sm text-slate-500">
                                          No hay movimientos para este centro con el filtro actual.
                                        </div>
                                      ) : (
                                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                                          <table className="min-w-full text-sm">
                                            <thead className="bg-slate-50">
                                              <tr>
                                                <th className="px-4 py-3 text-left font-medium text-slate-600">Fecha</th>
                                                <th className="px-4 py-3 text-left font-medium text-slate-600">Concepto</th>
                                                <th className="px-4 py-3 text-left font-medium text-slate-600">Tipo</th>
                                                <th className="px-4 py-3 text-left font-medium text-slate-600">Operacion</th>
                                                <th className="px-4 py-3 text-right font-medium text-slate-600">Monto</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {movimientos.map((movimiento) => (
                                                <tr key={movimiento.id} className="border-t border-slate-100">
                                                  <td className="px-4 py-3 text-slate-700">
                                                    {formatDate(movimiento.fecha)}
                                                  </td>
                                                  <td className="px-4 py-3 text-slate-700">
                                                    {movimiento.concepto}
                                                  </td>
                                                  <td className="px-4 py-3">
                                                    <BaseBadge
                                                      variant={
                                                        movimiento.tipoMovimiento === 'cargo'
                                                          ? 'destructive'
                                                          : 'success'
                                                      }
                                                    >
                                                      {movimiento.tipoMovimiento === 'cargo' ? 'Cargo' : 'Abono'}
                                                    </BaseBadge>
                                                  </td>
                                                  <td className="px-4 py-3 text-slate-700">
                                                    {movimiento.tipoOperacion}
                                                  </td>
                                                  <td className="px-4 py-3 text-right font-medium text-slate-900">
                                                    {formatCurrency(movimiento.monto)}
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}
                                    </div>
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

          <Section
            title="Tabla resumen"
            description="Comparativa consolidada de cargos, abonos y saldo para todos los centros."
          >
            {!resumenes.length ? (
              <BaseCard>
                <div className="py-10 text-center text-sm text-slate-500">
                  Aun no hay resumenes disponibles.
                </div>
              </BaseCard>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-600">Centro</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600">Movimientos</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600">Cargos</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600">Abonos</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumenes.map((resumen) => (
                      <tr key={resumen.centroCostoId} className="border-t border-slate-100">
                        <td className="px-4 py-3 font-medium text-slate-900">{resumen.nombre}</td>
                        <td className="px-4 py-3 text-right text-slate-700">
                          {resumen.cantidadMovimientos}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700">
                          {formatCurrency(resumen.totalCargos)}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700">
                          {formatCurrency(resumen.totalAbonos)}
                        </td>
                        <td className={`px-4 py-3 text-right font-medium ${getSaldoClass(resumen.saldo)}`}>
                          {formatCurrency(resumen.saldo)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </div>
      </PluginGate>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar centro de costo' : 'Nuevo centro de costo'}</DialogTitle>
          </DialogHeader>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="codigo">Codigo</Label>
                <BaseInput
                  id="codigo"
                  value={formData.codigo}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, codigo: event.target.value }))
                  }
                  placeholder="CC-001"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <BaseInput
                  id="nombre"
                  value={formData.nombre}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, nombre: event.target.value }))
                  }
                  placeholder="Administracion central"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <BaseSelect
                  value={formData.tipo}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, tipo: value as TipoCentroCosto }))
                  }
                >
                  <BaseSelectTrigger>
                    <BaseSelectValue placeholder="Selecciona un tipo" />
                  </BaseSelectTrigger>
                  <BaseSelectContent>
                    {TIPO_OPTIONS.map((item) => (
                      <BaseSelectItem key={item.value} value={item.value}>
                        {item.label}
                      </BaseSelectItem>
                    ))}
                  </BaseSelectContent>
                </BaseSelect>
              </div>

              <div className="space-y-2">
                <Label>Campana opcional</Label>
                <BaseSelect
                  value={formData.campaniaId || 'sin_campania'}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      campaniaId: value === 'sin_campania' ? '' : value,
                    }))
                  }
                >
                  <BaseSelectTrigger>
                    <BaseSelectValue placeholder="Sin asignar" />
                  </BaseSelectTrigger>
                  <BaseSelectContent>
                    <BaseSelectItem value="sin_campania">Sin asignar</BaseSelectItem>
                    {campanias.map((campania) => (
                      <BaseSelectItem key={campania.id} value={campania.id}>
                        {campania.nombre}
                      </BaseSelectItem>
                    ))}
                  </BaseSelectContent>
                </BaseSelect>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripcion</Label>
              <textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, descripcion: event.target.value }))
                }
                placeholder="Detalle operativo del centro de costo"
                className="min-h-28 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2">
              <BaseButton
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setEditando(null);
                  setFormData(EMPTY_FORM);
                }}
              >
                Cancelar
              </BaseButton>
              <BaseButton type="submit" disabled={guardando}>
                {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear centro'}
              </BaseButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function KpiCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: string;
}) {
  return (
    <BaseCard>
      <div className="space-y-2">
        <p className="text-sm text-slate-500">{label}</p>
        <p className={`text-2xl font-semibold ${tone}`}>{value}</p>
        <p className="text-sm leading-6 text-slate-600">{detail}</p>
      </div>
    </BaseCard>
  );
}

function ResumenMiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-900">{value}</p>
    </div>
  );
}
