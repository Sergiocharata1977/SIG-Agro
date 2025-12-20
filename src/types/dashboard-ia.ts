// Tipos para el Dashboard de Análisis IA

export interface IAAnalysisResult {
    id: string;
    loteId: string;
    loteName: string;
    campoId: string;
    timestamp: Date;
    type: 'ndvi' | 'prediccion' | 'recomendacion' | 'alerta';
    confidence: number; // 0-1
    data: Record<string, unknown>;
}

export interface NDVIAnalysis extends IAAnalysisResult {
    type: 'ndvi';
    data: {
        current: number;
        previous: number;
        change: number;
        trend: 'mejorando' | 'estable' | 'empeorando';
        zones: {
            zoneName: string;
            value: number;
            status: 'excelente' | 'bueno' | 'regular' | 'malo';
        }[];
    };
}

export interface PrediccionCosecha extends IAAnalysisResult {
    type: 'prediccion';
    data: {
        cultivo: string;
        rendimientoEstimado: number; // kg/ha
        rendimientoMinimo: number;
        rendimientoMaximo: number;
        fechaEstimada: string;
        factoresRiesgo: string[];
    };
}

export interface RecomendacionIA extends IAAnalysisResult {
    type: 'recomendacion';
    data: {
        categoria: 'fertilizacion' | 'riego' | 'aplicacion' | 'cosecha' | 'general';
        titulo: string;
        descripcion: string;
        urgencia: 'alta' | 'media' | 'baja';
        acciones: string[];
        impactoEstimado?: string;
    };
}

export interface AlertaIA extends IAAnalysisResult {
    type: 'alerta';
    data: {
        tipoAlerta: 'plaga' | 'enfermedad' | 'clima' | 'estres' | 'anomalia';
        severidad: 'critica' | 'alta' | 'media' | 'baja';
        descripcion: string;
        areaAfectada?: number; // hectáreas
        accionesRecomendadas: string[];
    };
}

export interface DashboardIAData {
    resumen: {
        totalAnalisis: number;
        alertasActivas: number;
        prediccionesRecientes: number;
        confianzaPromedio: number;
    };
    analisisRecientes: IAAnalysisResult[];
    alertas: AlertaIA[];
    recomendaciones: RecomendacionIA[];
    predicciones: PrediccionCosecha[];
    tendenciasNDVI: {
        fecha: string;
        promedio: number;
    }[];
}

// Tipos para Gestión de Insumos
export interface Insumo {
    id: string;
    organizationId: string;
    nombre: string;
    categoria: 'semilla' | 'fertilizante' | 'fitosanitario' | 'combustible' | 'otro';
    unidad: string;
    stockActual: number;
    stockMinimo: number;
    precioUnitario: number;
    proveedor?: string;
    lote?: string;
    fechaVencimiento?: string;
    ubicacion?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface MovimientoInsumo {
    id: string;
    insumoId: string;
    tipo: 'entrada' | 'salida' | 'ajuste';
    cantidad: number;
    motivo: string;
    operacionId?: string;
    loteId?: string;
    fecha: Date;
    usuario: string;
}

export interface AlertaStock {
    insumoId: string;
    insumoNombre: string;
    stockActual: number;
    stockMinimo: number;
    porcentaje: number;
    estado: 'critico' | 'bajo' | 'normal';
}

// Tipos para Planificación de Siembra
export interface PlanSiembra {
    id: string;
    organizationId: string;
    campaniaId: string;
    loteId: string;
    loteName: string;
    cultivo: string;
    variedad?: string;
    fechaSiembraPlanificada: string;
    fechaSiembraReal?: string;
    fechaCosechaEstimada: string;
    superficieHa: number;
    densidadSiembra: number;
    unidadDensidad: string;
    cultivoAnterior?: string;
    rotacionRecomendada: boolean;
    estado: 'planificado' | 'sembrado' | 'en_crecimiento' | 'cosechado' | 'cancelado';
    notas?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CalendarioSiembra {
    mes: number;
    cultivosRecomendados: {
        cultivo: string;
        optimo: boolean;
        notas?: string;
    }[];
}

// Tipos para Mapas de Rendimiento
export interface MapaRendimiento {
    id: string;
    campaniaId: string;
    loteId: string;
    fechaCosecha: string;
    rendimientoPromedio: number;
    rendimientoMaximo: number;
    rendimientoMinimo: number;
    humedadPromedio: number;
    zonas: ZonaRendimiento[];
    geojson?: GeoJSON.FeatureCollection;
}

export interface ZonaRendimiento {
    id: string;
    polygon: {
        type: 'Polygon';
        coordinates: number[][][];
    };
    rendimiento: number;
    humedad: number;
    clasificacion: 'alto' | 'medio' | 'bajo';
    color: string;
    areaHa: number;
}

export interface EstadisticasRendimiento {
    campaniaId: string;
    cultivo: string;
    superficieTotal: number;
    produccionTotal: number;
    rendimientoPromedio: number;
    variabilidad: number;
    comparativaHistorica: {
        anio: string;
        rendimiento: number;
    }[];
}
