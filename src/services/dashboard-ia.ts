import type {
    DashboardIAData,
    IAAnalysisResult,
    NDVIAnalysis,
    PrediccionCosecha,
    RecomendacionIA,
    AlertaIA
} from '@/types/dashboard-ia';

// Servicio para obtener datos del Dashboard de IA
class DashboardIAService {

    // Obtener datos completos del dashboard
    async getDashboardData(organizationId: string): Promise<DashboardIAData> {
        // En producción, esto conectaría con Firebase/API
        // Por ahora, generar datos de demostración

        const alertas = this.generateAlerts(organizationId);
        const recomendaciones = this.generateRecommendations(organizationId);
        const predicciones = this.generatePredictions(organizationId);
        const analisisRecientes = [...alertas, ...recomendaciones, ...predicciones]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 10);

        return {
            resumen: {
                totalAnalisis: analisisRecientes.length,
                alertasActivas: alertas.filter(a => a.data.severidad === 'alta' || a.data.severidad === 'critica').length,
                prediccionesRecientes: predicciones.length,
                confianzaPromedio: this.calculateAverageConfidence(analisisRecientes),
            },
            analisisRecientes,
            alertas,
            recomendaciones,
            predicciones,
            tendenciasNDVI: this.generateNDVITrend(),
        };
    }

    // Generar alertas de demostración
    private generateAlerts(organizationId: string): AlertaIA[] {
        const now = new Date();
        return [
            {
                id: 'alert-1',
                loteId: 'lote-1',
                loteName: 'Lote Norte',
                campoId: 'campo-1',
                timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
                type: 'alerta',
                confidence: 0.85,
                data: {
                    tipoAlerta: 'estres',
                    severidad: 'media',
                    descripcion: 'Estrés hídrico detectado en zona noroeste del lote',
                    areaAfectada: 15,
                    accionesRecomendadas: [
                        'Verificar estado del riego',
                        'Realizar scouting en la zona afectada',
                        'Evaluar necesidad de riego suplementario'
                    ]
                }
            },
            {
                id: 'alert-2',
                loteId: 'lote-2',
                loteName: 'Lote Sur',
                campoId: 'campo-1',
                timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000),
                type: 'alerta',
                confidence: 0.72,
                data: {
                    tipoAlerta: 'plaga',
                    severidad: 'alta',
                    descripcion: 'Posible presencia de oruga militar en sector este',
                    areaAfectada: 8,
                    accionesRecomendadas: [
                        'Realizar monitoreo urgente con trampas',
                        'Evaluar umbral de daño económico',
                        'Preparar aplicación preventiva'
                    ]
                }
            }
        ];
    }

    // Generar recomendaciones de demostración
    private generateRecommendations(organizationId: string): RecomendacionIA[] {
        const now = new Date();
        return [
            {
                id: 'rec-1',
                loteId: 'lote-1',
                loteName: 'Lote Norte',
                campoId: 'campo-1',
                timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000),
                type: 'recomendacion',
                confidence: 0.88,
                data: {
                    categoria: 'fertilizacion',
                    titulo: 'Aplicación de Nitrógeno recomendada',
                    descripcion: 'Basado en el estado del cultivo y el análisis de NDVI, se recomienda una aplicación de nitrógeno para optimizar el rendimiento.',
                    urgencia: 'media',
                    acciones: [
                        'Aplicar 50 kg/ha de urea',
                        'Realizar en las próximas 72 horas',
                        'Evitar aplicación si hay pronóstico de lluvia intensa'
                    ],
                    impactoEstimado: 'Aumento estimado de 8-12% en rendimiento'
                }
            },
            {
                id: 'rec-2',
                loteId: 'lote-3',
                loteName: 'Lote Este',
                campoId: 'campo-2',
                timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000),
                type: 'recomendacion',
                confidence: 0.91,
                data: {
                    categoria: 'cosecha',
                    titulo: 'Ventana óptima de cosecha identificada',
                    descripcion: 'Las condiciones climáticas y el estado del grano indican una ventana óptima de cosecha.',
                    urgencia: 'alta',
                    acciones: [
                        'Programar cosecha para los próximos 5-7 días',
                        'Humedad estimada del grano: 14.5%',
                        'Monitorear pronóstico extendido'
                    ]
                }
            }
        ];
    }

    // Generar predicciones de cosecha
    private generatePredictions(organizationId: string): PrediccionCosecha[] {
        const now = new Date();
        return [
            {
                id: 'pred-1',
                loteId: 'lote-1',
                loteName: 'Lote Norte',
                campoId: 'campo-1',
                timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000),
                type: 'prediccion',
                confidence: 0.82,
                data: {
                    cultivo: 'Soja',
                    rendimientoEstimado: 3200,
                    rendimientoMinimo: 2800,
                    rendimientoMaximo: 3600,
                    fechaEstimada: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    factoresRiesgo: [
                        'Posible déficit hídrico en etapa de llenado',
                        'Temperatura elevada pronosticada'
                    ]
                }
            },
            {
                id: 'pred-2',
                loteId: 'lote-2',
                loteName: 'Lote Sur',
                campoId: 'campo-1',
                timestamp: new Date(now.getTime() - 18 * 60 * 60 * 1000),
                type: 'prediccion',
                confidence: 0.78,
                data: {
                    cultivo: 'Maíz',
                    rendimientoEstimado: 9500,
                    rendimientoMinimo: 8500,
                    rendimientoMaximo: 10500,
                    fechaEstimada: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    factoresRiesgo: [
                        'Presión de plagas en zona sur'
                    ]
                }
            }
        ];
    }

    // Generar tendencia NDVI
    private generateNDVITrend(): { fecha: string; promedio: number }[] {
        const trend = [];
        const now = new Date();

        for (let i = 30; i >= 0; i -= 5) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const baseValue = 0.55 + (30 - i) * 0.005; // Tendencia creciente
            const variation = (Math.random() - 0.5) * 0.1;

            trend.push({
                fecha: date.toISOString().split('T')[0],
                promedio: Math.max(0, Math.min(1, baseValue + variation))
            });
        }

        return trend;
    }

    // Calcular confianza promedio
    private calculateAverageConfidence(results: IAAnalysisResult[]): number {
        if (results.length === 0) return 0;
        const sum = results.reduce((acc, r) => acc + r.confidence, 0);
        return sum / results.length;
    }

    // Obtener análisis por lote
    async getAnalysisByLote(loteId: string): Promise<IAAnalysisResult[]> {
        const allData = await this.getDashboardData('');
        return allData.analisisRecientes.filter(a => a.loteId === loteId);
    }

    // Obtener alertas activas
    async getActiveAlerts(organizationId: string): Promise<AlertaIA[]> {
        const data = await this.getDashboardData(organizationId);
        return data.alertas.filter(a =>
            a.data.severidad === 'critica' || a.data.severidad === 'alta'
        );
    }
}

export const dashboardIAService = new DashboardIAService();
