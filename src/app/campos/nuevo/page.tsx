'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { crearCampo } from '@/services/campos';
import type { GeoJSONPoint, GeoJSONPolygon } from '@/types';
import {
  BaseButton,
  BaseCard,
  BaseInput,
  BaseSelect,
  BaseSelectContent,
  BaseSelectItem,
  BaseSelectTrigger,
  BaseSelectValue,
  Section,
} from '@/components/design-system';
import { PageShell } from '@/components/layout/PageShell';

const MapaEditor = dynamic(() => import('@/components/mapa/MapaEditor'), {
  ssr: false,
  loading: () => <div className="h-[400px] bg-slate-100 animate-pulse rounded-lg flex items-center justify-center text-slate-500">Cargando editor de mapa...</div>,
});

const DEPARTAMENTOS_CHACO = [
  'Almirante Brown','Bermejo','Chacabuco','Comandante Fernandez','Doce de Octubre','Dos de Abril','Fray Justo Santa Maria de Oro','General Belgrano','General Donovan','General Guemes','Independencia','Libertad','Libertador General San Martin','Maipu','Mayor Luis J. Fontana','Nueve de Julio','OHiggins','Presidente de la Plaza','Primero de Mayo','Quitilipi','San Fernando','San Lorenzo','Sargento Cabral','Tapenaga','Veinticinco de Mayo',
];

export default function NuevoCampoPage() {
  const router = useRouter();
  const { firebaseUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<1 | 2>(1);

  const [formData, setFormData] = useState({ nombre: '', departamento: '', localidad: '', superficieTotal: 0 });
  const [poligono, setPoligono] = useState<GeoJSONPolygon | null>(null);
  const [areaCalculada, setAreaCalculada] = useState<number>(0);

  function handlePolygonCreated(polygon: GeoJSONPolygon) {
    setPoligono(polygon);

    const coords = polygon.coordinates[0];
    const n = coords.length - 1;
    let area = 0;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += coords[i][0] * coords[j][1];
      area -= coords[j][0] * coords[i][1];
    }
    area = Math.abs(area) / 2;
    const factor = 111 * 111 * Math.cos((27 * Math.PI) / 180) * 100;
    const areaHa = area * factor;

    setAreaCalculada(areaHa);
    setFormData(prev => ({ ...prev, superficieTotal: Math.round(areaHa * 100) / 100 }));
  }

  function handleNextStep() {
    if (!formData.nombre || !formData.departamento) {
      setError('Completa nombre y departamento');
      return;
    }
    setError('');
    setStep(2);
  }

  async function handleSubmit() {
    if (!firebaseUser) return setError('Debes iniciar sesion');
    if (!poligono) return setError('Dibuja el perimetro del campo');

    setLoading(true);
    setError('');

    try {
      const coords = poligono.coordinates[0];
      const n = coords.length - 1;
      let sumLng = 0;
      let sumLat = 0;
      for (let i = 0; i < n; i++) {
        sumLng += coords[i][0];
        sumLat += coords[i][1];
      }
      const centroide: GeoJSONPoint = { type: 'Point', coordinates: [sumLng / n, sumLat / n] };

      await crearCampo(firebaseUser.uid, {
        productorId: firebaseUser.uid,
        nombre: formData.nombre,
        provincia: 'Chaco',
        departamento: formData.departamento,
        localidad: formData.localidad || undefined,
        superficieTotal: formData.superficieTotal || areaCalculada,
        perimetro: poligono,
        ubicacion: centroide,
        activo: true,
      });

      router.push('/campos');
    } catch {
      setError('Error al guardar el campo');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell title="Nuevo campo" subtitle={`Paso ${step} de 2`}>
      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {step === 1 ? (
        <Section title="Informacion del campo">
          <BaseCard>
            <div className="space-y-4 max-w-2xl">
              <Field label="Nombre"><BaseInput value={formData.nombre} onChange={e => setFormData(prev => ({ ...prev, nombre: e.target.value }))} required /></Field>
              <Field label="Departamento">
                <BaseSelect value={formData.departamento} onValueChange={v => setFormData(prev => ({ ...prev, departamento: v }))}>
                  <BaseSelectTrigger><BaseSelectValue placeholder="Seleccionar" /></BaseSelectTrigger>
                  <BaseSelectContent>
                    {DEPARTAMENTOS_CHACO.map(dep => <BaseSelectItem key={dep} value={dep}>{dep}</BaseSelectItem>)}
                  </BaseSelectContent>
                </BaseSelect>
              </Field>
              <Field label="Localidad"><BaseInput value={formData.localidad} onChange={e => setFormData(prev => ({ ...prev, localidad: e.target.value }))} /></Field>
              <div className="flex justify-end"><BaseButton onClick={handleNextStep}>Continuar al mapa</BaseButton></div>
            </div>
          </BaseCard>
        </Section>
      ) : (
        <Section title="Delimitacion GIS" description="Dibuja el perimetro del campo.">
          <BaseCard>
            <div className="space-y-4">
              <MapaEditor onPolygonCreated={handlePolygonCreated} initialPolygon={poligono} />
              <div className="text-sm text-slate-600">Superficie estimada: <b>{(formData.superficieTotal || areaCalculada).toFixed(2)} ha</b></div>
              <div className="flex justify-between gap-2">
                <BaseButton variant="outline" onClick={() => setStep(1)}>Volver</BaseButton>
                <BaseButton onClick={handleSubmit} disabled={loading}>{loading ? 'Guardando...' : 'Guardar campo'}</BaseButton>
              </div>
            </div>
          </BaseCard>
        </Section>
      )}
    </PageShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}
