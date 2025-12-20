'use client';

import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Wind, Droplets, Thermometer, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    obtenerClimaActual,
    obtenerPronostico7Dias,
    detectarAlertasClimaticas
} from '@/services/weather';
import type { DatosClimaActual, PronosticoDiario, AlertaClimatica } from '@/types/weather';
import { CONDICION_CLIMA_CONFIG, SEVERIDAD_ALERTA_CONFIG } from '@/types/weather';

interface WeatherWidgetProps {
    latitude: number;
    longitude: number;
    nombreLugar?: string;
    showPronostico?: boolean;
    showAlertas?: boolean;
}

export default function WeatherWidget({
    latitude,
    longitude,
    nombreLugar = 'Mi Campo',
    showPronostico = true,
    showAlertas = true
}: WeatherWidgetProps) {
    const [climaActual, setClimaActual] = useState<DatosClimaActual | null>(null);
    const [pronostico, setPronostico] = useState<PronosticoDiario[]>([]);
    const [alertas, setAlertas] = useState<AlertaClimatica[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const cargarDatos = async () => {
        setLoading(true);
        setError(null);

        try {
            const [actual, forecast, alerts] = await Promise.all([
                obtenerClimaActual(latitude, longitude),
                showPronostico ? obtenerPronostico7Dias(latitude, longitude) : Promise.resolve([]),
                showAlertas ? detectarAlertasClimaticas(latitude, longitude) : Promise.resolve([])
            ]);

            setClimaActual(actual);
            setPronostico(forecast);
            setAlertas(alerts);
        } catch (err) {
            console.error('Error cargando clima:', err);
            setError('Error al cargar datos meteorológicos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, [latitude, longitude]);

    if (loading) {
        return (
            <Card className="p-4">
                <div className="flex items-center justify-center h-32">
                    <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="p-4">
                <div className="text-center text-red-500">
                    <p>{error}</p>
                    <Button variant="outline" size="sm" onClick={cargarDatos} className="mt-2">
                        Reintentar
                    </Button>
                </div>
            </Card>
        );
    }

    if (!climaActual) return null;

    const condicionConfig = CONDICION_CLIMA_CONFIG[climaActual.condicion];

    return (
        <Card className="overflow-hidden">
            {/* Alertas climáticas */}
            {alertas.length > 0 && (
                <div className="bg-amber-50 border-b border-amber-200 p-3">
                    <div className="flex items-center gap-2 text-amber-700 font-medium mb-2">
                        <AlertTriangle className="h-4 w-4" />
                        {alertas.length} alerta{alertas.length > 1 ? 's' : ''} activa{alertas.length > 1 ? 's' : ''}
                    </div>
                    {alertas.slice(0, 2).map(alerta => {
                        const severidadConfig = SEVERIDAD_ALERTA_CONFIG[alerta.severidad];
                        return (
                            <div
                                key={alerta.id}
                                className={`text-sm p-2 rounded ${severidadConfig.colorBg} ${severidadConfig.color} mb-1`}
                            >
                                {alerta.titulo}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Clima actual */}
            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="font-semibold text-gray-900">{nombreLugar}</h3>
                        <p className="text-sm text-gray-500">{climaActual.descripcion}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={cargarDatos}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-6">
                    {/* Temperatura principal */}
                    <div className="flex items-center gap-3">
                        <span className="text-5xl">{condicionConfig?.icono || '🌤️'}</span>
                        <div>
                            <div className="text-4xl font-bold text-gray-900">
                                {Math.round(climaActual.temperatura)}°
                            </div>
                            <div className="text-sm text-gray-500">
                                Sensación: {Math.round(climaActual.sensacionTermica)}°
                            </div>
                        </div>
                    </div>

                    {/* Datos adicionales */}
                    <div className="flex-1 grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                            <Droplets className="h-4 w-4 text-blue-500" />
                            <span>{climaActual.humedadRelativa}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Wind className="h-4 w-4 text-gray-500" />
                            <span>{Math.round(climaActual.velocidadViento)} km/h</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CloudRain className="h-4 w-4 text-blue-400" />
                            <span>{climaActual.precipitacionHora} mm</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Thermometer className="h-4 w-4 text-red-400" />
                            <span>{climaActual.presionAtmosferica} hPa</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pronóstico 7 días */}
            {showPronostico && pronostico.length > 0 && (
                <div className="border-t px-4 py-3 bg-gray-50">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Próximos 7 días</h4>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                        {pronostico.map((dia, idx) => {
                            const diaConfig = CONDICION_CLIMA_CONFIG[dia.condicion];
                            const diaSemana = dia.fecha.toLocaleDateString('es', { weekday: 'short' });

                            return (
                                <div
                                    key={idx}
                                    className="flex-shrink-0 text-center p-2 bg-white rounded-lg border min-w-[70px]"
                                >
                                    <div className="text-xs text-gray-500 capitalize">{diaSemana}</div>
                                    <div className="text-xl my-1">{diaConfig?.icono || '🌤️'}</div>
                                    <div className="text-sm font-medium">
                                        {Math.round(dia.tempMaxima)}°
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {Math.round(dia.tempMinima)}°
                                    </div>
                                    {dia.precipitacionTotal > 0 && (
                                        <div className="text-xs text-blue-500 mt-1">
                                            {dia.precipitacionTotal}mm
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </Card>
    );
}
