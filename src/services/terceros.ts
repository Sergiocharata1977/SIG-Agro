/**
 * Servicio de Terceros (Clientes/Proveedores Unificados)
 * CRUD + cálculo de saldos
 */

import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    Timestamp,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Tercero, TipoTercero, MovimientoTercero } from '@/types/contabilidad-simple';

const getCollectionPath = (orgId: string) => `organizations/${orgId}/terceros`;
const getMovimientosPath = (orgId: string) => `organizations/${orgId}/movimientos_terceros`;

// ============================================
// CRUD TERCEROS
// ============================================

/**
 * Obtener todos los terceros
 */
export async function obtenerTerceros(
    orgId: string,
    filtroTipo?: TipoTercero
): Promise<Tercero[]> {
    const tercerosRef = collection(db, getCollectionPath(orgId));

    let q = query(tercerosRef, where('activo', '==', true), orderBy('nombre'));

    if (filtroTipo && filtroTipo !== 'ambos') {
        // Si filtro por cliente, incluir 'cliente' y 'ambos'
        // Si filtro por proveedor, incluir 'proveedor' y 'ambos'
        q = query(
            tercerosRef,
            where('activo', '==', true),
            where('tipo', 'in', [filtroTipo, 'ambos']),
            orderBy('nombre')
        );
    }

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Tercero[];
}

/**
 * Obtener tercero por ID
 */
export async function obtenerTercero(orgId: string, terceroId: string): Promise<Tercero | null> {
    const docRef = doc(db, getCollectionPath(orgId), terceroId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
    } as Tercero;
}

/**
 * Crear tercero
 */
export async function crearTercero(
    orgId: string,
    data: Omit<Tercero, 'id' | 'organizationId' | 'saldoCliente' | 'saldoProveedor' | 'createdAt' | 'updatedAt'>
): Promise<Tercero> {
    const tercerosRef = collection(db, getCollectionPath(orgId));

    const terceroData = {
        ...data,
        organizationId: orgId,
        saldoCliente: 0,
        saldoProveedor: 0,
        activo: data.activo ?? true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(tercerosRef, terceroData);

    return {
        id: docRef.id,
        ...data,
        organizationId: orgId,
        saldoCliente: 0,
        saldoProveedor: 0,
        activo: data.activo ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}

/**
 * Actualizar tercero
 */
export async function actualizarTercero(
    orgId: string,
    terceroId: string,
    data: Partial<Omit<Tercero, 'id' | 'organizationId' | 'createdAt'>>
): Promise<void> {
    const docRef = doc(db, getCollectionPath(orgId), terceroId);

    await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
    });
}

/**
 * Desactivar tercero (soft delete)
 */
export async function desactivarTercero(orgId: string, terceroId: string): Promise<void> {
    await actualizarTercero(orgId, terceroId, { activo: false });
}

// ============================================
// SALDOS Y MOVIMIENTOS
// ============================================

/**
 * Actualizar saldo de tercero después de una operación
 */
export async function actualizarSaldoTercero(
    orgId: string,
    terceroId: string,
    deltaCliente: number,
    deltaProveedor: number
): Promise<void> {
    const tercero = await obtenerTercero(orgId, terceroId);
    if (!tercero) throw new Error('Tercero no encontrado');

    await actualizarTercero(orgId, terceroId, {
        saldoCliente: tercero.saldoCliente + deltaCliente,
        saldoProveedor: tercero.saldoProveedor + deltaProveedor,
    });
}

/**
 * Obtener movimientos de un tercero
 */
export async function obtenerMovimientosTercero(
    orgId: string,
    terceroId: string
): Promise<MovimientoTercero[]> {
    const movRef = collection(db, getMovimientosPath(orgId));
    const q = query(
        movRef,
        where('terceroId', '==', terceroId),
        orderBy('fecha', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        fecha: doc.data().fecha?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as MovimientoTercero[];
}

/**
 * Registrar movimiento de tercero
 */
export async function registrarMovimientoTercero(
    orgId: string,
    movimiento: Omit<MovimientoTercero, 'id' | 'organizationId' | 'createdAt'>
): Promise<string> {
    const movRef = collection(db, getMovimientosPath(orgId));

    const movData = {
        ...movimiento,
        organizationId: orgId,
        fecha: Timestamp.fromDate(movimiento.fecha),
        createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(movRef, movData);

    // Actualizar saldo del tercero
    await actualizarSaldoTercero(
        orgId,
        movimiento.terceroId,
        movimiento.montoCliente,
        movimiento.montoProveedor
    );

    return docRef.id;
}

// ============================================
// CONSULTAS ÚTILES
// ============================================

/**
 * Obtener clientes con saldo pendiente (nos deben)
 */
export async function obtenerClientesConSaldo(orgId: string): Promise<Tercero[]> {
    const terceros = await obtenerTerceros(orgId, 'cliente');
    return terceros.filter(t => t.saldoCliente > 0);
}

/**
 * Obtener proveedores con saldo pendiente (les debemos)
 */
export async function obtenerProveedoresConSaldo(orgId: string): Promise<Tercero[]> {
    const terceros = await obtenerTerceros(orgId, 'proveedor');
    return terceros.filter(t => t.saldoProveedor > 0);
}

/**
 * Calcular totales de saldos
 */
export async function calcularTotalesSaldos(orgId: string): Promise<{
    totalCuentasCobrar: number;
    totalCuentasPagar: number;
}> {
    const terceros = await obtenerTerceros(orgId);

    return {
        totalCuentasCobrar: terceros.reduce((sum, t) => sum + Math.max(0, t.saldoCliente), 0),
        totalCuentasPagar: terceros.reduce((sum, t) => sum + Math.max(0, t.saldoProveedor), 0),
    };
}
