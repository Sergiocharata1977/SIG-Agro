import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  QueryConstraint,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type {
  EstadoAprobacion,
  HistorialAprobacion,
  SolicitudAprobacion,
  TipoAprobacion,
} from '@/types/aprobaciones';
import { UMBRALES_APROBACION } from '@/types/aprobaciones';

const COLLECTION = 'solicitudes_aprobacion';

const getCollectionPath = (orgId: string) => `organizations/${orgId}/${COLLECTION}`;

type CrearSolicitudAprobacionInput = Omit<
  SolicitudAprobacion,
  | 'id'
  | 'organizationId'
  | 'estado'
  | 'aprobadorId'
  | 'aprobadorNombre'
  | 'fechaAprobacion'
  | 'motivoAprobacion'
  | 'historial'
  | 'createdAt'
  | 'updatedAt'
> & {
  fechaSolicitud?: Date;
};

type FiltrosSolicitudAprobacion = {
  estado?: EstadoAprobacion;
  tipo?: TipoAprobacion;
};

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

  if (typeof value === 'string' || typeof value === 'number') {
    return new Date(value);
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate?: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate();
  }

  return new Date();
}

function mapHistorialEntry(data: Record<string, unknown>): HistorialAprobacion {
  return {
    estado: data.estado as EstadoAprobacion,
    usuarioId: typeof data.usuarioId === 'string' ? data.usuarioId : '',
    usuarioNombre: typeof data.usuarioNombre === 'string' ? data.usuarioNombre : undefined,
    fecha: toDate(data.fecha),
    observacion: typeof data.observacion === 'string' ? data.observacion : undefined,
  };
}

function mapSolicitudAprobacion(
  id: string,
  data: Record<string, unknown>,
  orgId: string
): SolicitudAprobacion {
  const historial = Array.isArray(data.historial)
    ? data.historial.map((entry) => mapHistorialEntry((entry as Record<string, unknown>) || {}))
    : [];

  return {
    id,
    organizationId: typeof data.organizationId === 'string' ? data.organizationId : orgId,
    tipo: data.tipo as TipoAprobacion,
    estado: data.estado as EstadoAprobacion,
    operacionTipo: typeof data.operacionTipo === 'string' ? data.operacionTipo : '',
    operacionId: typeof data.operacionId === 'string' ? data.operacionId : undefined,
    descripcion: typeof data.descripcion === 'string' ? data.descripcion : '',
    monto: typeof data.monto === 'number' ? data.monto : undefined,
    solicitanteId: typeof data.solicitanteId === 'string' ? data.solicitanteId : '',
    solicitanteNombre:
      typeof data.solicitanteNombre === 'string' ? data.solicitanteNombre : undefined,
    fechaSolicitud: toDate(data.fechaSolicitud),
    motivoSolicitud: typeof data.motivoSolicitud === 'string' ? data.motivoSolicitud : '',
    aprobadorId: typeof data.aprobadorId === 'string' ? data.aprobadorId : undefined,
    aprobadorNombre:
      typeof data.aprobadorNombre === 'string' ? data.aprobadorNombre : undefined,
    fechaAprobacion: data.fechaAprobacion ? toDate(data.fechaAprobacion) : undefined,
    motivoAprobacion:
      typeof data.motivoAprobacion === 'string' ? data.motivoAprobacion : undefined,
    historial,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function serializarHistorial(historial: HistorialAprobacion[]) {
  return historial.map((entry) =>
    compactObject({
      ...entry,
      fecha: Timestamp.fromDate(entry.fecha),
      usuarioNombre: entry.usuarioNombre,
      observacion: entry.observacion,
    })
  );
}

export async function crearSolicitud(
  orgId: string,
  data: CrearSolicitudAprobacionInput
): Promise<string> {
  const now = Timestamp.now();
  const fechaSolicitud = data.fechaSolicitud ?? new Date();
  const historialInicial: HistorialAprobacion[] = [
    {
      estado: 'pendiente_aprobacion',
      usuarioId: data.solicitanteId,
      usuarioNombre: data.solicitanteNombre,
      fecha: fechaSolicitud,
      observacion: data.motivoSolicitud,
    },
  ];

  const payload = {
    ...compactObject({
      ...data,
      operacionId: data.operacionId,
      monto: data.monto,
      solicitanteNombre: data.solicitanteNombre,
    }),
    organizationId: orgId,
    estado: 'pendiente_aprobacion' as const,
    fechaSolicitud: Timestamp.fromDate(fechaSolicitud),
    historial: serializarHistorial(historialInicial),
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, getCollectionPath(orgId)), payload);
  return docRef.id;
}

export async function obtenerSolicitudesPendientes(
  orgId: string
): Promise<SolicitudAprobacion[]> {
  return obtenerSolicitudes(orgId, { estado: 'pendiente_aprobacion' });
}

export async function obtenerSolicitudes(
  orgId: string,
  filtros?: FiltrosSolicitudAprobacion
): Promise<SolicitudAprobacion[]> {
  const constraints: QueryConstraint[] = [orderBy('fechaSolicitud', 'desc')];

  if (filtros?.estado) {
    constraints.unshift(where('estado', '==', filtros.estado));
  }

  if (filtros?.tipo) {
    constraints.unshift(where('tipo', '==', filtros.tipo));
  }

  const snapshot = await getDocs(query(collection(db, getCollectionPath(orgId)), ...constraints));

  return snapshot.docs.map((item) => mapSolicitudAprobacion(item.id, item.data(), orgId));
}

export async function aprobarSolicitud(
  orgId: string,
  solicitudId: string,
  aprobadorId: string,
  aprobadorNombre: string,
  motivo?: string
): Promise<void> {
  const docRef = doc(db, getCollectionPath(orgId), solicitudId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    throw new Error('Solicitud de aprobacion no encontrada');
  }

  const solicitud = mapSolicitudAprobacion(snapshot.id, snapshot.data(), orgId);

  if (solicitud.estado !== 'pendiente_aprobacion') {
    throw new Error('Solo se pueden aprobar solicitudes pendientes');
  }

  const now = new Date();
  const historialActualizado: HistorialAprobacion[] = [
    ...solicitud.historial,
    {
      estado: 'aprobado',
      usuarioId: aprobadorId,
      usuarioNombre: aprobadorNombre,
      fecha: now,
      observacion: motivo,
    },
  ];

  await updateDoc(docRef, compactObject({
    estado: 'aprobado' as const,
    aprobadorId,
    aprobadorNombre,
    fechaAprobacion: Timestamp.fromDate(now),
    motivoAprobacion: motivo,
    historial: serializarHistorial(historialActualizado),
    updatedAt: Timestamp.now(),
  }));
}

export async function rechazarSolicitud(
  orgId: string,
  solicitudId: string,
  aprobadorId: string,
  motivo: string
): Promise<void> {
  const docRef = doc(db, getCollectionPath(orgId), solicitudId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    throw new Error('Solicitud de aprobacion no encontrada');
  }

  const solicitud = mapSolicitudAprobacion(snapshot.id, snapshot.data(), orgId);

  if (solicitud.estado !== 'pendiente_aprobacion') {
    throw new Error('Solo se pueden rechazar solicitudes pendientes');
  }

  const now = new Date();
  const historialActualizado: HistorialAprobacion[] = [
    ...solicitud.historial,
    {
      estado: 'rechazado',
      usuarioId: aprobadorId,
      usuarioNombre: solicitud.aprobadorNombre,
      fecha: now,
      observacion: motivo,
    },
  ];

  await updateDoc(docRef, {
    estado: 'rechazado' as const,
    aprobadorId,
    fechaAprobacion: Timestamp.fromDate(now),
    motivoAprobacion: motivo,
    historial: serializarHistorial(historialActualizado),
    updatedAt: Timestamp.now(),
  });
}

export function requiereAprobacion(tipo: string, monto?: number): boolean {
  const umbral = UMBRALES_APROBACION[tipo];

  if (umbral === undefined) {
    return false;
  }

  if (monto === undefined) {
    return true;
  }

  return monto >= umbral;
}
