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
import type { IrrigationPlan } from '@/types/domain-model';

const COLLECTION = 'irrigation_plans';

export interface IrrigationSummary {
  totalPlans: number;
  totalTargetMm: number;
  totalAppliedMm: number;
  averageDeviationMm: number;
  efficiencyPercent: number;
  overduePlans: number;
}

export async function crearPlanRiego(
  orgId: string,
  payload: Omit<IrrigationPlan, 'id' | 'createdAt' | 'updatedAt' | 'status'>
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

export async function obtenerPlanesRiego(
  orgId: string,
  filters?: { campaignId?: string; fieldId?: string; plotId?: string }
): Promise<IrrigationPlan[]> {
  const q = query(collection(db, `organizations/${orgId}/${COLLECTION}`), orderBy('planDate', 'desc'));
  const snapshot = await getDocs(q);

  let items = snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...(data as Omit<IrrigationPlan, 'id' | 'planDate' | 'createdAt' | 'updatedAt'>),
      planDate: (data.planDate as Timestamp | undefined)?.toDate?.() || (data.planDate as Date),
      createdAt: (data.createdAt as Timestamp | undefined)?.toDate?.() || (data.createdAt as Date),
      updatedAt: (data.updatedAt as Timestamp | undefined)?.toDate?.() || (data.updatedAt as Date),
    } as IrrigationPlan;
  });

  if (filters?.campaignId) items = items.filter((i) => i.campaignId === filters.campaignId);
  if (filters?.fieldId) items = items.filter((i) => i.fieldId === filters.fieldId);
  if (filters?.plotId) items = items.filter((i) => i.plotId === filters.plotId);

  return items;
}

export async function actualizarPlanRiego(
  orgId: string,
  planId: string,
  payload: Partial<IrrigationPlan>
): Promise<void> {
  await updateDoc(doc(db, `organizations/${orgId}/${COLLECTION}/${planId}`), {
    ...payload,
    updatedAt: new Date(),
  });
}

export async function eliminarPlanRiego(orgId: string, planId: string): Promise<void> {
  await deleteDoc(doc(db, `organizations/${orgId}/${COLLECTION}/${planId}`));
}

export function calcularResumenRiego(plans: IrrigationPlan[], today: Date = new Date()): IrrigationSummary {
  if (plans.length === 0) {
    return {
      totalPlans: 0,
      totalTargetMm: 0,
      totalAppliedMm: 0,
      averageDeviationMm: 0,
      efficiencyPercent: 0,
      overduePlans: 0,
    };
  }

  const totalTargetMm = plans.reduce((acc, p) => acc + (p.targetMm || 0), 0);
  const totalAppliedMm = plans.reduce((acc, p) => acc + (p.appliedMm || 0), 0);

  const deviations = plans
    .filter((p) => typeof p.appliedMm === 'number')
    .map((p) => (p.appliedMm || 0) - (p.targetMm || 0));

  const averageDeviationMm = deviations.length
    ? deviations.reduce((a, b) => a + b, 0) / deviations.length
    : 0;

  const efficiencyPercent = totalTargetMm > 0 ? Number(((totalAppliedMm / totalTargetMm) * 100).toFixed(2)) : 0;

  const overduePlans = plans.filter((p) => {
    const planDate = p.planDate instanceof Date ? p.planDate : new Date(p.planDate);
    return p.executionStatus === 'planned' && planDate < today;
  }).length;

  return {
    totalPlans: plans.length,
    totalTargetMm,
    totalAppliedMm,
    averageDeviationMm: Number(averageDeviationMm.toFixed(2)),
    efficiencyPercent,
    overduePlans,
  };
}

export function generarAlertasRiego(plans: IrrigationPlan[], today: Date = new Date()): string[] {
  const alerts: string[] = [];
  const summary = calcularResumenRiego(plans, today);

  if (summary.overduePlans > 0) {
    alerts.push(`Hay ${summary.overduePlans} plan(es) de riego fuera de ventana.`);
  }

  if (summary.efficiencyPercent < 90 && summary.totalPlans > 0) {
    alerts.push(`Eficiencia de riego baja (${summary.efficiencyPercent}%). Revisar desvio plan vs aplicado.`);
  }

  if (Math.abs(summary.averageDeviationMm) > 5) {
    alerts.push(`Desvio promedio alto (${summary.averageDeviationMm} mm). Ajustar programacion de riego.`);
  }

  return alerts;
}
