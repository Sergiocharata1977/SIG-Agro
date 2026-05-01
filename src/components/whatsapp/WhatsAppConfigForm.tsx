'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import {
    AlertCircle,
    CheckCircle2,
    Eye,
    EyeOff,
    Loader2,
    Save,
    ShieldCheck,
    Send,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import type {
    OrganizationWhatsAppConfig,
    WhatsAppMode,
    WhatsAppProvider,
    WhatsAppWebhookStatus,
} from '@/types/whatsapp';

type ConfigResponse = {
    orgId: string;
    config: OrganizationWhatsAppConfig;
};

type WebhookTestResponse = {
    ok: boolean;
    orgId: string;
    config?: OrganizationWhatsAppConfig;
    details?: string;
    message?: string;
};

const DEFAULT_FORM: OrganizationWhatsAppConfig = {
    enabled: false,
    provider: 'meta',
    mode: 'inbox',
    webhook_status: 'pending',
    allowed_channels: ['meta'],
    metadata: {},
};

const MODE_OPTIONS: Array<{ value: WhatsAppMode; label: string }> = [
    { value: 'notifications_only', label: 'Solo notificaciones' },
    { value: 'inbox', label: 'Inbox' },
    { value: 'hybrid', label: 'Hibrido' },
];

export function WhatsAppConfigForm() {
    const { activeOrgId, canPerformAction, firebaseUser, organization } = useAuth();
    const canManage = canPerformAction('admin');

    const [form, setForm] = useState<OrganizationWhatsAppConfig>(DEFAULT_FORM);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testingWebhook, setTestingWebhook] = useState(false);
    const [showAccessToken, setShowAccessToken] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [testResult, setTestResult] = useState<{
        ok: boolean;
        title: string;
        description: string;
    } | null>(null);

    useEffect(() => {
        void loadConfig();
    }, [activeOrgId, firebaseUser]);

    async function loadConfig() {
        if (!activeOrgId || !firebaseUser) {
            setForm(DEFAULT_FORM);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`/api/configuracion/whatsapp?orgId=${activeOrgId}`, {
                headers: await buildAuthHeaders(firebaseUser),
                cache: 'no-store',
            });
            const data = (await response.json().catch(() => ({}))) as Partial<ConfigResponse> & {
                error?: string;
            };

            if (!response.ok) {
                throw new Error(data.error || 'No se pudo cargar la configuracion de WhatsApp.');
            }

            setForm({
                ...DEFAULT_FORM,
                ...data.config,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo cargar la configuracion.');
        } finally {
            setLoading(false);
        }
    }

    function updateField<K extends keyof OrganizationWhatsAppConfig>(
        key: K,
        value: OrganizationWhatsAppConfig[K]
    ) {
        setForm((current) => ({
            ...current,
            [key]: value,
        }));
    }

    async function handleSave() {
        if (!firebaseUser || !activeOrgId) {
            setError('Necesitas una organizacion activa para guardar la configuracion.');
            return;
        }

        try {
            setSaving(true);
            setError(null);
            setSuccess(null);

            const payload: OrganizationWhatsAppConfig = {
                ...form,
                webhook_status:
                    form.webhook_status
                    ?? (form.provider === 'meta' ? 'pending' : DEFAULT_FORM.webhook_status),
                allowed_channels: [form.provider === 'twilio' ? 'twilio' : 'meta'],
            };

            const response = await fetch('/api/configuracion/whatsapp', {
                method: 'PUT',
                headers: await buildAuthHeaders(firebaseUser),
                body: JSON.stringify({
                    orgId: activeOrgId,
                    config: payload,
                }),
            });
            const data = (await response.json().catch(() => ({}))) as Partial<ConfigResponse> & {
                error?: string;
            };

            if (!response.ok) {
                throw new Error(data.error || 'No se pudo guardar la configuracion.');
            }

            setForm({
                ...DEFAULT_FORM,
                ...data.config,
            });
            setSuccess('La configuracion de WhatsApp se guardo correctamente.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo guardar la configuracion.');
        } finally {
            setSaving(false);
        }
    }

    async function handleWebhookTest() {
        if (!firebaseUser || !activeOrgId) {
            setError('Necesitas una organizacion activa para probar el webhook.');
            return;
        }

        try {
            setTestingWebhook(true);
            setError(null);
            setSuccess(null);
            setDialogOpen(true);
            setTestResult({
                ok: true,
                title: 'Probando webhook',
                description: 'Estamos validando las credenciales y el estado de la integracion.',
            });

            const response = await fetch('/api/configuracion/whatsapp/test-webhook', {
                method: 'POST',
                headers: await buildAuthHeaders(firebaseUser),
                body: JSON.stringify({ orgId: activeOrgId }),
            });
            const data = (await response.json().catch(() => ({}))) as Partial<WebhookTestResponse> & {
                error?: string;
            };

            if (!response.ok) {
                throw new Error(data.error || data.details || 'No se pudo probar el webhook.');
            }

            if (data.config) {
                setForm((current) => ({
                    ...current,
                    ...data.config,
                }));
            }

            setSuccess(data.message || 'La prueba de webhook finalizo correctamente.');
            setTestResult({
                ok: data.ok !== false,
                title: 'Webhook verificado',
                description:
                    data.details
                    || data.message
                    || 'Las credenciales actuales respondieron correctamente.',
            });
        } catch (err) {
            const message =
                err instanceof Error ? err.message : 'No se pudo probar el webhook.';
            setTestResult({
                ok: false,
                title: 'Error al probar webhook',
                description: message,
            });
            setError(message);
            setForm((current) => ({
                ...current,
                webhook_status: 'error',
            }));
        } finally {
            setTestingWebhook(false);
        }
    }

    const statusTone = getStatusTone(form.webhook_status);
    const isMeta = form.provider !== 'twilio';

    if (!activeOrgId) {
        return (
            <section className="rounded-[28px] border border-slate-200 bg-white px-6 py-8 text-sm text-slate-600 shadow-sm">
                Selecciona una organizacion activa para configurar el canal de WhatsApp.
            </section>
        );
    }

    return (
        <>
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
                <article className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm md:p-7">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                                Canal por organizacion
                            </div>
                            <h2 className="mt-4 text-2xl font-semibold text-slate-950">
                                Configuracion de WhatsApp
                            </h2>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                                Guarda las credenciales de Meta o Twilio para la organizacion activa
                                y valida el estado del webhook antes de publicar el canal.
                            </p>
                        </div>

                        <Badge
                            variant={statusTone.variant}
                            className={cn(
                                'rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em]',
                                statusTone.className
                            )}
                        >
                            {statusTone.label}
                        </Badge>
                    </div>

                    {error ? (
                        <div className="mt-6 rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                            {error}
                        </div>
                    ) : null}

                    {success ? (
                        <div className="mt-6 rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                            {success}
                        </div>
                    ) : null}

                    {!canManage ? (
                        <div className="mt-6 rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                            Necesitas permisos de administrador para modificar esta configuracion.
                        </div>
                    ) : null}

                    {loading ? (
                        <div className="mt-10 flex items-center gap-3 rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-5 text-sm text-slate-600">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Cargando configuracion actual...
                        </div>
                    ) : (
                        <div className="mt-8 space-y-6">
                            <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            Habilitar WhatsApp
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Activa el canal para {organization?.name || 'la organizacion actual'}.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={form.enabled}
                                        disabled={!canManage || saving || testingWebhook}
                                        onClick={() => updateField('enabled', !form.enabled)}
                                        className={cn(
                                            'relative inline-flex h-8 w-14 items-center rounded-full transition',
                                            form.enabled ? 'bg-emerald-600' : 'bg-slate-300',
                                            !canManage || saving || testingWebhook
                                                ? 'cursor-not-allowed opacity-60'
                                                : 'cursor-pointer'
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'inline-block h-6 w-6 rounded-full bg-white shadow-sm transition',
                                                form.enabled ? 'translate-x-7' : 'translate-x-1'
                                            )}
                                        />
                                    </button>
                                </div>
                            </div>

                            <div className="grid gap-5 md:grid-cols-2">
                                <FieldBlock label="Proveedor" htmlFor="provider">
                                    <Select
                                        value={form.provider}
                                        onValueChange={(value) => {
                                            const provider = value as WhatsAppProvider;
                                            setForm((current) => ({
                                                ...current,
                                                provider,
                                                allowed_channels: [provider === 'twilio' ? 'twilio' : 'meta'],
                                                webhook_status:
                                                    current.webhook_status === 'verified'
                                                        ? 'pending'
                                                        : current.webhook_status,
                                            }));
                                        }}
                                        disabled={!canManage || saving || testingWebhook}
                                    >
                                        <SelectTrigger
                                            id="provider"
                                            className="h-12 rounded-2xl border-slate-200 px-4"
                                        >
                                            <SelectValue placeholder="Selecciona proveedor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="meta">Meta</SelectItem>
                                            <SelectItem value="twilio">Twilio</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FieldBlock>

                                <FieldBlock label="Modo" htmlFor="mode">
                                    <Select
                                        value={form.mode}
                                        onValueChange={(value) =>
                                            updateField('mode', value as WhatsAppMode)
                                        }
                                        disabled={!canManage || saving || testingWebhook}
                                    >
                                        <SelectTrigger
                                            id="mode"
                                            className="h-12 rounded-2xl border-slate-200 px-4"
                                        >
                                            <SelectValue placeholder="Selecciona modo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {MODE_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FieldBlock>
                            </div>

                            {isMeta ? (
                                <FieldBlock
                                    label="Phone Number ID"
                                    htmlFor="whatsapp_phone_number_id"
                                    hint="Se usa para mapear el numero de Meta con la organizacion activa."
                                >
                                    <Input
                                        id="whatsapp_phone_number_id"
                                        value={form.whatsapp_phone_number_id || ''}
                                        onChange={(event) =>
                                            updateField(
                                                'whatsapp_phone_number_id',
                                                event.target.value
                                            )
                                        }
                                        placeholder="Ej. 123456789012345"
                                        disabled={!canManage || saving || testingWebhook}
                                        className="h-12 rounded-2xl border-slate-200 px-4"
                                    />
                                </FieldBlock>
                            ) : null}

                            <div className="grid gap-5 md:grid-cols-2">
                                <FieldBlock
                                    label="Access Token"
                                    htmlFor="access_token"
                                    hint="Se almacena por organizacion y se usa para llamadas autenticadas a la API."
                                >
                                    <div className="relative">
                                        <Input
                                            id="access_token"
                                            type={showAccessToken ? 'text' : 'password'}
                                            value={form.access_token || ''}
                                            onChange={(event) =>
                                                updateField('access_token', event.target.value)
                                            }
                                            placeholder="Pega aqui el token del proveedor"
                                            disabled={!canManage || saving || testingWebhook}
                                            className="h-12 rounded-2xl border-slate-200 px-4 pr-12"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowAccessToken((current) => !current)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700"
                                            aria-label={
                                                showAccessToken
                                                    ? 'Ocultar access token'
                                                    : 'Mostrar access token'
                                            }
                                        >
                                            {showAccessToken ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </FieldBlock>

                                <FieldBlock
                                    label="Verify Token"
                                    htmlFor="verify_token"
                                    hint="Debe coincidir con el token configurado en el webhook de Meta."
                                >
                                    <Input
                                        id="verify_token"
                                        value={form.verify_token || ''}
                                        onChange={(event) =>
                                            updateField('verify_token', event.target.value)
                                        }
                                        placeholder="Token de verificacion del webhook"
                                        disabled={!canManage || saving || testingWebhook}
                                        className="h-12 rounded-2xl border-slate-200 px-4"
                                    />
                                </FieldBlock>
                            </div>

                            <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 md:flex-row">
                                <Button
                                    type="button"
                                    onClick={() => void handleSave()}
                                    disabled={!canManage || loading || saving || testingWebhook}
                                    className="h-12 rounded-2xl bg-[#0f2e21] px-5 text-sm font-semibold text-white hover:bg-[#143b2b]"
                                >
                                    {saving ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="mr-2 h-4 w-4" />
                                    )}
                                    Guardar configuracion
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => void handleWebhookTest()}
                                    disabled={!canManage || loading || saving || testingWebhook}
                                    className="h-12 rounded-2xl border-slate-200 px-5 text-sm font-semibold text-slate-700"
                                >
                                    {testingWebhook ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="mr-2 h-4 w-4" />
                                    )}
                                    Probar webhook
                                </Button>
                            </div>
                        </div>
                    )}
                </article>

                <aside className="space-y-5">
                    <article className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                                    Estado del webhook
                                </p>
                                <p className="mt-1 text-lg font-semibold text-slate-950">
                                    {statusTone.label}
                                </p>
                            </div>
                        </div>

                        <p className="mt-4 text-sm leading-6 text-slate-500">
                            {getStatusDescription(form.webhook_status)}
                        </p>
                    </article>

                    <article className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Alcance actual
                        </p>

                        <div className="mt-4 space-y-3 text-sm text-slate-600">
                            <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                <span className="font-semibold text-slate-900">Proveedor:</span>{' '}
                                {form.provider === 'twilio' ? 'Twilio' : 'Meta'}
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                <span className="font-semibold text-slate-900">Modo:</span>{' '}
                                {MODE_OPTIONS.find((option) => option.value === form.mode)?.label}
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                <span className="font-semibold text-slate-900">Canal:</span>{' '}
                                {form.enabled ? 'Activo' : 'Desactivado'}
                            </div>
                        </div>
                    </article>
                </aside>
            </section>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-950">
                            {testResult?.ok ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            ) : (
                                <AlertCircle className="h-5 w-5 text-rose-600" />
                            )}
                            {testResult?.title || 'Resultado de la prueba'}
                        </DialogTitle>
                        <DialogDescription className="text-sm leading-6 text-slate-500">
                            {testResult?.description
                                || 'Todavia no ejecutaste una prueba para esta organizacion.'}
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                            className="rounded-2xl border-slate-200"
                        >
                            Cerrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function FieldBlock({
    label,
    htmlFor,
    hint,
    children,
}: {
    label: string;
    htmlFor: string;
    hint?: string;
    children: ReactNode;
}) {
    return (
        <div className="space-y-2">
            <Label htmlFor={htmlFor} className="text-sm font-semibold text-slate-800">
                {label}
            </Label>
            {children}
            {hint ? <p className="text-xs leading-5 text-slate-500">{hint}</p> : null}
        </div>
    );
}

function getStatusTone(status: WhatsAppWebhookStatus | undefined) {
    switch (status) {
        case 'verified':
            return {
                label: 'Verificado',
                variant: 'success' as const,
                className: 'bg-emerald-100 text-emerald-800',
            };
        case 'error':
            return {
                label: 'Error',
                variant: 'destructive' as const,
                className: 'bg-rose-100 text-rose-800',
            };
        default:
            return {
                label: 'Pendiente',
                variant: 'outline' as const,
                className: 'border-amber-200 bg-amber-50 text-amber-800',
            };
    }
}

function getStatusDescription(status: WhatsAppWebhookStatus | undefined) {
    switch (status) {
        case 'verified':
            return 'La integracion respondio correctamente y el webhook quedo listo para recibir eventos.';
        case 'error':
            return 'La ultima validacion encontro un problema de credenciales, token o conectividad.';
        default:
            return 'La organizacion todavia no valido el webhook o tiene cambios pendientes por confirmar.';
    }
}

async function buildAuthHeaders(firebaseUser: { getIdToken: () => Promise<string> }) {
    const token = await firebaseUser.getIdToken();

    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };
}
