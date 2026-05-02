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
  CategoriaPresupuesto,
  LineaPresupuesto,
  Presupuesto,
} from '@/types/presupuesto';

const COLLECTION = 'presupuestos';

type TotalesPresupuesto = Pick<
  Presupuesto,
  | 'totalPresupuestadoGastos'
  | 'totalPresupuestadoIngresos'
  | 'totalRealGastos'
  | 'totalRealIngresos'
  | 'margenPresupuestado'
  | 'margenReal'
>;

type PresupuestoInput = Omit<
  Presupuesto,
  | 'id'
  | 'organizationId'
  | 'createdAt'
  | 'updatedAt'
  | 'totalPresupuestadoGastos'
  | 'totalPresupuestadoIngresos'
  | 'totalRealGastos'
  | 'totalRealIngresos'
  | 'margenPresupuestado'
  | 'margenReal'
>;

type PresupuestoUpdate = Partial<
  Omit<Presupuesto, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>
>;

const getCollectionPath = (orgId: string) => `organizations/${orgId}/${COLLECTION}`;

function compactObject<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)
  ) as T;
}

function toNumber(value: number): number {
  return Number(value.toFixed(2));
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

function calcularVariacionPct(montoPresupuestado: number, diferencia: number): number {
  if (montoPresupuestado === 0) {
    return 0;
  }

  return toNumber((diferencia / montoPresupuestado) * 100);
}

function normalizarLinea(linea: LineaPresupuesto): LineaPresupuesto {
  const montoPresupuestado = Number.isFinite(linea.montoPresupuestado)
    ? linea.montoPresupuestado
    : 0;
  const montoReal = Number.isFinite(linea.montoReal) ? linea.montoReal : 0;
  const diferencia = toNumber(montoReal - montoPresupuestado);

  return {
    ...linea,
    montoPresupuestado: toNumber(montoPresupuestado),
    montoReal: toNumber(montoReal),
    diferencia,
    variacionPct: calcularVariacionPct(montoPresupuestado, diferencia),
  };
}

function mapLinea(data: Record<string, unknown>): LineaPresupuesto {
  return normalizarLinea({
    id: typeof data.id === 'string' ? data.id : '',
    categoria: data.categoria as CategoriaPresupuesto,
    descripcion: typeof data.descripcion === 'string' ? data.descripcion : '',
    tipo: data.tipo as LineaPresupuesto['tipo'],
    montoPresupuestado:
      typeof data.montoPresupuestado === 'number' ? data.montoPresupuestado : 0,
    montoReal: typeof data.montoReal === 'number' ? data.montoReal : 0,
    diferencia: typeof data.diferencia === 'number' ? data.diferencia : 0,
    variacionPct: typeof data.variacionPct === 'number' ? data.variacionPct : 0,
  });
}

function mapPresupuesto(
  id: string,
  data: Record<string, unknown>,
  orgId: string
): Presupuesto {
  const lineas = Array.isArray(data.lineas)
    ? data.lineas.map((linea) => mapLinea((linea as Record<string, unknown>) || {}))
    : [];
  const totales = calcularTotalesPresupuesto(lineas);

  return {
    id,
    organizationId: typeof data.organizationId === 'string' ? data.organizationId : orgId,
    nombre: typeof data.nombre === 'string' ? data.nombre : '',
    campaniaId: typeof data.campaniaId === 'string' ? data.campaniaId : undefined,
    campoId: typeof data.campoId === 'string' ? data.campoId : undefined,
    loteId: typeof data.loteId === 'string' ? data.loteId : undefined,
    cultivo: typeof data.cultivo === 'string' ? data.cultivo : undefined,
    hectareas: typeof data.hectareas === 'number' ? data.hectareas : undefined,
    año: typeof data.año === 'number' ? data.año : new Date().getFullYear(),
    lineas,
    ...totales,
    estado: data.estado as Presupuesto['estado'],
    notas: typeof data.notas === 'string' ? data.notas : undefined,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function prepararLineas(lineas: LineaPresupuesto[]): LineaPresupuesto[] {
  return lineas.map((linea) => normalizarLinea(linea));
}

export function calcularTotalesPresupuesto(
  lineas: LineaPresupuesto[]
): TotalesPresupuesto {
  return lineas.reduce<TotalesPresupuesto>(
    (acumulado, linea) => {
      if (linea.tipo === 'gasto') {
        acumulado.totalPresupuestadoGastos = toNumber(
          acumulado.totalPresupuestadoGastos + linea.montoPresupuestado
        );
        acumulado.totalRealGastos = toNumber(
          acumulado.totalRealGastos + linea.montoReal
        );
      } else {
        acumulado.totalPresupuestadoIngresos = toNumber(
          acumulado.totalPresupuestadoIngresos + linea.montoPresupuestado
        );
        acumulado.totalRealIngresos = toNumber(
          acumulado.totalRealIngresos + linea.montoReal
        );
      }

      acumulado.margenPresupuestado = toNumber(
        acumulado.totalPresupuestadoIngresos - acumulado.totalPresupuestadoGastos
      );
      acumulado.margenReal = toNumber(
        acumulado.totalRealIngresos - acumulado.totalRealGastos
      );

      return acumulado;
    },
    {
      totalPresupuestadoGastos: 0,
      totalPresupuestadoIngresos: 0,
      totalRealGastos: 0,
      totalRealIngresos: 0,
      margenPresupuestado: 0,
      margenReal: 0,
    }
  );
}

export async function crearPresupuesto(
  orgId: string,
  data: PresupuestoInput
): Promise<string> {
  const lineas = prepararLineas(data.lineas);
  const now = Timestamp.now();
  const payload = {
    ...compactObject({
      ...data,
      campaniaId: data.campaniaId,
      campoId: data.campoId,
      loteId: data.loteId,
      cultivo: data.cultivo,
      hectareas: data.hectareas,
      notas: data.notas,
    }),
    organizationId: orgId,
    lineas,
    ...calcularTotalesPresupuesto(lineas),
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, getCollectionPath(orgId)), payload);
  return docRef.id;
}

export async function obtenerPresupuestos(
  orgId: string,
  campaniaId?: string
): Promise<Presupuesto[]> {
  const constraints: QueryConstraint[] = [orderBy('updatedAt', 'desc')];

  if (campaniaId) {
    constraints.unshift(where('campaniaId', '==', campaniaId));
  }

  const snapshot = await getDocs(query(collection(db, getCollectionPath(orgId)), ...constraints));

  return snapshot.docs.map((item) => mapPresupuesto(item.id, item.data(), orgId));
}

export async function obtenerPresupuesto(
  orgId: string,
  id: string
): Promise<Presupuesto | null> {
  const snapshot = await getDoc(doc(db, getCollectionPath(orgId), id));

  if (!snapshot.exists()) {
    return null;
  }

  return mapPresupuesto(snapshot.id, snapshot.data(), orgId);
}

export async function actualizarPresupuesto(
  orgId: string,
  id: string,
  data: PresupuestoUpdate
): Promise<void> {
  const payload = compactObject({
    ...data,
    lineas: data.lineas ? prepararLineas(data.lineas) : undefined,
    updatedAt: Timestamp.now(),
  });

  if (payload.lineas) {
    Object.assign(payload, calcularTotalesPresupuesto(payload.lineas));
  }

  await updateDoc(doc(db, getCollectionPath(orgId), id), payload);
}

export async function actualizarMontoReal(
  orgId: string,
  presupuestoId: string,
  categoria: CategoriaPresupuesto,
  montoReal: number
): Promise<void> {
  const presupuesto = await obtenerPresupuesto(orgId, presupuestoId);

  if (!presupuesto) {
    throw new Error('Presupuesto no encontrado');
  }

  const lineasActualizadas = presupuesto.lineas.map((linea) =>
    linea.categoria === categoria
      ? normalizarLinea({
          ...linea,
          montoReal: toNumber(montoReal),
        })
      : linea
  );

  const huboCambios = lineasActualizadas.some(
    (linea, index) => linea.montoReal !== presupuesto.lineas[index]?.montoReal
  );

  if (!huboCambios) {
    throw new Error(`No se encontro una linea para la categoria ${categoria}`);
  }

  await updateDoc(doc(db, getCollectionPath(orgId), presupuestoId), {
    lineas: lineasActualizadas,
    ...calcularTotalesPresupuesto(lineasActualizadas),
    updatedAt: Timestamp.now(),
  });
}
