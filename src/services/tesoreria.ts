import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type {
  CajaChica,
  CuentaBancaria,
  MovimientoTesoreria,
  ResumenTesoreria,
  TipoCuenta,
} from '@/types/tesoreria';

function cuentasBancariasRef(orgId: string) {
  return collection(db, 'organizations', orgId, 'cuentas_bancarias');
}

function cajasChicasRef(orgId: string) {
  return collection(db, 'organizations', orgId, 'cajas_chicas');
}

function movimientosRef(orgId: string) {
  return collection(db, 'organizations', orgId, 'movimientos_tesoreria');
}

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === 'object' && typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date(value as string | number | Date);
}

function mapCuentaBancaria(
  id: string,
  orgId: string,
  data: Record<string, unknown>
): CuentaBancaria {
  return {
    id,
    organizationId: orgId,
    banco: String(data.banco ?? ''),
    numeroCuenta: String(data.numeroCuenta ?? ''),
    titular: String(data.titular ?? ''),
    tipoCuenta: (data.tipoCuenta as CuentaBancaria['tipoCuenta']) ?? 'corriente',
    moneda: (data.moneda as CuentaBancaria['moneda']) ?? 'ARS',
    saldoInicial: Number(data.saldoInicial ?? 0),
    saldo: Number(data.saldo ?? 0),
    estado: (data.estado as CuentaBancaria['estado']) ?? 'activo',
    notas: typeof data.notas === 'string' ? data.notas : undefined,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function mapCajaChica(id: string, orgId: string, data: Record<string, unknown>): CajaChica {
  return {
    id,
    organizationId: orgId,
    nombre: String(data.nombre ?? ''),
    responsable: typeof data.responsable === 'string' ? data.responsable : undefined,
    saldoInicial: Number(data.saldoInicial ?? 0),
    saldo: Number(data.saldo ?? 0),
    moneda: (data.moneda as CajaChica['moneda']) ?? 'ARS',
    estado: (data.estado as CajaChica['estado']) ?? 'activo',
    notas: typeof data.notas === 'string' ? data.notas : undefined,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function mapMovimiento(id: string, orgId: string, data: Record<string, unknown>): MovimientoTesoreria {
  return {
    id,
    organizationId: orgId,
    tipo: data.tipo as MovimientoTesoreria['tipo'],
    cuentaOrigenTipo: data.cuentaOrigenTipo as TipoCuenta,
    cuentaOrigenId: String(data.cuentaOrigenId ?? ''),
    cuentaOrigenNombre: String(data.cuentaOrigenNombre ?? ''),
    cuentaDestinoTipo: data.cuentaDestinoTipo as TipoCuenta | undefined,
    cuentaDestinoId: typeof data.cuentaDestinoId === 'string' ? data.cuentaDestinoId : undefined,
    cuentaDestinoNombre: typeof data.cuentaDestinoNombre === 'string' ? data.cuentaDestinoNombre : undefined,
    fecha: toDate(data.fecha),
    concepto: String(data.concepto ?? ''),
    monto: Number(data.monto ?? 0),
    terceroId: typeof data.terceroId === 'string' ? data.terceroId : undefined,
    terceroNombre: typeof data.terceroNombre === 'string' ? data.terceroNombre : undefined,
    operacionId: typeof data.operacionId === 'string' ? data.operacionId : undefined,
    asientoId: typeof data.asientoId === 'string' ? data.asientoId : undefined,
    notas: typeof data.notas === 'string' ? data.notas : undefined,
    createdAt: toDate(data.createdAt),
  };
}

function docPathByTipo(orgId: string, tipo: TipoCuenta, id: string) {
  return tipo === 'banco'
    ? doc(db, 'organizations', orgId, 'cuentas_bancarias', id)
    : doc(db, 'organizations', orgId, 'cajas_chicas', id);
}

export async function crearCuentaBancaria(
  orgId: string,
  data: Omit<CuentaBancaria, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const now = new Date();
  const docRef = await addDoc(cuentasBancariasRef(orgId), {
    ...data,
    organizationId: orgId,
    saldo: data.saldo ?? data.saldoInicial,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function obtenerCuentasBancarias(orgId: string): Promise<CuentaBancaria[]> {
  const snapshot = await getDocs(cuentasBancariasRef(orgId));
  return snapshot.docs
    .map((item) => mapCuentaBancaria(item.id, orgId, item.data()))
    .sort((a, b) => a.banco.localeCompare(b.banco, 'es'));
}

export async function actualizarCuentaBancaria(
  orgId: string,
  id: string,
  data: Partial<CuentaBancaria>
): Promise<void> {
  await updateDoc(doc(db, 'organizations', orgId, 'cuentas_bancarias', id), {
    ...data,
    updatedAt: new Date(),
  });
}

export async function crearCajaChica(
  orgId: string,
  data: Omit<CajaChica, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const now = new Date();
  const docRef = await addDoc(cajasChicasRef(orgId), {
    ...data,
    organizationId: orgId,
    saldo: data.saldo ?? data.saldoInicial,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function obtenerCajasChicas(orgId: string): Promise<CajaChica[]> {
  const snapshot = await getDocs(cajasChicasRef(orgId));
  return snapshot.docs
    .map((item) => mapCajaChica(item.id, orgId, item.data()))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

export async function actualizarCajaChica(orgId: string, id: string, data: Partial<CajaChica>): Promise<void> {
  await updateDoc(doc(db, 'organizations', orgId, 'cajas_chicas', id), {
    ...data,
    updatedAt: new Date(),
  });
}

export async function registrarMovimiento(
  orgId: string,
  data: Omit<MovimientoTesoreria, 'id' | 'organizationId' | 'createdAt'>
): Promise<string> {
  const now = new Date();
  const movimientoRef = doc(movimientosRef(orgId));

  await runTransaction(db, async (transaction) => {
    const origenRef = docPathByTipo(orgId, data.cuentaOrigenTipo, data.cuentaOrigenId);
    const origenSnap = await transaction.get(origenRef);

    if (!origenSnap.exists()) {
      throw new Error('La cuenta origen no existe');
    }

    const origenSaldo = Number(origenSnap.data().saldo ?? 0);
    let nuevoSaldoOrigen = origenSaldo;

    if (data.tipo === 'ingreso') nuevoSaldoOrigen += data.monto;
    if (data.tipo === 'egreso' || data.tipo === 'transferencia') nuevoSaldoOrigen -= data.monto;

    transaction.update(origenRef, {
      saldo: nuevoSaldoOrigen,
      updatedAt: now,
    });

    if (data.tipo === 'transferencia' && data.cuentaDestinoTipo && data.cuentaDestinoId) {
      const destinoRef = docPathByTipo(orgId, data.cuentaDestinoTipo, data.cuentaDestinoId);
      const destinoSnap = await transaction.get(destinoRef);

      if (!destinoSnap.exists()) {
        throw new Error('La cuenta destino no existe');
      }

      const destinoSaldo = Number(destinoSnap.data().saldo ?? 0);
      transaction.update(destinoRef, {
        saldo: destinoSaldo + data.monto,
        updatedAt: now,
      });
    }

    transaction.set(movimientoRef, {
      ...data,
      organizationId: orgId,
      createdAt: now,
    });
  });

  return movimientoRef.id;
}

export async function obtenerMovimientos(
  orgId: string,
  filtros?: { cuentaId?: string; cuentaTipo?: TipoCuenta; desde?: Date; hasta?: Date }
): Promise<MovimientoTesoreria[]> {
  const snapshot = await getDocs(movimientosRef(orgId));
  let items = snapshot.docs.map((item) => mapMovimiento(item.id, orgId, item.data()));

  if (filtros?.cuentaId) {
    items = items.filter(
      (item) =>
        item.cuentaOrigenId === filtros.cuentaId || item.cuentaDestinoId === filtros.cuentaId
    );
  }

  if (filtros?.cuentaTipo) {
    items = items.filter(
      (item) =>
        item.cuentaOrigenTipo === filtros.cuentaTipo || item.cuentaDestinoTipo === filtros.cuentaTipo
    );
  }

  if (filtros?.desde) {
    items = items.filter((item) => item.fecha >= filtros.desde!);
  }

  if (filtros?.hasta) {
    items = items.filter((item) => item.fecha <= filtros.hasta!);
  }

  return items.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
}

export async function obtenerResumenTesoreria(orgId: string): Promise<ResumenTesoreria> {
  const [cuentas, cajas, movimientos] = await Promise.all([
    obtenerCuentasBancarias(orgId),
    obtenerCajasChicas(orgId),
    obtenerMovimientos(orgId),
  ]);

  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const movimientosMes = movimientos.filter((item) => item.fecha >= inicioMes);

  return {
    totalBancos: cuentas.reduce((acc, item) => acc + item.saldo, 0),
    totalCajas: cajas.reduce((acc, item) => acc + item.saldo, 0),
    totalGeneral:
      cuentas.reduce((acc, item) => acc + item.saldo, 0) + cajas.reduce((acc, item) => acc + item.saldo, 0),
    ingresosMes: movimientosMes
      .filter((item) => item.tipo === 'ingreso')
      .reduce((acc, item) => acc + item.monto, 0),
    egresosMes: movimientosMes
      .filter((item) => item.tipo === 'egreso')
      .reduce((acc, item) => acc + item.monto, 0),
  };
}

export async function obtenerCuentaTesoreriaNombre(
  orgId: string,
  tipo: TipoCuenta,
  id: string
): Promise<string | undefined> {
  const snapshot = await getDoc(docPathByTipo(orgId, tipo, id));
  if (!snapshot.exists()) return undefined;
  const data = snapshot.data();
  return tipo === 'banco' ? String(data.banco ?? data.numeroCuenta ?? '') : String(data.nombre ?? '');
}
