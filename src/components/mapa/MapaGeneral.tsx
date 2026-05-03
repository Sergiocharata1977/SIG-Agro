'use client';

/**
 * Componente MapaGeneral
 * Mapa interactivo con Leaflet para dibujar campos y lotes
 *
 * Funcionalidades:
 * - Visualizar campos y lotes como poligonos
 * - Dibujar nuevos poligonos
 * - Editar poligonos existentes
 * - Capas satelitales (OpenStreetMap, Satellite)
 */

import { useState, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Sprout } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

import type { GeoJSONPolygon, Campo, Lote } from '@/types';

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

interface MapaGeneralProps {
    centro?: [number, number];
    zoom?: number;
    campos?: Campo[];
    lotes?: Lote[];
    onCampoClick?: (campo: Campo) => void;
    onLoteClick?: (lote: Lote) => void;
    _onPolygonCreated?: (polygon: GeoJSONPolygon) => void;
    modoEdicion?: boolean;
    altura?: string;
}

const COLORES = {
    campo: {
        color: '#2563eb',
        fillColor: '#3b82f6',
        fillOpacity: 0.2,
    },
    lote: {
        color: '#16a34a',
        fillColor: '#22c55e',
        fillOpacity: 0.3,
    },
    loteSeleccionado: {
        color: '#dc2626',
        fillColor: '#ef4444',
        fillOpacity: 0.4,
    },
};

const CAPAS = {
    osm: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors',
        nombre: 'Calles',
    },
    satellite: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.png',
        attribution: '© Esri',
        nombre: 'Satelite',
    },
    terrain: {
        url: 'https://{s}.tile.opentopomap.org/{z}/{y}/{x}.png',
        attribution: '© OpenTopoMap',
        nombre: 'Terreno',
    },
    modis_ndvi: {
        url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDVI_8Day/default/2024-01-01/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png',
        attribution: '© NASA GIBS MODIS',
        nombre: 'NDVI (MODIS)',
    },
};

export default function MapaGeneral({
    centro = [-27.4534, -58.9867],
    zoom = 10,
    campos = [],
    lotes = [],
    onCampoClick,
    onLoteClick,
    _onPolygonCreated,
    modoEdicion = false,
    altura = '100%',
}: MapaGeneralProps) {
    const [capaActiva, setCapaActiva] = useState<keyof typeof CAPAS>('satellite');
    const [loteSeleccionado, setLoteSeleccionado] = useState<string | null>(null);

    const isClient = useSyncExternalStore(
        () => () => {},
        () => true,
        () => false
    );

    const geoJsonToLeaflet = (polygon: GeoJSONPolygon): [number, number][] => {
        return polygon.coordinates[0].map((coord) => [coord[1], coord[0]]);
    };

    const handleLoteClick = (lote: Lote) => {
        setLoteSeleccionado(lote.id);
        onLoteClick?.(lote);
    };

    if (!isClient) {
        return (
            <div
                style={{ height: altura }}
                className="flex animate-pulse items-center justify-center rounded-lg bg-gray-200"
            >
                <span className="text-gray-500">Cargando mapa...</span>
            </div>
        );
    }

    return (
        <div className="relative isolate h-full overflow-hidden rounded-lg shadow-lg">
            <div className="absolute right-4 top-4 z-[1000] rounded-lg bg-white p-2 shadow-md">
                <select
                    value={capaActiva}
                    onChange={(e) => setCapaActiva(e.target.value as keyof typeof CAPAS)}
                    className="cursor-pointer rounded border-0 text-sm focus:ring-2 focus:ring-green-500"
                >
                    {Object.entries(CAPAS).map(([key, value]) => (
                        <option key={key} value={key}>
                            {value.nombre}
                        </option>
                    ))}
                </select>
            </div>

            <MapContainer
                key={`map-${centro[0]}-${centro[1]}-${zoom}`}
                center={centro}
                zoom={zoom}
                style={{ height: altura, width: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    url={CAPAS[capaActiva].url}
                    attribution={CAPAS[capaActiva].attribution}
                />

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
                                <div className="sigagro-map-popup">
                                    <p className="sigagro-map-popup__eyebrow">Campo</p>
                                    <h3 className="sigagro-map-popup__title">{campo.nombre}</h3>
                                    <div className="sigagro-map-popup__meta">
                                        <span className="sigagro-map-popup__pill">{campo.superficieTotal} ha</span>
                                    </div>
                                    <p className="sigagro-map-popup__detail">
                                        <MapPin className="h-4 w-4" />
                                        <span>{campo.localidad}, {campo.departamento}</span>
                                    </p>
                                </div>
                            </Popup>
                        </Polygon>
                    );
                })}

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
                                <div className="sigagro-map-popup">
                                    <p className="sigagro-map-popup__eyebrow">Lote</p>
                                    <h3 className="sigagro-map-popup__title">{lote.nombre}</h3>
                                    <div className="sigagro-map-popup__meta">
                                        <span className="sigagro-map-popup__pill">{lote.superficie.toFixed(2)} ha</span>
                                        <span
                                            className={`sigagro-map-popup__status ${
                                                lote.estado === 'sembrado'
                                                    ? 'sigagro-map-popup__status--ok'
                                                    : lote.estado === 'cosecha'
                                                      ? 'sigagro-map-popup__status--warn'
                                                      : 'sigagro-map-popup__status--idle'
                                            }`}
                                        >
                                            {lote.estado}
                                        </span>
                                    </div>
                                    {lote.cultivoActual && (
                                        <p className="sigagro-map-popup__detail">
                                            <Sprout className="h-4 w-4" />
                                            <span>{lote.cultivoActual}</span>
                                        </p>
                                    )}
                                </div>
                            </Popup>
                        </Polygon>
                    );
                })}
            </MapContainer>

            <div className="absolute bottom-4 left-4 z-[1000] rounded-lg bg-white p-3 shadow-md">
                <h4 className="mb-2 text-xs font-bold text-gray-700">Leyenda</h4>
                <div className="flex items-center gap-2 text-xs">
                    <div
                        className="h-4 w-4 rounded"
                        style={{ backgroundColor: COLORES.campo.fillColor, opacity: 0.5 }}
                    />
                    <span>Campos</span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs">
                    <div
                        className="h-4 w-4 rounded"
                        style={{ backgroundColor: COLORES.lote.fillColor, opacity: 0.5 }}
                    />
                    <span>Lotes</span>
                </div>
            </div>

            {modoEdicion && (
                <div className="absolute left-4 top-4 z-[1000] rounded-lg bg-yellow-500 px-3 py-1 text-sm font-medium text-white">
                    Modo edicion
                </div>
            )}
        </div>
    );
}
