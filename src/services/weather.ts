/**
 * Servicio de Clima
 * Integración con Open-Meteo API (gratuita)
 */

import type {
    DatosClimaActual,
    PronosticoDiario,
    PronosticoHorario,
    AlertaClimatica,
    HistorialClimatico,
    CondicionClima
} from '@/types/weather';

// ============================================
// OPEN-METEO API
// ============================================

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1';

/**
 * Convertir código WMO a condición interna
 */
function wmoToCondicion(wmoCode: number): CondicionClima {
    // https://open-meteo.com/en/docs#weathervariables
    if (wmoCode === 0) return 'soleado';
    if (wmoCode <= 3) return 'parcialmente_nublado';
    if (wmoCode <= 49) return 'niebla';
    if (wmoCode <= 59) return 'lluvia';
    if (wmoCode <= 69) return 'nieve';
    if (wmoCode <= 79) return 'lluvia';
    if (wmoCode <= 84) return 'lluvia_fuerte';
    if (wmoCode <= 94) return 'tormenta';
    if (wmoCode <= 99) return 'granizo';
    return 'nublado';
}

/**
 * Obtener clima actual para una coordenada
 */
export async function obtenerClimaActual(
    latitude: number,
    longitude: number
): Promise<DatosClimaActual> {
    try {
        const params = new URLSearchParams({
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            current: [
                'temperature_2m',
                'relative_humidity_2m',
                'apparent_temperature',
                'precipitation',
                'weather_code',
                'wind_speed_10m',
                'wind_direction_10m',
                'wind_gusts_10m',
                'surface_pressure'
            ].join(','),
            timezone: 'America/Argentina/Buenos_Aires'
        });

        const response = await fetch(`${OPEN_METEO_BASE}/forecast?${params}`);

        if (!response.ok) {
            throw new Error(`Error de Open-Meteo: ${response.status}`);
        }

        const data = await response.json();
        const current = data.current;

        return {
            timestamp: new Date(current.time),
            latitude,
            longitude,
            temperatura: current.temperature_2m,
            sensacionTermica: current.apparent_temperature,
            humedadRelativa: current.relative_humidity_2m,
            puntoRocio: current.temperature_2m - ((100 - current.relative_humidity_2m) / 5),
            velocidadViento: current.wind_speed_10m,
            direccionViento: current.wind_direction_10m,
            rafagasViento: current.wind_gusts_10m,
            precipitacionHora: current.precipitation,
            presionAtmosferica: current.surface_pressure,
            condicion: wmoToCondicion(current.weather_code),
            descripcion: obtenerDescripcionWMO(current.weather_code)
        };
    } catch (error) {
        console.error('Error obteniendo clima actual:', error);
        throw error;
    }
}

/**
 * Obtener pronóstico de 7 días
 */
export async function obtenerPronostico7Dias(
    latitude: number,
    longitude: number
): Promise<PronosticoDiario[]> {
    try {
        const params = new URLSearchParams({
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            daily: [
                'weather_code',
                'temperature_2m_max',
                'temperature_2m_min',
                'precipitation_sum',
                'precipitation_probability_max',
                'wind_speed_10m_max',
                'sunrise',
                'sunset'
            ].join(','),
            timezone: 'America/Argentina/Buenos_Aires'
        });

        const response = await fetch(`${OPEN_METEO_BASE}/forecast?${params}`);

        if (!response.ok) {
            throw new Error(`Error de Open-Meteo: ${response.status}`);
        }

        const data = await response.json();
        const daily = data.daily;

        return daily.time.map((fecha: string, idx: number) => ({
            fecha: new Date(fecha),
            tempMaxima: daily.temperature_2m_max[idx],
            tempMinima: daily.temperature_2m_min[idx],
            precipitacionTotal: daily.precipitation_sum[idx] || 0,
            probabilidadPrecipitacion: daily.precipitation_probability_max[idx] || 0,
            velocidadVientoMax: daily.wind_speed_10m_max[idx],
            humedadPromedio: 60, // Open-Meteo no da humedad diaria, usar promedio
            condicion: wmoToCondicion(daily.weather_code[idx]),
            descripcion: obtenerDescripcionWMO(daily.weather_code[idx]),
            horaAmanecer: daily.sunrise[idx]?.split('T')[1],
            horaAtardecer: daily.sunset[idx]?.split('T')[1]
        }));
    } catch (error) {
        console.error('Error obteniendo pronóstico:', error);
        throw error;
    }
}

/**
 * Obtener pronóstico horario para las próximas 24 horas
 */
export async function obtenerPronosticoHorario(
    latitude: number,
    longitude: number
): Promise<PronosticoHorario[]> {
    try {
        const params = new URLSearchParams({
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            hourly: [
                'temperature_2m',
                'apparent_temperature',
                'relative_humidity_2m',
                'precipitation',
                'precipitation_probability',
                'weather_code',
                'wind_speed_10m',
                'wind_direction_10m'
            ].join(','),
            forecast_hours: '24',
            timezone: 'America/Argentina/Buenos_Aires'
        });

        const response = await fetch(`${OPEN_METEO_BASE}/forecast?${params}`);

        if (!response.ok) {
            throw new Error(`Error de Open-Meteo: ${response.status}`);
        }

        const data = await response.json();
        const hourly = data.hourly;

        return hourly.time.map((hora: string, idx: number) => ({
            hora: new Date(hora),
            temperatura: hourly.temperature_2m[idx],
            sensacionTermica: hourly.apparent_temperature[idx],
            humedadRelativa: hourly.relative_humidity_2m[idx],
            precipitacion: hourly.precipitation[idx] || 0,
            probabilidadPrecipitacion: hourly.precipitation_probability[idx] || 0,
            velocidadViento: hourly.wind_speed_10m[idx],
            direccionViento: hourly.wind_direction_10m[idx],
            condicion: wmoToCondicion(hourly.weather_code[idx])
        }));
    } catch (error) {
        console.error('Error obteniendo pronóstico horario:', error);
        throw error;
    }
}

/**
 * Detectar alertas climáticas basadas en pronóstico
 */
export async function detectarAlertasClimaticas(
    latitude: number,
    longitude: number
): Promise<AlertaClimatica[]> {
    const alertas: AlertaClimatica[] = [];

    try {
        const pronostico = await obtenerPronostico7Dias(latitude, longitude);
        const ahora = new Date();

        for (const dia of pronostico) {
            // Alerta de helada (temp mínima < 0°C)
            if (dia.tempMinima < 0) {
                alertas.push({
                    id: `helada_${dia.fecha.toISOString()}`,
                    tipo: 'helada',
                    severidad: dia.tempMinima < -3 ? 'roja' : dia.tempMinima < -1 ? 'naranja' : 'amarilla',
                    inicio: dia.fecha,
                    fin: new Date(dia.fecha.getTime() + 12 * 60 * 60 * 1000),
                    titulo: `Alerta de helada: ${dia.tempMinima}°C`,
                    descripcion: `Se esperan temperaturas mínimas de ${dia.tempMinima}°C`,
                    recomendaciones: [
                        'Proteger cultivos sensibles',
                        'Considerar riego nocturno para protección',
                        'Cubrir plantines si es posible'
                    ]
                });
            }

            // Alerta de lluvia intensa (> 30mm en un día)
            if (dia.precipitacionTotal > 30) {
                alertas.push({
                    id: `lluvia_${dia.fecha.toISOString()}`,
                    tipo: 'lluvia_intensa',
                    severidad: dia.precipitacionTotal > 60 ? 'roja' : dia.precipitacionTotal > 40 ? 'naranja' : 'amarilla',
                    inicio: dia.fecha,
                    fin: new Date(dia.fecha.getTime() + 24 * 60 * 60 * 1000),
                    titulo: `Lluvia intensa: ${dia.precipitacionTotal}mm`,
                    descripcion: `Se esperan precipitaciones de ${dia.precipitacionTotal}mm`,
                    recomendaciones: [
                        'Verificar drenaje de lotes',
                        'Postergar aplicaciones fitosanitarias',
                        'Revisar accesos a campos'
                    ]
                });
            }

            // Alerta de tormenta/granizo
            if (dia.condicion === 'granizo' || dia.condicion === 'tormenta') {
                alertas.push({
                    id: `tormenta_${dia.fecha.toISOString()}`,
                    tipo: dia.condicion === 'granizo' ? 'granizo' : 'tormenta_severa',
                    severidad: 'naranja',
                    inicio: dia.fecha,
                    fin: new Date(dia.fecha.getTime() + 24 * 60 * 60 * 1000),
                    titulo: dia.condicion === 'granizo' ? 'Posible granizo' : 'Tormenta severa',
                    descripcion: `Condiciones meteorológicas adversas previstas`,
                    recomendaciones: [
                        'Resguardar maquinaria',
                        'Evitar trabajos a campo abierto',
                        'Monitorear actualizaciones'
                    ]
                });
            }

            // Ola de calor (temp máxima > 38°C)
            if (dia.tempMaxima > 38) {
                alertas.push({
                    id: `calor_${dia.fecha.toISOString()}`,
                    tipo: 'ola_calor',
                    severidad: dia.tempMaxima > 42 ? 'roja' : 'naranja',
                    inicio: dia.fecha,
                    fin: new Date(dia.fecha.getTime() + 24 * 60 * 60 * 1000),
                    titulo: `Ola de calor: ${dia.tempMaxima}°C`,
                    descripcion: `Temperaturas extremadamente altas`,
                    recomendaciones: [
                        'Aumentar frecuencia de riego',
                        'Evitar aplicaciones en horas pico',
                        'Monitorear estrés hídrico'
                    ]
                });
            }
        }
    } catch (error) {
        console.error('Error detectando alertas:', error);
    }

    return alertas;
}

/**
 * Obtener historial climático (últimos N días)
 */
export async function obtenerHistorialClimatico(
    latitude: number,
    longitude: number,
    diasAtras: number = 30
): Promise<HistorialClimatico> {
    try {
        const fechaFin = new Date();
        const fechaInicio = new Date(fechaFin.getTime() - diasAtras * 24 * 60 * 60 * 1000);

        const params = new URLSearchParams({
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            start_date: fechaInicio.toISOString().split('T')[0],
            end_date: fechaFin.toISOString().split('T')[0],
            daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum',
            timezone: 'America/Argentina/Buenos_Aires'
        });

        // Usar el endpoint de archivo histórico de Open-Meteo
        const response = await fetch(`${OPEN_METEO_BASE}/forecast?${params}&past_days=${diasAtras}`);

        if (!response.ok) {
            throw new Error(`Error de Open-Meteo: ${response.status}`);
        }

        const data = await response.json();
        const daily = data.daily;

        const datosDiarios = daily.time.map((fecha: string, idx: number) => ({
            fecha: new Date(fecha),
            tempMax: daily.temperature_2m_max[idx],
            tempMin: daily.temperature_2m_min[idx],
            precipitacion: daily.precipitation_sum[idx] || 0
        }));

        const precipitacionAcumulada = datosDiarios.reduce((sum: number, d: any) => sum + d.precipitacion, 0);
        const diasConLluvia = datosDiarios.filter((d: any) => d.precipitacion > 0.1).length;
        const diasConHelada = datosDiarios.filter((d: any) => d.tempMin < 0).length;

        const todasTempMax = datosDiarios.map((d: any) => d.tempMax);
        const todasTempMin = datosDiarios.map((d: any) => d.tempMin);

        return {
            latitude,
            longitude,
            fechaDesde: fechaInicio,
            fechaHasta: fechaFin,
            precipitacionAcumulada: Math.round(precipitacionAcumulada * 10) / 10,
            diasConLluvia,
            diasConHelada,
            tempMaximaAbsoluta: Math.max(...todasTempMax),
            tempMinimaAbsoluta: Math.min(...todasTempMin),
            tempPromedio: (todasTempMax.reduce((a: number, b: number) => a + b, 0) +
                todasTempMin.reduce((a: number, b: number) => a + b, 0)) /
                (todasTempMax.length * 2),
            datosDiarios
        };
    } catch (error) {
        console.error('Error obteniendo historial:', error);
        throw error;
    }
}

// ============================================
// HELPERS
// ============================================

/**
 * Obtener descripción textual del código WMO
 */
function obtenerDescripcionWMO(code: number): string {
    const descripciones: Record<number, string> = {
        0: 'Cielo despejado',
        1: 'Mayormente despejado',
        2: 'Parcialmente nublado',
        3: 'Nublado',
        45: 'Niebla',
        48: 'Niebla con escarcha',
        51: 'Llovizna ligera',
        53: 'Llovizna moderada',
        55: 'Llovizna intensa',
        61: 'Lluvia ligera',
        63: 'Lluvia moderada',
        65: 'Lluvia fuerte',
        71: 'Nevada ligera',
        73: 'Nevada moderada',
        75: 'Nevada fuerte',
        80: 'Chubascos ligeros',
        81: 'Chubascos moderados',
        82: 'Chubascos fuertes',
        95: 'Tormenta',
        96: 'Tormenta con granizo ligero',
        99: 'Tormenta con granizo fuerte'
    };

    return descripciones[code] || 'Condiciones variables';
}

/**
 * Calcular Grados Día Acumulados (GDA)
 * Útil para seguimiento fenológico
 */
export function calcularGDA(
    datosDiarios: { tempMax: number; tempMin: number }[],
    tempBase: number = 10 // Temperatura base del cultivo
): number {
    return datosDiarios.reduce((gda, dia) => {
        const tempMedia = (dia.tempMax + dia.tempMin) / 2;
        const gradosDia = Math.max(0, tempMedia - tempBase);
        return gda + gradosDia;
    }, 0);
}
