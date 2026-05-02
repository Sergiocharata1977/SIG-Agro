'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
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
import { useAuth } from '@/contexts/AuthContext';
import { usePlugins } from '@/contexts/PluginsContext';
import { AuditoriaService } from '@/lib/auditoria/AuditoriaService';
import type { AccionAuditoria, ModuloAuditoria, RegistroAuditoria } from '@/types/auditoria';

type ModuloFiltro = ModuloAuditoria | 'todos';
type AccionFiltro = AccionAuditoria | 'todas';

const PAGE_SIZE = 50;

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'short',
  timeStyle: 'medium',
});

const MODULO_OPTIONS: Array<{ value: ModuloFiltro; label: string }> = [
  { value: 'todos', label: 'Todos los modulos' },
  { value: 'contabilidad', label: 'Contabilidad' },
  { value: 'terceros', label: 'Terceros' },
  { value: 'tesoreria', label: 'Tesoreria' },
  { value: 'cheques', label: 'Cheques' },
  { value: 'operaciones', label: 'Operaciones' },
  { value: 'operaciones_comerciales', label: 'Operaciones comerciales' },
  { value: 'presupuesto', label: 'Presupuesto' },
  { value: 'centros_costo', label: 'Centros de costo' },
  { value: 'campanas', label: 'Campanas' },
  { value: 'plan_cuentas', label: 'Plan de cuentas' },
];

const ACCION_OPTIONS: Array<{ value: AccionFiltro; label: string }> = [
  { value: 'todas', label: 'Todas las acciones' },
  { value: 'crear', label: 'Crear' },
  { value: 'modificar', label: 'Modificar' },
  { value: 'eliminar', label: 'Eliminar' },
  { value: 'contabilizar', label: 'Contabilizar' },
  { value: 'anular', label: 'Anular' },
  { value: 'aprobar', label: 'Aprobar' },
  { value: 'rechazar', label: 'Rechazar' },
  { value: 'cambiar_estado', label: 'Cambiar estado' },
];

type JsonValue = Record<string, unknown> | unknown[] | string | number | boolean | null | undefined;

function formatDateTime(value: Date) {
  return DATE_TIME_FORMATTER.format(value);
}

function formatActionLabel(value: AccionAuditoria) {
  return ACCION_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

function formatModuleLabel(value: ModuloAuditoria) {
  return MODULO_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

function normalizeDateStart(value: string) {
  return value ? new Date(`${value}T00:00:00`) : null;
}

function normalizeDateEnd(value: string) {
  return value ? new Date(`${value}T23:59:59.999`) : null;
}

function stringifyJson(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function areValuesEqual(left: unknown, right: unknown) {
  return stringifyJson(left) === stringifyJson(right);
}

function getActionBadgeClass(action: AccionAuditoria) {
  switch (action) {
    case 'crear':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'modificar':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'eliminar':
      return 'border-rose-200 bg-rose-50 text-rose-700';
    case 'anular':
      return 'border-orange-200 bg-orange-50 text-orange-700';
    case 'aprobar':
      return 'border-blue-200 bg-blue-50 text-blue-700';
    case 'rechazar':
      return 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700';
    case 'contabilizar':
      return 'border-cyan-200 bg-cyan-50 text-cyan-700';
    case 'cambiar_estado':
      return 'border-violet-200 bg-violet-50 text-violet-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
}

function getModuleBadgeClass(modulo: ModuloAuditoria) {
  switch (modulo) {
    case 'contabilidad':
      return 'border-blue-200 bg-blue-50 text-blue-700';
    case 'terceros':
      return 'border-teal-200 bg-teal-50 text-teal-700';
    case 'tesoreria':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'cheques':
      return 'border-orange-200 bg-orange-50 text-orange-700';
    case 'operaciones':
      return 'border-cyan-200 bg-cyan-50 text-cyan-700';
    case 'operaciones_comerciales':
      return 'border-indigo-200 bg-indigo-50 text-indigo-700';
    case 'presupuesto':
      return 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700';
    case 'centros_costo':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'campanas':
      return 'border-lime-200 bg-lime-50 text-lime-700';
    case 'plan_cuentas':
      return 'border-slate-300 bg-slate-100 text-slate-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
}

function getChangedKeys(
  previous?: Record<string, unknown>,
  next?: Record<string, unknown>
) {
  return Array.from(new Set([...Object.keys(previous || {}), ...Object.keys(next || {})])).filter(
    (key) => !areValuesEqual(previous?.[key], next?.[key])
  );
}

function hasAnyChange(previous: unknown, next: unknown): boolean {
  if (Array.isArray(previous) || Array.isArray(next)) {
    if (!Array.isArray(previous) || !Array.isArray(next)) return true;
    if (previous.length !== next.length) return true;
    return previous.some((item, index) => hasAnyChange(item, next[index]));
  }

  if (isPlainObject(previous) || isPlainObject(next)) {
    if (!isPlainObject(previous) || !isPlainObject(next)) return true;
    return getChangedKeys(previous, next).some((key) => hasAnyChange(previous[key], next[key]));
  }

  return !areValuesEqual(previous, next);
}

function renderPrimitive(value: unknown) {
  if (typeof value === 'string') return `"${value}"`;
  if (value === undefined) return 'undefined';
  return String(value);
}

function JsonCompareTree({
  left,
  right,
  level = 0,
}: {
  left: JsonValue;
  right: JsonValue;
  level?: number;
}) {
  const changed = hasAnyChange(left, right);

  if (Array.isArray(left) || Array.isArray(right)) {
    const leftArray = Array.isArray(left) ? left : [];
    const rightArray = Array.isArray(right) ? right : [];
    const maxLength = Math.max(leftArray.length, rightArray.length);

    return (
      <div className={`rounded-lg px-2 py-1 ${changed ? 'bg-amber-100/80' : ''}`}>
        <div className="text-slate-500">[</div>
        <div className="space-y-1">
          {Array.from({ length: maxLength }).map((_, index) => (
            <div key={index} className="pl-4">
              <JsonCompareTree left={leftArray[index] as JsonValue} right={rightArray[index] as JsonValue} level={level + 1} />
            </div>
          ))}
        </div>
        <div className="text-slate-500">]</div>
      </div>
    );
  }

  if (isPlainObject(left) || isPlainObject(right)) {
    const leftObject = isPlainObject(left) ? left : {};
    const rightObject = isPlainObject(right) ? right : {};
    const keys = Array.from(new Set([...Object.keys(leftObject), ...Object.keys(rightObject)]));

    return (
      <div className={`rounded-lg px-2 py-1 ${changed ? 'bg-amber-100/80' : ''}`}>
        <div className="text-slate-500">{'{'}</div>
        <div className="space-y-1">
          {keys.map((key) => {
            const rowChanged = hasAnyChange(leftObject[key], rightObject[key]);

            return (
              <div
                key={`${level}-${key}`}
                className={`rounded-md pl-4 ${rowChanged ? 'bg-amber-200/70' : ''}`}
              >
                <span className="text-sky-700">"{key}"</span>
                <span className="text-slate-400">: </span>
                <JsonCompareTree left={leftObject[key] as JsonValue} right={rightObject[key] as JsonValue} level={level + 1} />
              </div>
            );
          })}
        </div>
        <div className="text-slate-500">{'}'}</div>
      </div>
    );
  }

  return <span className={changed ? 'rounded bg-amber-200/70 px-1' : ''}>{renderPrimitive(left)}</span>;
}

function AuditValuePanel({
  title,
  current,
  counterpart,
}: {
  title: string;
  current?: Record<string, unknown>;
  counterpart?: Record<string, unknown>;
}) {
  const hasValue = Boolean(current && Object.keys(current).length);

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="max-h-[26rem] overflow-auto p-4">
        {!hasValue ? (
          <p className="text-sm text-slate-500">Sin datos.</p>
        ) : (
          <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-6 text-slate-800">
            <JsonCompareTree left={current} right={counterpart} />
          </pre>
        )}
      </div>
    </div>
  );
}

export default function AuditoriaPage() {
  const { organizationId, loading: authLoading } = useAuth();
  const { isActive, loading: pluginsLoading } = usePlugins();

  const [registros, setRegistros] = useState<RegistroAuditoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [modulo, setModulo] = useState<ModuloFiltro>('todos');
  const [accion, setAccion] = useState<AccionFiltro>('todas');
  const [usuario, setUsuario] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  useEffect(() => {
    async function cargarAuditoria() {
      if (!organizationId) {
        setRegistros([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await AuditoriaService.obtenerRegistros(organizationId);
        setRegistros(data);
      } catch (error) {
        console.error('Error cargando auditoria:', error);
        setRegistros([]);
      } finally {
        setLoading(false);
      }
    }

    void cargarAuditoria();
  }, [organizationId]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [modulo, accion, usuario, fechaDesde, fechaHasta]);

  const filtrados = useMemo(() => {
    const search = usuario.trim().toLowerCase();
    const desde = normalizeDateStart(fechaDesde);
    const hasta = normalizeDateEnd(fechaHasta);

    return registros.filter((registro) => {
      if (modulo !== 'todos' && registro.modulo !== modulo) return false;
      if (accion !== 'todas' && registro.accion !== accion) return false;
      if (desde && registro.timestamp < desde) return false;
      if (hasta && registro.timestamp > hasta) return false;

      if (!search) return true;

      const usuarioIndex = [
        registro.usuarioNombre,
        registro.usuarioEmail,
        registro.usuarioId,
        registro.entidadDescripcion,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return usuarioIndex.includes(search);
    });
  }, [accion, fechaDesde, fechaHasta, modulo, registros, usuario]);

  const visibles = useMemo(() => filtrados.slice(0, visibleCount), [filtrados, visibleCount]);

  const totalCambios = useMemo(
    () => registros.filter((registro) => registro.accion === 'modificar').length,
    [registros]
  );

  function toggleExpanded(registroId: string) {
    setExpandedRows((prev) =>
      prev.includes(registroId) ? prev.filter((item) => item !== registroId) : [...prev, registroId]
    );
  }

  if (authLoading || pluginsLoading || loading) {
    return (
      <PageShell
        title="Auditoria"
        subtitle="Trazabilidad de eventos y cambios del sistema por modulo y usuario"
      >
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
          Cargando auditoria...
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Auditoria"
      subtitle="Consulta eventos de control interno, compara cambios y sigue el historial operativo."
    >
      <PluginGate pluginId="iso_control_interno" isActive={isActive('iso_control_interno')}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <BaseCard>
              <p className="text-sm text-slate-500">Registros auditados</p>
              <p className="text-2xl font-semibold text-slate-900">{registros.length}</p>
            </BaseCard>
            <BaseCard>
              <p className="text-sm text-slate-500">Cambios de datos</p>
              <p className="text-2xl font-semibold text-amber-700">{totalCambios}</p>
            </BaseCard>
            <BaseCard>
              <p className="text-sm text-slate-500">Mostrando</p>
              <p className="text-2xl font-semibold text-blue-700">
                {visibles.length} / {filtrados.length}
              </p>
            </BaseCard>
          </div>

          <Section
            title="Registro de auditoria"
            description="Filtra por modulo, accion, usuario y rango de fechas para revisar actividad interna."
          >
            <PageToolbar
              filters={
                <>
                  <BaseSelect value={modulo} onValueChange={(value) => setModulo(value as ModuloFiltro)}>
                    <BaseSelectTrigger className="w-full md:w-48">
                      <BaseSelectValue placeholder="Modulo" />
                    </BaseSelectTrigger>
                    <BaseSelectContent>
                      {MODULO_OPTIONS.map((item) => (
                        <BaseSelectItem key={item.value} value={item.value}>
                          {item.label}
                        </BaseSelectItem>
                      ))}
                    </BaseSelectContent>
                  </BaseSelect>

                  <BaseSelect value={accion} onValueChange={(value) => setAccion(value as AccionFiltro)}>
                    <BaseSelectTrigger className="w-full md:w-48">
                      <BaseSelectValue placeholder="Accion" />
                    </BaseSelectTrigger>
                    <BaseSelectContent>
                      {ACCION_OPTIONS.map((item) => (
                        <BaseSelectItem key={item.value} value={item.value}>
                          {item.label}
                        </BaseSelectItem>
                      ))}
                    </BaseSelectContent>
                  </BaseSelect>

                  <BaseInput
                    value={usuario}
                    onChange={(event) => setUsuario(event.target.value)}
                    placeholder="Usuario o entidad"
                    className="w-full md:w-56"
                  />

                  <BaseInput
                    type="date"
                    value={fechaDesde}
                    onChange={(event) => setFechaDesde(event.target.value)}
                    className="w-full md:w-40"
                  />

                  <BaseInput
                    type="date"
                    value={fechaHasta}
                    onChange={(event) => setFechaHasta(event.target.value)}
                    className="w-full md:w-40"
                  />
                </>
              }
            />

            {!filtrados.length ? (
              <BaseCard>
                <div className="py-10 text-center text-sm text-slate-500">
                  No hay registros para los filtros actuales.
                </div>
              </BaseCard>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="w-12 px-4 py-3 text-left font-medium text-slate-600" />
                        <th className="px-4 py-3 text-left font-medium text-slate-600">Fecha/Hora</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-600">Modulo</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-600">Accion</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-600">Entidad</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-600">Usuario</th>
                        <th className="min-w-[260px] px-4 py-3 text-left font-medium text-slate-600">Descripcion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibles.map((registro) => {
                        const expanded = expandedRows.includes(registro.id);
                        const changedKeys =
                          registro.camposModificados?.length
                            ? registro.camposModificados
                            : getChangedKeys(registro.valorAnterior, registro.valorNuevo);

                        return (
                          <Fragment key={registro.id}>
                            <tr
                              className="cursor-pointer border-t border-slate-100 transition-colors hover:bg-slate-50"
                              onClick={() => toggleExpanded(registro.id)}
                            >
                              <td className="px-4 py-3 text-slate-500">
                                {expanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </td>
                              <td className="px-4 py-3 text-slate-700">{formatDateTime(registro.timestamp)}</td>
                              <td className="px-4 py-3">
                                <BaseBadge className={getModuleBadgeClass(registro.modulo)} variant="outline">
                                  {formatModuleLabel(registro.modulo)}
                                </BaseBadge>
                              </td>
                              <td className="px-4 py-3">
                                <BaseBadge className={getActionBadgeClass(registro.accion)} variant="outline">
                                  {formatActionLabel(registro.accion)}
                                </BaseBadge>
                              </td>
                              <td className="px-4 py-3 text-slate-700">
                                <div>
                                  <p className="font-medium text-slate-900">{registro.entidadDescripcion}</p>
                                  <p className="text-xs text-slate-500">
                                    {registro.entidadTipo} · {registro.entidadId}
                                  </p>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-slate-700">
                                <div>
                                  <p className="font-medium text-slate-900">
                                    {registro.usuarioNombre || 'Usuario sin nombre'}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {registro.usuarioEmail || registro.usuarioId}
                                  </p>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-slate-700">
                                {changedKeys.length ? (
                                  <div className="space-y-2">
                                    <p>Se modificaron {changedKeys.length} campo(s).</p>
                                    <div className="flex flex-wrap gap-2">
                                      {changedKeys.map((campo) => (
                                        <span
                                          key={campo}
                                          className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800"
                                        >
                                          {campo}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <p>{formatActionLabel(registro.accion)} sobre {registro.entidadTipo}.</p>
                                )}
                              </td>
                            </tr>
                            {expanded ? (
                              <tr className="border-t border-slate-100 bg-slate-50/70">
                                <td colSpan={7} className="px-4 py-4">
                                  <div className="grid gap-4 lg:grid-cols-2">
                                    <AuditValuePanel
                                      title="Valor anterior"
                                      current={registro.valorAnterior}
                                      counterpart={registro.valorNuevo}
                                    />
                                    <AuditValuePanel
                                      title="Valor nuevo"
                                      current={registro.valorNuevo}
                                      counterpart={registro.valorAnterior}
                                    />
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

                {visibleCount < filtrados.length ? (
                  <div className="border-t border-slate-200 px-4 py-4">
                    <BaseButton variant="outline" onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}>
                      Cargar mas
                    </BaseButton>
                  </div>
                ) : null}
              </div>
            )}
          </Section>
        </div>
      </PluginGate>
    </PageShell>
  );
}
