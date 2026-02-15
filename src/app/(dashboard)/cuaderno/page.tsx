'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, PlusCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { Field, Plot } from '@/types/sig-agro';
import type { FieldLogbookEntry, TreatmentApplication } from '@/types/domain-model';
import { obtenerFields } from '@/services/fields';
import { obtenerPlots } from '@/services/plots';
import { crearRegistroCuaderno, obtenerRegistrosCuaderno } from '@/services/field-logbooks';
import { crearTratamiento, exportTratamientosCsv, obtenerTratamientos } from '@/services/treatments';

type Tab = 'cuaderno' | 'tratamientos';

const DEFAULT_CAMPAIGN = '2025-2026';

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

  const [activityType, setActivityType] = useState<FieldLogbookEntry['activityType']>('siembra');
  const [description, setDescription] = useState('');

  const [issueType, setIssueType] = useState<TreatmentApplication['issueType']>('maleza');
  const [mode, setMode] = useState<TreatmentApplication['mode']>('manual');
  const [productName, setProductName] = useState('');
  const [dosagePerHa, setDosagePerHa] = useState(1);
  const [dosageUnit, setDosageUnit] = useState<TreatmentApplication['dosageUnit']>('l_ha');
  const [appliedAreaHa, setAppliedAreaHa] = useState(1);

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

  const handleCreateEntry = async () => {
    if (!organizationId || !user || !fieldId || !description.trim()) return;

    await crearRegistroCuaderno(organizationId, {
      organizationId,
      campaignId,
      fieldId,
      plotId: plotId || undefined,
      activityType,
      startDate: new Date(),
      description: description.trim(),
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

    setDescription('');
    await loadAll();
  };

  const handleCreateTreatment = async () => {
    if (!organizationId || !user || !fieldId || !plotId || !productName.trim()) return;

    await crearTratamiento(organizationId, {
      organizationId,
      campaignId,
      fieldId,
      plotId,
      mode,
      issueType,
      productName: productName.trim(),
      dosagePerHa,
      dosageUnit,
      appliedAreaHa,
      applicationDate: new Date(),
      operatorIds: [user.id],
      createdBy: user.id,
    });

    setProductName('');
    await loadAll();
  };

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

  if (!organizationId) return <div className="p-6">Selecciona una organizacion para continuar.</div>;

  return (
    <div className="p-4 md:p-6 space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Cuaderno de Campo</h1>
        <p className="text-sm text-slate-600">Flujo operativo de actividades y tratamientos por campana.</p>
      </header>

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
        <section className="grid grid-cols-1 xl:grid-cols-[370px_1fr] gap-4">
          <article className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <h2 className="font-medium">Nueva actividad</h2>
            <select value={activityType} onChange={(e) => setActivityType(e.target.value as FieldLogbookEntry['activityType'])} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="siembra">Siembra</option>
              <option value="fertilizacion">Fertilizacion</option>
              <option value="riego">Riego</option>
              <option value="aplicacion">Aplicacion</option>
              <option value="scouting">Scouting</option>
              <option value="cosecha">Cosecha</option>
              <option value="mantenimiento">Mantenimiento</option>
              <option value="otro">Otro</option>
            </select>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Detalle operativo" className="w-full border rounded-lg px-3 py-2 text-sm" />
            <button onClick={() => void handleCreateEntry()} className="w-full rounded-lg bg-emerald-600 text-white px-3 py-2 text-sm inline-flex items-center justify-center gap-2">
              <PlusCircle className="w-4 h-4" /> Guardar registro
            </button>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="font-medium mb-3">Registros de cuaderno</h2>
            {loading ? <p className="text-sm text-slate-500">Cargando...</p> : (
              <div className="space-y-2 max-h-[520px] overflow-auto">
                {entries.filter((entry) => !plotId || entry.plotId === plotId).map((entry) => (
                  <div key={entry.id} className="border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{entry.activityType}</span>
                      <span>{new Date(entry.startDate).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-slate-800 mt-1">{entry.description}</p>
                  </div>
                ))}
                {entries.length === 0 && <p className="text-sm text-slate-500">Sin registros.</p>}
              </div>
            )}
          </article>
        </section>
      ) : (
        <section className="grid grid-cols-1 xl:grid-cols-[370px_1fr] gap-4">
          <article className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <h2 className="font-medium">Nuevo tratamiento</h2>
            <select value={mode} onChange={(e) => setMode(e.target.value as TreatmentApplication['mode'])} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="manual">Manual</option>
              <option value="bulk">Masivo</option>
            </select>
            <select value={issueType} onChange={(e) => setIssueType(e.target.value as TreatmentApplication['issueType'])} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="maleza">Maleza</option>
              <option value="plaga">Plaga</option>
              <option value="enfermedad">Enfermedad</option>
              <option value="nutricion">Nutricion</option>
              <option value="otro">Otro</option>
            </select>
            <input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Producto" className="w-full border rounded-lg px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" min={0} step="0.1" value={dosagePerHa} onChange={(e) => setDosagePerHa(Number(e.target.value))} placeholder="Dosis" className="w-full border rounded-lg px-3 py-2 text-sm" />
              <select value={dosageUnit} onChange={(e) => setDosageUnit(e.target.value as TreatmentApplication['dosageUnit'])} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="l_ha">l/ha</option>
                <option value="kg_ha">kg/ha</option>
                <option value="cc_ha">cc/ha</option>
                <option value="g_ha">g/ha</option>
              </select>
            </div>
            <input type="number" min={0} step="0.1" value={appliedAreaHa} onChange={(e) => setAppliedAreaHa(Number(e.target.value))} placeholder="Area aplicada (ha)" className="w-full border rounded-lg px-3 py-2 text-sm" />
            <button onClick={() => void handleCreateTreatment()} className="w-full rounded-lg bg-emerald-600 text-white px-3 py-2 text-sm inline-flex items-center justify-center gap-2">
              <PlusCircle className="w-4 h-4" /> Guardar tratamiento
            </button>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium">Tratamientos registrados</h2>
              <button onClick={downloadCsv} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs inline-flex items-center gap-1">
                <Download className="w-3.5 h-3.5" /> Exportar CSV
              </button>
            </div>
            {loading ? <p className="text-sm text-slate-500">Cargando...</p> : (
              <div className="space-y-2 max-h-[520px] overflow-auto">
                {treatments.filter((t) => !plotId || t.plotId === plotId).map((treatment) => (
                  <div key={treatment.id} className="border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{treatment.issueType}</span>
                      <span>{new Date(treatment.applicationDate).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-slate-800 mt-1">{treatment.productName} - {treatment.dosagePerHa} {treatment.dosageUnit}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Modo: {treatment.mode} · Area: {treatment.appliedAreaHa} ha</p>
                  </div>
                ))}
                {treatments.length === 0 && <p className="text-sm text-slate-500">Sin tratamientos.</p>}
              </div>
            )}
          </article>
        </section>
      )}
    </div>
  );
}
