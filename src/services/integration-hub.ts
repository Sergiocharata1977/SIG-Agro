import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  query,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { SensorReading } from '@/types/domain-model';
import type {
  IntegrationResult,
  IoTSensorPayload,
  MachineryTaskEventPayload,
  MachineryTaskPayload,
} from '@/types/integrations';

function normalizeMetric(metric: string): SensorReading['metric'] {
  const key = metric.toLowerCase();
  if (key.includes('soil_moisture')) return 'soil_moisture';
  if (key.includes('air_temperature')) return 'air_temperature';
  if (key.includes('soil_temperature')) return 'soil_temperature';
  if (key.includes('rain')) return 'rain_mm';
  if (key.includes('humidity')) return 'humidity';
  if (key.includes('wind')) return 'wind_speed';
  if (key.includes('pressure')) return 'pressure';
  if (key.includes('ndvi')) return 'ndvi_proxy';
  return 'other';
}

export function normalizeIoTSensorPayload(payload: IoTSensorPayload): Omit<SensorReading, 'id'> {
  return {
    organizationId: payload.organizationId,
    provider: payload.provider,
    sourceDeviceId: payload.sourceDeviceId,
    fieldId: payload.fieldId,
    plotId: payload.plotId,
    metric: normalizeMetric(payload.metric),
    value: Number(payload.value),
    unit: payload.unit,
    quality: payload.quality || 'good',
    measuredAt: new Date(payload.measuredAt),
    rawPayload: payload.rawPayload || JSON.stringify(payload),
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'integration-hub',
    status: 'active',
  };
}

async function alreadyProcessed(
  orgId: string,
  externalEventId: string,
  channel: 'iot' | 'machine'
): Promise<{ id: string } | null> {
  const q = query(
    collection(db, `organizations/${orgId}/integration_events`),
    where('externalEventId', '==', externalEventId),
    where('channel', '==', channel),
    limit(1)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id };
}

export async function ingestarTelemetriaIoT(payload: IoTSensorPayload): Promise<IntegrationResult> {
  const duplicate = await alreadyProcessed(payload.organizationId, payload.externalEventId, 'iot');
  if (duplicate) {
    return { success: true, id: duplicate.id, duplicate: true, message: 'Evento IoT duplicado, ignorado' };
  }

  const normalized = normalizeIoTSensorPayload(payload);

  const readingRef = await addDoc(
    collection(db, `organizations/${payload.organizationId}/sensor_readings`),
    normalized
  );

  await addDoc(collection(db, `organizations/${payload.organizationId}/integration_events`), {
    channel: 'iot',
    externalEventId: payload.externalEventId,
    linkedId: readingRef.id,
    status: 'processed',
    createdAt: Timestamp.now(),
    payload: payload,
  });

  return { success: true, id: readingRef.id, duplicate: false };
}

export async function crearTareaMaquinaria(payload: MachineryTaskPayload): Promise<IntegrationResult> {
  const q = query(
    collection(db, `organizations/${payload.organizationId}/machine_tasks`),
    where('externalTaskId', '==', payload.externalTaskId),
    limit(1)
  );
  const existing = await getDocs(q);
  if (!existing.empty) {
    return {
      success: true,
      id: existing.docs[0].id,
      duplicate: true,
      message: 'Tarea existente',
    };
  }

  const taskRef = await addDoc(collection(db, `organizations/${payload.organizationId}/machine_tasks`), {
    ...payload,
    status: 'sent',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  return { success: true, id: taskRef.id };
}

export async function registrarEventoMaquinaria(
  payload: MachineryTaskEventPayload
): Promise<IntegrationResult> {
  const duplicate = await alreadyProcessed(payload.organizationId, payload.externalEventId, 'machine');
  if (duplicate) {
    return { success: true, id: duplicate.id, duplicate: true, message: 'Evento de maquinaria duplicado' };
  }

  const taskQuery = query(
    collection(db, `organizations/${payload.organizationId}/machine_tasks`),
    where('externalTaskId', '==', payload.externalTaskId),
    limit(1)
  );
  const taskSnap = await getDocs(taskQuery);

  if (!taskSnap.empty) {
    const taskDoc = taskSnap.docs[0];
    await updateDoc(doc(db, `organizations/${payload.organizationId}/machine_tasks/${taskDoc.id}`), {
      status: payload.status,
      lastEventAt: new Date(payload.timestamp),
      lastEventDetails: payload.details || null,
      updatedAt: Timestamp.now(),
    });
  }

  const eventRef = await addDoc(collection(db, `organizations/${payload.organizationId}/integration_events`), {
    channel: 'machine',
    externalEventId: payload.externalEventId,
    externalTaskId: payload.externalTaskId,
    status: payload.status,
    createdAt: Timestamp.now(),
    payload,
  });

  return { success: true, id: eventRef.id, duplicate: false };
}
