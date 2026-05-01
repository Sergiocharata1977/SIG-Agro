'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, PlusCircle, Scale } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { crearAsiento, obtenerCuentas } from '@/services/contabilidad';
import type { CuentaContable, LineaAsiento } from '@/types';
import {
  BaseButton,
  BaseInput,
  BaseSelect,
  BaseSelectContent,
  BaseSelectItem,
  BaseSelectTrigger,
  BaseSelectValue,
  Section,
} from '@/components/design-system';
import { PageShell } from '@/components/layout/PageShell';

export default function NuevoAsientoPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [cuentas, setCuentas] = useState<CuentaContable[]>([]);
  const [loadingCuentas, setLoadingCuentas] = useState(true);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    concepto: '',
    descripcion: '',
    tipo: 'operativo' as const,
  });

  const [lineas, setLineas] = useState<Array<{ cuentaId: string; debe: string; haber: string }>>([
    { cuentaId: '', debe: '', haber: '' },
    { cuentaId: '', debe: '', haber: '' },
  ]);

  useEffect(() => {
    if (!user) return;

    const cargar = async () => {
      try {
        const data = await obtenerCuentas(user.id);
        setCuentas(data.filter(c => c.admiteMovimientos));
      } finally {
        setLoadingCuentas(false);
      }
    };

    void cargar();
  }, [user]);

  function agregarLinea() {
    setLineas(prev => [...prev, { cuentaId: '', debe: '', haber: '' }]);
  }

  function eliminarLinea(index: number) {
    if (lineas.length <= 2) return;
    setLineas(prev => prev.filter((_, i) => i !== index));
  }

  function actualizarLinea(index: number, campo: 'cuentaId' | 'debe' | 'haber', valor: string) {
    setLineas(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [campo]: valor };
      if (campo === 'debe' && valor) next[index].haber = '';
      if (campo === 'haber' && valor) next[index].debe = '';
      return next;
    });
  }

  function calcularTotales() {
    const totalDebe = lineas.reduce((acc, l) => acc + (parseFloat(l.debe) || 0), 0);
    const totalHaber = lineas.reduce((acc, l) => acc + (parseFloat(l.haber) || 0), 0);
    return { totalDebe, totalHaber, balanceado: Math.abs(totalDebe - totalHaber) < 0.01 };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const { balanceado } = calcularTotales();
    if (!balanceado) return setError('El asiento no esta balanceado (Debe = Haber)');
    if (!formData.concepto.trim()) return setError('Ingresa un concepto');

    setLoading(true);
    setError('');

    try {
      const lineasAsiento: LineaAsiento[] = lineas
        .filter(l => l.cuentaId && (parseFloat(l.debe) > 0 || parseFloat(l.haber) > 0))
        .map(l => {
          const cuenta = cuentas.find(c => c.id === l.cuentaId);
          return {
            cuentaId: l.cuentaId,
            cuentaCodigo: cuenta?.codigo || '',
            cuentaNombre: cuenta?.nombre || '',
            debe: parseFloat(l.debe) || 0,
            haber: parseFloat(l.haber) || 0,
            moneda: 'ARS' as const,
          };
        });

      await crearAsiento(user.id, {
        fecha: new Date(formData.fecha),
        concepto: formData.concepto,
        descripcion: formData.descripcion || undefined,
        tipo: formData.tipo,
        lineas: lineasAsiento,
        estado: 'borrador',
        createdBy: user.id,
      });

      router.push('/contabilidad');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear asiento');
    } finally {
      setLoading(false);
    }
  }

  const { totalDebe, totalHaber, balanceado } = calcularTotales();

  if (loadingCuentas) return <div className="min-h-screen flex items-center justify-center text-slate-500">Cargando cuentas...</div>;

  return (
    <PageShell title="Nuevo asiento contable" subtitle="Formulario modal de carga con validacion de balance, cuentas agro y multiples lineas.">
      <Section>
        <form onSubmit={handleSubmit} className="mx-auto max-w-5xl rounded-[32px] border border-[rgba(193,200,194,0.9)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,249,255,0.98))] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:p-8 space-y-6">
          <div className="flex flex-col gap-4 rounded-[28px] bg-[#eff7f1] p-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#c1ecd4] bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#446900]">
                <Scale className="h-4 w-4" />
                Popup contable
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-[#0b1c30]">Carga manual de asiento agro</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Registrá fecha, concepto y lineas del asiento. El sistema controla que debe y haber queden balanceados antes de guardar.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push('/contabilidad')}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Cerrar
            </button>
          </div>

          {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Fecha"><BaseInput type="date" value={formData.fecha} onChange={e => setFormData(prev => ({ ...prev, fecha: e.target.value }))} required /></Field>
            <Field label="Concepto"><BaseInput value={formData.concepto} onChange={e => setFormData(prev => ({ ...prev, concepto: e.target.value }))} required /></Field>
          </div>

          <div className="space-y-3">
            {lineas.map((linea, index) => (
              <div key={index} className="rounded-[28px] border border-slate-200 bg-white p-4">
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Linea {index + 1}</div>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_180px_auto] gap-2 items-end">
                <Field label={`Cuenta ${index + 1}`}>
                  <BaseSelect value={linea.cuentaId} onValueChange={v => actualizarLinea(index, 'cuentaId', v)}>
                    <BaseSelectTrigger><BaseSelectValue placeholder="Seleccionar cuenta" /></BaseSelectTrigger>
                    <BaseSelectContent>
                      {cuentas.map(c => <BaseSelectItem key={c.id} value={c.id}>{c.codigo} - {c.nombre}</BaseSelectItem>)}
                    </BaseSelectContent>
                  </BaseSelect>
                </Field>
                <Field label="Debe"><BaseInput type="number" min={0} step="0.01" value={linea.debe} onChange={e => actualizarLinea(index, 'debe', e.target.value)} /></Field>
                <Field label="Haber"><BaseInput type="number" min={0} step="0.01" value={linea.haber} onChange={e => actualizarLinea(index, 'haber', e.target.value)} /></Field>
                <BaseButton type="button" variant="outline" onClick={() => eliminarLinea(index)}>Quitar</BaseButton>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col justify-between gap-4 rounded-[28px] border border-slate-200 bg-[#fbfcff] p-5 md:flex-row md:items-center">
            <BaseButton type="button" variant="outline" onClick={agregarLinea}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Agregar linea
            </BaseButton>
            <div className="text-right text-sm">
              <p>Debe: <b>$ {totalDebe.toLocaleString('es-AR')}</b></p>
              <p>Haber: <b>$ {totalHaber.toLocaleString('es-AR')}</b></p>
              <p className={balanceado ? 'text-emerald-700' : 'text-rose-700'}>{balanceado ? 'Balanceado' : 'No balanceado'}</p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <BaseButton type="button" variant="outline" onClick={() => router.push('/contabilidad')}>Cancelar</BaseButton>
            <BaseButton type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar asiento'}</BaseButton>
          </div>
        </form>
      </Section>
    </PageShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</label>
      {children}
    </div>
  );
}
