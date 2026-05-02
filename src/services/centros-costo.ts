import {
  addDoc,
  collection,
  doc,
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
  ActualizacionCentroCosto,
  CentroCosto,
  MovimientoCentroCosto,
  NuevoCentroCosto,
  NuevoMovimientoCentroCosto,
  ResumenCentroCosto,
} from '@/types/centros-costo';

const CENTROS_COSTO_COLLECTION = 'centros_costo';
const MOVIMIENTOS_CC_COLLECTION = 'movimientos_cc';

const getCentrosCostoPath = (orgId: string) =>
  `organizations/${orgId}/${CENTROS_COSTO_COLLECTION}`;
const getMovimientosPath = (orgId: string) =>
  `organizations/${orgId}/${MOVIMIENTOS_CC_COLLECTION}`;

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

  return new Date();
}

function compactObject<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)
  ) as T;
}

function mapCentroCosto(id: string, data: Record<string, unknown>, orgId: string): CentroCosto {
  return {
    id,
    organizationId: typeof data.organizationId === 'string' ? data.organizationId : orgId,
    codigo: typeof data.codigo === 'string' ? data.codigo : '',
    nombre: typeof data.nombre === 'string' ? data.nombre : '',
    tipo: (data.tipo as CentroCosto['tipo']) ?? 'otro',
    descripcion: typeof data.descripcion === 'string' ? data.descripcion : undefined,
    campaniaId: typeof data.campaniaId === 'string' ? data.campaniaId : undefined,
    campoId: typeof data.campoId === 'string' ? data.campoId : undefined,
    loteId: typeof data.loteId === 'string' ? data.loteId : undefined,
    padre: typeof data.padre === 'string' ? data.padre : undefined,
    activo: typeof data.activo === 'boolean' ? data.activo : true,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function mapMovimientoCentroCosto(
  id: string,
  data: Record<string, unknown>,
  orgId: string
): MovimientoCentroCosto {
  return {
    id,
    organizationId: typeof data.organizationId === 'string' ? data.organizationId : orgId,
    centroCostoId: typeof data.centroCostoId === 'string' ? data.centroCostoId : '',
    centroCostoNombre:
      typeof data.centroCostoNombre === 'string' ? data.centroCostoNombre : '',
    fecha: toDate(data.fecha),
    concepto: typeof data.concepto === 'string' ? data.concepto : '',
    tipoMovimiento: (data.tipoMovimiento as MovimientoCentroCosto['tipoMovimiento']) ?? 'cargo',
    monto: typeof data.monto === 'number' ? data.monto : 0,
    operacionId: typeof data.operacionId === 'string' ? data.operacionId : '',
    tipoOperacion: typeof data.tipoOperacion === 'string' ? data.tipoOperacion : '',
    asientoId: typeof data.asientoId === 'string' ? data.asientoId : undefined,
    createdAt: toDate(data.createdAt),
  };
}

export async function crearCentroCosto(
  orgId: string,
  data: NuevoCentroCosto
): Promise<string> {
  const now = Timestamp.now();
  const payload = {
    ...compactObject({
      ...data,
      descripcion: data.descripcion,
      campaniaId: data.campaniaId,
      campoId: data.campoId,
      loteId: data.loteId,
      padre: data.padre,
    }),
    organizationId: orgId,
    activo: data.activo ?? true,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, getCentrosCostoPath(orgId)), payload);
  return docRef.id;
}

export async function obtenerCentrosCosto(
  orgId: string,
  soloActivos = false
): Promise<CentroCosto[]> {
  const constraints: QueryConstraint[] = [orderBy('codigo', 'asc')];

  if (soloActivos) {
    constraints.unshift(where('activo', '==', true));
  }

  const snapshot = await getDocs(
    query(collection(db, getCentrosCostoPath(orgId)), ...constraints)
  );

  return snapshot.docs.map((item) => mapCentroCosto(item.id, item.data(), orgId));
}

export async function actualizarCentroCosto(
  orgId: string,
  id: string,
  data: ActualizacionCentroCosto
): Promise<void> {
  const payload = compactObject({
    ...data,
    updatedAt: Timestamp.now(),
  });

  await updateDoc(doc(db, getCentrosCostoPath(orgId), id), payload);
}

export async function registrarMovimientoCentroCosto(
  orgId: string,
  data: NuevoMovimientoCentroCosto
): Promise<string> {
  const payload = {
    ...compactObject({
      ...data,
      asientoId: data.asientoId,
    }),
    organizationId: orgId,
    fecha: Timestamp.fromDate(data.fecha),
    createdAt: Timestamp.now(),
  };

  const docRef = await addDoc(collection(db, getMovimientosPath(orgId)), payload);
  return docRef.id;
}

export async function obtenerMovimientosCentroCosto(
  orgId: string,
  ccId: string,
  desde?: Date,
  hasta?: Date
): Promise<MovimientoCentroCosto[]> {
  const constraints: QueryConstraint[] = [
    where('centroCostoId', '==', ccId),
    orderBy('fecha', 'desc'),
  ];

  if (desde) {
    constraints.unshift(where('fecha', '>=', Timestamp.fromDate(desde)));
  }

  if (hasta) {
    constraints.unshift(where('fecha', '<=', Timestamp.fromDate(hasta)));
  }

  const snapshot = await getDocs(
    query(collection(db, getMovimientosPath(orgId)), ...constraints)
  );

  return snapshot.docs.map((item) => mapMovimientoCentroCosto(item.id, item.data(), orgId));
}

export async function obtenerResumenesCentrosCosto(
  orgId: string
): Promise<ResumenCentroCosto[]> {
  const [centrosCosto, movimientosSnapshot] = await Promise.all([
    obtenerCentrosCosto(orgId),
    getDocs(query(collection(db, getMovimientosPath(orgId)), orderBy('fecha', 'desc'))),
  ]);

  const resumenes = new Map<string, ResumenCentroCosto>();

  for (const centro of centrosCosto) {
    resumenes.set(centro.id, {
      centroCostoId: centro.id,
      nombre: centro.nombre,
      totalCargos: 0,
      totalAbonos: 0,
      saldo: 0,
      cantidadMovimientos: 0,
    });
  }

  for (const movimientoDoc of movimientosSnapshot.docs) {
    const movimiento = mapMovimientoCentroCosto(movimientoDoc.id, movimientoDoc.data(), orgId);
    const resumenActual = resumenes.get(movimiento.centroCostoId) ?? {
      centroCostoId: movimiento.centroCostoId,
      nombre: movimiento.centroCostoNombre,
      totalCargos: 0,
      totalAbonos: 0,
      saldo: 0,
      cantidadMovimientos: 0,
    };

    if (movimiento.tipoMovimiento === 'cargo') {
      resumenActual.totalCargos += movimiento.monto;
    } else {
      resumenActual.totalAbonos += movimiento.monto;
    }

    resumenActual.saldo = resumenActual.totalCargos - resumenActual.totalAbonos;
    resumenActual.cantidadMovimientos += 1;

    resumenes.set(movimiento.centroCostoId, resumenActual);
  }

  return Array.from(resumenes.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
}
