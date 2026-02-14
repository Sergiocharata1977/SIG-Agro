/**
 * Motor Contable Core - Servicio de Terceros
 * 
 * Gestión de clientes y proveedores con saldos.
 * 
 * @module motor-contable/core/TercerosService
 */

import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    Timestamp,
    Firestore,
} from 'firebase/firestore';
import {
    Tercero,
    TipoTercero,
    MovimientoTercero,
    Moneda,
} from './types';

// ============================================
// CONFIGURACIÓN
// ============================================

const getTercerosPath = (orgId: string) => `organizations/${orgId}/terceros`;
const getMovimientosPath = (orgId: string) => `organizations/${orgId}/movimientos_terceros`;

// ============================================
// INTERFAZ DE CREACIÓN
// ============================================

export interface CreateTerceroData {
    nombre: string;
    tipo: TipoTercero;
    cuit?: string;
    direccion?: string;
    telefono?: string;
    email?: string;
    monedaSaldo?: Moneda;
}

export interface RegistrarMovimientoData {
    terceroId: string;
    fecha: Date;
    tipoOperacion: string;
    descripcion: string;
    montoCliente: number;
    montoProveedor: number;
    asientoId?: string;
    moneda?: Moneda;
}

// ============================================
// SERVICIO DE TERCEROS
// ============================================

export function createTercerosService(db: Firestore) {
    return {
        /**
         * Listar terceros
         */
        async listar(orgId: string, tipo?: TipoTercero): Promise<Tercero[]> {
            const tercerosRef = collection(db, getTercerosPath(orgId));
            let q = query(tercerosRef, where('activo', '==', true), orderBy('nombre', 'asc'));

            if (tipo && tipo !== 'ambos') {
                q = query(
                    tercerosRef,
                    where('activo', '==', true),
                    where('tipo', 'in', [tipo, 'ambos']),
                    orderBy('nombre', 'asc')
                );
            }

            const snapshot = await getDocs(q);

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
                updatedAt: doc.data().updatedAt?.toDate() || new Date(),
            })) as Tercero[];
        },

        /**
         * Obtener un tercero por ID
         */
        async getById(orgId: string, terceroId: string): Promise<Tercero | null> {
            const docRef = doc(db, getTercerosPath(orgId), terceroId);
            const snapshot = await getDoc(docRef);

            if (!snapshot.exists()) return null;

            const data = snapshot.data();
            return {
                id: snapshot.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
            } as Tercero;
        },

        /**
         * Crear tercero
         */
        async crear(orgId: string, data: CreateTerceroData): Promise<Tercero> {
            const tercerosRef = collection(db, getTercerosPath(orgId));
            const now = new Date();

            const terceroData = {
                organizationId: orgId,
                nombre: data.nombre,
                tipo: data.tipo,
                cuit: data.cuit,
                direccion: data.direccion,
                telefono: data.telefono,
                email: data.email,
                saldoCliente: 0,
                saldoProveedor: 0,
                monedaSaldo: data.monedaSaldo || 'ARS',
                activo: true,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            };

            const docRef = await addDoc(tercerosRef, terceroData);

            return {
                id: docRef.id,
                ...terceroData,
                createdAt: now,
                updatedAt: now,
            } as Tercero;
        },

        /**
         * Registrar movimiento y actualizar saldo
         */
        async registrarMovimiento(
            orgId: string,
            data: RegistrarMovimientoData
        ): Promise<string> {
            const movimientosRef = collection(db, getMovimientosPath(orgId));
            const moneda = data.moneda || 'ARS';

            // Guardar movimiento
            const movimientoData = {
                terceroId: data.terceroId,
                fecha: Timestamp.fromDate(data.fecha),
                tipoOperacion: data.tipoOperacion,
                descripcion: data.descripcion,
                montoCliente: data.montoCliente,
                montoProveedor: data.montoProveedor,
                asientoId: data.asientoId,
                moneda,
                createdAt: Timestamp.now(),
            };

            const docRef = await addDoc(movimientosRef, movimientoData);

            // Actualizar saldo del tercero
            const tercero = await this.getById(orgId, data.terceroId);
            if (tercero) {
                const terceroRef = doc(db, getTercerosPath(orgId), data.terceroId);
                await updateDoc(terceroRef, {
                    saldoCliente: tercero.saldoCliente + data.montoCliente,
                    saldoProveedor: tercero.saldoProveedor + data.montoProveedor,
                    updatedAt: Timestamp.now(),
                });
            }

            return docRef.id;
        },

        /**
         * Obtener movimientos de un tercero
         */
        async getMovimientos(orgId: string, terceroId: string): Promise<MovimientoTercero[]> {
            const movimientosRef = collection(db, getMovimientosPath(orgId));
            const q = query(
                movimientosRef,
                where('terceroId', '==', terceroId),
                orderBy('fecha', 'desc')
            );

            const snapshot = await getDocs(q);

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                fecha: doc.data().fecha?.toDate() || new Date(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
            })) as MovimientoTercero[];
        },

        /**
         * Actualizar tercero
         */
        async actualizar(
            orgId: string,
            terceroId: string,
            data: Partial<Tercero>
        ): Promise<void> {
            const docRef = doc(db, getTercerosPath(orgId), terceroId);
            await updateDoc(docRef, {
                ...data,
                updatedAt: Timestamp.now(),
            });
        },
    };
}
