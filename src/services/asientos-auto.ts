/**
 * Servicio de Asientos Automáticos
 * Genera asientos contables desde operaciones estándar
 * El usuario NO interactúa con este servicio directamente
 */

import {
    collection,
    addDoc,
    Timestamp,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import {
    TipoOperacion,
    AsientoAutomatico,
    LineaAsientoAuto,
    PLAN_CUENTAS_AGRO,
    DatosCompraInsumo,
    DatosAplicacionInsumo,
    DatosCosecha,
    DatosEntregaAcopiador,
    DatosVenta,
    DatosCobro,
    DatosPago,
    TipoInsumo,
    MedioPago,
} from '@/types/contabilidad-simple';
import { registrarMovimientoTercero } from './terceros';

const getAsientosPath = (orgId: string) => `organizations/${orgId}/asientos_auto`;

// ============================================
// MAPEO DE CUENTAS POR TIPO DE INSUMO
// ============================================

const CUENTA_POR_INSUMO: Record<TipoInsumo, string> = {
    semilla: '1.3.1',       // Semillas
    fertilizante: '1.3.2',  // Fertilizantes
    agroquimico: '1.3.3',   // Agroquímicos
    combustible: '1.3.4',   // Combustibles
    otro: '1.3.1',          // Default a Semillas
};

const CUENTA_POR_MEDIO_PAGO: Record<MedioPago, string> = {
    efectivo: '1.1.1',      // Caja
    transferencia: '1.1.2', // Bancos
    cheque: '1.1.2',        // Bancos
};

// ============================================
// FUNCIÓN PRINCIPAL: GENERAR ASIENTO AUTOMÁTICO
// ============================================

/**
 * Genera un asiento contable automático según el tipo de operación
 * Esta función es llamada internamente por los formularios de operaciones
 */
export async function generarAsientoAutomatico(
    orgId: string,
    tipoOperacion: TipoOperacion,
    datos: DatosCompraInsumo | DatosAplicacionInsumo | DatosCosecha | DatosEntregaAcopiador | DatosVenta | DatosCobro | DatosPago,
    operacionId: string
): Promise<string> {
    let lineas: LineaAsientoAuto[] = [];
    let descripcion = '';
    let terceroId: string | undefined;
    let terceroNombre: string | undefined;
    let campoId: string | undefined;
    let loteId: string | undefined;
    let fecha: Date;

    // Según el tipo de operación, generar las líneas correspondientes
    switch (tipoOperacion) {
        case 'compra_insumo': {
            const d = datos as DatosCompraInsumo;
            const monto = d.cantidad * d.precioUnitario;
            const cuentaInsumo = CUENTA_POR_INSUMO[d.tipoInsumo];

            lineas = [
                {
                    cuentaId: cuentaInsumo,
                    cuentaNombre: obtenerNombreCuenta(cuentaInsumo),
                    debe: monto,
                    haber: 0,
                },
                {
                    cuentaId: '2.1.1', // Proveedores
                    cuentaNombre: 'Proveedores',
                    debe: 0,
                    haber: monto,
                },
            ];
            descripcion = `Compra ${d.productoNombre} - ${d.cantidad} unidades`;
            terceroId = d.terceroId;
            fecha = d.fecha;

            // Registrar movimiento en tercero (aumenta saldoProveedor)
            await registrarMovimientoTercero(orgId, {
                terceroId: d.terceroId,
                fecha: d.fecha,
                tipoOperacion: 'compra_insumo',
                descripcion,
                montoCliente: 0,
                montoProveedor: monto, // Les debemos más
                asientoId: operacionId,
            });
            break;
        }

        case 'aplicacion_insumo': {
            const d = datos as DatosAplicacionInsumo;
            const monto = d.cantidad * d.valorUnitario;
            const cuentaInsumo = CUENTA_POR_INSUMO[d.tipoInsumo];

            lineas = [
                {
                    cuentaId: '1.4.1', // Cultivos en preparación
                    cuentaNombre: 'Cultivos en preparación',
                    debe: monto,
                    haber: 0,
                },
                {
                    cuentaId: cuentaInsumo,
                    cuentaNombre: obtenerNombreCuenta(cuentaInsumo),
                    debe: 0,
                    haber: monto,
                },
            ];
            descripcion = `Aplicación ${d.productoNombre} - ${d.cantidad} unidades`;
            campoId = d.campoId;
            loteId = d.loteId;
            fecha = d.fecha;
            break;
        }

        case 'cosecha': {
            const d = datos as DatosCosecha;
            // El monto de cosecha se calcula al costo acumulado del cultivo
            // Por ahora usamos un valor estimado (esto se podría mejorar)
            const monto = d.cantidad * (d.unidad === 'tn' ? 1000 : 1); // Placeholder

            lineas = [
                {
                    cuentaId: '1.5.1', // Stock de granos
                    cuentaNombre: 'Stock de granos',
                    debe: monto,
                    haber: 0,
                },
                {
                    cuentaId: '1.4.1', // Cultivos en preparación
                    cuentaNombre: 'Cultivos en preparación',
                    debe: 0,
                    haber: monto,
                },
            ];
            descripcion = `Cosecha ${d.cultivo} - ${d.cantidad} ${d.unidad}`;
            campoId = d.campoId;
            loteId = d.loteId;
            fecha = d.fecha;
            break;
        }

        case 'entrega_acopiador': {
            const d = datos as DatosEntregaAcopiador;
            const cantidad = d.cantidad * (d.unidad === 'tn' ? 1000 : 1);

            if (d.esVenta && d.precioUnitario) {
                // Venta directa
                const monto = cantidad * d.precioUnitario;
                lineas = [
                    {
                        cuentaId: '1.1.3', // Clientes
                        cuentaNombre: 'Clientes',
                        debe: monto,
                        haber: 0,
                    },
                    {
                        cuentaId: '4.1.1', // Ventas de granos
                        cuentaNombre: 'Ventas de granos',
                        debe: 0,
                        haber: monto,
                    },
                ];
                descripcion = `Venta ${d.tipoGrano} - ${d.cantidad} ${d.unidad}`;

                // Registrar movimiento en tercero (aumenta saldoCliente)
                await registrarMovimientoTercero(orgId, {
                    terceroId: d.terceroId,
                    fecha: d.fecha,
                    tipoOperacion: 'venta',
                    descripcion,
                    montoCliente: monto, // Nos deben más
                    montoProveedor: 0,
                    asientoId: operacionId,
                });
            } else {
                // Consignación (granos en terceros)
                lineas = [
                    {
                        cuentaId: '1.5.2', // Granos en terceros
                        cuentaNombre: 'Granos en terceros',
                        debe: cantidad, // Usamos cantidad como valor
                        haber: 0,
                    },
                    {
                        cuentaId: '1.5.1', // Stock de granos
                        cuentaNombre: 'Stock de granos',
                        debe: 0,
                        haber: cantidad,
                    },
                ];
                descripcion = `Entrega ${d.tipoGrano} a acopiador - ${d.cantidad} ${d.unidad}`;
            }
            terceroId = d.terceroId;
            fecha = d.fecha;
            break;
        }

        case 'venta': {
            const d = datos as DatosVenta;
            lineas = [
                {
                    cuentaId: '1.1.3', // Clientes
                    cuentaNombre: 'Clientes',
                    debe: d.monto,
                    haber: 0,
                },
                {
                    cuentaId: '4.1.1', // Ventas de granos
                    cuentaNombre: 'Ventas de granos',
                    debe: 0,
                    haber: d.monto,
                },
            ];
            descripcion = d.descripcion;
            terceroId = d.terceroId;
            fecha = d.fecha;

            // Registrar movimiento en tercero
            await registrarMovimientoTercero(orgId, {
                terceroId: d.terceroId,
                fecha: d.fecha,
                tipoOperacion: 'venta',
                descripcion,
                montoCliente: d.monto,
                montoProveedor: 0,
                asientoId: operacionId,
            });
            break;
        }

        case 'cobro': {
            const d = datos as DatosCobro;
            const cuentaCaja = CUENTA_POR_MEDIO_PAGO[d.medioPago];

            lineas = [
                {
                    cuentaId: cuentaCaja,
                    cuentaNombre: obtenerNombreCuenta(cuentaCaja),
                    debe: d.monto,
                    haber: 0,
                },
                {
                    cuentaId: '1.1.3', // Clientes
                    cuentaNombre: 'Clientes',
                    debe: 0,
                    haber: d.monto,
                },
            ];
            descripcion = `Cobro de cliente - ${d.medioPago}`;
            terceroId = d.terceroId;
            fecha = d.fecha;

            // Registrar movimiento en tercero (reduce saldoCliente)
            await registrarMovimientoTercero(orgId, {
                terceroId: d.terceroId,
                fecha: d.fecha,
                tipoOperacion: 'cobro',
                descripcion,
                montoCliente: -d.monto, // Nos deben menos
                montoProveedor: 0,
                asientoId: operacionId,
            });
            break;
        }

        case 'pago': {
            const d = datos as DatosPago;
            const cuentaCaja = CUENTA_POR_MEDIO_PAGO[d.medioPago];

            lineas = [
                {
                    cuentaId: '2.1.1', // Proveedores
                    cuentaNombre: 'Proveedores',
                    debe: d.monto,
                    haber: 0,
                },
                {
                    cuentaId: cuentaCaja,
                    cuentaNombre: obtenerNombreCuenta(cuentaCaja),
                    debe: 0,
                    haber: d.monto,
                },
            ];
            descripcion = `Pago a proveedor - ${d.medioPago}`;
            terceroId = d.terceroId;
            fecha = d.fecha;

            // Registrar movimiento en tercero (reduce saldoProveedor)
            await registrarMovimientoTercero(orgId, {
                terceroId: d.terceroId,
                fecha: d.fecha,
                tipoOperacion: 'pago',
                descripcion,
                montoCliente: 0,
                montoProveedor: -d.monto, // Les debemos menos
                asientoId: operacionId,
            });
            break;
        }
    }

    // Validar doble partida
    const totalDebe = lineas.reduce((sum, l) => sum + l.debe, 0);
    const totalHaber = lineas.reduce((sum, l) => sum + l.haber, 0);

    if (Math.abs(totalDebe - totalHaber) > 0.01) {
        throw new Error(`Error de balance: Debe=${totalDebe}, Haber=${totalHaber}`);
    }

    // Guardar asiento
    const asientosRef = collection(db, getAsientosPath(orgId));

    const asientoData: Omit<AsientoAutomatico, 'id'> = {
        organizationId: orgId,
        tipoOperacion,
        operacionId,
        descripcion,
        fecha: fecha!,
        lineas,
        totalDebe,
        totalHaber,
        terceroId,
        terceroNombre,
        campoId,
        loteId,
        createdAt: new Date(),
    };

    const docRef = await addDoc(asientosRef, {
        ...asientoData,
        fecha: Timestamp.fromDate(fecha!),
        createdAt: Timestamp.now(),
    });

    return docRef.id;
}

// ============================================
// HELPERS
// ============================================

function obtenerNombreCuenta(cuentaId: string): string {
    const cuenta = PLAN_CUENTAS_AGRO.find(c => c.id === cuentaId);
    return cuenta?.nombre || 'Cuenta desconocida';
}
