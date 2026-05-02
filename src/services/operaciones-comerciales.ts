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
  EstadoOperacionComercial,
  FiltrosOperacionComercial,
  LineaOperacionComercial,
  NuevaOperacionComercial,
  OperacionComercial,
} from '@/types/operaciones-comerciales';

const COLLECTION = 'operaciones_comerciales';

const getCollectionPath = (orgId: string) => `organizations/${orgId}/${COLLECTION}`;

function compactObject<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)
  ) as T;
}

function compactLinea(linea: LineaOperacionComercial) {
  return compactObject(linea as unknown as Record<string, unknown>);
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

  return new Date();
}

function mapLinea(data: Record<string, unknown>): LineaOperacionComercial {
  return {
    descripcion: typeof data.descripcion === 'string' ? data.descripcion : '',
    cantidad: typeof data.cantidad === 'number' ? data.cantidad : 0,
    precioUnitario: typeof data.precioUnitario === 'number' ? data.precioUnitario : 0,
    descuento: typeof data.descuento === 'number' ? data.descuento : 0,
    subtotal: typeof data.subtotal === 'number' ? data.subtotal : 0,
    esRepuesto: typeof data.esRepuesto === 'boolean' ? data.esRepuesto : undefined,
    esManoObra: typeof data.esManoObra === 'boolean' ? data.esManoObra : undefined,
  };
}

function mapOperacionComercial(
  id: string,
  data: Record<string, unknown>,
  orgId: string
): OperacionComercial {
  const lineas = Array.isArray(data.lineas)
    ? data.lineas.map((linea) => mapLinea((linea as Record<string, unknown>) || {}))
    : [];

  return {
    id,
    organizationId: typeof data.organizationId === 'string' ? data.organizationId : orgId,
    tipo: data.tipo as OperacionComercial['tipo'],
    estado: data.estado as OperacionComercial['estado'],
    fecha: toDate(data.fecha),
    numeroDocumento:
      typeof data.numeroDocumento === 'string' ? data.numeroDocumento : undefined,
    terceroId: typeof data.terceroId === 'string' ? data.terceroId : '',
    terceroNombre: typeof data.terceroNombre === 'string' ? data.terceroNombre : '',
    lineas,
    subtotal: typeof data.subtotal === 'number' ? data.subtotal : 0,
    descuentoGlobal: typeof data.descuentoGlobal === 'number' ? data.descuentoGlobal : 0,
    iva: typeof data.iva === 'number' ? data.iva : 0,
    montoIVA: typeof data.montoIVA === 'number' ? data.montoIVA : 0,
    total: typeof data.total === 'number' ? data.total : 0,
    condicionVenta: data.condicionVenta as OperacionComercial['condicionVenta'],
    medioCobro: typeof data.medioCobro === 'string' ? data.medioCobro : undefined,
    maquinaId: typeof data.maquinaId === 'string' ? data.maquinaId : undefined,
    ordenServicioId:
      typeof data.ordenServicioId === 'string' ? data.ordenServicioId : undefined,
    maquinaVendidaDescripcion:
      typeof data.maquinaVendidaDescripcion === 'string'
        ? data.maquinaVendidaDescripcion
        : undefined,
    marcaMaquina: typeof data.marcaMaquina === 'string' ? data.marcaMaquina : undefined,
    modeloMaquina: typeof data.modeloMaquina === 'string' ? data.modeloMaquina : undefined,
    anioMaquina: typeof data.anioMaquina === 'number' ? data.anioMaquina : undefined,
    asientoId: typeof data.asientoId === 'string' ? data.asientoId : undefined,
    notas: typeof data.notas === 'string' ? data.notas : undefined,
    creadoPor: typeof data.creadoPor === 'string' ? data.creadoPor : '',
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export function calcularTotalesLineas(
  lineas: LineaOperacionComercial[],
  ivaPct: number
): { subtotal: number; montoIVA: number; total: number } {
  const subtotal = lineas.reduce((acumulado, linea) => {
    const cantidad = Number.isFinite(linea.cantidad) ? linea.cantidad : 0;
    const precioUnitario = Number.isFinite(linea.precioUnitario) ? linea.precioUnitario : 0;
    const descuento = Number.isFinite(linea.descuento) ? linea.descuento : 0;
    const factorDescuento = 1 - descuento / 100;

    return acumulado + cantidad * precioUnitario * factorDescuento;
  }, 0);

  const montoIVA = subtotal * (ivaPct / 100);
  const total = subtotal + montoIVA;

  return { subtotal, montoIVA, total };
}

export async function crearOperacionComercial(
  orgId: string,
  data: NuevaOperacionComercial
): Promise<string> {
  const now = Timestamp.now();
  const payload = {
    ...compactObject({
      ...data,
      lineas: data.lineas.map(compactLinea),
    }),
    organizationId: orgId,
    fecha: Timestamp.fromDate(data.fecha),
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, getCollectionPath(orgId)), payload);
  return docRef.id;
}

export async function obtenerOperacionesComerciales(
  orgId: string,
  filtros?: FiltrosOperacionComercial
): Promise<OperacionComercial[]> {
  const constraints: QueryConstraint[] = [orderBy('fecha', 'desc')];

  if (filtros?.tipo) {
    constraints.unshift(where('tipo', '==', filtros.tipo));
  }

  if (filtros?.estado) {
    constraints.unshift(where('estado', '==', filtros.estado));
  }

  if (filtros?.terceroId) {
    constraints.unshift(where('terceroId', '==', filtros.terceroId));
  }

  if (filtros?.desde) {
    constraints.unshift(where('fecha', '>=', Timestamp.fromDate(filtros.desde)));
  }

  if (filtros?.hasta) {
    constraints.unshift(where('fecha', '<=', Timestamp.fromDate(filtros.hasta)));
  }

  const snapshot = await getDocs(query(collection(db, getCollectionPath(orgId)), ...constraints));

  return snapshot.docs.map((item) => mapOperacionComercial(item.id, item.data(), orgId));
}

export async function obtenerOperacionComercial(
  orgId: string,
  id: string
): Promise<OperacionComercial | null> {
  const snapshot = await getDoc(doc(db, getCollectionPath(orgId), id));

  if (!snapshot.exists()) {
    return null;
  }

  return mapOperacionComercial(snapshot.id, snapshot.data(), orgId);
}

export async function actualizarEstadoOperacion(
  orgId: string,
  id: string,
  estado: EstadoOperacionComercial,
  asientoId?: string
): Promise<void> {
  const payload: {
    estado: EstadoOperacionComercial;
    updatedAt: Timestamp;
    asientoId?: string;
  } = {
    estado,
    updatedAt: Timestamp.now(),
  };

  if (asientoId !== undefined) {
    payload.asientoId = asientoId;
  }

  await updateDoc(doc(db, getCollectionPath(orgId), id), payload);
}

export async function actualizarOperacionComercial(
  orgId: string,
  id: string,
  data: Partial<NuevaOperacionComercial>
): Promise<void> {
  const payload = compactObject({
    ...data,
    fecha: data.fecha ? Timestamp.fromDate(data.fecha) : undefined,
    lineas: data.lineas?.map(compactLinea),
    updatedAt: Timestamp.now(),
  });

  await updateDoc(doc(db, getCollectionPath(orgId), id), payload);
}
