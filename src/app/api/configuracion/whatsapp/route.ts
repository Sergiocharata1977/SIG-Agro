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

export async function GET(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request);
        if (!auth) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const snapshot = await adminDb
            .collection('organizations')
            .doc(auth.orgId)
            .collection('settings')
            .doc(SETTINGS_DOC_ID)
            .get();

        const config = snapshot.exists
            ? serializeConfig(snapshot.data() ?? {})
            : getDefaultConfig();

        return NextResponse.json({ orgId: auth.orgId, config });
    } catch (error) {
        console.error('Error GET /api/configuracion/whatsapp', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request);
        if (!auth) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const body = await request.json() as {
            orgId?: string;
            config?: Partial<OrganizationWhatsAppConfig>;
        };
        const targetOrgId = typeof body.orgId === 'string' && body.orgId.trim()
            ? body.orgId.trim()
            : auth.orgId;

        if (targetOrgId !== auth.orgId) {
            return NextResponse.json({ error: 'No autorizado para esa organizacion' }, { status: 403 });
        }

        const input = body.config ?? {};
        const now = new Date();
        const payload = {
            enabled: Boolean(input.enabled),
            provider: input.provider ?? 'meta',
            mode: input.mode ?? 'inbox',
            whatsapp_phone_number_id: cleanOptionalString(input.whatsapp_phone_number_id),
            access_token: cleanOptionalString(input.access_token),
            verify_token: cleanOptionalString(input.verify_token),
            app_secret: cleanOptionalString(input.app_secret),
            business_account_id: cleanOptionalString(input.business_account_id),
            webhook_status: input.webhook_status ?? 'pending',
            default_assignee_user_id: cleanOptionalString(input.default_assignee_user_id),
            allowed_channels: Array.isArray(input.allowed_channels) ? input.allowed_channels : ['meta'],
            max_messages_per_minute:
                typeof input.max_messages_per_minute === 'number'
                    ? input.max_messages_per_minute
                    : undefined,
            metadata: input.metadata ?? {},
            updatedAt: now,
            updatedBy: auth.uid,
        };

        await adminDb
            .collection('organizations')
            .doc(targetOrgId)
            .collection('settings')
            .doc(SETTINGS_DOC_ID)
            .set(payload, { merge: true });

        return NextResponse.json({
            orgId: targetOrgId,
            config: serializeConfig(payload),
        });
    } catch (error) {
        console.error('Error PUT /api/configuracion/whatsapp', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
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
    const organizationId = typeof userData.organizationId === 'string' ? userData.organizationId : '';
    const organizationIds = Array.isArray(userData.organizationIds)
        ? (userData.organizationIds as string[])
        : [];
    const resolvedOrgId = bodyOrgId || organizationId || organizationIds[0] || '';

    if (!resolvedOrgId || !organizationIds.includes(resolvedOrgId) && organizationId !== resolvedOrgId) {
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
        webhook_status: (data.webhook_status as OrganizationWhatsAppConfig['webhook_status'] | undefined) ?? 'pending',
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

function getDefaultConfig(): OrganizationWhatsAppConfig {
    return {
        enabled: false,
        provider: 'meta',
        mode: 'inbox',
        allowed_channels: ['meta'],
        webhook_status: 'pending',
        metadata: {},
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
