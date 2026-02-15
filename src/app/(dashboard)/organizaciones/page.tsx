'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Building2, CheckCircle2, Pencil, PlusCircle, Power, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Organization } from '@/types/organization';
import { actualizarOrganizacion, crearOrganizacionParaUsuario } from '@/services/organizations';

interface OrgFormState {
    name: string;
    email: string;
    province: string;
    city: string;
    cuit: string;
    phone: string;
}

const EMPTY_FORM: OrgFormState = {
    name: '',
    email: '',
    province: 'Chaco',
    city: '',
    cuit: '',
    phone: '',
};

export default function OrganizacionesPage() {
    const {
        user,
        organizationId,
        organizations,
        setActiveOrganization,
        canPerformAction,
        firebaseUser,
    } = useAuth();

    const [form, setForm] = useState<OrgFormState>(EMPTY_FORM);
    const [editing, setEditing] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [okMessage, setOkMessage] = useState<string | null>(null);

    const canManage = canPerformAction('admin');

    const sortedOrganizations = useMemo(
        () => [...organizations].sort((a, b) => a.name.localeCompare(b.name)),
        [organizations]
    );

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
    };

    const handleCreateOrUpdate = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setOkMessage(null);

        if (!firebaseUser || !user) {
            setError('Sesion invalida. Reingresa.');
            return;
        }

        if (!form.name.trim() || !form.email.trim()) {
            setError('Nombre y email son obligatorios');
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
            <header className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">ABM de Organizaciones</h1>
                <p className="text-sm text-slate-600">
                    Productor padre con multiples organizaciones hijas. La organizacion activa define el contexto operativo.
                </p>
            </header>

            <section className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6">
                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        {editing ? <Pencil className="w-5 h-5 text-emerald-600" /> : <PlusCircle className="w-5 h-5 text-emerald-600" />}
                        <h2 className="font-semibold text-slate-900">
                            {editing ? 'Editar organizacion' : 'Nueva organizacion'}
                        </h2>
                    </div>

                    <form onSubmit={handleCreateOrUpdate} className="space-y-3">
                        <Input label="Nombre" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} required />
                        <Input label="Email" type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} required />
                        <Input label="Provincia" value={form.province} onChange={(v) => setForm((f) => ({ ...f, province: v }))} required />
                        <Input label="Ciudad" value={form.city} onChange={(v) => setForm((f) => ({ ...f, city: v }))} />
                        <Input label="CUIT" value={form.cuit} onChange={(v) => setForm((f) => ({ ...f, cuit: v }))} />
                        <Input label="Telefono" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />

                        {error && <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">{error}</div>}
                        {okMessage && <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">{okMessage}</div>}

                        <div className="flex gap-2 pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 rounded-xl bg-emerald-600 text-white py-2.5 px-3 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                            >
                                {loading ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear organizacion'}
                            </button>
                            {editing && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="rounded-xl border border-slate-300 py-2.5 px-3 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                    Cancelar
                                </button>
                            )}
                        </div>
                    </form>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="font-semibold text-slate-900 mb-4">Organizaciones del productor</h2>

                    <div className="space-y-3">
                        {sortedOrganizations.map((org) => {
                            const isActive = organizationId === org.id;
                            const isEnabled = org.status === 'active';

                            return (
                                <div key={org.id} className="rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-emerald-600" />
                                            <p className="font-medium text-slate-900 truncate">{org.name}</p>
                                            {isActive && (
                                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Activa</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-600 mt-1">{org.email} · {org.province}</p>
                                        <p className="text-xs mt-1">
                                            {isEnabled ? (
                                                <span className="inline-flex items-center gap-1 text-emerald-700">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Activa
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-rose-700">
                                                    <XCircle className="w-3.5 h-3.5" /> Suspendida
                                                </span>
                                            )}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            onClick={() => void setActiveOrganization(org.id)}
                                            disabled={isActive}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                        >
                                            Usar
                                        </button>
                                        <button
                                            onClick={() => handleEdit(org)}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => void handleToggleStatus(org)}
                                            className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 inline-flex items-center gap-1"
                                        >
                                            <Power className="w-3 h-3" /> {isEnabled ? 'Suspender' : 'Activar'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {sortedOrganizations.length === 0 && (
                            <p className="text-sm text-slate-500">Todavia no hay organizaciones cargadas.</p>
                        )}
                    </div>
                </article>
            </section>
        </div>
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
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
            />
        </label>
    );
}

