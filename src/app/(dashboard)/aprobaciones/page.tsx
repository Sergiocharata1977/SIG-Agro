'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  ShieldCheck,
  XCircle,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { usePlugins } from '@/contexts/PluginsContext';
import {
  aprobarSolicitud,
  obtenerSolicitudes,
  rechazarSolicitud,
} from '@/services/aprobaciones';
import type { EstadoAprobacion, HistorialAprobacion, SolicitudAprobacion } from '@/types/aprobaciones';

type TabValue = 'pendientes' | 'todas';
type EstadoFiltro = 'todos' | EstadoAprobacion;

type ApprovalDialogState = {
  open: boolean;
  solicitud: SolicitudAprobacion | null;
  observacion: string;
  saving: boolean;
  error: string | null;
};

type RejectionDialogState = {
  open: boolean;
  solicitud: SolicitudAprobacion | null;
  motivo: string;
  saving: boolean;
  error: string | null;
};

const DATE_FORMATTER = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const ESTADO_LABELS: Record<EstadoAprobacion, string> = {
  borrador: 'Borrador',
  pendiente_aprobacion: 'Pendiente',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  contabilizado: 'Contabilizado',
  anulado: 'Anulado',
};

const TIPO_LABELS: Record<SolicitudAprobacion['tipo'], string> = {
  pago_grande: 'Pago grande',
  ajuste_contable: 'Ajuste contable',
  anulacion: 'Anulacion',
  nota_credito: 'Nota de credito',
  refinanciacion: 'Refinanciacion',
  condonacion: 'Condonacion',
  ajuste_cc: 'Ajuste de cuenta corriente',
};

const EMPTY_APPROVAL_DIALOG: ApprovalDialogState = {
  open: false,
  solicitud: null,
  observacion: '',
  saving: false,
  error: null,
};

const EMPTY_REJECTION_DIALOG: RejectionDialogState = {
  open: false,
  solicitud: null,
  motivo: '',
  saving: false,
  error: null,
};

function formatCurrency(value?: number) {
  if (typeof value !== 'number') return '-';

  return value.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  });
}

function formatDate(value?: Date) {
  if (!value) return '-';
  return DATE_FORMATTER.format(value);
}

function formatDateTime(value?: Date) {
  if (!value) return '-';
  return DATE_TIME_FORMATTER.format(value);
}

function getTipoLabel(tipo: SolicitudAprobacion['tipo']) {
  return TIPO_LABELS[tipo] || tipo;
}

function getEstadoLabel(estado: EstadoAprobacion) {
  return ESTADO_LABELS[estado] || estado;
}

function getEstadoBadgeVariant(
  estado: EstadoAprobacion
): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' {
  switch (estado) {
    case 'aprobado':
    case 'contabilizado':
      return 'success';
    case 'rechazado':
    case 'anulado':
      return 'destructive';
    case 'pendiente_aprobacion':
      return 'secondary';
    default:
      return 'outline';
  }
}

function sortHistorial(historial: HistorialAprobacion[]) {
  return [...historial].sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
}

function KpiCard({
  label,
  value,
  icon: Icon,
  tone = 'slate',
  badge,
}: {
  label: string;
  value: string;
  icon: typeof Clock3;
  tone?: 'red' | 'emerald' | 'slate';
  badge?: React.ReactNode;
}) {
  const toneClass = {
    red: 'border-red-200 bg-red-50/90 text-red-900',
    emerald: 'border-emerald-200 bg-emerald-50/90 text-emerald-900',
    slate: 'border-slate-200 bg-white text-slate-900',
  };

  return (
    <BaseCard className={toneClass[tone]}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-current/80">{label}</p>
            {badge}
          </div>
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className="rounded-2xl bg-white/70 p-3">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </BaseCard>
  );
}

export default function AprobacionesPage() {
  const { user, loading: authLoading, organizationId } = useAuth();
  const { isActive, loading: pluginsLoading } = usePlugins();

  const [solicitudes, setSolicitudes] = useState<SolicitudAprobacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<TabValue>('pendientes');
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>('todos');
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [approvalDialog, setApprovalDialog] = useState<ApprovalDialogState>(EMPTY_APPROVAL_DIALOG);
  const [rejectionDialog, setRejectionDialog] = useState<RejectionDialogState>(EMPTY_REJECTION_DIALOG);

  useEffect(() => {
    if (!organizationId) {
      setSolicitudes([]);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const cargarSolicitudes = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await obtenerSolicitudes(organizationId);
        if (isMounted) {
          setSolicitudes(data);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'No se pudieron cargar las solicitudes de aprobacion.'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void cargarSolicitudes();

    return () => {
      isMounted = false;
    };
  }, [organizationId]);

  const solicitudesPendientes = useMemo(
    () => solicitudes.filter((item) => item.estado === 'pendiente_aprobacion'),
    [solicitudes]
  );

  const aprobadasHoy = useMemo(() => {
    const today = new Date();
    const sameDay = (date?: Date) =>
      Boolean(date) &&
      date?.getDate() === today.getDate() &&
      date?.getMonth() === today.getMonth() &&
      date?.getFullYear() === today.getFullYear();

    return solicitudes.filter((item) => item.estado === 'aprobado' && sameDay(item.fechaAprobacion)).length;
  }, [solicitudes]);

  const rechazadasMes = useMemo(() => {
    const today = new Date();
    return solicitudes.filter((item) => {
      if (item.estado !== 'rechazado' || !item.fechaAprobacion) return false;

      return (
        item.fechaAprobacion.getMonth() === today.getMonth() &&
        item.fechaAprobacion.getFullYear() === today.getFullYear()
      );
    }).length;
  }, [solicitudes]);

  const solicitudesPendientesFiltradas = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return solicitudesPendientes.filter((item) => {
      if (!normalized) return true;

      const searchable = [
        item.descripcion,
        item.solicitanteNombre,
        item.operacionTipo,
        item.motivoSolicitud,
        getTipoLabel(item.tipo),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchable.includes(normalized);
    });
  }, [search, solicitudesPendientes]);

  const solicitudesTodasFiltradas = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return solicitudes.filter((item) => {
      const matchesSearch =
        !normalized ||
        [
          item.descripcion,
          item.solicitanteNombre,
          item.operacionTipo,
          item.motivoSolicitud,
          item.aprobadorNombre,
          getTipoLabel(item.tipo),
          getEstadoLabel(item.estado),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalized);

      const matchesEstado = estadoFiltro === 'todos' || item.estado === estadoFiltro;

      return matchesSearch && matchesEstado;
    });
  }, [estadoFiltro, search, solicitudes]);

  const canInteract = Boolean(user?.id && organizationId);

  const refreshSolicitudes = async () => {
    if (!organizationId) return;

    const data = await obtenerSolicitudes(organizationId);
    setSolicitudes(data);
  };

  const toggleExpandedRow = (solicitudId: string) => {
    setExpandedRows((current) =>
      current.includes(solicitudId)
        ? current.filter((id) => id !== solicitudId)
        : [...current, solicitudId]
    );
  };

  const handleApprove = async () => {
    if (!approvalDialog.solicitud || !organizationId || !user?.id) return;

    setApprovalDialog((current) => ({ ...current, saving: true, error: null }));

    try {
      await aprobarSolicitud(
        organizationId,
        approvalDialog.solicitud.id,
        user.id,
        user.displayName,
        approvalDialog.observacion.trim() || undefined
      );

      await refreshSolicitudes();
      setApprovalDialog(EMPTY_APPROVAL_DIALOG);
    } catch (actionError) {
      setApprovalDialog((current) => ({
        ...current,
        saving: false,
        error:
          actionError instanceof Error
            ? actionError.message
            : 'No se pudo aprobar la solicitud.',
      }));
    }
  };

  const handleReject = async () => {
    if (!rejectionDialog.solicitud || !organizationId || !user?.id) return;

    const motivo = rejectionDialog.motivo.trim();

    if (!motivo) {
      setRejectionDialog((current) => ({
        ...current,
        error: 'El motivo de rechazo es obligatorio.',
      }));
      return;
    }

    setRejectionDialog((current) => ({ ...current, saving: true, error: null }));

    try {
      await rechazarSolicitud(organizationId, rejectionDialog.solicitud.id, user.id, motivo);
      await refreshSolicitudes();
      setRejectionDialog(EMPTY_REJECTION_DIALOG);
    } catch (actionError) {
      setRejectionDialog((current) => ({
        ...current,
        saving: false,
        error:
          actionError instanceof Error
            ? actionError.message
            : 'No se pudo rechazar la solicitud.',
      }));
    }
  };

  if (authLoading || pluginsLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        Cargando aprobaciones...
      </div>
    );
  }

  if (!isActive('iso_control_interno')) {
    return <PluginGate pluginId="iso_control_interno" isActive={false}>{null}</PluginGate>;
  }

  return (
    <PageShell
      title="Aprobaciones"
      subtitle="Gestiona solicitudes pendientes, revisa su historial y registra decisiones con trazabilidad."
      rightSlot={(
        <BaseBadge variant="outline" className="rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em]">
          ISO & Control Interno
        </BaseBadge>
      )}
    >
      <Section>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <KpiCard
            label="Pendientes"
            value={String(solicitudesPendientes.length)}
            icon={Clock3}
            tone={solicitudesPendientes.length > 0 ? 'red' : 'slate'}
            badge={
              solicitudesPendientes.length > 0 ? (
                <BaseBadge variant="destructive">{solicitudesPendientes.length}</BaseBadge>
              ) : undefined
            }
          />
          <KpiCard
            label="Aprobadas hoy"
            value={String(aprobadasHoy)}
            icon={CheckCircle2}
            tone="emerald"
          />
          <KpiCard
            label="Rechazadas mes"
            value={String(rechazadasMes)}
            icon={XCircle}
            tone="slate"
          />
        </div>
      </Section>

      <Section>
        <PageToolbar
          searchValue={search}
          searchPlaceholder="Buscar por descripcion, solicitante o tipo..."
          onSearchChange={setSearch}
          filters={tab === 'todas' ? (
            <BaseSelect value={estadoFiltro} onValueChange={(value) => setEstadoFiltro(value as EstadoFiltro)}>
              <BaseSelectTrigger className="w-full md:w-[220px]">
                <BaseSelectValue placeholder="Filtrar por estado" />
              </BaseSelectTrigger>
              <BaseSelectContent>
                <BaseSelectItem value="todos">Todos los estados</BaseSelectItem>
                <BaseSelectItem value="pendiente_aprobacion">Pendiente</BaseSelectItem>
                <BaseSelectItem value="aprobado">Aprobado</BaseSelectItem>
                <BaseSelectItem value="rechazado">Rechazado</BaseSelectItem>
                <BaseSelectItem value="borrador">Borrador</BaseSelectItem>
                <BaseSelectItem value="contabilizado">Contabilizado</BaseSelectItem>
                <BaseSelectItem value="anulado">Anulado</BaseSelectItem>
              </BaseSelectContent>
            </BaseSelect>
          ) : null}
        />
      </Section>

      {error ? (
        <Section>
          <BaseCard className="border-red-200 bg-red-50">
            <div className="text-sm text-red-800">{error}</div>
          </BaseCard>
        </Section>
      ) : null}

      <Section>
        <Tabs value={tab} onValueChange={(value) => setTab(value as TabValue)} className="space-y-4">
          <TabsList className="grid h-auto w-full grid-cols-2 rounded-2xl bg-slate-100 p-1 md:w-[360px]">
            <TabsTrigger value="pendientes" className="gap-2 rounded-xl py-2.5">
              <span>Pendientes</span>
              {solicitudesPendientes.length > 0 ? (
                <BaseBadge variant="destructive" className="h-5 min-w-5 justify-center rounded-full px-1.5">
                  {solicitudesPendientes.length}
                </BaseBadge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="todas" className="rounded-xl py-2.5">
              Todas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pendientes">
            <ApprovalTable
              solicitudes={solicitudesPendientesFiltradas}
              emptyMessage="No hay solicitudes pendientes para los filtros actuales."
              showActions
              canInteract={canInteract}
              onApprove={(solicitud) =>
                setApprovalDialog({
                  open: true,
                  solicitud,
                  observacion: '',
                  saving: false,
                  error: null,
                })
              }
              onReject={(solicitud) =>
                setRejectionDialog({
                  open: true,
                  solicitud,
                  motivo: '',
                  saving: false,
                  error: null,
                })
              }
            />
          </TabsContent>

          <TabsContent value="todas">
            <ApprovalTable
              solicitudes={solicitudesTodasFiltradas}
              emptyMessage="No hay solicitudes registradas para los filtros actuales."
              expandedRows={expandedRows}
              onToggleExpanded={toggleExpandedRow}
            />
          </TabsContent>
        </Tabs>
      </Section>

      <Dialog
        open={approvalDialog.open}
        onOpenChange={(open) =>
          setApprovalDialog((current) => (open ? current : EMPTY_APPROVAL_DIALOG))
        }
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Confirmar aprobacion</DialogTitle>
            <DialogDescription>
              {approvalDialog.solicitud
                ? `Vas a aprobar la solicitud "${approvalDialog.solicitud.descripcion}". Puedes agregar una observacion opcional.`
                : 'Puedes agregar una observacion opcional.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {approvalDialog.solicitud ? (
              <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 md:grid-cols-2">
                <InfoItem label="Solicitante" value={approvalDialog.solicitud.solicitanteNombre || '-'} />
                <InfoItem label="Monto" value={formatCurrency(approvalDialog.solicitud.monto)} />
                <InfoItem label="Tipo" value={getTipoLabel(approvalDialog.solicitud.tipo)} />
                <InfoItem label="Fecha" value={formatDate(approvalDialog.solicitud.fechaSolicitud)} />
              </div>
            ) : null}

            <label className="block space-y-2 text-sm font-medium text-slate-700">
              <span>Observacion</span>
              <textarea
                value={approvalDialog.observacion}
                onChange={(event) =>
                  setApprovalDialog((current) => ({
                    ...current,
                    observacion: event.target.value,
                  }))
                }
                rows={4}
                placeholder="Agregar detalle para el historial (opcional)"
                className="flex min-h-[112px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </label>

            {approvalDialog.error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {approvalDialog.error}
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <BaseButton
              variant="outline"
              onClick={() => setApprovalDialog(EMPTY_APPROVAL_DIALOG)}
              disabled={approvalDialog.saving}
            >
              Cancelar
            </BaseButton>
            <BaseButton
              onClick={() => void handleApprove()}
              disabled={approvalDialog.saving}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {approvalDialog.saving ? 'Aprobando...' : 'Aprobar'}
            </BaseButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={rejectionDialog.open}
        onOpenChange={(open) =>
          setRejectionDialog((current) => (open ? current : EMPTY_REJECTION_DIALOG))
        }
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Rechazar solicitud</DialogTitle>
            <DialogDescription>
              El motivo es obligatorio y quedara registrado en el historial de aprobaciones.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {rejectionDialog.solicitud ? (
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                <p className="text-sm font-medium text-slate-900">
                  {rejectionDialog.solicitud.descripcion}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {getTipoLabel(rejectionDialog.solicitud.tipo)} ·{' '}
                  {rejectionDialog.solicitud.solicitanteNombre || 'Sin solicitante'} ·{' '}
                  {formatCurrency(rejectionDialog.solicitud.monto)}
                </p>
              </div>
            ) : null}

            <label className="block space-y-2 text-sm font-medium text-slate-700">
              <span>Motivo del rechazo</span>
              <textarea
                value={rejectionDialog.motivo}
                onChange={(event) =>
                  setRejectionDialog((current) => ({
                    ...current,
                    motivo: event.target.value,
                    error: null,
                  }))
                }
                rows={5}
                placeholder="Explica por que se rechaza la solicitud"
                className="flex min-h-[132px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </label>

            {rejectionDialog.error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {rejectionDialog.error}
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <BaseButton
              variant="outline"
              onClick={() => setRejectionDialog(EMPTY_REJECTION_DIALOG)}
              disabled={rejectionDialog.saving}
            >
              Cancelar
            </BaseButton>
            <BaseButton
              onClick={() => void handleReject()}
              disabled={rejectionDialog.saving}
              variant="destructive"
            >
              {rejectionDialog.saving ? 'Rechazando...' : 'Rechazar'}
            </BaseButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function ApprovalTable({
  solicitudes,
  emptyMessage,
  showActions = false,
  canInteract = false,
  expandedRows = [],
  onToggleExpanded,
  onApprove,
  onReject,
}: {
  solicitudes: SolicitudAprobacion[];
  emptyMessage: string;
  showActions?: boolean;
  canInteract?: boolean;
  expandedRows?: string[];
  onToggleExpanded?: (solicitudId: string) => void;
  onApprove?: (solicitud: SolicitudAprobacion) => void;
  onReject?: (solicitud: SolicitudAprobacion) => void;
}) {
  if (!solicitudes.length) {
    return (
      <BaseCard>
        <div className="py-10 text-center text-sm text-slate-500">{emptyMessage}</div>
      </BaseCard>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            {onToggleExpanded ? (
              <th className="w-12 px-4 py-3 text-left font-medium text-slate-600" />
            ) : null}
            <th className="px-4 py-3 text-left font-medium text-slate-600">Fecha</th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Tipo</th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Descripcion</th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Solicitante</th>
            <th className="px-4 py-3 text-right font-medium text-slate-600">Monto</th>
            {showActions ? (
              <th className="px-4 py-3 text-right font-medium text-slate-600">Acciones</th>
            ) : (
              <th className="px-4 py-3 text-left font-medium text-slate-600">Estado</th>
            )}
          </tr>
        </thead>
        <tbody>
          {solicitudes.map((solicitud) => {
            const expanded = expandedRows.includes(solicitud.id);

            return (
              <Fragment key={solicitud.id}>
                <tr className="border-t border-slate-100 align-top">
                  {onToggleExpanded ? (
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => onToggleExpanded(solicitud.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                        aria-label={expanded ? 'Ocultar historial' : 'Mostrar historial'}
                      >
                        {expanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                  ) : null}
                  <td className="px-4 py-3 text-slate-700">{formatDate(solicitud.fechaSolicitud)}</td>
                  <td className="px-4 py-3 text-slate-700">{getTipoLabel(solicitud.tipo)}</td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <p className="font-medium text-slate-900">{solicitud.descripcion}</p>
                      <p className="text-xs text-slate-500">{solicitud.operacionTipo}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {solicitud.solicitanteNombre || 'Sin nombre'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">
                    {formatCurrency(solicitud.monto)}
                  </td>
                  {showActions ? (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <BaseButton
                          onClick={() => onApprove?.(solicitud)}
                          disabled={!canInteract}
                          className="bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          Aprobar
                        </BaseButton>
                        <BaseButton
                          onClick={() => onReject?.(solicitud)}
                          disabled={!canInteract}
                          variant="destructive"
                        >
                          Rechazar
                        </BaseButton>
                      </div>
                    </td>
                  ) : (
                    <td className="px-4 py-3">
                      <div className="space-y-2">
                        <BaseBadge variant={getEstadoBadgeVariant(solicitud.estado)}>
                          {getEstadoLabel(solicitud.estado)}
                        </BaseBadge>
                        {solicitud.motivoAprobacion ? (
                          <p className="max-w-[280px] text-xs text-slate-500">
                            {solicitud.motivoAprobacion}
                          </p>
                        ) : null}
                      </div>
                    </td>
                  )}
                </tr>

                {onToggleExpanded && expanded ? (
                  <tr className="border-t border-slate-100 bg-slate-50/70">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                          <BaseBadge variant={getEstadoBadgeVariant(solicitud.estado)}>
                            {getEstadoLabel(solicitud.estado)}
                          </BaseBadge>
                          <span className="text-xs text-slate-500">
                            Solicitada el {formatDateTime(solicitud.fechaSolicitud)}
                          </span>
                        </div>

                        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <InfoItem label="Solicitante" value={solicitud.solicitanteNombre || '-'} />
                          <InfoItem label="Aprobador" value={solicitud.aprobadorNombre || '-'} />
                          <InfoItem label="Motivo solicitud" value={solicitud.motivoSolicitud || '-'} />
                          <InfoItem label="Monto" value={formatCurrency(solicitud.monto)} />
                        </div>

                        <div className="space-y-3">
                          <p className="text-sm font-semibold text-slate-900">Historial</p>
                          <div className="space-y-3">
                            {sortHistorial(solicitud.historial).map((entry, index) => (
                              <div
                                key={`${solicitud.id}-${entry.estado}-${entry.usuarioId}-${index}`}
                                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                              >
                                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                  <div className="flex items-center gap-2">
                                    <BaseBadge variant={getEstadoBadgeVariant(entry.estado)}>
                                      {getEstadoLabel(entry.estado)}
                                    </BaseBadge>
                                    <span className="text-sm text-slate-700">
                                      {entry.usuarioNombre || entry.usuarioId}
                                    </span>
                                  </div>
                                  <span className="text-xs text-slate-500">
                                    {formatDateTime(entry.fecha)}
                                  </span>
                                </div>
                                {entry.observacion ? (
                                  <p className="mt-2 text-sm text-slate-600">{entry.observacion}</p>
                                ) : null}
                              </div>
                            ))}
                          </div>
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
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-900">{value}</p>
    </div>
  );
}
