/**
 * Motor Contable - Paquete Principal
 * 
 * Sistema de contabilidad de doble partida para empresas.
 * Soporta múltiples monedas (ARS/USD) y planes de cuentas por industria.
 * 
 * @example
 * ```typescript
 * import { 
 *   createAsientosService, 
 *   createCuentasService,
 *   PLAN_CUENTAS_AGRO 
 * } from '@/lib/motor-contable';
 * 
 * // Inicializar servicios
 * const asientos = createAsientosService(db);
 * const cuentas = createCuentasService(db);
 * 
 * // Inicializar plan de cuentas
 * await cuentas.inicializarDesdeTemplate(orgId, PLAN_CUENTAS_AGRO);
 * 
 * // Crear asiento
 * const asiento = await asientos.crear(orgId, {
 *   fecha: new Date(),
 *   descripcion: 'Compra de semillas',
 *   moneda: 'ARS',
 *   lineas: [
 *     { cuentaId: '1.3.1', cuentaCodigo: '1.3.1', cuentaNombre: 'Semillas', debe: 10000, haber: 0 },
 *     { cuentaId: '2.1.1', cuentaCodigo: '2.1.1', cuentaNombre: 'Proveedores', debe: 0, haber: 10000 },
 *   ],
 * });
 * ```
 * 
 * @module motor-contable
 */

// Core
export * from './core';

// Templates
export * from './templates';
