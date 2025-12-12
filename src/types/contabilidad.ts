/**
 * Tipos para Sistema Contable de Doble Partida
 * Basado en prácticas contables argentinas
 */

// ============================================
// PLAN DE CUENTAS
// ============================================

export type TipoCuenta = 'activo' | 'pasivo' | 'patrimonio' | 'ingreso' | 'gasto';
export type NaturalezaCuenta = 'deudora' | 'acreedora';

export interface CuentaContable {
    id: string;
    productorId: string;

    // Identificación
    codigo: string;           // "1.1.01.001" - Jerárquico
    nombre: string;           // "Caja Chica"
    descripcion?: string;

    // Clasificación
    tipo: TipoCuenta;
    naturaleza: NaturalezaCuenta;
    nivel: number;            // 1=Grupo, 2=Subgrupo, 3=Cuenta, 4=Subcuenta
    cuentaPadreId?: string;

    // Control
    admiteMovimientos: boolean;
    esCuentaStock: boolean;
    esCuentaBancaria: boolean;

    // Moneda
    moneda: 'ARS' | 'USD' | 'ambas';

    activa: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// ============================================
// ASIENTOS CONTABLES
// ============================================

export type TipoAsiento = 'apertura' | 'operativo' | 'ajuste' | 'cierre' | 'automatico';
export type EstadoAsiento = 'borrador' | 'contabilizado' | 'anulado';

export interface AsientoContable {
    id: string;
    productorId: string;

    // Identificación
    numero: number;
    fecha: Date;
    tipo: TipoAsiento;

    // Descripción
    concepto: string;
    descripcion?: string;

    // Origen
    origenTipo?: 'compra' | 'venta' | 'produccion' | 'stock' | 'manual';
    origenId?: string;

    // Vinculación productiva
    campoId?: string;
    loteId?: string;
    campaniaId?: string;

    // Líneas del asiento
    lineas: LineaAsiento[];

    // Totales
    totalDebe: number;
    totalHaber: number;

    estado: EstadoAsiento;

    createdAt: Date;
    createdBy: string;
    contabilizadoAt?: Date;
    contabilizadoBy?: string;
}

export interface LineaAsiento {
    cuentaId: string;
    cuentaCodigo: string;
    cuentaNombre: string;

    debe: number;
    haber: number;

    // Moneda
    moneda: 'ARS' | 'USD';
    tipoCambio?: number;
    montoOriginal?: number;

    // Centro de costo
    centroCostoId?: string;

    descripcion?: string;
}

// ============================================
// LIBRO MAYOR
// ============================================

export interface MovimientoMayor {
    id: string;
    productorId: string;

    cuentaId: string;
    cuentaCodigo: string;

    // Período
    ejercicio: string;        // "2024"
    periodo: string;          // "2024-12"

    // Referencia
    asientoId: string;
    asientoNumero: number;
    fecha: Date;

    debe: number;
    haber: number;
    saldoAcumulado: number;

    concepto: string;
    centroCostoId?: string;
}

// ============================================
// EJERCICIO CONTABLE
// ============================================

export interface EjercicioContable {
    id: string;
    productorId: string;

    nombre: string;
    fechaInicio: Date;
    fechaCierre?: Date;

    estado: 'abierto' | 'cerrado';
    saldosIniciales?: Record<string, number>;

    createdAt: Date;
    updatedAt: Date;
}

// ============================================
// STOCK E INVENTARIOS
// ============================================

export type CategoriaStock = 'insumo' | 'grano' | 'combustible' | 'repuesto' | 'otro';
export type UnidadMedida = 'kg' | 'lt' | 'un' | 'tn' | 'ha' | 'bolsa' | 'dosis';

export interface ProductoStock {
    id: string;
    productorId: string;

    codigo: string;
    nombre: string;
    descripcion?: string;

    categoria: CategoriaStock;
    subcategoria?: string;
    unidadMedida: UnidadMedida;

    precioCompra?: number;
    precioVenta?: number;
    moneda: 'ARS' | 'USD';

    stockMinimo?: number;
    stockMaximo?: number;

    // Cuentas contables vinculadas
    cuentaStockId?: string;
    cuentaGastoId?: string;
    cuentaIngresoId?: string;

    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Almacen {
    id: string;
    productorId: string;

    nombre: string;
    tipo: 'galpon' | 'silobolsa' | 'silo' | 'deposito' | 'campo';

    campoId?: string;
    loteId?: string;
    ubicacionDescripcion?: string;

    capacidad?: number;

    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export type TipoMovimientoStock =
    | 'entrada_compra'
    | 'entrada_produccion'
    | 'entrada_ajuste'
    | 'salida_consumo'
    | 'salida_venta'
    | 'salida_ajuste'
    | 'transferencia';

export interface MovimientoStock {
    id: string;
    productorId: string;

    productoId: string;
    productoNombre: string;

    tipo: TipoMovimientoStock;

    almacenOrigenId?: string;
    almacenDestinoId?: string;

    cantidad: number;
    unidadMedida: UnidadMedida;

    precioUnitario: number;
    moneda: 'ARS' | 'USD';
    valorTotal: number;

    // Vinculación productiva
    campoId?: string;
    loteId?: string;
    campaniaId?: string;
    eventoId?: string;

    // Contabilidad
    asientoId?: string;

    documento?: string;
    proveedor?: string;
    cliente?: string;

    fecha: Date;
    observaciones?: string;

    createdAt: Date;
    createdBy: string;
}

export interface SaldoStock {
    id: string;
    productorId: string;
    productoId: string;
    almacenId: string;

    cantidad: number;
    valorizado: number;

    ultimoMovimiento: Date;
    updatedAt: Date;
}

// ============================================
// PLAN DE CUENTAS BASE AGROPECUARIO
// ============================================

export const PLAN_CUENTAS_BASE: Omit<CuentaContable, 'id' | 'productorId' | 'createdAt' | 'updatedAt'>[] = [
    // ACTIVO
    { codigo: '1', nombre: 'ACTIVO', tipo: 'activo', naturaleza: 'deudora', nivel: 1, admiteMovimientos: false, esCuentaStock: false, esCuentaBancaria: false, moneda: 'ambas', activa: true },
    { codigo: '1.1', nombre: 'Activo Corriente', tipo: 'activo', naturaleza: 'deudora', nivel: 2, cuentaPadreId: '1', admiteMovimientos: false, esCuentaStock: false, esCuentaBancaria: false, moneda: 'ambas', activa: true },
    { codigo: '1.1.01', nombre: 'Caja y Bancos', tipo: 'activo', naturaleza: 'deudora', nivel: 3, cuentaPadreId: '1.1', admiteMovimientos: false, esCuentaStock: false, esCuentaBancaria: false, moneda: 'ambas', activa: true },
    { codigo: '1.1.01.001', nombre: 'Caja', tipo: 'activo', naturaleza: 'deudora', nivel: 4, cuentaPadreId: '1.1.01', admiteMovimientos: true, esCuentaStock: false, esCuentaBancaria: false, moneda: 'ARS', activa: true },
    { codigo: '1.1.01.002', nombre: 'Banco Cuenta Corriente', tipo: 'activo', naturaleza: 'deudora', nivel: 4, cuentaPadreId: '1.1.01', admiteMovimientos: true, esCuentaStock: false, esCuentaBancaria: true, moneda: 'ARS', activa: true },
    { codigo: '1.1.02', nombre: 'Créditos', tipo: 'activo', naturaleza: 'deudora', nivel: 3, cuentaPadreId: '1.1', admiteMovimientos: false, esCuentaStock: false, esCuentaBancaria: false, moneda: 'ambas', activa: true },
    { codigo: '1.1.02.001', nombre: 'Deudores por Ventas', tipo: 'activo', naturaleza: 'deudora', nivel: 4, cuentaPadreId: '1.1.02', admiteMovimientos: true, esCuentaStock: false, esCuentaBancaria: false, moneda: 'ARS', activa: true },
    { codigo: '1.1.03', nombre: 'Bienes de Cambio', tipo: 'activo', naturaleza: 'deudora', nivel: 3, cuentaPadreId: '1.1', admiteMovimientos: false, esCuentaStock: false, esCuentaBancaria: false, moneda: 'ambas', activa: true },
    { codigo: '1.1.03.001', nombre: 'Stock Insumos', tipo: 'activo', naturaleza: 'deudora', nivel: 4, cuentaPadreId: '1.1.03', admiteMovimientos: true, esCuentaStock: true, esCuentaBancaria: false, moneda: 'ARS', activa: true },
    { codigo: '1.1.03.002', nombre: 'Stock Granos', tipo: 'activo', naturaleza: 'deudora', nivel: 4, cuentaPadreId: '1.1.03', admiteMovimientos: true, esCuentaStock: true, esCuentaBancaria: false, moneda: 'ARS', activa: true },

    // PASIVO
    { codigo: '2', nombre: 'PASIVO', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 1, admiteMovimientos: false, esCuentaStock: false, esCuentaBancaria: false, moneda: 'ambas', activa: true },
    { codigo: '2.1', nombre: 'Pasivo Corriente', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 2, cuentaPadreId: '2', admiteMovimientos: false, esCuentaStock: false, esCuentaBancaria: false, moneda: 'ambas', activa: true },
    { codigo: '2.1.01', nombre: 'Proveedores', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 3, cuentaPadreId: '2.1', admiteMovimientos: true, esCuentaStock: false, esCuentaBancaria: false, moneda: 'ARS', activa: true },

    // PATRIMONIO NETO
    { codigo: '3', nombre: 'PATRIMONIO NETO', tipo: 'patrimonio', naturaleza: 'acreedora', nivel: 1, admiteMovimientos: false, esCuentaStock: false, esCuentaBancaria: false, moneda: 'ambas', activa: true },
    { codigo: '3.1', nombre: 'Capital', tipo: 'patrimonio', naturaleza: 'acreedora', nivel: 2, cuentaPadreId: '3', admiteMovimientos: true, esCuentaStock: false, esCuentaBancaria: false, moneda: 'ARS', activa: true },
    { codigo: '3.2', nombre: 'Resultados Acumulados', tipo: 'patrimonio', naturaleza: 'acreedora', nivel: 2, cuentaPadreId: '3', admiteMovimientos: true, esCuentaStock: false, esCuentaBancaria: false, moneda: 'ARS', activa: true },

    // INGRESOS
    { codigo: '4', nombre: 'INGRESOS', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 1, admiteMovimientos: false, esCuentaStock: false, esCuentaBancaria: false, moneda: 'ambas', activa: true },
    { codigo: '4.1', nombre: 'Ventas', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 2, cuentaPadreId: '4', admiteMovimientos: false, esCuentaStock: false, esCuentaBancaria: false, moneda: 'ambas', activa: true },
    { codigo: '4.1.01', nombre: 'Venta de Granos', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 3, cuentaPadreId: '4.1', admiteMovimientos: true, esCuentaStock: false, esCuentaBancaria: false, moneda: 'ARS', activa: true },

    // GASTOS
    { codigo: '5', nombre: 'GASTOS', tipo: 'gasto', naturaleza: 'deudora', nivel: 1, admiteMovimientos: false, esCuentaStock: false, esCuentaBancaria: false, moneda: 'ambas', activa: true },
    { codigo: '5.1', nombre: 'Costos de Producción', tipo: 'gasto', naturaleza: 'deudora', nivel: 2, cuentaPadreId: '5', admiteMovimientos: false, esCuentaStock: false, esCuentaBancaria: false, moneda: 'ambas', activa: true },
    { codigo: '5.1.01', nombre: 'Semillas', tipo: 'gasto', naturaleza: 'deudora', nivel: 3, cuentaPadreId: '5.1', admiteMovimientos: true, esCuentaStock: false, esCuentaBancaria: false, moneda: 'ARS', activa: true },
    { codigo: '5.1.02', nombre: 'Fertilizantes', tipo: 'gasto', naturaleza: 'deudora', nivel: 3, cuentaPadreId: '5.1', admiteMovimientos: true, esCuentaStock: false, esCuentaBancaria: false, moneda: 'ARS', activa: true },
    { codigo: '5.1.03', nombre: 'Agroquímicos', tipo: 'gasto', naturaleza: 'deudora', nivel: 3, cuentaPadreId: '5.1', admiteMovimientos: true, esCuentaStock: false, esCuentaBancaria: false, moneda: 'ARS', activa: true },
    { codigo: '5.1.04', nombre: 'Labores', tipo: 'gasto', naturaleza: 'deudora', nivel: 3, cuentaPadreId: '5.1', admiteMovimientos: true, esCuentaStock: false, esCuentaBancaria: false, moneda: 'ARS', activa: true },
    { codigo: '5.1.05', nombre: 'Cosecha', tipo: 'gasto', naturaleza: 'deudora', nivel: 3, cuentaPadreId: '5.1', admiteMovimientos: true, esCuentaStock: false, esCuentaBancaria: false, moneda: 'ARS', activa: true },
];
