import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/admin-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Payload = {
  name?: string;
  email?: string;
  province?: string;
  city?: string;
  cuit?: string;
  phone?: string;
};

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);
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

export async function POST(request: NextRequest) {
  try {
    const decoded = await authenticate(request);
    if (!decoded?.uid) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = (await request.json()) as Payload;
    const name = clean(body.name);
    const email = clean(body.email);
    const province = clean(body.province);
    const city = clean(body.city);
    const cuit = clean(body.cuit);
    const phone = clean(body.phone);

    if (!name || !email || !province) {
      return NextResponse.json(
        { error: 'Campos requeridos: name, email, province' },
        { status: 400 }
      );
    }

    const adminDb = getAdminFirestore();
    const now = new Date();
    const orgRef = adminDb.collection('organizations').doc();
    const orgId = orgRef.id;
    const slug = `${slugify(name)}-${orgId.slice(-5).toLowerCase()}`;

    await orgRef.set({
      name,
      slug,
      cuit: cuit || null,
      razonSocial: name,
      email,
      phone: phone || null,
      address: null,
      city: city || null,
      province,
      plan: 'free',
      status: 'active',
      settings: {
        timezone: 'America/Argentina/Buenos_Aires',
        currency: 'ARS',
        language: 'es',
      },
      features: {
        mapa_gis: true,
        campanias: true,
        contabilidad: true,
        analisis_ia: true,
        documentos: true,
      },
      createdBy: decoded.uid,
      createdAt: now,
      updatedAt: now,
    });

    await adminDb.collection('organizations').doc(orgId).collection('members').doc(decoded.uid).set({
      userId: decoded.uid,
      email: decoded.email || email,
      displayName: decoded.name || decoded.email?.split('@')[0] || 'Productor',
      role: 'owner',
      status: 'active',
      modulosHabilitados: null,
      invitedBy: decoded.uid,
      joinedAt: now,
    });

    await adminDb.collection('users').doc(decoded.uid).set(
      {
        email: decoded.email || email,
        displayName: decoded.name || decoded.email?.split('@')[0] || 'Productor',
        organizationId: orgId,
        organizationIds: [orgId],
        accessAllOrganizations: true,
        role: 'owner',
        status: 'active',
        modulosHabilitados: null,
        updatedAt: now,
      },
      { merge: true }
    );

    return NextResponse.json({ organizationId: orgId }, { status: 201 });
  } catch (error) {
    console.error('Error POST /api/producer/organizations', error);
    const detail = error instanceof Error ? error.message : 'unknown';
    return NextResponse.json({ error: 'Error interno', detail }, { status: 500 });
  }
}

