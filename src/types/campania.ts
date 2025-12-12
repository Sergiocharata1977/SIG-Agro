/**
 * Tipos para Campañas Agrícolas y Eventos de Lote
 * Gestión productiva completa
 */

// ============================================
// CAMPAÑA AGRÍCOLA
// ============================================

export type EstadoCampania = 'planificada' | 'en_curso' | 'finalizada' | 'cancelada';

export interface Campania {
    id: string;
    productorId: string;
    loteId: string;
    campoId: string;

    // Identificación
    nombre: string;           // "Soja 2024/2025"
    codigo?: string;          // "CAMP-2024-001"

    // Cultivo
    cultivo: string;          // "Soja", "Maíz", "Algodón", etc.
    variedad?: string;        // "DM 46i17"
    tecnologia?: string;      // "RR", "Bt", "Convencional"

    // Fechas
    fechaInicio: Date;
    fechaFinPrevista?: Date;
    fechaFinReal?: Date;

    // Superficie
    superficieSembrada?: number;  // ha

    // Siembra
    fechaSiembra?: Date;
    densidadSiembra?: number;     // semillas/m o kg/ha
    distanciaEntresurco?: number; // cm

    // Cosecha
    fechaCosecha?: Date;
    rendimiento?: number;         // kg/ha
    produccionTotal?: number;     // kg totales
    humedadCosecha?: number;      // %

    // Estado
    estado: EstadoCampania;

    // Observaciones
    observaciones?: string;

    // Metadatos
    createdAt: Date;
    updatedAt: Date;
}

// ============================================
// EVENTOS / LABORES
// ============================================

export type TipoEvento =
    | 'siembra'
    | 'fertilizacion'
    | 'pulverizacion'
    | 'laboreo'
    | 'riego'
    | 'cosecha'
    | 'monitoreo'
    | 'analisis_suelo'
    | 'otro';

export type EstadoEvento = 'programado' | 'en_curso' | 'completado' | 'cancelado';

export interface Evento {
    id: string;
    productorId: string;
    campaniaId: string;
    loteId: string;
    campoId: string;

    // Tipo
    tipo: TipoEvento;
    titulo: string;
    descripcion?: string;

    // Fecha y hora
    fecha: Date;
    horaInicio?: string;
    horaFin?: string;

    // Superficie
    superficieAplicada?: number;  // ha

    // Estado
    estado: EstadoEvento;

    // Productos aplicados (fertilización/pulverización)
    productos?: ProductoAplicado[];

    // Condiciones climáticas
    condicionesClimaticas?: {
        temperatura?: number;
        humedad?: number;
        viento?: number;
        direccionViento?: string;
    };

    // Maquinaria
    maquinaria?: string;
    operador?: string;

    // Documentación
    fotos?: string[];
    observaciones?: string;

    // Costos
    costoManoObra?: number;
    costoMaquinaria?: number;
    costoInsumos?: number;
    costoTotal?: number;

    // Metadatos
    createdAt: Date;
    createdBy: string;
    updatedAt: Date;
}

export interface ProductoAplicado {
    nombre: string;
    marca?: string;
    cantidad: number;
    unidad: string;           // "lt/ha", "kg/ha", "dosis/ha"
    precioUnitario?: number;
    costoTotal?: number;
}

// ============================================
// COSTO SIMPLIFICADO
// ============================================

export type CategoriaCosto =
    | 'semilla'
    | 'fertilizante'
    | 'fitosanitario'
    | 'laboreo'
    | 'siembra'
    | 'cosecha'
    | 'flete'
    | 'arrendamiento'
    | 'otros';

export interface CostoBasico {
    id: string;
    productorId: string;
    campaniaId: string;
    loteId: string;

    // Categoría
    categoria: CategoriaCosto;
    concepto: string;

    // Monto
    monto: number;
    moneda: 'ARS' | 'USD';
    tipoCambio?: number;
    montoARS: number;         // Siempre en ARS

    // Vinculación
    eventoId?: string;        // Si viene de un evento

    // Fecha
    fecha: Date;

    // Observaciones
    observaciones?: string;

    // Metadatos
    createdAt: Date;
    updatedAt: Date;
}

// ============================================
// INGRESO (VENTA)
// ============================================

export interface Ingreso {
    id: string;
    productorId: string;
    campaniaId: string;
    loteId: string;

    // Tipo
    tipo: 'venta_grano' | 'venta_servicio' | 'otro';
    concepto: string;

    // Cantidad
    cantidad?: number;
    unidad?: string;
    precioUnitario?: number;

    // Monto
    monto: number;
    moneda: 'ARS' | 'USD';
    tipoCambio?: number;
    montoARS: number;

    // Comprador
    comprador?: string;
    nroContrato?: string;

    // Fecha
    fecha: Date;

    // Metadatos
    createdAt: Date;
    updatedAt: Date;
}

// ============================================
// MARGEN BRUTO (Calculado)
// ============================================

export interface MargenBruto {
    campaniaId: string;
    loteId: string;

    // Datos
    cultivo: string;
    superficie: number;

    // Costos por categoría
    costosSemilla: number;
    costosFertilizantes: number;
    costosFitosanitarios: number;
    costosLabores: number;
    costosCosecha: number;
    otrosCostos: number;

    // Totales
    costoTotalARS: number;
    costoPorHa: number;

    // Producción
    rendimiento: number;        // kg/ha
    produccionTotal: number;    // kg

    // Ingresos
    precioPromedio: number;     // $/kg
    ingresoTotalARS: number;
    ingresoPorHa: number;

    // Resultado
    margenBrutoARS: number;
    margenBrutoPorHa: number;
    rentabilidad: number;       // % (MB/Costo)

    fechaCalculo: Date;
}
