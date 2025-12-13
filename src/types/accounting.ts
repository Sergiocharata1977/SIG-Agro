
export interface Account {
    id: string;
    orgId: string;
    codigo: string; // Ej: "1.1.01.001"
    nombre: string;
    tipo: 'activo' | 'pasivo' | 'patrimonio' | 'ingreso' | 'gasto';
    naturaleza: 'deudora' | 'acreedora';
    nivel: number;
    cuentaPadreId?: string;
    admiteMovimientos: boolean;
    esCuentaStock: boolean;
    moneda: 'ARS' | 'USD';
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface JournalEntryLine {
    cuentaId: string;
    cuentaNombre: string; // Desnormalizado para visualizar rápido
    debe: number;
    haber: number;
}

export interface JournalEntry {
    id: string;
    orgId: string;
    numero: number;
    fecha: Date;
    tipo: 'apertura' | 'operativo' | 'ajuste' | 'cierre';
    concepto: string;
    lineas: JournalEntryLine[];
    totalDebe: number;
    totalHaber: number;
    plotId?: string;
    cropId?: string;
    estado: 'borrador' | 'contabilizado' | 'anulado';
    createdAt: Date;
    updatedAt: Date;
}

export interface Product {
    id: string;
    orgId: string;
    codigo: string; // SKU
    nombre: string;
    categoria: 'insumo' | 'grano' | 'combustible' | 'servicio' | 'otro';
    unidadMedida: 'kg' | 'lt' | 'un' | 'tn' | 'has';
    precioCompra: number;
    precioVenta: number;
    stockMinimo: number;
    stockActual: number; // Campo calculado/cacheado
    cuentaStockId?: string; // Cuenta de activo asociada
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface StockMovement {
    id: string;
    orgId: string;
    productId: string;
    tipo: 'entrada_compra' | 'salida_consumo' | 'cosecha' | 'ajuste';
    cantidad: number;
    precioUnitario: number;
    plotId?: string;
    cropId?: string;
    journalEntryId?: string;
    observaciones?: string;
    fecha: Date;
    createdAt: Date;
}
