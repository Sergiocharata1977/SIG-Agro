import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyIdToken } from '@/lib/firebase-admin';
import type { OrganizationWhatsAppConfig } from '@/types/whatsapp';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type AuthContext = {
    orgId: string;
    uid: string;
};

const SETTINGS_DOC_ID = 'channels_whatsapp';
const META_API_URL = 'https://graph.facebook.com/v19.0';

export async function POST(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request);
        if (!auth) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const body = (await request.json().catch(() => ({}))) as { orgId?: string };
        const targetOrgId =
            typeof body.orgId === 'string' && body.orgId.trim() ? body.orgId.trim() : auth.orgId;

        if (targetOrgId !== auth.orgId) {
            return NextResponse.json(
                { error: 'No autorizado para esa organizacion' },
                { status: 403 }
            );
        }

        const docRef = adminDb
            .collection('organizations')
            .doc(targetOrgId)
            .collection('settings')
            .doc(SETTINGS_DOC_ID);

        const snapshot = await docRef.get();
        const config = snapshot.exists ? serializeConfig(snapshot.data() ?? {}) : null;

        if (!config) {
            return NextResponse.json(
                { error: 'No existe configuracion de WhatsApp para esta organizacion.' },
                { status: 404 }
            );
        }

        if (config.provider === 'twilio') {
            await docRef.set(
                {
                    webhook_status: 'pending',
                    updatedAt: new Date(),
                    updatedBy: auth.uid,
                },
                { merge: true }
            );

            return NextResponse.json({
                ok: true,
                orgId: targetOrgId,
                config: {
                    ...config,
                    webhook_status: 'pending',
                },
                message: 'La prueba automatica esta disponible solo para Meta por ahora.',
                details: 'Twilio quedo marcado como pendiente hasta implementar la verificacion propia.',
            });
        }

        if (!config.whatsapp_phone_number_id || !config.access_token || !config.verify_token) {
            await docRef.set(
                {
                    webhook_status: 'error',
                    updatedAt: new Date(),
                    updatedBy: auth.uid,
                },
                { merge: true }
            );

            return NextResponse.json(
                {
                    error: 'Completa Phone Number ID, Access Token y Verify Token antes de probar el webhook.',
                },
                { status: 400 }
            );
        }

        const result = await validateMetaConfig(
            config.whatsapp_phone_number_id,
            config.access_token
        );

        const nextStatus = result.ok ? 'verified' : 'error';
        await docRef.set(
            {
                webhook_status: nextStatus,
                updatedAt: new Date(),
                updatedBy: auth.uid,
                metadata: {
                    ...(config.metadata ?? {}),
                    webhook_last_tested_at: new Date().toISOString(),
                    webhook_last_test_details: result.details,
                },
            },
            { merge: true }
        );

        const nextConfig = {
            ...config,
            webhook_status: nextStatus,
            metadata: {
                ...(config.metadata ?? {}),
                webhook_last_tested_at: new Date().toISOString(),
                webhook_last_test_details: result.details,
            },
        };

        return NextResponse.json({
            ok: result.ok,
            orgId: targetOrgId,
            config: nextConfig,
            message: result.ok
                ? 'La configuracion de Meta respondio correctamente.'
                : 'La validacion de Meta devolvio un error.',
            details: result.details,
        });
    } catch (error) {
        console.error('Error POST /api/configuracion/whatsapp/test-webhook', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

async function validateMetaConfig(phoneNumberId: string, accessToken: string) {
    const response = await fetch(
        `${META_API_URL}/${phoneNumberId}?fields=id,display_phone_number,verified_name`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            cache: 'no-store',
        }
    );

    if (!response.ok) {
        const details = await response.text();
        return {
            ok: false,
            details: details || `Meta Graph API devolvio ${response.status}.`,
        };
    }

    const payload = (await response.json().catch(() => ({}))) as {
        id?: string;
        display_phone_number?: string;
        verified_name?: string;
    };

    return {
        ok: true,
        details: [
            payload.verified_name ? `Nombre verificado: ${payload.verified_name}` : null,
            payload.display_phone_number
                ? `Numero: ${payload.display_phone_number}`
                : null,
        ]
            .filter(Boolean)
            .join(' | ')
            || 'Meta respondio correctamente a la validacion del numero.',
    };
}

async function authenticateRequest(request: NextRequest): Promise<AuthContext | null> {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
        return null;
    }

    const decoded = await verifyIdToken(token);
    if (!decoded?.uid) {
        return null;
    }

    const bodyOrgId = request.nextUrl.searchParams.get('orgId')?.trim();
    const userSnapshot = await adminDb.collection('users').doc(decoded.uid).get();
    const userData = userSnapshot.data() ?? {};
    const organizationId =
        typeof userData.organizationId === 'string' ? userData.organizationId : '';
    const organizationIds = Array.isArray(userData.organizationIds)
        ? (userData.organizationIds as string[])
        : [];
    const resolvedOrgId = bodyOrgId || organizationId || organizationIds[0] || '';

    if (
        !resolvedOrgId
        || (!organizationIds.includes(resolvedOrgId) && organizationId !== resolvedOrgId)
    ) {
        const membership = await adminDb
            .collection('organizations')
            .doc(resolvedOrgId)
            .collection('members')
            .doc(decoded.uid)
            .get();

        if (!membership.exists) {
            return null;
        }
    }

    return {
        orgId: resolvedOrgId,
        uid: decoded.uid,
    };
}

function cleanOptionalString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const trimmed = value.trim();
    return trimmed || undefined;
}

function serializeConfig(data: Record<string, unknown>): OrganizationWhatsAppConfig {
    return {
        enabled: Boolean(data.enabled),
        provider: (data.provider as OrganizationWhatsAppConfig['provider'] | undefined) ?? 'meta',
        mode: (data.mode as OrganizationWhatsAppConfig['mode'] | undefined) ?? 'inbox',
        whatsapp_phone_number_id: cleanOptionalString(data.whatsapp_phone_number_id),
        access_token: cleanOptionalString(data.access_token),
        verify_token: cleanOptionalString(data.verify_token),
        app_secret: cleanOptionalString(data.app_secret),
        business_account_id: cleanOptionalString(data.business_account_id),
        webhook_status:
            (data.webhook_status as OrganizationWhatsAppConfig['webhook_status'] | undefined)
            ?? 'pending',
        default_assignee_user_id: cleanOptionalString(data.default_assignee_user_id),
        allowed_channels: Array.isArray(data.allowed_channels)
            ? (data.allowed_channels as OrganizationWhatsAppConfig['allowed_channels'])
            : ['meta'],
        max_messages_per_minute:
            typeof data.max_messages_per_minute === 'number'
                ? data.max_messages_per_minute
                : undefined,
        metadata: (data.metadata as Record<string, unknown> | undefined) ?? {},
        updatedAt: toDate(data.updatedAt),
    };
}

function toDate(value: unknown): Date | undefined {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    if (typeof value === 'object' && value && 'toDate' in value) {
        return (value as { toDate: () => Date }).toDate();
    }

    return undefined;
}
