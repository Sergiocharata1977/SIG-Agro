import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/admin-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Payload = {
  organizationId?: string;
  email?: string;
  displayName?: string;
  password?: string;
  role?: 'owner' | 'admin' | 'operator' | 'viewer';
};

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

async function authenticate(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return null;
  try {
    return await getAdminAuth().verifyIdToken(token);
  } catch {
    return null;
  }
}

function canManageRole(role?: string | null) {
  return role === 'owner' || role === 'admin' || role === 'super_admin';
}

export async function POST(request: NextRequest) {
  try {
    const decoded = await authenticate(request);
    if (!decoded?.uid) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = (await request.json()) as Payload;
    const organizationId = clean(body.organizationId);
    const email = clean(body.email).toLowerCase();
    const displayName = clean(body.displayName);
    const password = clean(body.password);
    const role = body.role || 'operator';

    if (!organizationId || !email || !displayName || !role) {
      return NextResponse.json(
        { error: 'Campos requeridos: organizationId, email, displayName, role' },
        { status: 400 }
      );
    }

    const adminDb = getAdminFirestore();
    const adminAuth = getAdminAuth();
    const requesterMembership = await adminDb
      .collection('organizations')
      .doc(organizationId)
      .collection('members')
      .doc(decoded.uid)
      .get();

    const requesterUser = await adminDb.collection('users').doc(decoded.uid).get();
    const requesterRole = requesterMembership.exists
      ? requesterMembership.data()?.role
      : requesterUser.data()?.role;

    if (!canManageRole(requesterRole)) {
      return NextResponse.json({ error: 'No autorizado para administrar usuarios en esta organizacion' }, { status: 403 });
    }

    const orgSnapshot = await adminDb.collection('organizations').doc(organizationId).get();
    if (!orgSnapshot.exists) {
      return NextResponse.json({ error: 'Organizacion no encontrada' }, { status: 404 });
    }

    let authUser;
    let created = false;

    try {
      authUser = await adminAuth.getUserByEmail(email);
    } catch {
      if (!password || password.length < 6) {
        return NextResponse.json(
          { error: 'Para un usuario nuevo la contrasena temporal debe tener al menos 6 caracteres' },
          { status: 400 }
        );
      }

      authUser = await adminAuth.createUser({
        email,
        password,
        displayName,
        emailVerified: false,
        disabled: false,
      });
      created = true;
    }

    const now = new Date();
    const userRef = adminDb.collection('users').doc(authUser.uid);
    const existingUser = await userRef.get();
    const existingData = existingUser.data() || {};

    await adminDb
      .collection('organizations')
      .doc(organizationId)
      .collection('members')
      .doc(authUser.uid)
      .set(
        {
          userId: authUser.uid,
          email,
          displayName,
          role,
          status: 'active',
          modulosHabilitados: null,
          invitedBy: decoded.uid,
          joinedAt: existingData.joinedAt || now,
        },
        { merge: true }
      );

    const currentOrgIds = Array.isArray(existingData.organizationIds) ? existingData.organizationIds : [];
    const nextOrgIds = Array.from(new Set([...currentOrgIds, organizationId]));

    await userRef.set(
      {
        email,
        displayName,
        organizationId: existingData.organizationId || organizationId,
        organizationIds: nextOrgIds,
        accessAllOrganizations: existingData.accessAllOrganizations ?? true,
        role: existingData.role || role,
        status: 'active',
        modulosHabilitados: existingData.modulosHabilitados ?? null,
        invitedBy: existingData.invitedBy || decoded.uid,
        joinedAt: existingData.joinedAt || now,
        createdAt: existingData.createdAt || now,
        updatedAt: now,
      },
      { merge: true }
    );

    return NextResponse.json(
      {
        ok: true,
        created,
        userId: authUser.uid,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error POST /api/producer/organization-members', error);
    const detail = error instanceof Error ? error.message : 'unknown';
    return NextResponse.json({ error: 'Error interno', detail }, { status: 500 });
  }
}
