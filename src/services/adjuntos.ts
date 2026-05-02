import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from 'firebase/storage';
import app, { db } from '@/firebase/config';
import type { Adjunto, TipoAdjunto } from '@/types/adjuntos';

const COLLECTION = 'adjuntos';

const storage = getStorage(app);

const getCollectionPath = (orgId: string) => `organizations/${orgId}/${COLLECTION}`;

const getStoragePath = (
  orgId: string,
  entidadTipo: string,
  entidadId: string,
  nombreStorage: string
) => `organizations/${orgId}/${COLLECTION}/${entidadTipo}/${entidadId}/${nombreStorage}`;

function getFileExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.');
  return lastDotIndex >= 0 ? fileName.slice(lastDotIndex) : '';
}

function compactObject<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)
  ) as T;
}

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate?: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate();
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return new Date(value);
  }

  return new Date();
}

function mapAdjunto(id: string, data: Record<string, unknown>, orgId: string): Adjunto {
  return {
    id,
    organizationId: typeof data.organizationId === 'string' ? data.organizationId : orgId,
    entidadTipo: typeof data.entidadTipo === 'string' ? data.entidadTipo : '',
    entidadId: typeof data.entidadId === 'string' ? data.entidadId : '',
    nombre: typeof data.nombre === 'string' ? data.nombre : '',
    nombreStorage: typeof data.nombreStorage === 'string' ? data.nombreStorage : '',
    url: typeof data.url === 'string' ? data.url : '',
    contentType: typeof data.contentType === 'string' ? data.contentType : '',
    tamaño: typeof data.tamaño === 'number' ? data.tamaño : 0,
    tipo: (data.tipo as TipoAdjunto) ?? 'otro',
    descripcion: typeof data.descripcion === 'string' ? data.descripcion : undefined,
    subidoPor: typeof data.subidoPor === 'string' ? data.subidoPor : '',
    subidoPorNombre:
      typeof data.subidoPorNombre === 'string' ? data.subidoPorNombre : undefined,
    createdAt: toDate(data.createdAt),
  };
}

export async function subirAdjunto(
  orgId: string,
  entidadTipo: string,
  entidadId: string,
  archivo: File,
  tipo: TipoAdjunto,
  subidoPor: string,
  descripcion?: string
): Promise<Adjunto> {
  const extension = getFileExtension(archivo.name);
  const nombreStorage = `${crypto.randomUUID()}${extension}`;
  const storagePath = getStoragePath(orgId, entidadTipo, entidadId, nombreStorage);
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, archivo, {
    contentType: archivo.type || undefined,
  });

  const url = await getDownloadURL(storageRef);
  const createdAt = new Date();
  const payload = compactObject({
    organizationId: orgId,
    entidadTipo,
    entidadId,
    nombre: archivo.name,
    nombreStorage,
    url,
    contentType: archivo.type || 'application/octet-stream',
    tamaño: archivo.size,
    tipo,
    descripcion,
    subidoPor,
    createdAt: Timestamp.fromDate(createdAt),
  });

  const docRef = await addDoc(collection(db, getCollectionPath(orgId)), payload);

  return mapAdjunto(docRef.id, payload, orgId);
}

export async function obtenerAdjuntos(
  orgId: string,
  entidadTipo: string,
  entidadId: string
): Promise<Adjunto[]> {
  const collectionRef = collection(db, getCollectionPath(orgId));
  const snapshot = await getDocs(
    query(
      collectionRef,
      where('entidadTipo', '==', entidadTipo),
      where('entidadId', '==', entidadId),
      orderBy('createdAt', 'desc')
    )
  );

  return snapshot.docs.map((item) => mapAdjunto(item.id, item.data(), orgId));
}

export async function eliminarAdjunto(orgId: string, adjuntoId: string): Promise<void> {
  const docRef = doc(db, getCollectionPath(orgId), adjuntoId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    throw new Error(`Adjunto no encontrado: ${adjuntoId}`);
  }

  const adjunto = mapAdjunto(snapshot.id, snapshot.data(), orgId);
  const storagePath = getStoragePath(
    orgId,
    adjunto.entidadTipo,
    adjunto.entidadId,
    adjunto.nombreStorage
  );

  await deleteObject(ref(storage, storagePath));
  await deleteDoc(docRef);
}
