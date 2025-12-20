// Tipos para el sistema de reportes PDF

export interface ReportConfig {
    title: string;
    subtitle?: string;
    logoPath?: string;
    organizationName: string;
    generatedBy: string;
    generatedAt: Date;
}

export interface CampaniaReportData {
    campania: {
        id: string;
        nombre: string;
        fechaInicio: string;
        fechaFin?: string;
        estado: 'planificada' | 'activa' | 'finalizada';
        cultivo: string;
    };
    lotes: {
        id: string;
        nombre: string;
        superficie: number;
        campo: string;
    }[];
    operaciones: {
        fecha: string;
        tipo: string;
        lote: string;
        costo: number;
        notas?: string;
    }[];
    resumen: {
        superficieTotal: number;
        costoTotal: number;
        operacionesCount: number;
    };
}

export interface CostoReportData {
    periodo: {
        inicio: string;
        fin: string;
    };
    categorias: {
        nombre: string;
        monto: number;
        porcentaje: number;
    }[];
    operaciones: {
        fecha: string;
        concepto: string;
        categoria: string;
        monto: number;
    }[];
    totales: {
        gastos: number;
        ingresos: number;
        balance: number;
    };
}

export interface ScoutingReportData {
    periodo: {
        inicio: string;
        fin: string;
    };
    registros: {
        fecha: string;
        lote: string;
        tipo: 'plaga' | 'enfermedad' | 'maleza' | 'general';
        descripcion: string;
        severidad: 'baja' | 'media' | 'alta';
        recomendacion?: string;
    }[];
    resumen: {
        totalRegistros: number;
        porTipo: Record<string, number>;
        alertasAltas: number;
    };
}

export interface RendimientoReportData {
    campania: string;
    cosechas: {
        lote: string;
        campo: string;
        superficie: number;
        rendimiento: number; // kg/ha
        humedad: number;
        calidad: string;
    }[];
    promedios: {
        rendimientoPromedio: number;
        humedadPromedio: number;
        rendimientoTotal: number;
    };
}

export type ReportType = 'campania' | 'costos' | 'scouting' | 'rendimiento';

export interface ReportRequest {
    type: ReportType;
    data: CampaniaReportData | CostoReportData | ScoutingReportData | RendimientoReportData;
    config: ReportConfig;
}
