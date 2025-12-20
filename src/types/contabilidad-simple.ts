/**
 * Tipos para Sistema Contable Agro Simplificado
 * - Terceros unificados (cliente/proveedor/ambos)
 * - Asientos automáticos desde operaciones
 * - Plan de cuentas simplificado
 */

// ============================================
// TERCEROS (CLIENTES + PROVEEDORES UNIFICADOS)
// ============================================

export type TipoTercero = 'cliente' | 'proveedor' | 'ambos';

export interface Tercero {
    id: string;
    organizationId: string;

    // Datos básicos
    nombre: string;
    cuit?: string;
    direccion?: string;
    localidad?: string;
    provincia?: string;
    telefono?: string;
    email?: string;

    // Clasificación
    tipo: TipoTercero;

    // Saldos (calculados desde movimientos)
    saldoCliente: number;    // Lo que nos debe (+ = a favor nuestro)
    saldoProveedor: number;  // Lo que le debemos (+ = a favor de él)

    // Metadata
    activo: boolean;
    notas?: string;
    createdAt: Date;
    updatedAt: Date;
}

// ============================================
// PLAN DE CUENTAS SIMPLIFICADO
// ============================================

export type TipoCuentaSimple = 'activo' | 'pasivo' | 'patrimonio' | 'ingreso' | 'gasto';

export interface CuentaSimple {
    id: string;
    codigo: string;
    nombre: string;
    tipo: TipoCuentaSimple;
    activa: boolean;
}

// Plan de cuentas predefinido para agro
export const PLAN_CUENTAS_AGRO: CuentaSimple[] = [
    // ACTIVO
    { id: '1.1.1', codigo: '1.1.1', nombre: 'Caja', tipo: 'activo', activa: true },
    { id: '1.1.2', codigo: '1.1.2', nombre: 'Bancos', tipo: 'activo', activa: true },
    { id: '1.1.3', codigo: '1.1.3', nombre: 'Clientes', tipo: 'activo', activa: true },
    { id: '1.3.1', codigo: '1.3.1', nombre: 'Semillas', tipo: 'activo', activa: true },
    { id: '1.3.2', codigo: '1.3.2', nombre: 'Fertilizantes', tipo: 'activo', activa: true },
    { id: '1.3.3', codigo: '1.3.3', nombre: 'Agroquímicos', tipo: 'activo', activa: true },
    { id: '1.3.4', codigo: '1.3.4', nombre: 'Combustibles', tipo: 'activo', activa: true },
    { id: '1.4.1', codigo: '1.4.1', nombre: 'Cultivos en preparación', tipo: 'activo', activa: true },
    { id: '1.5.1', codigo: '1.5.1', nombre: 'Stock de granos', tipo: 'activo', activa: true },
    { id: '1.5.2', codigo: '1.5.2', nombre: 'Granos en terceros', tipo: 'activo', activa: true },

    // PASIVO
    { id: '2.1.1', codigo: '2.1.1', nombre: 'Proveedores', tipo: 'pasivo', activa: true },

    // INGRESOS
    { id: '4.1.1', codigo: '4.1.1', nombre: 'Ventas de granos', tipo: 'ingreso', activa: true },
    { id: '4.1.2', codigo: '4.1.2', nombre: 'Servicios agrícolas', tipo: 'ingreso', activa: true },

    // GASTOS
    { id: '5.1.1', codigo: '5.1.1', nombre: 'Compras de insumos', tipo: 'gasto', activa: true },
    { id: '5.1.2', codigo: '5.1.2', nombre: 'Servicios contratados', tipo: 'gasto', activa: true },
    { id: '5.1.3', codigo: '5.1.3', nombre: 'Combustible', tipo: 'gasto', activa: true },
];

// ============================================
// TIPOS DE OPERACIONES
// ============================================

export type TipoOperacion =
    | 'compra_insumo'        // Compra de insumos a proveedor
    | 'aplicacion_insumo'    // Aplicación de insumo a lote
    | 'cosecha'              // Registro de cosecha
    | 'entrega_acopiador'    // Entrega a acopiador sin venta
    | 'venta'                // Venta de granos
    | 'cobro'                // Cobro a cliente
    | 'pago';                // Pago a proveedor

export type TipoInsumo = 'semilla' | 'fertilizante' | 'agroquimico' | 'combustible' | 'otro';
export type MedioPago = 'efectivo' | 'transferencia' | 'cheque';

// ============================================
// ASIENTOS AUTOMÁTICOS
// ============================================

export interface LineaAsientoAuto {
    cuentaId: string;
    cuentaNombre: string;
    debe: number;
    haber: number;
}

export interface AsientoAutomatico {
    id: string;
    organizationId: string;

    // Origen
    tipoOperacion: TipoOperacion;
    operacionId: string;      // ID de la operación que lo generó
    descripcion: string;

    // Contabilidad
    fecha: Date;
    lineas: LineaAsientoAuto[];
    totalDebe: number;
    totalHaber: number;

    // Relaciones opcionales
    terceroId?: string;
    terceroNombre?: string;
    campoId?: string;
    loteId?: string;
    campaniaId?: string;

    // Metadata
    createdAt: Date;
}

// ============================================
// MOVIMIENTOS DE TERCEROS
// ============================================

export interface MovimientoTercero {
    id: string;
    organizationId: string;
    terceroId: string;

    fecha: Date;
    tipoOperacion: TipoOperacion;
    descripcion: string;

    // Montos (solo uno tiene valor según el tipo)
    montoCliente: number;     // + cuando nos debe, - cuando paga
    montoProveedor: number;   // + cuando le debemos, - cuando pagamos

    // Referencia al asiento
    asientoId: string;

    createdAt: Date;
}

// ============================================
// DATOS PARA FORMULARIOS DE OPERACIONES
// ============================================

export interface DatosCompraInsumo {
    terceroId: string;
    tipoInsumo: TipoInsumo;
    productoNombre: string;
    cantidad: number;
    precioUnitario: number;
    depositoId?: string;
    fecha: Date;
    observaciones?: string;
}

export interface DatosAplicacionInsumo {
    campoId: string;
    loteId: string;
    campaniaId?: string;
    tipoInsumo: TipoInsumo;
    productoNombre: string;
    cantidad: number;
    valorUnitario: number;
    fecha: Date;
    observaciones?: string;
}

export interface DatosCosecha {
    campoId: string;
    loteId: string;
    campaniaId?: string;
    cultivo: string;
    cantidad: number;        // kg o tn
    unidad: 'kg' | 'tn';
    siloDestinoId?: string;
    fecha: Date;
    observaciones?: string;
}

export interface DatosEntregaAcopiador {
    terceroId: string;       // Acopiador
    tipoGrano: string;
    cantidad: number;
    unidad: 'kg' | 'tn';
    siloOrigenId?: string;
    esVenta: boolean;        // false = consignación, true = venta directa
    precioUnitario?: number; // Solo si esVenta = true
    fecha: Date;
    cartaPorte?: string;
    observaciones?: string;
}

export interface DatosVenta {
    terceroId: string;
    descripcion: string;
    monto: number;
    fecha: Date;
    observaciones?: string;
}

export interface DatosCobro {
    terceroId: string;
    monto: number;
    medioPago: MedioPago;
    fecha: Date;
    observaciones?: string;
}

export interface DatosPago {
    terceroId: string;
    monto: number;
    medioPago: MedioPago;
    fecha: Date;
    observaciones?: string;
}
