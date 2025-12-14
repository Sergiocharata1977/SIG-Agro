'use client';

/**
 * Componente MapaEditor
 * Permite dibujar polígonos de campos y lotes usando Leaflet.Draw
 * 
 * Características:
 * - Dibujo de polígonos con herramientas de Leaflet.Draw
 * - Edición de polígonos existentes
 * - Callback con coordenadas GeoJSON
 * - Integración con Firestore
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import type { GeoJSONPolygon } from '@/types';

// Props del componente
interface MapaEditorProps {
    // Centro inicial (por defecto: Resistencia, Chaco)
    centro?: [number, number];
    zoom?: number;

    // Polígono existente para editar
    poligonoInicial?: GeoJSONPolygon | null;

    // Callback cuando se crea/modifica el polígono
    onPolygonChange?: (polygon: GeoJSONPolygon) => void;

    // Configuración
    altura?: string;
    tipoPoligono?: 'campo' | 'lote';
}

// Colores según tipo
const COLORES = {
    campo: {
        color: '#2563eb',      // Azul
        fillColor: '#3b82f6',
        fillOpacity: 0.3,
    },
    lote: {
        color: '#16a34a',      // Verde
        fillColor: '#22c55e',
        fillOpacity: 0.4,
    },
};

// Capas de tiles disponibles
const CAPAS = {
    osm: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap',
    },
    satellite: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '© Esri',
    },
};

export default function MapaEditor({
    centro = [-27.4534, -58.9867], // Resistencia, Chaco
    zoom = 13,
    poligonoInicial = null,
    onPolygonChange,
    altura = '400px',
    tipoPoligono = 'lote',
}: MapaEditorProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
    const [capaActual, setCapaActual] = useState<'osm' | 'satellite'>('satellite');
    const [isClient, setIsClient] = useState(false);

    // Detectar cliente
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Función para convertir layer a GeoJSON
    const layerToGeoJSON = useCallback((layer: L.Layer): GeoJSONPolygon | null => {
        if (layer instanceof L.Polygon) {
            const latLngs = layer.getLatLngs()[0] as L.LatLng[];
            const coordinates = latLngs.map((latLng) => [latLng.lng, latLng.lat]);
            // Cerrar el polígono
            if (coordinates.length > 0) {
                coordinates.push(coordinates[0]);
            }
            return {
                type: 'Polygon',
                coordinates: [coordinates],
            };
        }
        return null;
    }, []);

    // Inicializar mapa
    useEffect(() => {
        if (!isClient || !mapContainerRef.current || mapRef.current) return;

        // Importar Leaflet.Draw dinámicamente
        import('leaflet-draw').then(() => {
            // Crear mapa
            const map = L.map(mapContainerRef.current!, {
                center: centro,
                zoom: zoom,
            });
            mapRef.current = map;

            // Agregar capa de tiles inicial
            const tileLayer = L.tileLayer(CAPAS[capaActual].url, {
                attribution: CAPAS[capaActual].attribution,
            });
            tileLayer.addTo(map);

            // Grupo para elementos dibujados
            const drawnItems = new L.FeatureGroup();
            drawnItemsRef.current = drawnItems;
            map.addLayer(drawnItems);

            // Si hay polígono inicial, agregarlo
            if (poligonoInicial && poligonoInicial.coordinates) {
                const coords = poligonoInicial.coordinates[0].map(
                    (coord) => [coord[1], coord[0]] as [number, number]
                );
                const polygon = L.polygon(coords, COLORES[tipoPoligono]);
                drawnItems.addLayer(polygon);

                // Centrar mapa en el polígono
                map.fitBounds(polygon.getBounds(), { padding: [50, 50] });
            }

            // Configurar controles de dibujo
            const drawControl = new L.Control.Draw({
                position: 'topright',
                draw: {
                    polygon: {
                        allowIntersection: false,
                        showArea: true,
                        shapeOptions: COLORES[tipoPoligono],
                    },
                    polyline: false,
                    circle: false,
                    rectangle: false,
                    marker: false,
                    circlemarker: false,
                },
                edit: {
                    featureGroup: drawnItems,
                    remove: true,
                },
            });
            map.addControl(drawControl);

            // Evento: Polígono creado
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            map.on(L.Draw.Event.CREATED, (event: any) => {
                const layer = event.layer;

                // Limpiar polígonos anteriores (solo 1 polígono por vez)
                drawnItems.clearLayers();
                drawnItems.addLayer(layer);

                // Callback con GeoJSON
                const geoJSON = layerToGeoJSON(layer);
                if (geoJSON && onPolygonChange) {
                    onPolygonChange(geoJSON);
                }
            });

            // Evento: Polígono editado
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            map.on(L.Draw.Event.EDITED, (event: any) => {
                const layers = event.layers;
                layers.eachLayer((layer: L.Layer) => {
                    const geoJSON = layerToGeoJSON(layer);
                    if (geoJSON && onPolygonChange) {
                        onPolygonChange(geoJSON);
                    }
                });
            });

            // Evento: Polígono eliminado
            map.on(L.Draw.Event.DELETED, () => {
                if (onPolygonChange) {
                    onPolygonChange({ type: 'Polygon', coordinates: [] });
                }
            });
        });

        // Cleanup
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [isClient, centro, zoom, poligonoInicial, tipoPoligono, capaActual, layerToGeoJSON, onPolygonChange]);

    // Cambiar capa de tiles
    const cambiarCapa = (nuevaCapa: 'osm' | 'satellite') => {
        if (!mapRef.current) return;

        // Remover capas de tiles existentes
        mapRef.current.eachLayer((layer) => {
            if (layer instanceof L.TileLayer) {
                mapRef.current?.removeLayer(layer);
            }
        });

        // Agregar nueva capa
        L.tileLayer(CAPAS[nuevaCapa].url, {
            attribution: CAPAS[nuevaCapa].attribution,
        }).addTo(mapRef.current);

        setCapaActual(nuevaCapa);
    };

    if (!isClient) {
        return (
            <div
                style={{ height: altura }}
                className="bg-gray-200 animate-pulse flex items-center justify-center rounded-lg"
            >
                <span className="text-gray-500">Cargando editor de mapa...</span>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Selector de capa */}
            <div className="absolute top-2 right-2 z-[1000] bg-white rounded-lg shadow-md p-1">
                <select
                    value={capaActual}
                    onChange={(e) => cambiarCapa(e.target.value as 'osm' | 'satellite')}
                    className="text-sm border-0 bg-transparent focus:ring-0 cursor-pointer"
                >
                    <option value="satellite">Satélite</option>
                    <option value="osm">Mapa</option>
                </select>
            </div>

            {/* Instrucciones */}
            <div className="absolute bottom-2 left-2 z-[1000] bg-white/90 rounded-lg shadow-md px-3 py-2 text-xs text-gray-600 max-w-xs">
                <strong>Instrucciones:</strong>
                <p>• Click en el ícono de polígono (derecha) para dibujar</p>
                <p>• Click en cada vértice, doble-click para terminar</p>
            </div>

            {/* Contenedor del mapa */}
            <div
                ref={mapContainerRef}
                style={{ height: altura }}
                className="rounded-lg overflow-hidden border border-gray-300"
            />
        </div>
    );
}
