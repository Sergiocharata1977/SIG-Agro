import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/admin-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type ProducerPayload = {
  id?: string;
  userId?: string;
  email: string;
  nombre: string;
  apellido?: string;
  telefono?: string;
  dni?: string;
  provincia: string;
  localidad: string;
  direccion?: string;
  razonSocial?: string;
  cuit?: string;
  password?: string;
  activo?: boolean;
};

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function toIso(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  // Firestore Timestamp
  if (typeof value === 'object' && value && 'toDate' in (value as Record<string, unknown>)) {
    const date = (value as { toDate: () => Date }).toDate();
    return date.toISOString();
  }
  return null;
}

function buildProducerId(nombre: string): string {
  const slug = normalizeString(nombre)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'productor';

  return `${slug}-${Date.now().toString().slice(-6)}`;
}

function mapProducer(id: string, data: Record<string, unknown>): Record<string, unknown> {
  return {
    id,
    ...data,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

export async function GET() {
  try {
    const adminDb = getAdminFirestore();
    const snapshot = await adminDb.collection('agro_productores').get();

    const producers = snapshot.docs
      .map(doc => mapProducer(doc.id, doc.data()))
      .sort((a, b) => {
        const dateA = new Date((a.updatedAt as string) || (a.createdAt as string) || 0).getTime();
        const dateB = new Date((b.updatedAt as string) || (b.createdAt as string) || 0).getTime();
        return dateB - dateA;
      });

    return NextResponse.json({ producers });
  } catch (error) {
    console.error('Error GET producers:', error);
    const detail = error instanceof Error ? error.message : 'unknown';
    return NextResponse.json({ error: 'Error interno', detail }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ProducerPayload;

    const nombre = normalizeString(body.nombre);
    const email = normalizeString(body.email);
    const provincia = normalizeString(body.provincia);
    const localidad = normalizeString(body.localidad);

    if (!nombre || !email || !provincia || !localidad) {
      return NextResponse.json(
        { error: 'Campos requeridos: nombre, email, provincia, localidad' },
        { status: 400 }
      );
    }
    const password = normalizeString(body.password);
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'La clave inicial es obligatoria y debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    const adminDb = getAdminFirestore();
    const adminAuth = getAdminAuth();
    const producerId = body.id && normalizeString(body.id) ? normalizeString(body.id) : buildProducerId(nombre);
    const now = new Date();
    const displayName = `${nombre} ${normalizeString(body.apellido)}`.trim() || nombre;

    let authUser;
    try {
      authUser = await adminAuth.createUser({
        email,
        password,
        displayName,
        emailVerified: true,
        disabled: body.activo === false,
      });
    } catch (error) {
      const code = (error as { code?: string }).code || '';
      if (code.includes('email-already-exists')) {
        return NextResponse.json(
          { error: 'El email ya existe en Auth. Usa editar para resetear clave o cambia email.' },
          { status: 409 }
        );
      }
      throw error;
    }

    const producerDoc = {
      userId: authUser.uid,
      email,
      nombre,
      apellido: normalizeString(body.apellido),
      telefono: normalizeString(body.telefono),
      dni: normalizeString(body.dni),
      provincia,
      localidad,
      direccion: normalizeString(body.direccion),
      razonSocial: normalizeString(body.razonSocial),
      cuit: normalizeString(body.cuit),
      activo: body.activo !== false,
      createdAt: now,
      updatedAt: now,
    };

    await adminDb.collection('agro_productores').doc(producerId).set(producerDoc, { merge: true });
    await adminDb.collection('users').doc(authUser.uid).set(
      {
        email,
        displayName,
        role: 'owner',
        status: body.activo === false ? 'inactive' : 'active',
        organizationId: '',
        organizationIds: [],
        accessAllOrganizations: true,
        modulosHabilitados: null,
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    return NextResponse.json(
      {
        producer: {
          id: producerId,
          ...producerDoc,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error POST producer:', error);
    const detail = error instanceof Error ? error.message : 'unknown';
    return NextResponse.json({ error: 'Error interno', detail }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json()) as ProducerPayload;
    const id = normalizeString(body.id);

    if (!id) {
      return NextResponse.json({ error: 'ID de productor requerido' }, { status: 400 });
    }

    const adminDb = getAdminFirestore();
    const adminAuth = getAdminAuth();
    const ref = adminDb.collection('agro_productores').doc(id);
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json({ error: 'Productor no encontrado' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    const current = (snap.data() || {}) as Record<string, unknown>;
    const password = normalizeString(body.password);
    if (password && password.length < 6) {
      return NextResponse.json({ error: 'La nueva clave debe tener al menos 6 caracteres' }, { status: 400 });
    }

    const updatableFields: Array<keyof ProducerPayload> = [
      'userId',
      'email',
      'nombre',
      'apellido',
      'telefono',
      'dni',
      'provincia',
      'localidad',
      'direccion',
      'razonSocial',
      'cuit',
      'activo',
    ];

    updatableFields.forEach(field => {
      if (body[field] !== undefined) {
        if (field === 'activo') {
          updateData[field] = Boolean(body[field]);
        } else {
          updateData[field] = normalizeString(body[field]);
        }
      }
    });

    await ref.set(updateData, { merge: true });

    const currentUserId = normalizeString(body.userId) || normalizeString(current.userId);
    const nextEmail = body.email !== undefined ? normalizeString(body.email) : normalizeString(current.email);
    const nextDisplayName = `${body.nombre !== undefined ? normalizeString(body.nombre) : normalizeString(current.nombre)} ${body.apellido !== undefined ? normalizeString(body.apellido) : normalizeString(current.apellido)}`.trim();
    const nextDisabled = body.activo !== undefined ? !Boolean(body.activo) : current.activo === false;

    if (currentUserId) {
      const authUpdate: Record<string, unknown> = {
        disabled: nextDisabled,
      };
      if (nextEmail) authUpdate.email = nextEmail;
      if (nextDisplayName) authUpdate.displayName = nextDisplayName;
      if (password) authUpdate.password = password;
      await adminAuth.updateUser(currentUserId, authUpdate);

      await adminDb.collection('users').doc(currentUserId).set(
        {
          email: nextEmail,
          displayName: nextDisplayName || undefined,
          status: nextDisabled ? 'inactive' : 'active',
          updatedAt: new Date(),
        },
        { merge: true }
      );
    }

    const updated = await ref.get();
    return NextResponse.json({ producer: mapProducer(updated.id, (updated.data() || {}) as Record<string, unknown>) });
  } catch (error) {
    console.error('Error PATCH producer:', error);
    const detail = error instanceof Error ? error.message : 'unknown';
    return NextResponse.json({ error: 'Error interno', detail }, { status: 500 });
  }
}
