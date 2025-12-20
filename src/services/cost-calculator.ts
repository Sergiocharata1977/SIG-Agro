/**
 * Servicio de Cálculo de Costos
 * Trazabilidad económica: Satélite → Problema → Costo de remediación
 */

import { obtenerProductos, registrarMovimiento } from '@/services/stock';
import type { Product, StockMovement } from '@/types/accounting';
import type { SatelliteAnalysis } from '@/types/sig-agro-advanced';
import type { Prescripcion } from '@/types/vra';

// ============================================
// TIPOS
// ============================================

export interface CostoRemediacion {
    problemaDetectado: string;
    severidad: 'leve' | 'moderado' | 'severo' | 'critico';

    // Insumos requeridos
    insumosRequeridos: {
        productoId: string;
        productoNombre: string;
        cantidadRequerida: number;
        unidad: string;
        stockDisponible: number;
        alcanza: boolean;
        costoUnitario: number;
        costoTotal: number;
    }[];

    // Totales
    costoTotal: number;
    areaAfectada: number;             // hectáreas
    costoPorHa: number;

    // Estado
    stockSuficiente: boolean;
    faltantes: string[];
}

export interface AnalisisCostoLote {
    plotId: string;
    fechaAnalisis: Date;

    // Análisis satelital fuente
    analisisSatelitalId?: string;
    indiceUsado: string;
    valorIndice: number;

    // Problema detectado
    problemaDetectado: boolean;
    tipoProblema?: string;

    // Costos
    costoRemediacion?: CostoRemediacion;

    // Recomendación
    accionRecomendada: string;
    prioridadAccion: 'urgente' | 'normal' | 'opcional';
}

export interface ResumenCostosOrganizacion {
    periodo: { desde: Date; hasta: Date };

    // Por tipo de análisis
    porTipoAnalisis: {
        tipo: string;
        cantidad: number;
        costoTotal: number;
    }[];

    // Por lote
    porLote: {
        plotId: string;
        plotNombre?: string;
        costosAcumulados: number;
    }[];

    // Totales
    analisisTotales: number;
    problemasDetectados: number;
    costoTotalEstimado: number;
    costoPromedioPorHa: number;
}

// ============================================
// PRODUCTOS/TRATAMIENTOS SUGERIDOS
// ============================================

/**
 * Base de datos de tratamientos sugeridos por tipo de problema
 */
export const TRATAMIENTOS_SUGERIDOS: Record<string, {
    descripcion: string;
    productos: {
        nombre: string;
        tipo: 'herbicida' | 'insecticida' | 'fungicida' | 'fertilizante' | 'otro';
        dosisMin: number;
        dosisMax: number;
        unidad: string;
        costoEstimadoLt?: number;
        costoEstimadoKg?: number;
    }[];
}> = {
    ndvi_bajo: {
        descripcion: 'NDVI bajo detectado - posible estrés general',
        productos: [
            { nombre: 'Fertilizante foliar', tipo: 'fertilizante', dosisMin: 2, dosisMax: 4, unidad: 'lt/ha', costoEstimadoLt: 15 },
            { nombre: 'Urea', tipo: 'fertilizante', dosisMin: 50, dosisMax: 100, unidad: 'kg/ha', costoEstimadoKg: 0.8 }
        ]
    },
    estres_hidrico: {
        descripcion: 'Estrés hídrico detectado',
        productos: [
            { nombre: 'Bioestimulante anti-estrés', tipo: 'otro', dosisMin: 1, dosisMax: 2, unidad: 'lt/ha', costoEstimadoLt: 45 }
        ]
    },
    ndmi_bajo: {
        descripcion: 'Índice de humedad bajo - deficiencia hídrica',
        productos: [
            { nombre: 'Polímero retenedor de humedad', tipo: 'otro', dosisMin: 2, dosisMax: 5, unidad: 'kg/ha', costoEstimadoKg: 25 }
        ]
    },
    reci_bajo: {
        descripcion: 'Índice de clorofila bajo - deficiencia de nitrógeno',
        productos: [
            { nombre: 'UAN 32', tipo: 'fertilizante', dosisMin: 30, dosisMax: 60, unidad: 'lt/ha', costoEstimadoLt: 1.2 },
            { nombre: 'Nitrato de amonio', tipo: 'fertilizante', dosisMin: 50, dosisMax: 100, unidad: 'kg/ha', costoEstimadoKg: 0.9 }
        ]
    },
    plaga_detectada: {
        descripcion: 'Posible presencia de plagas',
        productos: [
            { nombre: 'Cipermetrina', tipo: 'insecticida', dosisMin: 0.1, dosisMax: 0.2, unidad: 'lt/ha', costoEstimadoLt: 12 },
            { nombre: 'Lambda-cihalotrina', tipo: 'insecticida', dosisMin: 0.15, dosisMax: 0.25, unidad: 'lt/ha', costoEstimadoLt: 18 }
        ]
    }
};

// ============================================
// FUNCIONES DE CÁLCULO
// ============================================

/**
 * Calcular costo de remediación basado en análisis satelital
 */
export async function calcularCostoRemediacion(
    orgId: string,
    analisis: SatelliteAnalysis,
    areaHa: number = 100
): Promise<CostoRemediacion | null> {
    // Determinar tipo de problema
    let tipoProblema: string | null = null;
    let severidad: CostoRemediacion['severidad'] = 'leve';

    // Analizar NDVI
    if (analisis.ndviPromedio !== undefined && analisis.ndviPromedio < 0.3) {
        tipoProblema = 'ndvi_bajo';
        severidad = analisis.ndviPromedio < 0.2 ? 'severo' : 'moderado';
    }

    // Analizar estrés hídrico
    if (analisis.estresHidrico) {
        tipoProblema = 'estres_hidrico';
        severidad = analisis.nivelEstres === 'critical' ? 'critico' :
            analisis.nivelEstres === 'warning' ? 'moderado' : 'leve';
    }

    // Analizar NDMI
    if (analisis.ndmiPromedio !== undefined && analisis.ndmiPromedio < -0.2) {
        tipoProblema = 'ndmi_bajo';
        severidad = 'moderado';
    }

    // Analizar ReCI
    if (analisis.reciPromedio !== undefined && analisis.reciPromedio < 0.5) {
        tipoProblema = 'reci_bajo';
        severidad = analisis.reciPromedio < 0.3 ? 'severo' : 'moderado';
    }

    if (!tipoProblema) return null;

    // Obtener tratamiento sugerido
    const tratamiento = TRATAMIENTOS_SUGERIDOS[tipoProblema];
    if (!tratamiento) return null;

    // Obtener productos del stock
    const productosStock = await obtenerProductos(orgId);

    // Calcular insumos requeridos
    const insumosRequeridos = tratamiento.productos.map(prod => {
        // Buscar en stock (por nombre similar)
        const productoEnStock = productosStock.find(p =>
            p.nombre.toLowerCase().includes(prod.nombre.toLowerCase().split(' ')[0])
        );

        const dosisMedia = (prod.dosisMin + prod.dosisMax) / 2;
        const cantidadRequerida = dosisMedia * areaHa;
        const stockDisponible = productoEnStock?.stockActual || 0;

        // Calcular costo
        const costoUnitario = prod.unidad.includes('lt')
            ? (prod.costoEstimadoLt || 0)
            : (prod.costoEstimadoKg || 0);
        const costoTotal = cantidadRequerida * costoUnitario;

        return {
            productoId: productoEnStock?.id || '',
            productoNombre: prod.nombre,
            cantidadRequerida: Math.round(cantidadRequerida * 10) / 10,
            unidad: prod.unidad.replace('/ha', ''),
            stockDisponible,
            alcanza: stockDisponible >= cantidadRequerida,
            costoUnitario,
            costoTotal: Math.round(costoTotal * 100) / 100
        };
    });

    const costoTotal = insumosRequeridos.reduce((sum, i) => sum + i.costoTotal, 0);
    const faltantes = insumosRequeridos
        .filter(i => !i.alcanza)
        .map(i => `${i.productoNombre}: faltan ${(i.cantidadRequerida - i.stockDisponible).toFixed(1)} ${i.unidad}`);

    return {
        problemaDetectado: tratamiento.descripcion,
        severidad,
        insumosRequeridos,
        costoTotal: Math.round(costoTotal * 100) / 100,
        areaAfectada: areaHa,
        costoPorHa: Math.round((costoTotal / areaHa) * 100) / 100,
        stockSuficiente: faltantes.length === 0,
        faltantes
    };
}

/**
 * Analizar costo completo de un lote basado en análisis satelital
 */
export async function analizarCostoLote(
    orgId: string,
    analisis: SatelliteAnalysis,
    areaHa: number
): Promise<AnalisisCostoLote> {
    const costoRemediacion = await calcularCostoRemediacion(orgId, analisis, areaHa);

    const problemaDetectado = costoRemediacion !== null;

    // Determinar prioridad
    let prioridadAccion: AnalisisCostoLote['prioridadAccion'] = 'opcional';
    if (costoRemediacion) {
        if (costoRemediacion.severidad === 'critico' || costoRemediacion.severidad === 'severo') {
            prioridadAccion = 'urgente';
        } else if (costoRemediacion.severidad === 'moderado') {
            prioridadAccion = 'normal';
        }
    }

    // Generar recomendación
    let accionRecomendada = 'Continuar monitoreo regular';
    if (costoRemediacion) {
        if (costoRemediacion.stockSuficiente) {
            accionRecomendada = `Aplicar tratamiento. Stock disponible. Costo estimado: $${costoRemediacion.costoTotal}`;
        } else {
            accionRecomendada = `Requiere compra de insumos: ${costoRemediacion.faltantes.join(', ')}`;
        }
    }

    return {
        plotId: analisis.plotId,
        fechaAnalisis: new Date(),
        analisisSatelitalId: analisis.id,
        indiceUsado: analisis.tipoAnalisis,
        valorIndice: analisis.ndviPromedio || analisis.ndmiPromedio || analisis.reciPromedio || 0,
        problemaDetectado,
        tipoProblema: costoRemediacion?.problemaDetectado,
        costoRemediacion: costoRemediacion || undefined,
        accionRecomendada,
        prioridadAccion
    };
}

/**
 * Calcular costo de una prescripción VRA
 */
export function calcularCostoPrescripcion(
    prescripcion: Prescripcion,
    costoUnitario: number
): {
    costoTotal: number;
    costoPorZona: { zonaNombre: string; costo: number }[];
    costoPorHa: number;
} {
    const costoPorZona = prescripcion.zonas.map(zona => ({
        zonaNombre: zona.zonaNombre,
        costo: Math.round(zona.dosisTotal * costoUnitario * 100) / 100
    }));

    const costoTotal = costoPorZona.reduce((sum, z) => sum + z.costo, 0);
    const areaTotal = prescripcion.zonas.reduce((sum, z) => sum + z.areaHa, 0);

    return {
        costoTotal: Math.round(costoTotal * 100) / 100,
        costoPorZona,
        costoPorHa: areaTotal > 0 ? Math.round((costoTotal / areaTotal) * 100) / 100 : 0
    };
}

/**
 * Generar orden de aplicación vinculada al stock
 */
export async function generarOrdenAplicacion(
    orgId: string,
    prescripcion: Prescripcion,
    productoId: string,
    userId: string
): Promise<{
    exito: boolean;
    mensaje: string;
    movimiento?: StockMovement;
}> {
    try {
        // Registrar consumo de stock
        const movimiento = await registrarMovimiento(orgId, {
            productId: productoId,
            tipo: 'salida_consumo',
            cantidad: prescripcion.cantidadTotal,
            fecha: new Date(),
            descripcion: `Aplicación VRA: ${prescripcion.productoNombre} - ${prescripcion.tipo}`,
            loteId: prescripcion.plotId,
            userId
        });

        return {
            exito: true,
            mensaje: `Stock actualizado. Se descontaron ${prescripcion.cantidadTotal} ${prescripcion.unidad}`,
            movimiento
        };
    } catch (error) {
        console.error('Error generando orden de aplicación:', error);
        return {
            exito: false,
            mensaje: 'Error al actualizar stock'
        };
    }
}
