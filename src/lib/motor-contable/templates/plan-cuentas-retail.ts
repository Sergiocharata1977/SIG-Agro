/**
 * Motor Contable - Plan de Cuentas Retail
 * 
 * Template de cuentas específicas para comercios minoristas.
 */

import { CreateCuentaData } from '../core/types';

export const PLAN_CUENTAS_RETAIL: CreateCuentaData[] = [
    // ============================================
    // 1. ACTIVO
    // ============================================

    { codigo: '1', nombre: 'ACTIVO', tipo: 'activo', naturaleza: 'deudor', nivel: 1, admiteMovimientos: false },

    // 1.1 Activo Corriente - Disponibilidades
    { codigo: '1.1', nombre: 'Disponibilidades', tipo: 'activo', naturaleza: 'deudor', nivel: 2, cuentaPadreId: '1', admiteMovimientos: false },
    { codigo: '1.1.1', nombre: 'Caja', tipo: 'activo', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '1.1', admiteMovimientos: true },
    { codigo: '1.1.2', nombre: 'Bancos', tipo: 'activo', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '1.1', admiteMovimientos: true },
    { codigo: '1.1.3', nombre: 'Caja en USD', tipo: 'activo', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '1.1', admiteMovimientos: true, moneda: 'USD' },

    // 1.2 Créditos
    { codigo: '1.2', nombre: 'Créditos', tipo: 'activo', naturaleza: 'deudor', nivel: 2, cuentaPadreId: '1', admiteMovimientos: false },
    { codigo: '1.2.1', nombre: 'Clientes', tipo: 'activo', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '1.2', admiteMovimientos: true },
    { codigo: '1.2.2', nombre: 'Tarjetas a Cobrar', tipo: 'activo', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '1.2', admiteMovimientos: true },
    { codigo: '1.2.3', nombre: 'Cheques a Cobrar', tipo: 'activo', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '1.2', admiteMovimientos: true },
    { codigo: '1.2.4', nombre: 'Anticipos a Proveedores', tipo: 'activo', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '1.2', admiteMovimientos: true },

    // 1.3 Bienes de Cambio
    { codigo: '1.3', nombre: 'Bienes de Cambio', tipo: 'activo', naturaleza: 'deudor', nivel: 2, cuentaPadreId: '1', admiteMovimientos: false },
    { codigo: '1.3.1', nombre: 'Mercaderías', tipo: 'activo', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '1.3', admiteMovimientos: true },
    { codigo: '1.3.2', nombre: 'Electrodomésticos', tipo: 'activo', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '1.3', admiteMovimientos: true },
    { codigo: '1.3.3', nombre: 'Tecnología', tipo: 'activo', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '1.3', admiteMovimientos: true },
    { codigo: '1.3.4', nombre: 'Muebles', tipo: 'activo', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '1.3', admiteMovimientos: true },

    // 1.4 Bienes de Uso
    { codigo: '1.4', nombre: 'Bienes de Uso', tipo: 'activo', naturaleza: 'deudor', nivel: 2, cuentaPadreId: '1', admiteMovimientos: false },
    { codigo: '1.4.1', nombre: 'Instalaciones', tipo: 'activo', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '1.4', admiteMovimientos: true },
    { codigo: '1.4.2', nombre: 'Muebles y Útiles', tipo: 'activo', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '1.4', admiteMovimientos: true },
    { codigo: '1.4.3', nombre: 'Equipos de Computación', tipo: 'activo', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '1.4', admiteMovimientos: true },
    { codigo: '1.4.4', nombre: 'Vehículos', tipo: 'activo', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '1.4', admiteMovimientos: true },

    // ============================================
    // 2. PASIVO
    // ============================================

    { codigo: '2', nombre: 'PASIVO', tipo: 'pasivo', naturaleza: 'acreedor', nivel: 1, admiteMovimientos: false },

    // 2.1 Pasivo Corriente
    { codigo: '2.1', nombre: 'Pasivo Corriente', tipo: 'pasivo', naturaleza: 'acreedor', nivel: 2, cuentaPadreId: '2', admiteMovimientos: false },
    { codigo: '2.1.1', nombre: 'Proveedores', tipo: 'pasivo', naturaleza: 'acreedor', nivel: 3, cuentaPadreId: '2.1', admiteMovimientos: true },
    { codigo: '2.1.2', nombre: 'Sueldos a Pagar', tipo: 'pasivo', naturaleza: 'acreedor', nivel: 3, cuentaPadreId: '2.1', admiteMovimientos: true },
    { codigo: '2.1.3', nombre: 'Cargas Sociales a Pagar', tipo: 'pasivo', naturaleza: 'acreedor', nivel: 3, cuentaPadreId: '2.1', admiteMovimientos: true },
    { codigo: '2.1.4', nombre: 'IVA Débito Fiscal', tipo: 'pasivo', naturaleza: 'acreedor', nivel: 3, cuentaPadreId: '2.1', admiteMovimientos: true },
    { codigo: '2.1.5', nombre: 'Anticipos de Clientes', tipo: 'pasivo', naturaleza: 'acreedor', nivel: 3, cuentaPadreId: '2.1', admiteMovimientos: true },

    // 2.2 Pasivo No Corriente
    { codigo: '2.2', nombre: 'Pasivo No Corriente', tipo: 'pasivo', naturaleza: 'acreedor', nivel: 2, cuentaPadreId: '2', admiteMovimientos: false },
    { codigo: '2.2.1', nombre: 'Préstamos Bancarios', tipo: 'pasivo', naturaleza: 'acreedor', nivel: 3, cuentaPadreId: '2.2', admiteMovimientos: true },
    { codigo: '2.2.2', nombre: 'Préstamos Personales', tipo: 'pasivo', naturaleza: 'acreedor', nivel: 3, cuentaPadreId: '2.2', admiteMovimientos: true },

    // ============================================
    // 3. PATRIMONIO NETO
    // ============================================

    { codigo: '3', nombre: 'PATRIMONIO NETO', tipo: 'patrimonio', naturaleza: 'acreedor', nivel: 1, admiteMovimientos: false },
    { codigo: '3.1', nombre: 'Capital', tipo: 'patrimonio', naturaleza: 'acreedor', nivel: 2, cuentaPadreId: '3', admiteMovimientos: true },
    { codigo: '3.2', nombre: 'Resultados Acumulados', tipo: 'patrimonio', naturaleza: 'acreedor', nivel: 2, cuentaPadreId: '3', admiteMovimientos: true },
    { codigo: '3.3', nombre: 'Resultado del Ejercicio', tipo: 'patrimonio', naturaleza: 'acreedor', nivel: 2, cuentaPadreId: '3', admiteMovimientos: true },

    // ============================================
    // 4. INGRESOS
    // ============================================

    { codigo: '4', nombre: 'INGRESOS', tipo: 'ingreso', naturaleza: 'acreedor', nivel: 1, admiteMovimientos: false },

    // 4.1 Ventas
    { codigo: '4.1', nombre: 'Ventas', tipo: 'ingreso', naturaleza: 'acreedor', nivel: 2, cuentaPadreId: '4', admiteMovimientos: false },
    { codigo: '4.1.1', nombre: 'Ventas de Productos', tipo: 'ingreso', naturaleza: 'acreedor', nivel: 3, cuentaPadreId: '4.1', admiteMovimientos: true },
    { codigo: '4.1.2', nombre: 'Ventas con Tarjeta', tipo: 'ingreso', naturaleza: 'acreedor', nivel: 3, cuentaPadreId: '4.1', admiteMovimientos: true },
    { codigo: '4.1.3', nombre: 'Servicios de Reparación', tipo: 'ingreso', naturaleza: 'acreedor', nivel: 3, cuentaPadreId: '4.1', admiteMovimientos: true },

    // 4.2 Otros Ingresos
    { codigo: '4.2', nombre: 'Otros Ingresos', tipo: 'ingreso', naturaleza: 'acreedor', nivel: 2, cuentaPadreId: '4', admiteMovimientos: false },
    { codigo: '4.2.1', nombre: 'Intereses Cobrados', tipo: 'ingreso', naturaleza: 'acreedor', nivel: 3, cuentaPadreId: '4.2', admiteMovimientos: true },
    { codigo: '4.2.2', nombre: 'Descuentos Obtenidos', tipo: 'ingreso', naturaleza: 'acreedor', nivel: 3, cuentaPadreId: '4.2', admiteMovimientos: true },
    { codigo: '4.2.3', nombre: 'Diferencia de Cambio Ganada', tipo: 'ingreso', naturaleza: 'acreedor', nivel: 3, cuentaPadreId: '4.2', admiteMovimientos: true },

    // ============================================
    // 5. EGRESOS
    // ============================================

    { codigo: '5', nombre: 'EGRESOS', tipo: 'gasto', naturaleza: 'deudor', nivel: 1, admiteMovimientos: false },

    // 5.1 Costo de Ventas
    { codigo: '5.1', nombre: 'Costo de Ventas', tipo: 'gasto', naturaleza: 'deudor', nivel: 2, cuentaPadreId: '5', admiteMovimientos: false },
    { codigo: '5.1.1', nombre: 'Costo Mercaderías Vendidas', tipo: 'gasto', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '5.1', admiteMovimientos: true },
    { codigo: '5.1.2', nombre: 'Compras de Mercaderías', tipo: 'gasto', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '5.1', admiteMovimientos: true },

    // 5.2 Gastos de Comercialización
    { codigo: '5.2', nombre: 'Gastos de Comercialización', tipo: 'gasto', naturaleza: 'deudor', nivel: 2, cuentaPadreId: '5', admiteMovimientos: false },
    { codigo: '5.2.1', nombre: 'Comisiones de Venta', tipo: 'gasto', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '5.2', admiteMovimientos: true },
    { codigo: '5.2.2', nombre: 'Publicidad y Marketing', tipo: 'gasto', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '5.2', admiteMovimientos: true },
    { codigo: '5.2.3', nombre: 'Fletes de Entrega', tipo: 'gasto', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '5.2', admiteMovimientos: true },

    // 5.3 Gastos de Administración
    { codigo: '5.3', nombre: 'Gastos de Administración', tipo: 'gasto', naturaleza: 'deudor', nivel: 2, cuentaPadreId: '5', admiteMovimientos: false },
    { codigo: '5.3.1', nombre: 'Sueldos y Jornales', tipo: 'gasto', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '5.3', admiteMovimientos: true },
    { codigo: '5.3.2', nombre: 'Cargas Sociales', tipo: 'gasto', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '5.3', admiteMovimientos: true },
    { codigo: '5.3.3', nombre: 'Alquileres', tipo: 'gasto', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '5.3', admiteMovimientos: true },
    { codigo: '5.3.4', nombre: 'Servicios (Luz, Gas, Tel)', tipo: 'gasto', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '5.3', admiteMovimientos: true },
    { codigo: '5.3.5', nombre: 'Seguros', tipo: 'gasto', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '5.3', admiteMovimientos: true },
    { codigo: '5.3.6', nombre: 'Impuestos y Tasas', tipo: 'gasto', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '5.3', admiteMovimientos: true },
    { codigo: '5.3.7', nombre: 'Gastos Varios', tipo: 'gasto', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '5.3', admiteMovimientos: true },

    // 5.4 Gastos Financieros
    { codigo: '5.4', nombre: 'Gastos Financieros', tipo: 'gasto', naturaleza: 'deudor', nivel: 2, cuentaPadreId: '5', admiteMovimientos: false },
    { codigo: '5.4.1', nombre: 'Intereses Pagados', tipo: 'gasto', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '5.4', admiteMovimientos: true },
    { codigo: '5.4.2', nombre: 'Comisiones Bancarias', tipo: 'gasto', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '5.4', admiteMovimientos: true },
    { codigo: '5.4.3', nombre: 'Comisiones Tarjetas', tipo: 'gasto', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '5.4', admiteMovimientos: true },
    { codigo: '5.4.4', nombre: 'Diferencia de Cambio Perdida', tipo: 'gasto', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '5.4', admiteMovimientos: true },
];

// Mapeo de categoría de ingreso a cuenta
export const CUENTA_POR_CATEGORIA_INGRESO_RETAIL: Record<string, string> = {
    venta_productos: '4.1.1',
    venta_tarjeta: '4.1.2',
    servicios: '4.1.3',
    intereses: '4.2.1',
    otros: '4.2.2',
};

// Mapeo de categoría de gasto a cuenta
export const CUENTA_POR_CATEGORIA_GASTO_RETAIL: Record<string, string> = {
    compras: '5.1.2',
    comisiones: '5.2.1',
    publicidad: '5.2.2',
    fletes: '5.2.3',
    sueldos: '5.3.1',
    alquileres: '5.3.3',
    servicios: '5.3.4',
    seguros: '5.3.5',
    impuestos: '5.3.6',
    otros: '5.3.7',
};

// Mapeo de medio de pago a cuenta
export const CUENTA_POR_MEDIO_PAGO_RETAIL: Record<string, string> = {
    efectivo: '1.1.1',
    transferencia: '1.1.2',
    cheque: '1.2.3',
    tarjeta: '1.2.2',
};
