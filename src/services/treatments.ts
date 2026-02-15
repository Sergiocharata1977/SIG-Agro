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
import type { TreatmentApplication } from '@/types/domain-model';

const COLLECTION = 'treatments';

export async function crearTratamiento(
  orgId: string,
  payload: Omit<TreatmentApplication, 'id' | 'createdAt' | 'updatedAt' | 'status'>
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

export async function obtenerTratamientos(
  orgId: string,
  filters?: { campaignId?: string; fieldId?: string; plotId?: string }
): Promise<TreatmentApplication[]> {
  const q = query(collection(db, `organizations/${orgId}/${COLLECTION}`), orderBy('applicationDate', 'desc'));
  const snapshot = await getDocs(q);

  let items = snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...(data as Omit<TreatmentApplication, 'id' | 'applicationDate' | 'createdAt' | 'updatedAt'>),
      applicationDate: (data.applicationDate as Timestamp | undefined)?.toDate?.() || (data.applicationDate as Date),
      createdAt: (data.createdAt as Timestamp | undefined)?.toDate?.() || (data.createdAt as Date),
      updatedAt: (data.updatedAt as Timestamp | undefined)?.toDate?.() || (data.updatedAt as Date),
    } as TreatmentApplication;
  });

  if (filters?.campaignId) items = items.filter((i) => i.campaignId === filters.campaignId);
  if (filters?.fieldId) items = items.filter((i) => i.fieldId === filters.fieldId);
  if (filters?.plotId) items = items.filter((i) => i.plotId === filters.plotId);

  return items;
}

export async function actualizarTratamiento(
  orgId: string,
  treatmentId: string,
  payload: Partial<TreatmentApplication>
): Promise<void> {
  await updateDoc(doc(db, `organizations/${orgId}/${COLLECTION}/${treatmentId}`), {
    ...payload,
    updatedAt: new Date(),
  });
}

export async function eliminarTratamiento(orgId: string, treatmentId: string): Promise<void> {
  await deleteDoc(doc(db, `organizations/${orgId}/${COLLECTION}/${treatmentId}`));
}

export function exportTratamientosCsv(items: TreatmentApplication[]): string {
  const header = [
    'id',
    'campaignId',
    'fieldId',
    'plotId',
    'mode',
    'issueType',
    'productName',
    'dosagePerHa',
    'dosageUnit',
    'appliedAreaHa',
    'applicationDate',
  ];

  const rows = items.map((item) => [
    item.id,
    item.campaignId,
    item.fieldId,
    item.plotId,
    item.mode,
    item.issueType,
    item.productName,
    item.dosagePerHa,
    item.dosageUnit,
    item.appliedAreaHa,
    item.applicationDate instanceof Date ? item.applicationDate.toISOString() : String(item.applicationDate),
  ]);

  return [header, ...rows]
    .map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
}
