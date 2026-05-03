import { addDoc, collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type {
  ChequeEmitido,
  ChequeRecibido,
  EstadoChequeEmitido,
  EstadoChequeRecibido,
  ResumenCheques,
} from '@/types/cheques';
import { obtenerCuentaTesoreriaNombre } from '@/services/tesoreria';

function chequesEmitidosRef(orgId: string) {
  return collection(db, 'organizations', orgId, 'cheques_emitidos');
}

function chequesRecibidosRef(orgId: string) {
  return collection(db, 'organizations', orgId, 'cheques_recibidos');
}

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === 'object' && typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date(value as string | number | Date);
}

function mapChequeEmitido(id: string, orgId: string, data: Record<string, unknown>): ChequeEmitido {
  return {
    id,
    organizationId: orgId,
    numeroCheque: String(data.numeroCheque ?? ''),
    banco: String(data.banco ?? ''),
    cuentaBancariaId: String(data.cuentaBancariaId ?? ''),
    cuentaBancariaNombre: String(data.cuentaBancariaNombre ?? ''),
    tipo: (data.tipo as ChequeEmitido['tipo']) ?? 'comun',
    fechaEmision: toDate(data.fechaEmision),
    fechaPago: toDate(data.fechaPago),
    monto: Number(data.monto ?? 0),
    beneficiario: String(data.beneficiario ?? ''),
    terceroId: typeof data.terceroId === 'string' ? data.terceroId : undefined,
    concepto: String(data.concepto ?? ''),
    estado: (data.estado as EstadoChequeEmitido) ?? 'emitido',
    notas: typeof data.notas === 'string' ? data.notas : undefined,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function mapChequeRecibido(id: string, orgId: string, data: Record<string, unknown>): ChequeRecibido {
  return {
    id,
    organizationId: orgId,
    numeroCheque: String(data.numeroCheque ?? ''),
    banco: String(data.banco ?? ''),
    tipo: (data.tipo as ChequeRecibido['tipo']) ?? 'comun',
    fechaRecepcion: toDate(data.fechaRecepcion),
    fechaPago: toDate(data.fechaPago),
    monto: Number(data.monto ?? 0),
    librador: String(data.librador ?? ''),
    terceroId: typeof data.terceroId === 'string' ? data.terceroId : undefined,
    concepto: String(data.concepto ?? ''),
    estado: (data.estado as EstadoChequeRecibido) ?? 'en_cartera',
    cuentaDepositoId: typeof data.cuentaDepositoId === 'string' ? data.cuentaDepositoId : undefined,
    cuentaDepositoNombre: typeof data.cuentaDepositoNombre === 'string' ? data.cuentaDepositoNombre : undefined,
    notas: typeof data.notas === 'string' ? data.notas : undefined,
    createdAt: toDate(data.createdAt),
  };
}

export async function crearChequeEmitido(
  orgId: string,
  data: Omit<ChequeEmitido, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const now = new Date();
  const docRef = await addDoc(chequesEmitidosRef(orgId), {
    ...data,
    organizationId: orgId,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function obtenerChequesEmitidos(
  orgId: string,
  filtros?: { estado?: EstadoChequeEmitido; desde?: Date; hasta?: Date }
): Promise<ChequeEmitido[]> {
  const snapshot = await getDocs(chequesEmitidosRef(orgId));
  let items = snapshot.docs.map((item) => mapChequeEmitido(item.id, orgId, item.data()));
  if (filtros?.estado) items = items.filter((item) => item.estado === filtros.estado);
  if (filtros?.desde) items = items.filter((item) => item.fechaPago >= filtros.desde!);
  if (filtros?.hasta) items = items.filter((item) => item.fechaPago <= filtros.hasta!);
  return items.sort((a, b) => a.fechaPago.getTime() - b.fechaPago.getTime());
}

export async function actualizarEstadoChequeEmitido(
  orgId: string,
  id: string,
  estado: EstadoChequeEmitido
): Promise<void> {
  await updateDoc(doc(db, 'organizations', orgId, 'cheques_emitidos', id), {
    estado,
    updatedAt: new Date(),
  });
}

export async function crearChequeRecibido(
  orgId: string,
  data: Omit<ChequeRecibido, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const now = new Date();
  const docRef = await addDoc(chequesRecibidosRef(orgId), {
    ...data,
    organizationId: orgId,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function obtenerChequesRecibidos(
  orgId: string,
  filtros?: { estado?: EstadoChequeRecibido; desde?: Date; hasta?: Date }
): Promise<ChequeRecibido[]> {
  const snapshot = await getDocs(chequesRecibidosRef(orgId));
  let items = snapshot.docs.map((item) => mapChequeRecibido(item.id, orgId, item.data()));
  if (filtros?.estado) items = items.filter((item) => item.estado === filtros.estado);
  if (filtros?.desde) items = items.filter((item) => item.fechaPago >= filtros.desde!);
  if (filtros?.hasta) items = items.filter((item) => item.fechaPago <= filtros.hasta!);
  return items.sort((a, b) => a.fechaPago.getTime() - b.fechaPago.getTime());
}

export async function actualizarEstadoChequeRecibido(
  orgId: string,
  id: string,
  estado: EstadoChequeRecibido,
  cuentaDepositoId?: string
): Promise<void> {
  const cuentaDepositoNombre = cuentaDepositoId
    ? await obtenerCuentaTesoreriaNombre(orgId, 'banco', cuentaDepositoId)
    : undefined;

  await updateDoc(doc(db, 'organizations', orgId, 'cheques_recibidos', id), {
    estado,
    cuentaDepositoId: cuentaDepositoId ?? null,
    cuentaDepositoNombre: cuentaDepositoNombre ?? null,
    updatedAt: new Date(),
  });
}

export async function obtenerResumenCheques(orgId: string): Promise<ResumenCheques> {
  const [emitidos, recibidos] = await Promise.all([
    obtenerChequesEmitidos(orgId),
    obtenerChequesRecibidos(orgId),
  ]);

  const hoy = new Date();
  const limite = new Date(hoy);
  limite.setDate(limite.getDate() + 7);

  const emitidosPendientes = emitidos.filter((item) =>
    item.estado === 'emitido' || item.estado === 'presentado'
  );
  const recibidosEnCartera = recibidos.filter((item) => item.estado === 'en_cartera');

  const vencenEsta7Dias =
    emitidosPendientes.filter((item) => item.fechaPago <= limite).length +
    recibidosEnCartera.filter((item) => item.fechaPago <= limite).length;

  return {
    emitidosPendientes: emitidosPendientes.length,
    emitidosMonto: emitidosPendientes.reduce((acc, item) => acc + item.monto, 0),
    recibidosEnCartera: recibidosEnCartera.length,
    recibidosMonto: recibidosEnCartera.reduce((acc, item) => acc + item.monto, 0),
    vencenEsta7Dias,
  };
}
