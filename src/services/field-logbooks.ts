import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { FieldLogbookEntry } from '@/types/domain-model';

const COLLECTION = 'field_logbooks';

function mapLogbook(docId: string, data: Record<string, unknown>): FieldLogbookEntry {
  return {
    ...(data as Omit<FieldLogbookEntry, 'id' | 'createdAt' | 'updatedAt' | 'startDate' | 'endDate'>),
    id: docId,
    startDate: (data.startDate as Timestamp | Date),
    endDate: data.endDate as Timestamp | Date | undefined,
    createdAt: data.createdAt as Timestamp | Date,
    updatedAt: data.updatedAt as Timestamp | Date,
  } as FieldLogbookEntry;
}

export async function crearRegistroCuaderno(
  orgId: string,
  payload: Omit<FieldLogbookEntry, 'id' | 'createdAt' | 'updatedAt' | 'status'>
): Promise<string> {
  const now = new Date();
  const docRef = await addDoc(collection(db, `organizations/${orgId}/${COLLECTION}`), {
    ...payload,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  });

  return docRef.id;
}

export async function obtenerRegistrosCuaderno(
  orgId: string,
  filters?: { campaignId?: string; fieldId?: string; plotId?: string }
): Promise<FieldLogbookEntry[]> {
  const constraints = [orderBy('startDate', 'desc')];
  const q = query(collection(db, `organizations/${orgId}/${COLLECTION}`), ...constraints);
  const snapshot = await getDocs(q);

  let items = snapshot.docs.map((d) => {
    const data = d.data();
    return {
      ...mapLogbook(d.id, data),
      startDate: (data.startDate as Timestamp | undefined)?.toDate?.() || (data.startDate as Date),
      endDate: (data.endDate as Timestamp | undefined)?.toDate?.() || (data.endDate as Date | undefined),
      createdAt: (data.createdAt as Timestamp | undefined)?.toDate?.() || (data.createdAt as Date),
      updatedAt: (data.updatedAt as Timestamp | undefined)?.toDate?.() || (data.updatedAt as Date),
    };
  });

  if (filters?.campaignId) items = items.filter((i) => i.campaignId === filters.campaignId);
  if (filters?.fieldId) items = items.filter((i) => i.fieldId === filters.fieldId);
  if (filters?.plotId) items = items.filter((i) => i.plotId === filters.plotId);

  return items;
}

export async function actualizarRegistroCuaderno(
  orgId: string,
  entryId: string,
  payload: Partial<FieldLogbookEntry>
): Promise<void> {
  await updateDoc(doc(db, `organizations/${orgId}/${COLLECTION}/${entryId}`), {
    ...payload,
    updatedAt: new Date(),
  });
}

export async function eliminarRegistroCuaderno(orgId: string, entryId: string): Promise<void> {
  await deleteDoc(doc(db, `organizations/${orgId}/${COLLECTION}/${entryId}`));
}
