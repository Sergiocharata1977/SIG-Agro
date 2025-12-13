/**
 * Servicio de Contabilidad
 * CRUD para plan de cuentas, asientos y mayor
 */

import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    Timestamp,
    writeBatch,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import {
    CuentaContable,
    AsientoContable,
    LineaAsiento,
    PLAN_CUENTAS_BASE
} from '@/types';

const PRODUCTORES = 'agro_productores';

// ============================================
// PLAN DE CUENTAS
// ============================================

/**
 * Obtener todas las cuentas
 */
export async function obtenerCuentas(productorId: string): Promise<CuentaContable[]> {
    const cuentasRef = collection(db, PRODUCTORES, productorId, 'cuentas');
    const q = query(cuentasRef, orderBy('codigo'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as CuentaContable[];
}

/**
 * Crear cuenta
 */
export async function crearCuenta(
    productorId: string,
    data: Omit<CuentaContable, 'id' | 'productorId' | 'createdAt' | 'updatedAt'>
): Promise<CuentaContable> {
    const cuentasRef = collection(db, PRODUCTORES, productorId, 'cuentas');

    const cuentaData = {
        ...data,
        productorId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(cuentasRef, cuentaData);

    return {
        id: docRef.id,
        ...data,
        productorId,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}

/**
 * Inicializar plan de cuentas base
 */
export async function inicializarPlanCuentas(productorId: string): Promise<void> {
    const batch = writeBatch(db);

    for (const cuenta of PLAN_CUENTAS_BASE) {
        const docRef = doc(db, PRODUCTORES, productorId, 'cuentas', cuenta.codigo);
        batch.set(docRef, {
            ...cuenta,
            id: cuenta.codigo,
            productorId,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
    }

    await batch.commit();
}

/**
 * Verificar si ya tiene plan de cuentas
 */
export async function tienePlanCuentas(productorId: string): Promise<boolean> {
    const cuentasRef = collection(db, PRODUCTORES, productorId, 'cuentas');
    const snapshot = await getDocs(query(cuentasRef));
    return !snapshot.empty;
}

// ============================================
// ASIENTOS CONTABLES
// ============================================

/**
 * Obtener último número de asiento
 */
async function obtenerUltimoNumeroAsiento(productorId: string): Promise<number> {
    const asientosRef = collection(db, PRODUCTORES, productorId, 'asientos');
    const q = query(asientosRef, orderBy('numero', 'desc'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return 0;
    return snapshot.docs[0].data().numero || 0;
}

/**
 * Validar asiento (debe = haber)
 */
function validarAsiento(lineas: LineaAsiento[]): { valido: boolean; error?: string } {
    const totalDebe = lineas.reduce((acc, l) => acc + l.debe, 0);
    const totalHaber = lineas.reduce((acc, l) => acc + l.haber, 0);

    if (Math.abs(totalDebe - totalHaber) > 0.01) {
        return {
            valido: false,
            error: `El asiento no balancea. Debe: ${totalDebe.toFixed(2)}, Haber: ${totalHaber.toFixed(2)}`,
        };
    }

    if (lineas.length < 2) {
        return { valido: false, error: 'El asiento debe tener al menos 2 líneas' };
    }

    return { valido: true };
}

/**
 * Crear asiento contable
 */
export async function crearAsiento(
    productorId: string,
    data: Omit<AsientoContable, 'id' | 'productorId' | 'numero' | 'totalDebe' | 'totalHaber' | 'createdAt'>
): Promise<AsientoContable> {
    // Validar
    const validacion = validarAsiento(data.lineas);
    if (!validacion.valido) {
        throw new Error(validacion.error);
    }

    const asientosRef = collection(db, PRODUCTORES, productorId, 'asientos');

    const numero = (await obtenerUltimoNumeroAsiento(productorId)) + 1;
    const totalDebe = data.lineas.reduce((acc, l) => acc + l.debe, 0);
    const totalHaber = data.lineas.reduce((acc, l) => acc + l.haber, 0);

    const asientoData = {
        ...data,
        productorId,
        numero,
        totalDebe,
        totalHaber,
        fecha: Timestamp.fromDate(data.fecha),
        estado: data.estado || 'borrador',
        createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(asientosRef, asientoData);

    return {
        id: docRef.id,
        ...data,
        productorId,
        numero,
        totalDebe,
        totalHaber,
        createdAt: new Date(),
    };
}

/**
 * Obtener asientos
 */
export async function obtenerAsientos(
    productorId: string,
    filtros?: { desde?: Date; hasta?: Date; estado?: string }
): Promise<AsientoContable[]> {
    const asientosRef = collection(db, PRODUCTORES, productorId, 'asientos');
    let q = query(asientosRef, orderBy('numero', 'desc'));

    if (filtros?.estado) {
        q = query(asientosRef, where('estado', '==', filtros.estado), orderBy('numero', 'desc'));
    }

    const snapshot = await getDocs(q);

    let asientos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        fecha: doc.data().fecha?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        contabilizadoAt: doc.data().contabilizadoAt?.toDate() || undefined,
    })) as AsientoContable[];

    // Filtrar por fecha si es necesario
    if (filtros?.desde) {
        asientos = asientos.filter(a => a.fecha >= filtros.desde!);
    }
    if (filtros?.hasta) {
        asientos = asientos.filter(a => a.fecha <= filtros.hasta!);
    }

    return asientos;
}

/**
 * Contabilizar asiento
 */
export async function contabilizarAsiento(
    productorId: string,
    asientoId: string,
    userId: string
): Promise<void> {
    const docRef = doc(db, PRODUCTORES, productorId, 'asientos', asientoId);

    await updateDoc(docRef, {
        estado: 'contabilizado',
        contabilizadoAt: Timestamp.now(),
        contabilizadoBy: userId,
    });
}

/**
 * Obtener saldo de una cuenta
 */
export async function obtenerSaldoCuenta(
    productorId: string,
    cuentaId: string
): Promise<number> {
    const asientos = await obtenerAsientos(productorId, { estado: 'contabilizado' });

    let saldo = 0;

    for (const asiento of asientos) {
        for (const linea of asiento.lineas) {
            if (linea.cuentaId === cuentaId || linea.cuentaCodigo === cuentaId) {
                saldo += linea.debe - linea.haber;
            }
        }
    }

    return saldo;
}

/**
 * Obtener balance de comprobación
 */
export async function obtenerBalanceComprobacion(
    productorId: string
): Promise<Array<{
    cuentaCodigo: string;
    cuentaNombre: string;
    debe: number;
    haber: number;
    saldo: number;
}>> {
    const cuentas = await obtenerCuentas(productorId);
    const asientos = await obtenerAsientos(productorId, { estado: 'contabilizado' });

    const saldos: Record<string, { nombre: string; debe: number; haber: number }> = {};

    // Inicializar cuentas que admiten movimientos
    for (const cuenta of cuentas.filter(c => c.admiteMovimientos)) {
        saldos[cuenta.codigo] = { nombre: cuenta.nombre, debe: 0, haber: 0 };
    }

    // Sumar movimientos
    for (const asiento of asientos) {
        for (const linea of asiento.lineas) {
            if (saldos[linea.cuentaCodigo]) {
                saldos[linea.cuentaCodigo].debe += linea.debe;
                saldos[linea.cuentaCodigo].haber += linea.haber;
            }
        }
    }

    // Convertir a array
    return Object.entries(saldos)
        .filter(([, v]) => v.debe !== 0 || v.haber !== 0)
        .map(([codigo, v]) => ({
            cuentaCodigo: codigo,
            cuentaNombre: v.nombre,
            debe: v.debe,
            haber: v.haber,
            saldo: v.debe - v.haber,
        }))
        .sort((a, b) => a.cuentaCodigo.localeCompare(b.cuentaCodigo));
}
