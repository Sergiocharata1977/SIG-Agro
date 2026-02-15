'use client';

import { useEffect, useMemo, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PageShell } from '@/components/layout/PageShell';
import type { Field, Plot } from '@/types/sig-agro';
import type { LoteDetalle } from '@/types/domain-model';
import { obtenerFields } from '@/services/fields';
import { obtenerPlots } from '@/services/plots';
import {
  compararVersionesLote,
  crearLoteDetalle,
  obtenerLotesDetalle,
  versionarGeometriaLote,
} from '@/services/lotes-detalle';

const DEFAULT_POLYGON = '{"type":"Polygon","coordinates":[[[-58.9,-27.4],[-58.89,-27.4],[-58.89,-27.41],[-58.9,-27.41],[-58.9,-27.4]]]}';

export default function LotesPage() {
  const { user, organizationId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState<Field[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [lotesDetalle, setLotesDetalle] = useState<LoteDetalle[]>([]);

  const [fieldId, setFieldId] = useState('');
  const [plotId, setPlotId] = useState('');
  const [name, setName] = useState('Lote Detalle');
  const [code, setCode] = useState('LD-001');
  const [geometry, setGeometry] = useState(DEFAULT_POLYGON);
  const [selectedLoteId, setSelectedLoteId] = useState('');

  const [fromVersion, setFromVersion] = useState(1);
  const [toVersion, setToVersion] = useState(1);
  const [compareResult, setCompareResult] = useState<{ areaFromHa: number; areaToHa: number; deltaHa: number; deltaPercent: number } | null>(null);
  const [message, setMessage] = useState('');

  const selectedLote = useMemo(
    () => lotesDetalle.find((item) => item.id === selectedLoteId) || null,
    [lotesDetalle, selectedLoteId]
  );

  const availablePlots = useMemo(
    () => plots.filter((plot) => !fieldId || plot.fieldId === fieldId),
    [plots, fieldId]
  );

  async function loadAll() {
    if (!organizationId) return;
    setLoading(true);
    try {
      const [f, p, ld] = await Promise.all([
        obtenerFields(organizationId, { activo: true }),
        obtenerPlots(organizationId, { activo: true }),
        obtenerLotesDetalle(organizationId),
      ]);
      setFields(f);
      setPlots(p);
      setLotesDetalle(ld);
      if (!fieldId && f[0]) setFieldId(f[0].id);
      if (!selectedLoteId && ld[0]) setSelectedLoteId(ld[0].id);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  const createLote = async () => {
    if (!organizationId || !user || !fieldId || !plotId) return;
    setMessage('');
    try {
      await crearLoteDetalle(organizationId, {
        organizationId,
        fieldId,
        plotId,
        name,
        code,
        areaHa: 0,
        currentGeometryGeoJSON: geometry,
        createdBy: user.id,
      });
      setMessage('Lote creado correctamente');
      await loadAll();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error creando lote');
    }
  };

  const newVersion = async () => {
    if (!organizationId || !user || !selectedLoteId) return;
    setMessage('');
    try {
      await versionarGeometriaLote(organizationId, selectedLoteId, geometry, user.id, 'Ajuste manual de delimitacion');
      setMessage('Nueva version de geometria guardada');
      await loadAll();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error guardando version');
    }
  };

  const compareVersions = () => {
    if (!selectedLote) return;
    try {
      const result = compararVersionesLote(selectedLote, fromVersion, toVersion);
      setCompareResult(result);
      setMessage('Comparacion calculada');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error comparando versiones');
    }
  };

  if (!organizationId) return <div className="p-6">Selecciona una organizacion para continuar.</div>;

  return (
    <PageShell
      title="Catastro de Lotes"
      subtitle="Gestion de delimitaciones con versionado geometrico y comparativa temporal."
    >

      {message && <div className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700">{message}</div>}

      <section className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-4">
        <article className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <h2 className="font-medium">Nuevo lote</h2>

          <select value={fieldId} onChange={(e) => { setFieldId(e.target.value); setPlotId(''); }} className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="">Seleccionar campo</option>
            {fields.map((field) => <option key={field.id} value={field.id}>{field.nombre}</option>)}
          </select>

          <select value={plotId} onChange={(e) => setPlotId(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="">Seleccionar lote</option>
            {availablePlots.map((plot) => <option key={plot.id} value={plot.id}>{plot.nombre}</option>)}
          </select>

          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Nombre" />
          <input value={code} onChange={(e) => setCode(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Codigo" />
          <textarea value={geometry} onChange={(e) => setGeometry(e.target.value)} rows={5} className="w-full border rounded-lg px-3 py-2 text-xs font-mono" />

          <button onClick={() => void createLote()} className="w-full rounded-lg bg-emerald-600 text-white px-3 py-2 text-sm inline-flex items-center justify-center gap-2">
            <PlusCircle className="w-4 h-4" /> Crear lote
          </button>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
          <h2 className="font-medium">Versionado y comparativa</h2>

          <select value={selectedLoteId} onChange={(e) => setSelectedLoteId(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="">Seleccionar lote</option>
            {lotesDetalle.map((lote) => <option key={lote.id} value={lote.id}>{lote.name} ({lote.code})</option>)}
          </select>

          {selectedLote && (
            <>
              <div className="text-sm text-slate-600">
                Version actual: <b>{selectedLote.geometryHistory[selectedLote.geometryHistory.length - 1]?.version || 1}</b> · Area: <b>{selectedLote.areaHa.toFixed(4)} ha</b>
              </div>

              <textarea value={geometry} onChange={(e) => setGeometry(e.target.value)} rows={5} className="w-full border rounded-lg px-3 py-2 text-xs font-mono" />

              <button onClick={() => void newVersion()} className="rounded-lg border border-emerald-300 text-emerald-700 px-3 py-2 text-sm">
                Guardar nueva version
              </button>

              <div className="grid grid-cols-3 gap-2 items-end">
                <div>
                  <label className="text-xs text-slate-600">Desde</label>
                  <input type="number" min={1} value={fromVersion} onChange={(e) => setFromVersion(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-600">Hasta</label>
                  <input type="number" min={1} value={toVersion} onChange={(e) => setToVersion(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <button onClick={compareVersions} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Comparar</button>
              </div>

              {compareResult && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                  <p>Area inicial: <b>{compareResult.areaFromHa.toFixed(4)} ha</b></p>
                  <p>Area final: <b>{compareResult.areaToHa.toFixed(4)} ha</b></p>
                  <p>Delta: <b>{compareResult.deltaHa.toFixed(4)} ha ({compareResult.deltaPercent}%)</b></p>
                </div>
              )}

              <div className="space-y-2 max-h-48 overflow-auto">
                {selectedLote.geometryHistory.map((h) => (
                  <div key={h.version} className="border border-slate-200 rounded-lg p-2 text-xs text-slate-600">
                    v{h.version} · {new Date(h.changedAt).toLocaleString()} · {h.changedBy}
                    {h.reason ? ` · ${h.reason}` : ''}
                  </div>
                ))}
              </div>
            </>
          )}

          {!selectedLote && !loading && <p className="text-sm text-slate-500">Sin lotes cargados.</p>}
        </article>
      </section>
    </PageShell>
  );
}
