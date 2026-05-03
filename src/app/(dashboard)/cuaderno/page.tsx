'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, PlusCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PageShell } from '@/components/layout/PageShell';
import type { Field, Plot } from '@/types/sig-agro';
import type { FieldLogbookEntry, TreatmentApplication } from '@/types/domain-model';
import { obtenerFields } from '@/services/fields';
import { obtenerPlots } from '@/services/plots';
import { crearRegistroCuaderno, obtenerRegistrosCuaderno } from '@/services/field-logbooks';
import { crearTratamiento, exportTratamientosCsv, obtenerTratamientos } from '@/services/treatments';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

type Tab = 'cuaderno' | 'tratamientos';

const DEFAULT_CAMPAIGN = '2025-2026';
const EMPTY_CUADERNO_FORM = {
  activityType: 'siembra' as FieldLogbookEntry['activityType'],
  description: '',
  fecha: new Date().toISOString().split('T')[0],
};
const EMPTY_TRATAMIENTO_FORM = {
  issueType: 'maleza' as TreatmentApplication['issueType'],
  mode: 'manual' as TreatmentApplication['mode'],
  productName: '',
  dosagePerHa: 1,
  dosageUnit: 'l_ha' as TreatmentApplication['dosageUnit'],
  appliedAreaHa: 1,
};

export default function CuadernoPage() {
  const { user, organizationId } = useAuth();
  const [tab, setTab] = useState<Tab>('cuaderno');
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState<Field[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [entries, setEntries] = useState<FieldLogbookEntry[]>([]);
  const [treatments, setTreatments] = useState<TreatmentApplication[]>([]);

  const [campaignId, setCampaignId] = useState(DEFAULT_CAMPAIGN);
  const [fieldId, setFieldId] = useState('');
  const [plotId, setPlotId] = useState('');

  const [cuadernoDialogOpen, setCuadernoDialogOpen] = useState(false);
  const [tratamientoDialogOpen, setTratamientoDialogOpen] = useState(false);
  const [guardandoCuaderno, setGuardandoCuaderno] = useState(false);
  const [guardandoTratamiento, setGuardandoTratamiento] = useState(false);
  const [cuadernoError, setCuadernoError] = useState<string | null>(null);
  const [tratamientoError, setTratamientoError] = useState<string | null>(null);
  const [cuadernoForm, setCuadernoForm] = useState(EMPTY_CUADERNO_FORM);
  const [tratamientoForm, setTratamientoForm] = useState(EMPTY_TRATAMIENTO_FORM);

  const availablePlots = useMemo(
    () => plots.filter((plot) => !fieldId || plot.fieldId === fieldId),
    [plots, fieldId]
  );

  async function loadAll() {
    if (!organizationId) return;
    setLoading(true);
    try {
      const [f, p, e, t] = await Promise.all([
        obtenerFields(organizationId, { activo: true }),
        obtenerPlots(organizationId, { activo: true }),
        obtenerRegistrosCuaderno(organizationId, { campaignId }),
        obtenerTratamientos(organizationId, { campaignId }),
      ]);
      setFields(f);
      setPlots(p);
      setEntries(e);
      setTreatments(t);

      if (!fieldId && f[0]) setFieldId(f[0].id);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, campaignId]);

  async function handleCreateEntry() {
    if (!organizationId || !user || !fieldId || !cuadernoForm.description.trim()) {
      setCuadernoError('Selecciona campo y completa la descripcion');
      return;
    }

    setGuardandoCuaderno(true);
    setCuadernoError(null);
    try {
      await crearRegistroCuaderno(organizationId, {
        organizationId,
        campaignId,
        fieldId,
        plotId: plotId || undefined,
        activityType: cuadernoForm.activityType,
        startDate: new Date(cuadernoForm.fecha),
        description: cuadernoForm.description.trim(),
        operatorIds: [user.id],
        source: 'manual',
        cost: {
          directCostsARS: 0,
          indirectCostsARS: 0,
          laborCostsARS: 0,
          machineryCostsARS: 0,
          logisticsCostsARS: 0,
        },
        createdBy: user.id,
      });

      setCuadernoDialogOpen(false);
      setCuadernoForm(EMPTY_CUADERNO_FORM);
      await loadAll();
    } finally {
      setGuardandoCuaderno(false);
    }
  }

  async function handleCreateTreatment() {
    if (!organizationId || !user || !fieldId || !plotId || !tratamientoForm.productName.trim()) {
      setTratamientoError('Selecciona campo, lote y producto');
      return;
    }

    setGuardandoTratamiento(true);
    setTratamientoError(null);
    try {
      await crearTratamiento(organizationId, {
        organizationId,
        campaignId,
        fieldId,
        plotId,
        mode: tratamientoForm.mode,
        issueType: tratamientoForm.issueType,
        productName: tratamientoForm.productName.trim(),
        dosagePerHa: tratamientoForm.dosagePerHa,
        dosageUnit: tratamientoForm.dosageUnit,
        appliedAreaHa: tratamientoForm.appliedAreaHa,
        applicationDate: new Date(),
        operatorIds: [user.id],
        createdBy: user.id,
      });

      setTratamientoDialogOpen(false);
      setTratamientoForm(EMPTY_TRATAMIENTO_FORM);
      await loadAll();
    } finally {
      setGuardandoTratamiento(false);
    }
  }

  const downloadCsv = () => {
    const csv = exportTratamientosCsv(treatments);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tratamientos-${campaignId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredEntries = useMemo(
    () => entries.filter((entry) => (!fieldId || entry.fieldId === fieldId) && (!plotId || entry.plotId === plotId)),
    [entries, fieldId, plotId]
  );
  const filteredTreatments = useMemo(
    () => treatments.filter((item) => (!fieldId || item.fieldId === fieldId) && (!plotId || item.plotId === plotId)),
    [treatments, fieldId, plotId]
  );

  if (!organizationId) return <div className="p-6">Selecciona una organizacion para continuar.</div>;

  return (
    <PageShell
      title="Cuaderno de Campo"
      subtitle="Flujo operativo de actividades y tratamientos por campana."
    >
      <section className="rounded-xl border border-slate-200 bg-white p-4 flex flex-wrap items-center gap-3">
        <label className="text-sm">Campana</label>
        <input
          value={campaignId}
          onChange={(e) => setCampaignId(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm"
        />

        <label className="text-sm">Campo</label>
        <select value={fieldId} onChange={(e) => { setFieldId(e.target.value); setPlotId(''); }} className="border rounded-lg px-3 py-1.5 text-sm">
          <option value="">Seleccionar</option>
          {fields.map((field) => <option key={field.id} value={field.id}>{field.nombre}</option>)}
        </select>

        <label className="text-sm">Lote</label>
        <select value={plotId} onChange={(e) => setPlotId(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm">
          <option value="">Todos</option>
          {availablePlots.map((plot) => <option key={plot.id} value={plot.id}>{plot.nombre}</option>)}
        </select>
      </section>

      <section className="flex gap-2">
        <button onClick={() => setTab('cuaderno')} className={`px-3 py-2 rounded-lg text-sm ${tab === 'cuaderno' ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-300'}`}>Cuaderno</button>
        <button onClick={() => setTab('tratamientos')} className={`px-3 py-2 rounded-lg text-sm ${tab === 'tratamientos' ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-300'}`}>Tratamientos</button>
      </section>

      {tab === 'cuaderno' ? (
        <section className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => { setCuadernoError(null); setCuadernoDialogOpen(true); }} className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm inline-flex items-center gap-2">
              <PlusCircle className="w-4 h-4" /> Nuevo registro
            </button>
          </div>
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="font-medium mb-3">Registros de cuaderno</h2>
            {loading ? <p className="text-sm text-slate-500">Cargando...</p> : (
              <div className="space-y-2 max-h-[520px] overflow-auto">
                {filteredEntries.map((entry) => (
                  <div key={entry.id} className="border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{entry.activityType}</span>
                      <span>{new Date(entry.startDate).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-slate-800 mt-1">{entry.description}</p>
                  </div>
                ))}
                {filteredEntries.length === 0 && <p className="text-sm text-slate-500">Sin registros.</p>}
              </div>
            )}
          </article>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <button onClick={() => { setTratamientoError(null); setTratamientoDialogOpen(true); }} className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm inline-flex items-center gap-2">
              <PlusCircle className="w-4 h-4" /> Nuevo tratamiento
            </button>
            <button onClick={downloadCsv} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs inline-flex items-center gap-1 bg-white">
              <Download className="w-3.5 h-3.5" /> Exportar CSV
            </button>
          </div>
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="font-medium mb-3">Tratamientos registrados</h2>
            {loading ? <p className="text-sm text-slate-500">Cargando...</p> : (
              <div className="space-y-2 max-h-[520px] overflow-auto">
                {filteredTreatments.map((treatment) => (
                  <div key={treatment.id} className="border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{treatment.issueType}</span>
                      <span>{new Date(treatment.applicationDate).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-slate-800 mt-1">{treatment.productName} - {treatment.dosagePerHa} {treatment.dosageUnit}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Modo: {treatment.mode} · Area: {treatment.appliedAreaHa} ha</p>
                  </div>
                ))}
                {filteredTreatments.length === 0 && <p className="text-sm text-slate-500">Sin tratamientos.</p>}
              </div>
            )}
          </article>
        </section>
      )}

      <Dialog open={cuadernoDialogOpen} onOpenChange={setCuadernoDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Nuevo registro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {cuadernoError ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{cuadernoError}</div> : null}
            <Field label="Actividad">
              <select value={cuadernoForm.activityType} onChange={(e) => setCuadernoForm((prev) => ({ ...prev, activityType: e.target.value as FieldLogbookEntry['activityType'] }))} className={fieldClassName}>
                <option value="siembra">Siembra</option>
                <option value="fertilizacion">Fertilizacion</option>
                <option value="riego">Riego</option>
                <option value="aplicacion">Aplicacion</option>
                <option value="scouting">Scouting</option>
                <option value="cosecha">Cosecha</option>
                <option value="mantenimiento">Mantenimiento</option>
                <option value="otro">Otro</option>
              </select>
            </Field>
            <Field label="Fecha">
              <input type="date" value={cuadernoForm.fecha} onChange={(e) => setCuadernoForm((prev) => ({ ...prev, fecha: e.target.value }))} className={fieldClassName} />
            </Field>
            <Field label="Descripcion">
              <textarea value={cuadernoForm.description} onChange={(e) => setCuadernoForm((prev) => ({ ...prev, description: e.target.value }))} rows={4} className={fieldClassName} />
            </Field>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setCuadernoDialogOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Cancelar</button>
              <button type="button" onClick={() => void handleCreateEntry()} disabled={guardandoCuaderno} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-60">
                {guardandoCuaderno ? 'Guardando...' : 'Guardar registro'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={tratamientoDialogOpen} onOpenChange={setTratamientoDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Nuevo tratamiento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {tratamientoError ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{tratamientoError}</div> : null}
            <Field label="Modo">
              <select value={tratamientoForm.mode} onChange={(e) => setTratamientoForm((prev) => ({ ...prev, mode: e.target.value as TreatmentApplication['mode'] }))} className={fieldClassName}>
                <option value="manual">Manual</option>
                <option value="bulk">Masivo</option>
              </select>
            </Field>
            <Field label="Tipo de problema">
              <select value={tratamientoForm.issueType} onChange={(e) => setTratamientoForm((prev) => ({ ...prev, issueType: e.target.value as TreatmentApplication['issueType'] }))} className={fieldClassName}>
                <option value="maleza">Maleza</option>
                <option value="plaga">Plaga</option>
                <option value="enfermedad">Enfermedad</option>
                <option value="nutricion">Nutricion</option>
                <option value="otro">Otro</option>
              </select>
            </Field>
            <Field label="Producto">
              <input value={tratamientoForm.productName} onChange={(e) => setTratamientoForm((prev) => ({ ...prev, productName: e.target.value }))} className={fieldClassName} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Dosis">
                <input type="number" min={0} step="0.1" value={tratamientoForm.dosagePerHa} onChange={(e) => setTratamientoForm((prev) => ({ ...prev, dosagePerHa: Number(e.target.value) }))} className={fieldClassName} />
              </Field>
              <Field label="Unidad">
                <select value={tratamientoForm.dosageUnit} onChange={(e) => setTratamientoForm((prev) => ({ ...prev, dosageUnit: e.target.value as TreatmentApplication['dosageUnit'] }))} className={fieldClassName}>
                  <option value="l_ha">l/ha</option>
                  <option value="kg_ha">kg/ha</option>
                  <option value="cc_ha">cc/ha</option>
                  <option value="g_ha">g/ha</option>
                </select>
              </Field>
            </div>
            <Field label="Area aplicada (ha)">
              <input type="number" min={0} step="0.1" value={tratamientoForm.appliedAreaHa} onChange={(e) => setTratamientoForm((prev) => ({ ...prev, appliedAreaHa: Number(e.target.value) }))} className={fieldClassName} />
            </Field>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setTratamientoDialogOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Cancelar</button>
              <button type="button" onClick={() => void handleCreateTreatment()} disabled={guardandoTratamiento} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-60">
                {guardandoTratamiento ? 'Guardando...' : 'Guardar tratamiento'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

const fieldClassName = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-slate-700">{label}</Label>
      {children}
    </div>
  );
}
