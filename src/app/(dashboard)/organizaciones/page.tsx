'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Building2, Pencil, Plus, Power, RotateCcw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Organization } from '@/types/organization';
import { actualizarOrganizacion, crearOrganizacionParaUsuario } from '@/services/organizations';

type OrgFormState = {
  name: string;
  email: string;
  province: string;
  city: string;
  cuit: string;
  phone: string;
};

const EMPTY_FORM: OrgFormState = {
  name: '',
  email: '',
  province: 'Chaco',
  city: '',
  cuit: '',
  phone: '',
};

export default function OrganizacionesPage() {
  const { user, organizationId, organizations, setActiveOrganization, canPerformAction, firebaseUser } = useAuth();

  const [form, setForm] = useState<OrgFormState>(EMPTY_FORM);
  const [editing, setEditing] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);

  const canManage = canPerformAction('admin') || organizations.length === 0;

  const sortedOrganizations = useMemo(() => [...organizations].sort((a, b) => a.name.localeCompare(b.name)), [organizations]);

  const filteredOrganizations = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sortedOrganizations;
    return sortedOrganizations.filter((org) => {
      const source = `${org.name} ${org.email || ''} ${org.province || ''} ${org.city || ''}`.toLowerCase();
      return source.includes(q);
    });
  }, [query, sortedOrganizations]);

  const stats = useMemo(() => {
    const total = sortedOrganizations.length;
    const active = sortedOrganizations.filter((org) => org.status === 'active').length;
    const suspended = total - active;
    return { total, active, suspended };
  }, [sortedOrganizations]);

  if (!user) {
    return <div className="p-6 text-slate-600">Cargando usuario...</div>;
  }

  if (!canManage) {
    return (
      <div className="p-6">
        <div className="max-w-xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
          No tenes permisos para administrar organizaciones.
        </div>
      </div>
    );
  }

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setShowForm(false);
  };

  const handleCreateOrUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setOkMessage(null);

    if (!firebaseUser || !user) {
      setError('Sesion invalida. Reingresa.');
      return;
    }

    if (!form.name.trim() || !form.email.trim() || !form.province.trim()) {
      setError('Nombre, email y provincia son obligatorios');
      return;
    }

    setLoading(true);
    try {
      if (editing) {
        await actualizarOrganizacion(editing.id, {
          name: form.name.trim(),
          cuit: form.cuit.trim() || undefined,
          province: form.province.trim(),
          city: form.city.trim() || undefined,
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          razonSocial: form.name.trim(),
        });
        setOkMessage('Organizacion actualizada');
      } else {
        await crearOrganizacionParaUsuario(
          {
            name: form.name.trim(),
            cuit: form.cuit.trim() || undefined,
            province: form.province.trim(),
            city: form.city.trim() || undefined,
            email: form.email.trim(),
            phone: form.phone.trim() || undefined,
          },
          firebaseUser.uid,
          user.email,
          user.displayName
        );
        setOkMessage('Organizacion creada');
      }

      resetForm();
      window.location.reload();
    } catch (err) {
      console.error(err);
      setError('No se pudo guardar la organizacion');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (org: Organization) => {
    setEditing(org);
    setShowForm(true);
    setForm({
      name: org.name || '',
      email: org.email || '',
      province: org.province || '',
      city: org.city || '',
      cuit: org.cuit || '',
      phone: org.phone || '',
    });
    setError(null);
    setOkMessage(null);
  };

  const handleToggleStatus = async (org: Organization) => {
    setError(null);
    setOkMessage(null);
    setLoading(true);
    try {
      await actualizarOrganizacion(org.id, {
        status: org.status === 'active' ? 'suspended' : 'active',
      });
      setOkMessage('Estado actualizado');
      window.location.reload();
    } catch (err) {
      console.error(err);
      setError('No se pudo cambiar el estado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">ABM Organizaciones</h1>
          <p className="text-slate-600">Alta, edicion y estado operativo de organizaciones del productor.</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setForm(EMPTY_FORM);
            setShowForm((prev) => !prev);
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          <Plus className="w-4 h-4" />
          {showForm ? 'Cerrar formulario' : 'Nueva organizacion'}
        </button>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CardStat label="Total organizaciones" value={stats.total} />
        <CardStat label="Activas" value={stats.active} tone="success" />
        <CardStat label="Suspendidas" value={stats.suspended} tone="danger" />
      </section>

      {showForm && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">{editing ? 'Editar organizacion' : 'Nueva organizacion'}</h2>
          <form onSubmit={handleCreateOrUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="Nombre" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} required />
            <Input label="Email" type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} required />
            <Input label="Provincia" value={form.province} onChange={(v) => setForm((f) => ({ ...f, province: v }))} required />
            <Input label="Ciudad" value={form.city} onChange={(v) => setForm((f) => ({ ...f, city: v }))} />
            <Input label="CUIT" value={form.cuit} onChange={(v) => setForm((f) => ({ ...f, cuit: v }))} />
            <Input label="Telefono" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />

            <div className="md:col-span-2 space-y-2">
              {error && <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">{error}</div>}
              {okMessage && <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">{okMessage}</div>}
            </div>

            <div className="md:col-span-2 flex gap-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-slate-900 text-white py-2.5 px-4 text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear organizacion'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-300 py-2.5 px-4 text-sm text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, email o ubicacion"
            className="w-full md:max-w-md rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500/30"
          />
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw className="w-4 h-4" /> Recargar
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                <th className="px-4 py-3 text-left font-semibold">Email</th>
                <th className="px-4 py-3 text-left font-semibold">Ubicacion</th>
                <th className="px-4 py-3 text-left font-semibold">Estado</th>
                <th className="px-4 py-3 text-left font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredOrganizations.map((org) => {
                const isActive = organizationId === org.id;
                const isEnabled = org.status === 'active';
                return (
                  <tr key={org.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-500" />
                        <span className="font-medium text-slate-900">{org.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{org.email || '-'}</td>
                    <td className="px-4 py-3 text-slate-700">{org.city || '-'}, {org.province || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${isEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {isEnabled ? 'activo' : 'suspendido'}
                      </span>
                      {isActive && <span className="ml-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold bg-sky-100 text-sky-700">en uso</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => void setActiveOrganization(org.id)}
                          disabled={isActive}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          Usar
                        </button>
                        <button
                          onClick={() => handleEdit(org)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Editar
                        </button>
                        <button
                          onClick={() => void handleToggleStatus(org)}
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50"
                        >
                          <Power className="w-3.5 h-3.5" /> {isEnabled ? 'Suspender' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredOrganizations.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No hay organizaciones cargadas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function CardStat({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'success' | 'danger' }) {
  const valueClass = tone === 'success' ? 'text-emerald-700' : tone === 'danger' ? 'text-rose-700' : 'text-slate-900';
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-600">{label}</p>
      <p className={`text-4xl font-semibold mt-2 ${valueClass}`}>{value}</p>
    </article>
  );
}

function Input({
  label,
  value,
  onChange,
  required,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: 'text' | 'email';
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500/30 focus:border-slate-500"
      />
    </label>
  );
}
