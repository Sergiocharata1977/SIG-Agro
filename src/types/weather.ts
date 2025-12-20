/**
 * Tipos para Integración Climática
 * Pronósticos, historial y alertas meteorológicas
 */

// Condiciones meteorológicas
export type CondicionClima =
    | 'soleado'
    | 'parcialmente_nublado'
    | 'nublado'
    | 'lluvia'
    | 'lluvia_fuerte'
    | 'tormenta'
    | 'granizo'
    | 'nieve'
    | 'niebla'
    | 'viento';

// Tipo de alerta meteorológica
export type TipoAlertaClima =
    | 'helada'
    | 'granizo'
    | 'tormenta_severa'
    | 'lluvia_intensa'
    | 'viento_fuerte'
    | 'ola_calor'
    | 'sequia';

/**
 * Datos meteorológicos actuales
 */
export interface DatosClimaActual {
    timestamp: Date;

    // Ubicación
    latitude: number;
    longitude: number;

    // Temperatura
    temperatura: number;                // °C
    sensacionTermica: number;           // °C (wind chill)

    // Humedad
    humedadRelativa: number;            // %
    puntoRocio: number;                 // °C

    // Viento
    velocidadViento: number;            // km/h
    direccionViento: number;            // grados (0-360)
    rafagasViento?: number;             // km/h

    // Precipitación
    precipitacionHora: number;          // mm en la última hora
    probabilidadPrecipitacion?: number; // %

    // Presión y otros
    presionAtmosferica: number;         // hPa
    radiacionSolar?: number;            // W/m²
    indicieUV?: number;                 // 0-11+

    // Condición general
    condicion: CondicionClima;
    descripcion: string;
    icono?: string;
}

/**
 * Pronóstico diario
 */
export interface PronosticoDiario {
    fecha: Date;

    // Temperaturas
    tempMaxima: number;
    tempMinima: number;

    // Precipitación
    precipitacionTotal: number;         // mm
    probabilidadPrecipitacion: number;  // %

    // Viento
    velocidadVientoMax: number;

    // Humedad
    humedadPromedio: number;

    // Condición
    condicion: CondicionClima;
    descripcion: string;
    icono?: string;

    // Horas de sol
    horaAmanecer?: string;
    horaAtardecer?: string;
}

/**
 * Pronóstico por hora
 */
export interface PronosticoHorario {
    hora: Date;

    temperatura: number;
    sensacionTermica: number;
    humedadRelativa: number;
    precipitacion: number;
    probabilidadPrecipitacion: number;
    velocidadViento: number;
    direccionViento: number;

    condicion: CondicionClima;
    icono?: string;
}

/**
 * Alerta meteorológica
 */
export interface AlertaClimatica {
    id: string;
    tipo: TipoAlertaClima;
    severidad: 'amarilla' | 'naranja' | 'roja';

    // Período de vigencia
    inicio: Date;
    fin: Date;

    // Contenido
    titulo: string;
    descripcion: string;
    recomendaciones: string[];

    // Área afectada
    zonaAfectada?: string;

    // Fuente
    fuente?: string;
}

/**
 * Historial climático para análisis
 */
export interface HistorialClimatico {
    plotId?: string;
    latitude: number;
    longitude: number;

    // Período
    fechaDesde: Date;
    fechaHasta: Date;

    // Acumulados
    precipitacionAcumulada: number;     // mm
    diasConLluvia: number;
    diasConHelada: number;

    // Temperaturas del período
    tempMaximaAbsoluta: number;
    tempMinimaAbsoluta: number;
    tempPromedio: number;

    // GDA (Grados Día Acumulados)
    gradosDiaAcumulados?: number;

    // Datos diarios
    datosDiarios: {
        fecha: Date;
        tempMax: number;
        tempMin: number;
        precipitacion: number;
    }[];
}

// ============================================
// CONFIGURACIONES
// ============================================

export const CONDICION_CLIMA_CONFIG: Record<CondicionClima, {
    label: string;
    icono: string;
    color: string;
}> = {
    soleado: { label: 'Soleado', icono: '☀️', color: '#FCD34D' },
    parcialmente_nublado: { label: 'Parcialmente nublado', icono: '⛅', color: '#93C5FD' },
    nublado: { label: 'Nublado', icono: '☁️', color: '#9CA3AF' },
    lluvia: { label: 'Lluvia', icono: '🌧️', color: '#60A5FA' },
    lluvia_fuerte: { label: 'Lluvia fuerte', icono: '🌧️', color: '#3B82F6' },
    tormenta: { label: 'Tormenta', icono: '⛈️', color: '#6366F1' },
    granizo: { label: 'Granizo', icono: '🌨️', color: '#A5B4FC' },
    nieve: { label: 'Nieve', icono: '❄️', color: '#E0E7FF' },
    niebla: { label: 'Niebla', icono: '🌫️', color: '#D1D5DB' },
    viento: { label: 'Viento', icono: '💨', color: '#A7F3D0' }
};

export const ALERTA_CLIMA_CONFIG: Record<TipoAlertaClima, {
    label: string;
    icono: string;
    prioridad: number;
}> = {
    helada: { label: 'Helada', icono: '🥶', prioridad: 5 },
    granizo: { label: 'Granizo', icono: '🌨️', prioridad: 5 },
    tormenta_severa: { label: 'Tormenta severa', icono: '⛈️', prioridad: 4 },
    lluvia_intensa: { label: 'Lluvia intensa', icono: '🌧️', prioridad: 3 },
    viento_fuerte: { label: 'Viento fuerte', icono: '💨', prioridad: 3 },
    ola_calor: { label: 'Ola de calor', icono: '🌡️', prioridad: 4 },
    sequia: { label: 'Sequía', icono: '☀️', prioridad: 4 }
};

export const SEVERIDAD_ALERTA_CONFIG: Record<'amarilla' | 'naranja' | 'roja', {
    label: string;
    color: string;
    colorBg: string;
}> = {
    amarilla: { label: 'Amarilla', color: '#CA8A04', colorBg: '#FEF9C3' },
    naranja: { label: 'Naranja', color: '#EA580C', colorBg: '#FFEDD5' },
    roja: { label: 'Roja', color: '#DC2626', colorBg: '#FEE2E2' }
};
