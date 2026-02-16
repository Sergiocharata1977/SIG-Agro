/**
 * Servicio de Asientos Automaticos
 * Genera asientos contables desde operaciones estandar y registra trazabilidad canonica.
 */

import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import {
  AsientoAutomatico,
  DatosAplicacionInsumo,
  DatosCobro,
  DatosCompraInsumo,
  DatosCosecha,
  DatosEntregaAcopiador,
  DatosPago,
  DatosVenta,
  LineaAsientoAuto,
  MedioPago,
  PLAN_CUENTAS_AGRO,
  TipoInsumo,
  TipoOperacion,
} from '@/types/contabilidad-simple';
import { registrarMovimientoTercero } from './terceros';
import {
  createOperationRecord,
  findOperationByRequestId,
  writeOperationAudit,
} from './operations-registry';

const getAsientosPath = (orgId: string) => `organizations/${orgId}/asientos_auto`;

const CUENTA_POR_INSUMO: Record<TipoInsumo, string> = {
  semilla: '1.3.1',
  fertilizante: '1.3.2',
  agroquimico: '1.3.3',
  combustible: '1.3.4',
  otro: '1.3.1',
};

const CUENTA_POR_MEDIO_PAGO: Record<MedioPago, string> = {
  efectivo: '1.1.1',
  transferencia: '1.1.2',
  cheque: '1.1.2',
};

export async function generarAsientoAutomatico(
  orgId: string,
  tipoOperacion: TipoOperacion,
  datos:
    | DatosCompraInsumo
    | DatosAplicacionInsumo
    | DatosCosecha
    | DatosEntregaAcopiador
    | DatosVenta
    | DatosCobro
    | DatosPago,
  operacionId: string,
  context?: {
    productorId?: string;
    userId?: string;
    requestId?: string;
  }
): Promise<string> {
  let lineas: LineaAsientoAuto[] = [];
  let descripcion = '';
  let terceroId: string | undefined;
  let campoId: string | undefined;
  let loteId: string | undefined;
  let fecha: Date;

  const productorId = context?.productorId || context?.userId || 'unknown';
  const actorId = context?.userId || 'system';
  const requestId = context?.requestId || `${tipoOperacion}_${operacionId}`;

  const existing = await findOperationByRequestId(orgId, requestId);
  if (existing?.journalEntryId) {
    return existing.journalEntryId;
  }

  switch (tipoOperacion) {
    case 'compra_insumo': {
      const d = datos as DatosCompraInsumo;
      const monto = d.cantidad * d.precioUnitario;
      const cuentaInsumo = CUENTA_POR_INSUMO[d.tipoInsumo];

      lineas = [
        { cuentaId: cuentaInsumo, cuentaNombre: obtenerNombreCuenta(cuentaInsumo), debe: monto, haber: 0 },
        { cuentaId: '2.1.1', cuentaNombre: 'Proveedores', debe: 0, haber: monto },
      ];
      descripcion = `Compra ${d.productoNombre} - ${d.cantidad} unidades`;
      terceroId = d.terceroId;
      campoId = d.campoId;
      loteId = d.loteId;
      fecha = d.fecha;

      await registrarMovimientoTercero(orgId, {
        productorId,
        terceroId: d.terceroId,
        fecha: d.fecha,
        tipoOperacion: 'compra_insumo',
        descripcion,
        montoCliente: 0,
        montoProveedor: monto,
        asientoId: operacionId,
      });
      break;
    }

    case 'aplicacion_insumo': {
      const d = datos as DatosAplicacionInsumo;
      const monto = d.cantidad * d.valorUnitario;
      const cuentaInsumo = CUENTA_POR_INSUMO[d.tipoInsumo];

      lineas = [
        { cuentaId: '1.4.1', cuentaNombre: 'Cultivos en preparacion', debe: monto, haber: 0 },
        { cuentaId: cuentaInsumo, cuentaNombre: obtenerNombreCuenta(cuentaInsumo), debe: 0, haber: monto },
      ];
      descripcion = `Aplicacion ${d.productoNombre} - ${d.cantidad} unidades`;
      campoId = d.campoId;
      loteId = d.loteId;
      fecha = d.fecha;
      break;
    }

    case 'cosecha': {
      const d = datos as DatosCosecha;
      const monto = d.cantidad * (d.unidad === 'tn' ? 1000 : 1);

      lineas = [
        { cuentaId: '1.5.1', cuentaNombre: 'Stock de granos', debe: monto, haber: 0 },
        { cuentaId: '1.4.1', cuentaNombre: 'Cultivos en preparacion', debe: 0, haber: monto },
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
      campoId = d.campoId;
      loteId = d.loteId;
      terceroId = d.terceroId;
      fecha = d.fecha;

      if (d.esVenta && d.precioUnitario) {
        const monto = cantidad * d.precioUnitario;
        lineas = [
          { cuentaId: '1.1.3', cuentaNombre: 'Clientes', debe: monto, haber: 0 },
          { cuentaId: '4.1.1', cuentaNombre: 'Ventas de granos', debe: 0, haber: monto },
        ];
        descripcion = `Venta ${d.tipoGrano} - ${d.cantidad} ${d.unidad}`;

        await registrarMovimientoTercero(orgId, {
          productorId,
          terceroId: d.terceroId,
          fecha: d.fecha,
          tipoOperacion: 'venta',
          descripcion,
          montoCliente: monto,
          montoProveedor: 0,
          asientoId: operacionId,
        });
      } else {
        lineas = [
          { cuentaId: '1.5.2', cuentaNombre: 'Granos en terceros', debe: cantidad, haber: 0 },
          { cuentaId: '1.5.1', cuentaNombre: 'Stock de granos', debe: 0, haber: cantidad },
        ];
        descripcion = `Entrega ${d.tipoGrano} a acopiador - ${d.cantidad} ${d.unidad}`;
      }
      break;
    }

    case 'venta': {
      const d = datos as DatosVenta;
      lineas = [
        { cuentaId: '1.1.3', cuentaNombre: 'Clientes', debe: d.monto, haber: 0 },
        { cuentaId: '4.1.1', cuentaNombre: 'Ventas de granos', debe: 0, haber: d.monto },
      ];
      descripcion = d.descripcion;
      terceroId = d.terceroId;
      fecha = d.fecha;

      await registrarMovimientoTercero(orgId, {
        productorId,
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
        { cuentaId: cuentaCaja, cuentaNombre: obtenerNombreCuenta(cuentaCaja), debe: d.monto, haber: 0 },
        { cuentaId: '1.1.3', cuentaNombre: 'Clientes', debe: 0, haber: d.monto },
      ];
      descripcion = `Cobro de cliente - ${d.medioPago}`;
      terceroId = d.terceroId;
      fecha = d.fecha;

      await registrarMovimientoTercero(orgId, {
        productorId,
        terceroId: d.terceroId,
        fecha: d.fecha,
        tipoOperacion: 'cobro',
        descripcion,
        montoCliente: -d.monto,
        montoProveedor: 0,
        asientoId: operacionId,
      });
      break;
    }

    case 'pago': {
      const d = datos as DatosPago;
      const cuentaCaja = CUENTA_POR_MEDIO_PAGO[d.medioPago];
      lineas = [
        { cuentaId: '2.1.1', cuentaNombre: 'Proveedores', debe: d.monto, haber: 0 },
        { cuentaId: cuentaCaja, cuentaNombre: obtenerNombreCuenta(cuentaCaja), debe: 0, haber: d.monto },
      ];
      descripcion = `Pago a proveedor - ${d.medioPago}`;
      terceroId = d.terceroId;
      fecha = d.fecha;

      await registrarMovimientoTercero(orgId, {
        productorId,
        terceroId: d.terceroId,
        fecha: d.fecha,
        tipoOperacion: 'pago',
        descripcion,
        montoCliente: 0,
        montoProveedor: -d.monto,
        asientoId: operacionId,
      });
      break;
    }
  }

  const totalDebe = lineas.reduce((sum, l) => sum + l.debe, 0);
  const totalHaber = lineas.reduce((sum, l) => sum + l.haber, 0);

  if (Math.abs(totalDebe - totalHaber) > 0.01) {
    throw new Error(`Error de balance: Debe=${totalDebe}, Haber=${totalHaber}`);
  }

  const asientosRef = collection(db, getAsientosPath(orgId));
  const asientoData: Omit<AsientoAutomatico, 'id'> = {
    productorId,
    organizationId: orgId,
    tipoOperacion,
    operacionId,
    descripcion,
    fecha: fecha!,
    lineas,
    totalDebe,
    totalHaber,
    terceroId,
    campoId,
    loteId,
    campaniaId: (datos as { campaniaId?: string }).campaniaId,
    createdAt: new Date(),
  };

  const docRef = await addDoc(asientosRef, {
    ...asientoData,
    fecha: Timestamp.fromDate(fecha!),
    createdAt: Timestamp.now(),
  });

  try {
    await createOperationRecord({
      productorId,
      organizationId: orgId,
      type: tipoOperacion,
      operationId: operacionId,
      requestId,
      descripcion,
      fecha: fecha!,
      amount: totalDebe,
      createdBy: actorId,
      thirdPartyId: terceroId,
      fieldId: campoId,
      plotId: loteId,
      campaignId: (datos as { campaniaId?: string }).campaniaId,
      warehouseOriginId: (datos as { siloOrigenId?: string }).siloOrigenId,
      warehouseDestinationId:
        (datos as { depositoId?: string; siloDestinoId?: string }).depositoId ||
        (datos as { siloDestinoId?: string }).siloDestinoId,
      journalEntryId: docRef.id,
      metadata: datos as unknown as Record<string, unknown>,
    });

    await writeOperationAudit({
      productorId,
      organizationId: orgId,
      operationId: operacionId,
      requestId,
      event: 'operation_posted',
      actorId,
      details: { tipoOperacion, journalEntryId: docRef.id },
    });
  } catch (error) {
    await writeOperationAudit({
      productorId,
      organizationId: orgId,
      operationId: operacionId,
      requestId,
      event: 'operation_failed',
      actorId,
      details: {
        tipoOperacion,
        error: error instanceof Error ? error.message : 'unknown',
      },
    });
  }

  return docRef.id;
}

function obtenerNombreCuenta(cuentaId: string): string {
  const cuenta = PLAN_CUENTAS_AGRO.find((c) => c.id === cuentaId);
  return cuenta?.nombre || 'Cuenta desconocida';
}

