import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin-server';

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
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
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

    const adminDb = getAdminFirestore();
    const producerId = body.id && normalizeString(body.id) ? normalizeString(body.id) : buildProducerId(nombre);
    const now = new Date();

    const producerDoc = {
      userId: normalizeString(body.userId) || producerId,
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
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
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
    const ref = adminDb.collection('agro_productores').doc(id);
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json({ error: 'Productor no encontrado' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

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

    const updated = await ref.get();
    return NextResponse.json({ producer: mapProducer(updated.id, (updated.data() || {}) as Record<string, unknown>) });
  } catch (error) {
    console.error('Error PATCH producer:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
