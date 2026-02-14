/**
 * Motor Contable Core - Tipos Base
 * 
 * Tipos compartidos para el sistema de contabilidad de doble partida.
 * Soporta multi-moneda (ARS/USD).
 * 
 * @module motor-contable/core/types
 */

// ============================================
// MONEDAS Y CONFIGURACIÓN
// ============================================

export type Moneda = 'ARS' | 'USD';

export interface ConfiguracionContable {
    monedaBase: Moneda;
    ejercicioFiscalInicio: number; // Mes (1-12)
    permitirAsientosSinBalancear: boolean;
    requiereAprobacion: boolean;
}

// ============================================
// CUENTAS CONTABLES
// ============================================

export type TipoCuenta = 'activo' | 'pasivo' | 'patrimonio' | 'ingreso' | 'gasto';
export type NaturalezaCuenta = 'deudor' | 'acreedor';

export interface Cuenta {
    id: string;
    codigo: string;        // "1.1.1", "2.1.1"
    nombre: string;        // "Caja", "Proveedores"
    tipo: TipoCuenta;
    naturaleza: NaturalezaCuenta;
    nivel: number;         // 1, 2, 3...
    cuentaPadreId?: string;
    admiteMovimientos: boolean;
    moneda?: Moneda;       // Si la cuenta es específica de una moneda
    activa: boolean;

    // Metadata
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateCuentaData {
    codigo: string;
    nombre: string;
    tipo: TipoCuenta;
    naturaleza: NaturalezaCuenta;
    nivel?: number;
    cuentaPadreId?: string;
    admiteMovimientos?: boolean;
    moneda?: Moneda;
}

// ============================================
// LÍNEAS DE ASIENTO
// ============================================

export interface LineaAsiento {
    cuentaId: string;
    cuentaCodigo: string;
    cuentaNombre: string;
    debe: number;
    haber: number;
    moneda: Moneda;
    tipoCambio?: number;    // Solo si moneda !== monedaBase
    descripcion?: string;
}

// ============================================
// ASIENTOS CONTABLES
// ============================================

export type EstadoAsiento = 'borrador' | 'contabilizado' | 'anulado';
export type ModuloOrigen = 'core' | 'agro' | 'retail' | 'logistica' | 'manual';

export interface Asiento {
    id: string;
    organizationId: string;
    numero: number;
    fecha: Date;
    descripcion: string;
    lineas: LineaAsiento[];

    // Totales
    totalDebe: number;
    totalHaber: number;
    moneda: Moneda;

    // Estado
    estado: EstadoAsiento;

    // Trazabilidad
    moduloOrigen: ModuloOrigen;
    tipoOperacion?: string;       // "compra_insumo", "venta_producto"
    operacionId?: string;         // ID del documento origen
    terceroId?: string;           // Cliente/Proveedor relacionado
    terceroNombre?: string;

    // Contexto adicional (para agro)
    campoId?: string;
    loteId?: string;

    // Auditoría
    createdAt: Date;
    createdBy?: string;
    contabilizadoAt?: Date;
    contabilizadoBy?: string;
    anuladoAt?: Date;
    anuladoBy?: string;
}

export interface CreateAsientoData {
    fecha: Date;
    descripcion: string;
    lineas: Omit<LineaAsiento, 'tipoCambio'>[];
    moneda?: Moneda;
    moduloOrigen?: ModuloOrigen;
    tipoOperacion?: string;
    operacionId?: string;
    terceroId?: string;
    terceroNombre?: string;
    campoId?: string;
    loteId?: string;
}

// ============================================
// TERCEROS (Clientes/Proveedores)
// ============================================

export type TipoTercero = 'cliente' | 'proveedor' | 'ambos';

export interface Tercero {
    id: string;
    organizationId: string;
    nombre: string;
    tipo: TipoTercero;
    cuit?: string;
    direccion?: string;
    telefono?: string;
    email?: string;

    // Saldos
    saldoCliente: number;     // Lo que nos deben
    saldoProveedor: number;   // Lo que debemos
    monedaSaldo: Moneda;

    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface MovimientoTercero {
    id: string;
    terceroId: string;
    fecha: Date;
    tipoOperacion: string;
    descripcion: string;
    montoCliente: number;     // Positivo = nos deben más, Negativo = cobramos
    montoProveedor: number;   // Positivo = debemos más, Negativo = pagamos
    asientoId?: string;
    moneda: Moneda;
    createdAt: Date;
}

// ============================================
// REPORTES
// ============================================

export interface SaldoCuenta {
    cuentaCodigo: string;
    cuentaNombre: string;
    tipo: TipoCuenta;
    debe: number;
    haber: number;
    saldo: number;
    moneda: Moneda;
}

export interface BalanceComprobacion {
    fecha: Date;
    cuentas: SaldoCuenta[];
    totalDebe: number;
    totalHaber: number;
    moneda: Moneda;
}

// ============================================
// VALIDACIÓN
// ============================================

export interface ValidationResult {
    valid: boolean;
    error?: string;
}

// ============================================
// FILTROS
// ============================================

export interface FiltrosAsiento {
    desde?: Date;
    hasta?: Date;
    estado?: EstadoAsiento;
    moduloOrigen?: ModuloOrigen;
    terceroId?: string;
    moneda?: Moneda;
}

export interface FiltrosCuenta {
    tipo?: TipoCuenta;
    nivel?: number;
    admiteMovimientos?: boolean;
    activa?: boolean;
}
