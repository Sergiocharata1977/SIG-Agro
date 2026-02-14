/**
 * Motor Contable Core - Servicio de Asientos
 * 
 * Maneja la creación, validación y consulta de asientos contables.
 * Implementa el principio de partida doble con soporte multi-moneda.
 * 
 * @module motor-contable/core/AsientosService
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
    limit,
    Timestamp,
    runTransaction,
    Firestore,
} from 'firebase/firestore';
import {
    Asiento,
    CreateAsientoData,
    LineaAsiento,
    FiltrosAsiento,
    ValidationResult,
    Moneda,
} from './types';

// ============================================
// CONFIGURACIÓN
// ============================================

const getAsientosPath = (orgId: string) => `organizations/${orgId}/asientos`;

// ============================================
// VALIDACIÓN
// ============================================

/**
 * Valida que un asiento cumpla con la partida doble
 */
export function validarAsiento(lineas: LineaAsiento[]): ValidationResult {
    // Validar que haya al menos 2 líneas
    if (lineas.length < 2) {
        return { valid: false, error: 'El asiento debe tener al menos 2 líneas' };
    }

    // Validar que todas las líneas tengan la misma moneda
    const monedas = new Set(lineas.map(l => l.moneda));
    if (monedas.size > 1) {
        return { valid: false, error: 'Todas las líneas deben tener la misma moneda' };
    }

    // Calcular totales
    const totalDebe = lineas.reduce((sum, l) => sum + l.debe, 0);
    const totalHaber = lineas.reduce((sum, l) => sum + l.haber, 0);

    // Validar balance (tolerancia de 0.01 para errores de redondeo)
    if (Math.abs(totalDebe - totalHaber) > 0.01) {
        return {
            valid: false,
            error: `El asiento no balancea. Debe: ${totalDebe.toFixed(2)}, Haber: ${totalHaber.toFixed(2)}`,
        };
    }

    // Validar que cada línea tenga debe O haber, no ambos
    for (const linea of lineas) {
        if (linea.debe > 0 && linea.haber > 0) {
            return {
                valid: false,
                error: `La cuenta ${linea.cuentaNombre} tiene valores en Debe y Haber simultáneamente`,
            };
        }
        if (linea.debe === 0 && linea.haber === 0) {
            return {
                valid: false,
                error: `La cuenta ${linea.cuentaNombre} no tiene valores`,
            };
        }
    }

    return { valid: true };
}

// ============================================
// SERVICIO DE ASIENTOS
// ============================================

export function createAsientosService(db: Firestore) {
    return {
        /**
         * Obtener el siguiente número de asiento
         */
        async getNextNumber(orgId: string): Promise<number> {
            const asientosRef = collection(db, getAsientosPath(orgId));
            const q = query(asientosRef, orderBy('numero', 'desc'), limit(1));
            const snapshot = await getDocs(q);

            if (snapshot.empty) return 1;
            return (snapshot.docs[0].data().numero || 0) + 1;
        },

        /**
         * Crear un nuevo asiento contable
         */
        async crear(
            orgId: string,
            data: CreateAsientoData,
            createdBy?: string
        ): Promise<Asiento> {
            // Preparar líneas con moneda por defecto
            const moneda: Moneda = data.moneda || 'ARS';
            const lineasConMoneda: LineaAsiento[] = data.lineas.map(l => ({
                ...l,
                moneda,
            }));

            // Validar
            const validacion = validarAsiento(lineasConMoneda);
            if (!validacion.valid) {
                throw new Error(validacion.error);
            }

            // Calcular totales
            const totalDebe = lineasConMoneda.reduce((sum, l) => sum + l.debe, 0);
            const totalHaber = lineasConMoneda.reduce((sum, l) => sum + l.haber, 0);

            // Obtener siguiente número
            const numero = await this.getNextNumber(orgId);
            const now = new Date();

            // Guardar
            const asientosRef = collection(db, getAsientosPath(orgId));
            const asientoData = {
                organizationId: orgId,
                numero,
                fecha: Timestamp.fromDate(data.fecha),
                descripcion: data.descripcion,
                lineas: lineasConMoneda,
                totalDebe,
                totalHaber,
                moneda,
                estado: 'borrador' as const,
                moduloOrigen: data.moduloOrigen || 'manual',
                tipoOperacion: data.tipoOperacion,
                operacionId: data.operacionId,
                terceroId: data.terceroId,
                terceroNombre: data.terceroNombre,
                campoId: data.campoId,
                loteId: data.loteId,
                createdAt: Timestamp.now(),
                createdBy,
            };

            const docRef = await addDoc(asientosRef, asientoData);

            return {
                id: docRef.id,
                ...asientoData,
                fecha: data.fecha,
                createdAt: now,
            } as Asiento;
        },

        /**
         * Obtener asientos con filtros
         */
        async listar(orgId: string, filtros?: FiltrosAsiento): Promise<Asiento[]> {
            const asientosRef = collection(db, getAsientosPath(orgId));
            let q = query(asientosRef, orderBy('numero', 'desc'));

            // Aplicar filtros
            if (filtros?.estado) {
                q = query(asientosRef, where('estado', '==', filtros.estado), orderBy('numero', 'desc'));
            }

            if (filtros?.moduloOrigen) {
                q = query(asientosRef, where('moduloOrigen', '==', filtros.moduloOrigen), orderBy('numero', 'desc'));
            }

            const snapshot = await getDocs(q);

            let asientos = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    fecha: data.fecha?.toDate() || new Date(),
                    createdAt: data.createdAt?.toDate() || new Date(),
                    contabilizadoAt: data.contabilizadoAt?.toDate(),
                    anuladoAt: data.anuladoAt?.toDate(),
                } as Asiento;
            });

            // Filtros adicionales en memoria
            if (filtros?.desde) {
                asientos = asientos.filter(a => a.fecha >= filtros.desde!);
            }
            if (filtros?.hasta) {
                asientos = asientos.filter(a => a.fecha <= filtros.hasta!);
            }
            if (filtros?.terceroId) {
                asientos = asientos.filter(a => a.terceroId === filtros.terceroId);
            }
            if (filtros?.moneda) {
                asientos = asientos.filter(a => a.moneda === filtros.moneda);
            }

            return asientos;
        },

        /**
         * Contabilizar un asiento (cambiar estado a 'contabilizado')
         */
        async contabilizar(
            orgId: string,
            asientoId: string,
            userId?: string
        ): Promise<void> {
            const docRef = doc(db, getAsientosPath(orgId), asientoId);
            await updateDoc(docRef, {
                estado: 'contabilizado',
                contabilizadoAt: Timestamp.now(),
                contabilizadoBy: userId,
            });
        },

        /**
         * Anular un asiento
         */
        async anular(
            orgId: string,
            asientoId: string,
            userId?: string
        ): Promise<void> {
            const docRef = doc(db, getAsientosPath(orgId), asientoId);
            await updateDoc(docRef, {
                estado: 'anulado',
                anuladoAt: Timestamp.now(),
                anuladoBy: userId,
            });
        },

        /**
         * Obtener saldo de una cuenta
         */
        async getSaldoCuenta(
            orgId: string,
            cuentaId: string,
            soloContabilizados = true
        ): Promise<number> {
            const asientos = await this.listar(orgId, {
                estado: soloContabilizados ? 'contabilizado' : undefined,
            });

            let saldo = 0;
            for (const asiento of asientos) {
                for (const linea of asiento.lineas) {
                    if (linea.cuentaId === cuentaId || linea.cuentaCodigo === cuentaId) {
                        saldo += linea.debe - linea.haber;
                    }
                }
            }

            return saldo;
        },
    };
}

// ============================================
// HELPER: Generar líneas desde operación
// ============================================

export interface OperacionContable {
    cuentaDebito: { id: string; codigo: string; nombre: string };
    cuentaCredito: { id: string; codigo: string; nombre: string };
    monto: number;
    moneda: Moneda;
    descripcion?: string;
}

export function generarLineasSimple(op: OperacionContable): LineaAsiento[] {
    return [
        {
            cuentaId: op.cuentaDebito.id,
            cuentaCodigo: op.cuentaDebito.codigo,
            cuentaNombre: op.cuentaDebito.nombre,
            debe: op.monto,
            haber: 0,
            moneda: op.moneda,
            descripcion: op.descripcion,
        },
        {
            cuentaId: op.cuentaCredito.id,
            cuentaCodigo: op.cuentaCredito.codigo,
            cuentaNombre: op.cuentaCredito.nombre,
            debe: 0,
            haber: op.monto,
            moneda: op.moneda,
            descripcion: op.descripcion,
        },
    ];
}
