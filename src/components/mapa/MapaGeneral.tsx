'use client';

/**
 * Componente MapaGeneral
 * Mapa interactivo con Leaflet para dibujar campos y lotes
 * 
 * Funcionalidades:
 * - Visualizar campos y lotes como polígonos
 * - Dibujar nuevos polígonos
 * - Editar polígonos existentes
 * - Capas satelitales (OpenStreetMap, Satellite)
 */

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

import type { GeoJSONPolygon, Campo, Lote } from '@/types';

// Importar Leaflet de forma dinámica para SSR
const MapContainer = dynamic(
    () => import('react-leaflet').then((mod) => mod.MapContainer),
    { ssr: false }
);

const TileLayer = dynamic(
    () => import('react-leaflet').then((mod) => mod.TileLayer),
    { ssr: false }
);

const Polygon = dynamic(
    () => import('react-leaflet').then((mod) => mod.Polygon),
    { ssr: false }
);

const Popup = dynamic(
    () => import('react-leaflet').then((mod) => mod.Popup),
    { ssr: false }
);

// Props del componente
interface MapaGeneralProps {
    // Centro inicial (por defecto: Resistencia, Chaco)
    centro?: [number, number];
    zoom?: number;

    // Datos a mostrar
    campos?: Campo[];
    lotes?: Lote[];

    // Callbacks
    onCampoClick?: (campo: Campo) => void;
    onLoteClick?: (lote: Lote) => void;
    onPolygonCreated?: (polygon: GeoJSONPolygon) => void;

    // Configuración
    modoEdicion?: boolean;
    altura?: string;
}

// Colores para campos y lotes
const COLORES = {
    campo: {
        color: '#2563eb',      // Azul
        fillColor: '#3b82f6',
        fillOpacity: 0.2,
    },
    lote: {
        color: '#16a34a',      // Verde
        fillColor: '#22c55e',
        fillOpacity: 0.3,
    },
    loteSeleccionado: {
        color: '#dc2626',      // Rojo
        fillColor: '#ef4444',
        fillOpacity: 0.4,
    },
};

// Capas de tiles disponibles
const CAPAS = {
    osm: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors',
        nombre: 'Calles',
    },
    satellite: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '© Esri',
        nombre: 'Satélite',
    },
    terrain: {
        url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        attribution: '© OpenTopoMap',
        nombre: 'Terreno',
    },
    // NASA GIBS MODIS NDVI - Gratuito sin autenticación
    modis_ndvi: {
        url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDVI_8Day/default/2024-01-01/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png',
        attribution: '© NASA GIBS MODIS',
        nombre: '🌿 NDVI (MODIS)',
    },
};

export default function MapaGeneral({
    centro = [-27.4534, -58.9867], // Resistencia, Chaco
    zoom = 10,
    campos = [],
    lotes = [],
    onCampoClick,
    onLoteClick,
    onPolygonCreated,
    modoEdicion = false,
    altura = '100%',
}: MapaGeneralProps) {
    const [capaActiva, setCapaActiva] = useState<keyof typeof CAPAS>('satellite');
    const [loteSeleccionado, setLoteSeleccionado] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);

    // Verificar si estamos en el cliente
    useEffect(() => {
        setIsClient(true);
        return () => setIsClient(false);
    }, []);

    // Convertir coordenadas GeoJSON a formato Leaflet
    const geoJsonToLeaflet = (polygon: GeoJSONPolygon): [number, number][] => {
        return polygon.coordinates[0].map((coord) => [coord[1], coord[0]]);
    };

    // Manejar click en lote
    const handleLoteClick = (lote: Lote) => {
        setLoteSeleccionado(lote.id);
        onLoteClick?.(lote);
    };

    if (!isClient) {
        return (
            <div
                style={{ height: altura }}
                className="bg-gray-200 animate-pulse flex items-center justify-center rounded-lg"
            >
                <span className="text-gray-500">Cargando mapa...</span>
            </div>
        );
    }

    return (
        <div className="relative rounded-lg overflow-hidden shadow-lg h-full">
            {/* Selector de capa */}
            <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-md p-2">
                <select
                    value={capaActiva}
                    onChange={(e) => setCapaActiva(e.target.value as keyof typeof CAPAS)}
                    className="text-sm border-0 focus:ring-2 focus:ring-green-500 rounded cursor-pointer"
                >
                    {Object.entries(CAPAS).map(([key, value]) => (
                        <option key={key} value={key}>
                            {value.nombre}
                        </option>
                    ))}
                </select>
            </div>

            {/* Mapa */}
            <MapContainer
                center={centro}
                zoom={zoom}
                style={{ height: altura, width: '100%' }}
                scrollWheelZoom={true}
            >
                {/* Capa de tiles */}
                <TileLayer
                    url={CAPAS[capaActiva].url}
                    attribution={CAPAS[capaActiva].attribution}
                />

                {/* Renderizar campos */}
                {campos.map((campo) => {
                    if (!campo.perimetro) return null;

                    return (
                        <Polygon
                            key={`campo-${campo.id}`}
                            positions={geoJsonToLeaflet(campo.perimetro)}
                            pathOptions={COLORES.campo}
                            eventHandlers={{
                                click: () => onCampoClick?.(campo),
                            }}
                        >
                            <Popup>
                                <div className="p-2">
                                    <h3 className="font-bold text-lg">{campo.nombre}</h3>
                                    <p className="text-sm text-gray-600">
                                        {campo.superficieTotal} ha
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {campo.localidad}, {campo.departamento}
                                    </p>
                                </div>
                            </Popup>
                        </Polygon>
                    );
                })}

                {/* Renderizar lotes */}
                {lotes.map((lote) => {
                    if (!lote.poligono) return null;

                    const esSeleccionado = lote.id === loteSeleccionado;
                    const estilo = esSeleccionado ? COLORES.loteSeleccionado : COLORES.lote;

                    return (
                        <Polygon
                            key={`lote-${lote.id}`}
                            positions={geoJsonToLeaflet(lote.poligono)}
                            pathOptions={estilo}
                            eventHandlers={{
                                click: () => handleLoteClick(lote),
                            }}
                        >
                            <Popup>
                                <div className="p-2">
                                    <h3 className="font-bold">{lote.nombre}</h3>
                                    <p className="text-sm">{lote.superficie.toFixed(2)} ha</p>
                                    {lote.cultivoActual && (
                                        <p className="text-sm text-green-600">
                                            🌱 {lote.cultivoActual}
                                        </p>
                                    )}
                                    <span className={`text-xs px-2 py-1 rounded ${lote.estado === 'sembrado' ? 'bg-green-100 text-green-800' :
                                        lote.estado === 'cosecha' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {lote.estado}
                                    </span>
                                </div>
                            </Popup>
                        </Polygon>
                    );
                })}
            </MapContainer>

            {/* Leyenda */}
            <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-lg shadow-md p-3">
                <h4 className="text-xs font-bold mb-2 text-gray-700">Leyenda</h4>
                <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORES.campo.fillColor, opacity: 0.5 }} />
                    <span>Campos</span>
                </div>
                <div className="flex items-center gap-2 text-xs mt-1">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORES.lote.fillColor, opacity: 0.5 }} />
                    <span>Lotes</span>
                </div>
            </div>

            {/* Indicador de modo edición */}
            {modoEdicion && (
                <div className="absolute top-4 left-4 z-[1000] bg-yellow-500 text-white px-3 py-1 rounded-lg text-sm font-medium">
                    ✏️ Modo Edición
                </div>
            )}
        </div>
    );
}
