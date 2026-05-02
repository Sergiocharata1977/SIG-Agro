'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Building2, Pencil, Plus, Power, RotateCcw, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Organization, OrganizationMember, ROLE_CONFIG, UserRole } from '@/types/organization';
import { actualizarOrganizacion, obtenerMiembrosOrganizacion } from '@/services/organizations';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageShell } from '@/components/layout/PageShell';

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

type MemberFormState = {
  displayName: string;
  email: string;
  role: UserRole;
  password: string;
};

const EMPTY_MEMBER_FORM: MemberFormState = {
  displayName: '',
  email: '',
  role: 'operator',
  password: '',
};

export default function OrganizacionesPage() {
  const { user, organization, organizationId, organizations, setActiveOrganization, firebaseUser } = useAuth();

  const [form, setForm] = useState<OrgFormState>(EMPTY_FORM);
  const [memberForm, setMemberForm] = useState<MemberFormState>(EMPTY_MEMBER_FORM);
  const [editing, setEditing] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [members, setMembers] = useState<OrganizationMember[]>([]);

  const canManage = user?.role !== 'super_admin';

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

  useEffect(() => {
    let cancelled = false;

    if (!organizationId) {
      setMembers([]);
      return;
    }

    setMembersLoading(true);
    obtenerMiembrosOrganizacion(organizationId)
      .then((data) => {
        if (!cancelled) {
          setMembers(data.sort((a, b) => a.displayName.localeCompare(b.displayName)));
        }
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) {
          setMembers([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setMembersLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [organizationId]);

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
    setDialogOpen(false);
  };

  const resetMemberForm = () => {
    setMemberForm(EMPTY_MEMBER_FORM);
    setMemberDialogOpen(false);
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
        const token = await firebaseUser.getIdToken();
        const response = await fetch('/api/producer/organizations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: form.name.trim(),
            cuit: form.cuit.trim() || undefined,
            province: form.province.trim(),
            city: form.city.trim() || undefined,
            email: form.email.trim(),
            phone: form.phone.trim() || undefined,
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || data.detail || 'No se pudo crear la organizacion');
        }
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
    setDialogOpen(true);
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

  const reloadMembers = async () => {
    if (!organizationId) return;
    setMembersLoading(true);
    try {
      const data = await obtenerMiembrosOrganizacion(organizationId);
      setMembers(data.sort((a, b) => a.displayName.localeCompare(b.displayName)));
    } finally {
      setMembersLoading(false);
    }
  };

  const handleCreateMember = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setOkMessage(null);

    if (!firebaseUser || !organizationId) {
      setError('Selecciona una organizacion activa para dar de alta usuarios.');
      return;
    }

    if (!memberForm.displayName.trim() || !memberForm.email.trim() || !memberForm.role) {
      setError('Nombre, email y rol son obligatorios.');
      return;
    }

    setLoading(true);
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/producer/organization-members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          organizationId,
          displayName: memberForm.displayName.trim(),
          email: memberForm.email.trim(),
          role: memberForm.role,
          password: memberForm.password.trim() || undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || data.detail || 'No se pudo crear el usuario');
      }

      setOkMessage(
        data.created
          ? 'Usuario creado y vinculado a la organizacion.'
          : 'Usuario existente vinculado a la organizacion.'
      );
      resetMemberForm();
      await reloadMembers();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'No se pudo guardar el usuario.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell title="ABM Organizaciones" subtitle="Vista del productor con switch de organizacion activa, estado y administracion basica.">
      <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">ABM Organizaciones</h1>
          <p className="text-slate-600">Alta, edicion y estado operativo de organizaciones del productor.</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setForm(EMPTY_FORM);
            setDialogOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          <Plus className="w-4 h-4" />
          Nueva organizacion
        </button>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CardStat label="Total organizaciones" value={stats.total} />
        <CardStat label="Activas" value={stats.active} tone="success" />
        <CardStat label="Suspendidas" value={stats.suspended} tone="danger" />
      </section>

      {okMessage && <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">{okMessage}</div>}
      {error && <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">{error}</div>}

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

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-900">
              <Users className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Usuarios de la organizacion</h2>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {organizationId
                ? `Alta y administracion de miembros para ${organization?.name || 'la organizacion activa'}.`
                : 'Selecciona una organizacion para administrar sus usuarios.'}
            </p>
          </div>
          <button
            onClick={() => {
              setMemberForm(EMPTY_MEMBER_FORM);
              setMemberDialogOpen(true);
            }}
            disabled={!organizationId}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Nuevo usuario
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                <th className="px-4 py-3 text-left font-semibold">Email</th>
                <th className="px-4 py-3 text-left font-semibold">Rol</th>
                <th className="px-4 py-3 text-left font-semibold">Estado</th>
                <th className="px-4 py-3 text-left font-semibold">Alta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {members.map((member) => (
                <tr key={member.userId}>
                  <td className="px-4 py-3 font-medium text-slate-900">{member.displayName}</td>
                  <td className="px-4 py-3 text-slate-700">{member.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${ROLE_CONFIG[member.role].color}`}>
                      {ROLE_CONFIG[member.role].label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${member.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{member.joinedAt.toLocaleDateString('es-AR')}</td>
                </tr>
              ))}

              {!membersLoading && members.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    {organizationId ? 'Todavia no hay usuarios cargados para esta organizacion.' : 'Selecciona una organizacion para ver sus usuarios.'}
                  </td>
                </tr>
              )}

              {membersLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Cargando usuarios...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar organizacion' : 'Nueva organizacion'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateOrUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="Nombre" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} required />
            <Input label="Email" type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} required />
            <Input label="Provincia" value={form.province} onChange={(v) => setForm((f) => ({ ...f, province: v }))} required />
            <Input label="Ciudad" value={form.city} onChange={(v) => setForm((f) => ({ ...f, city: v }))} />
            <Input label="CUIT" value={form.cuit} onChange={(v) => setForm((f) => ({ ...f, cuit: v }))} />
            <Input label="Telefono" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />

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
        </DialogContent>
      </Dialog>

      <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nuevo usuario para la organizacion</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateMember} className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Input label="Nombre y apellido" value={memberForm.displayName} onChange={(v) => setMemberForm((f) => ({ ...f, displayName: v }))} required />
            <Input label="Email" type="email" value={memberForm.email} onChange={(v) => setMemberForm((f) => ({ ...f, email: v }))} required />
            <SelectField
              label="Rol"
              value={memberForm.role}
              onChange={(value) => setMemberForm((f) => ({ ...f, role: value as UserRole }))}
              options={[
                { value: 'admin', label: 'Administrador' },
                { value: 'operator', label: 'Operador' },
                { value: 'viewer', label: 'Visualizador' },
              ]}
            />
            <Input
              label="Contrasena temporal"
              value={memberForm.password}
              onChange={(v) => setMemberForm((f) => ({ ...f, password: v }))}
              type="password"
            />

            <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
              Si el email ya existe, se vincula a la organizacion activa. Si es un usuario nuevo, completa una contrasena temporal de al menos 6 caracteres.
            </div>

            <div className="md:col-span-2 flex gap-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Crear usuario'}
              </button>
              <button
                type="button"
                onClick={resetMemberForm}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      </div>
    </PageShell>
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
  type?: 'text' | 'email' | 'password';
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

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-500/30"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
