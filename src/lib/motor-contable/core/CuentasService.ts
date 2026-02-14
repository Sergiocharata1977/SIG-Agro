/**
 * Motor Contable Core - Servicio de Cuentas
 * 
 * CRUD para el plan de cuentas contables.
 * 
 * @module motor-contable/core/CuentasService
 */

import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    writeBatch,
    query,
    where,
    orderBy,
    Timestamp,
    Firestore,
} from 'firebase/firestore';
import {
    Cuenta,
    CreateCuentaData,
    FiltrosCuenta,
} from './types';

// ============================================
// CONFIGURACIÓN
// ============================================

const getCuentasPath = (orgId: string) => `organizations/${orgId}/cuentas`;

// ============================================
// SERVICIO DE CUENTAS
// ============================================

export function createCuentasService(db: Firestore) {
    return {
        /**
         * Obtener todas las cuentas
         */
        async listar(orgId: string, filtros?: FiltrosCuenta): Promise<Cuenta[]> {
            const cuentasRef = collection(db, getCuentasPath(orgId));
            let q = query(cuentasRef, orderBy('codigo', 'asc'));

            // Filtrar solo activas por defecto
            if (filtros?.activa !== false) {
                q = query(cuentasRef, where('activa', '==', true), orderBy('codigo', 'asc'));
            }

            const snapshot = await getDocs(q);

            let cuentas = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
                updatedAt: doc.data().updatedAt?.toDate() || new Date(),
            })) as Cuenta[];

            // Filtros adicionales
            if (filtros?.tipo) {
                cuentas = cuentas.filter(c => c.tipo === filtros.tipo);
            }
            if (filtros?.nivel) {
                cuentas = cuentas.filter(c => c.nivel === filtros.nivel);
            }
            if (filtros?.admiteMovimientos !== undefined) {
                cuentas = cuentas.filter(c => c.admiteMovimientos === filtros.admiteMovimientos);
            }

            return cuentas;
        },

        /**
         * Obtener solo cuentas que admiten movimientos
         */
        async listarMovibles(orgId: string): Promise<Cuenta[]> {
            return this.listar(orgId, { admiteMovimientos: true, activa: true });
        },

        /**
         * Crear una cuenta
         */
        async crear(orgId: string, data: CreateCuentaData): Promise<Cuenta> {
            const cuentasRef = collection(db, getCuentasPath(orgId));
            const now = new Date();

            const cuentaData = {
                ...data,
                nivel: data.nivel || 1,
                admiteMovimientos: data.admiteMovimientos ?? true,
                activa: true,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            };

            const docRef = await addDoc(cuentasRef, cuentaData);

            return {
                id: docRef.id,
                ...cuentaData,
                createdAt: now,
                updatedAt: now,
            } as Cuenta;
        },

        /**
         * Actualizar una cuenta
         */
        async actualizar(
            orgId: string,
            cuentaId: string,
            data: Partial<Cuenta>
        ): Promise<void> {
            const docRef = doc(db, getCuentasPath(orgId), cuentaId);
            await updateDoc(docRef, {
                ...data,
                updatedAt: Timestamp.now(),
            });
        },

        /**
         * Desactivar una cuenta (soft delete)
         */
        async desactivar(orgId: string, cuentaId: string): Promise<void> {
            const docRef = doc(db, getCuentasPath(orgId), cuentaId);
            await updateDoc(docRef, {
                activa: false,
                updatedAt: Timestamp.now(),
            });
        },

        /**
         * Inicializar plan de cuentas desde template
         */
        async inicializarDesdeTemplate(
            orgId: string,
            template: CreateCuentaData[]
        ): Promise<void> {
            const batch = writeBatch(db);

            for (const cuenta of template) {
                const docRef = doc(db, getCuentasPath(orgId), cuenta.codigo);
                batch.set(docRef, {
                    ...cuenta,
                    id: cuenta.codigo,
                    activa: true,
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                });
            }

            await batch.commit();
        },

        /**
         * Verificar si ya tiene plan de cuentas
         */
        async tieneplanDeCuentas(orgId: string): Promise<boolean> {
            const cuentasRef = collection(db, getCuentasPath(orgId));
            const snapshot = await getDocs(query(cuentasRef));
            return !snapshot.empty;
        },

        /**
         * Buscar cuenta por código
         */
        async buscarPorCodigo(orgId: string, codigo: string): Promise<Cuenta | null> {
            const cuentas = await this.listar(orgId);
            return cuentas.find(c => c.codigo === codigo) || null;
        },
    };
}
