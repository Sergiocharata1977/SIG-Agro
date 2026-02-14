/**
 * Motor Contable - Plan de Cuentas Agropecuario
 * 
 * Template de cuentas específicas para el sector agropecuario.
 */

import { CreateCuentaData } from '../core/types';

export const PLAN_CUENTAS_AGRO: CreateCuentaData[] = [
    // ============================================
    // 1. ACTIVO
    // ============================================

    // 1.1 Activo Corriente - Disponibilidades
    { codigo: '1', nombre: 'ACTIVO', tipo: 'activo', naturaleza: 'deudor', nivel: 1, admiteMovimientos: false },
    { codigo: '1.1', nombre: 'Activo Corriente', tipo: 'activo', naturaleza: 'deudor', nivel: 2, cuentaPadreId: '1', admiteMovimientos: false },
    { codigo: '1.1.1', nombre: 'Caja', tipo: 'activo', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '1.1', admiteMovimientos: true },
    { codigo: '1.1.2', nombre: 'Bancos', tipo: 'activo', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '1.1', admiteMovimientos: true },
    { codigo: '1.1.3', nombre: 'Clientes', tipo: 'activo', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '1.1', admiteMovimientos: true },

    // 1.2 Activo Corriente - Créditos
    { codigo: '1.2', nombre: 'Créditos', tipo: 'activo', naturaleza: 'deudor', nivel: 2, cuentaPadreId: '1', admiteMovimientos: false },
    { codigo: '1.2.1', nombre: 'Anticipos a Proveedores', tipo: 'activo', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '1.2', admiteMovimientos: true },
    { codigo: '1.2.2', nombre: 'Créditos Fiscales (IVA)', tipo: 'activo', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '1.2', admiteMovimientos: true },

    // 1.3 Bienes de Cambio - Insumos
    { codigo: '1.3', nombre: 'Insumos', tipo: 'activo', naturaleza: 'deudor', nivel: 2, cuentaPadreId: '1', admiteMovimientos: false },
    { codigo: '1.3.1', nombre: 'Semillas', tipo: 'activo', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '1.3', admiteMovimientos: true },
    { codigo: '1.3.2', nombre: 'Fertilizantes', tipo: 'activo', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '1.3', admiteMovimientos: true },
    { codigo: '1.3.3', nombre: 'Agroquímicos', tipo: 'activo', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '1.3', admiteMovimientos: true },
    { codigo: '1.3.4', nombre: 'Combustibles y Lubricantes', tipo: 'activo', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '1.3', admiteMovimientos: true },

    // 1.4 Bienes de Cambio - Producción en Proceso
    { codigo: '1.4', nombre: 'Producción en Proceso', tipo: 'activo', naturaleza: 'deudor', nivel: 2, cuentaPadreId: '1', admiteMovimientos: false },
    { codigo: '1.4.1', nombre: 'Cultivos en Preparación', tipo: 'activo', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '1.4', admiteMovimientos: true },
    { codigo: '1.4.2', nombre: 'Cultivos en Desarrollo', tipo: 'activo', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '1.4', admiteMovimientos: true },

    // 1.5 Bienes de Cambio - Producción Terminada
    { codigo: '1.5', nombre: 'Producción Terminada', tipo: 'activo', naturaleza: 'deudor', nivel: 2, cuentaPadreId: '1', admiteMovimientos: false },
    { codigo: '1.5.1', nombre: 'Stock de Granos', tipo: 'activo', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '1.5', admiteMovimientos: true },
    { codigo: '1.5.2', nombre: 'Granos en Terceros (Acopio)', tipo: 'activo', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '1.5', admiteMovimientos: true },

    // 1.6 Activo No Corriente - Bienes de Uso
    { codigo: '1.6', nombre: 'Bienes de Uso', tipo: 'activo', naturaleza: 'deudor', nivel: 2, cuentaPadreId: '1', admiteMovimientos: false },
    { codigo: '1.6.1', nombre: 'Maquinaria Agrícola', tipo: 'activo', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '1.6', admiteMovimientos: true },
    { codigo: '1.6.2', nombre: 'Vehículos', tipo: 'activo', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '1.6', admiteMovimientos: true },
    { codigo: '1.6.3', nombre: 'Instalaciones', tipo: 'activo', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '1.6', admiteMovimientos: true },
    { codigo: '1.6.4', nombre: 'Campos', tipo: 'activo', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '1.6', admiteMovimientos: true },

    // ============================================
    // 2. PASIVO
    // ============================================

    { codigo: '2', nombre: 'PASIVO', tipo: 'pasivo', naturaleza: 'acreedor', nivel: 1, admiteMovimientos: false },
    { codigo: '2.1', nombre: 'Pasivo Corriente', tipo: 'pasivo', naturaleza: 'acreedor', nivel: 2, cuentaPadreId: '2', admiteMovimientos: false },
    { codigo: '2.1.1', nombre: 'Proveedores', tipo: 'pasivo', naturaleza: 'acreedor', nivel: 3, cuentaPadreId: '2.1', admiteMovimientos: true },
    { codigo: '2.1.2', nombre: 'Acreedores Varios', tipo: 'pasivo', naturaleza: 'acreedor', nivel: 3, cuentaPadreId: '2.1', admiteMovimientos: true },
    { codigo: '2.1.3', nombre: 'Sueldos a Pagar', tipo: 'pasivo', naturaleza: 'acreedor', nivel: 3, cuentaPadreId: '2.1', admiteMovimientos: true },
    { codigo: '2.1.4', nombre: 'Cargas Sociales a Pagar', tipo: 'pasivo', naturaleza: 'acreedor', nivel: 3, cuentaPadreId: '2.1', admiteMovimientos: true },
    { codigo: '2.1.5', nombre: 'Débitos Fiscales (IVA)', tipo: 'pasivo', naturaleza: 'acreedor', nivel: 3, cuentaPadreId: '2.1', admiteMovimientos: true },

    { codigo: '2.2', nombre: 'Pasivo No Corriente', tipo: 'pasivo', naturaleza: 'acreedor', nivel: 2, cuentaPadreId: '2', admiteMovimientos: false },
    { codigo: '2.2.1', nombre: 'Préstamos Bancarios', tipo: 'pasivo', naturaleza: 'acreedor', nivel: 3, cuentaPadreId: '2.2', admiteMovimientos: true },

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
    { codigo: '4.1', nombre: 'Ventas', tipo: 'ingreso', naturaleza: 'acreedor', nivel: 2, cuentaPadreId: '4', admiteMovimientos: false },
    { codigo: '4.1.1', nombre: 'Ventas de Granos', tipo: 'ingreso', naturaleza: 'acreedor', nivel: 3, cuentaPadreId: '4.1', admiteMovimientos: true },
    { codigo: '4.1.2', nombre: 'Ventas de Hacienda', tipo: 'ingreso', naturaleza: 'acreedor', nivel: 3, cuentaPadreId: '4.1', admiteMovimientos: true },
    { codigo: '4.1.3', nombre: 'Servicios de Maquinaria', tipo: 'ingreso', naturaleza: 'acreedor', nivel: 3, cuentaPadreId: '4.1', admiteMovimientos: true },

    { codigo: '4.2', nombre: 'Otros Ingresos', tipo: 'ingreso', naturaleza: 'acreedor', nivel: 2, cuentaPadreId: '4', admiteMovimientos: false },
    { codigo: '4.2.1', nombre: 'Intereses Ganados', tipo: 'ingreso', naturaleza: 'acreedor', nivel: 3, cuentaPadreId: '4.2', admiteMovimientos: true },
    { codigo: '4.2.2', nombre: 'Arrendamientos Cobrados', tipo: 'ingreso', naturaleza: 'acreedor', nivel: 3, cuentaPadreId: '4.2', admiteMovimientos: true },

    // ============================================
    // 5. EGRESOS / COSTOS
    // ============================================

    { codigo: '5', nombre: 'EGRESOS', tipo: 'gasto', naturaleza: 'deudor', nivel: 1, admiteMovimientos: false },

    // 5.1 Costo de Producción
    { codigo: '5.1', nombre: 'Costo de Producción', tipo: 'gasto', naturaleza: 'deudor', nivel: 2, cuentaPadreId: '5', admiteMovimientos: false },
    { codigo: '5.1.1', nombre: 'Costo de Labores', tipo: 'gasto', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '5.1', admiteMovimientos: true },
    { codigo: '5.1.2', nombre: 'Costo de Siembra', tipo: 'gasto', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '5.1', admiteMovimientos: true },
    { codigo: '5.1.3', nombre: 'Costo de Cosecha', tipo: 'gasto', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '5.1', admiteMovimientos: true },
    { codigo: '5.1.4', nombre: 'Fletes y Acarreos', tipo: 'gasto', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '5.1', admiteMovimientos: true },

    // 5.2 Gastos de Comercialización
    { codigo: '5.2', nombre: 'Gastos de Comercialización', tipo: 'gasto', naturaleza: 'deudor', nivel: 2, cuentaPadreId: '5', admiteMovimientos: false },
    { codigo: '5.2.1', nombre: 'Comisiones de Venta', tipo: 'gasto', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '5.2', admiteMovimientos: true },
    { codigo: '5.2.2', nombre: 'Gastos de Acopio', tipo: 'gasto', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '5.2', admiteMovimientos: true },

    // 5.3 Gastos de Administración
    { codigo: '5.3', nombre: 'Gastos de Administración', tipo: 'gasto', naturaleza: 'deudor', nivel: 2, cuentaPadreId: '5', admiteMovimientos: false },
    { codigo: '5.3.1', nombre: 'Sueldos y Jornales', tipo: 'gasto', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '5.3', admiteMovimientos: true },
    { codigo: '5.3.2', nombre: 'Cargas Sociales', tipo: 'gasto', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '5.3', admiteMovimientos: true },
    { codigo: '5.3.3', nombre: 'Honorarios Profesionales', tipo: 'gasto', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '5.3', admiteMovimientos: true },
    { codigo: '5.3.4', nombre: 'Impuestos y Tasas', tipo: 'gasto', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '5.3', admiteMovimientos: true },
    { codigo: '5.3.5', nombre: 'Seguros', tipo: 'gasto', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '5.3', admiteMovimientos: true },
    { codigo: '5.3.6', nombre: 'Gastos Varios', tipo: 'gasto', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '5.3', admiteMovimientos: true },

    // 5.4 Gastos Financieros
    { codigo: '5.4', nombre: 'Gastos Financieros', tipo: 'gasto', naturaleza: 'deudor', nivel: 2, cuentaPadreId: '5', admiteMovimientos: false },
    { codigo: '5.4.1', nombre: 'Intereses Pagados', tipo: 'gasto', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '5.4', admiteMovimientos: true },
    { codigo: '5.4.2', nombre: 'Gastos Bancarios', tipo: 'gasto', naturaleza: 'deudor', nivel: 3, cuentaPadreId: '5.4', admiteMovimientos: true },
];

// Mapeo de tipo de insumo a cuenta
export const CUENTA_POR_INSUMO_AGRO: Record<string, string> = {
    semilla: '1.3.1',
    fertilizante: '1.3.2',
    agroquimico: '1.3.3',
    combustible: '1.3.4',
    otro: '1.3.1',
};

// Mapeo de medio de pago a cuenta
export const CUENTA_POR_MEDIO_PAGO_AGRO: Record<string, string> = {
    efectivo: '1.1.1',
    transferencia: '1.1.2',
    cheque: '1.1.2',
};
