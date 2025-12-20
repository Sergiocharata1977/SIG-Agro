'use client';

import { useState, useRef } from 'react';
import { Camera, MapPin, AlertTriangle, X, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    TipoObservacion,
    SeveridadProblema,
    TIPOS_OBSERVACION_CONFIG,
    SEVERIDAD_CONFIG
} from '@/types/scouting';
import { crearObservacion, subirFotoScouting, obtenerUbicacionActual } from '@/services/scouting';
import { useAuth } from '@/contexts/AuthContext';

interface ScoutingFormProps {
    orgId: string;
    onSuccess?: () => void;
    onCancel?: () => void;
    initialPlotId?: string;
    initialFieldId?: string;
}

export default function ScoutingForm({
    orgId,
    onSuccess,
    onCancel,
    initialPlotId,
    initialFieldId
}: ScoutingFormProps) {
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Estado del formulario
    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [tipo, setTipo] = useState<TipoObservacion>('estado_general');
    const [severidad, setSeveridad] = useState<SeveridadProblema>('leve');
    const [especie, setEspecie] = useState('');
    const [accionRecomendada, setAccionRecomendada] = useState('');
    const [urgente, setUrgente] = useState(false);

    // Estado de ubicación
    const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
    const [obteniendoUbicacion, setObteniendoUbicacion] = useState(false);
    const [errorUbicacion, setErrorUbicacion] = useState<string | null>(null);

    // Estado de fotos
    const [fotos, setFotos] = useState<{ file: File; preview: string }[]>([]);

    // Estado de envío
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Obtener ubicación
    const handleObtenerUbicacion = async () => {
        setObteniendoUbicacion(true);
        setErrorUbicacion(null);

        try {
            const position = await obtenerUbicacionActual();
            setUbicacion({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy
            });
        } catch (err) {
            setErrorUbicacion('No se pudo obtener la ubicación. Verifica los permisos de GPS.');
            console.error('Error de geolocalización:', err);
        } finally {
            setObteniendoUbicacion(false);
        }
    };

    // Manejar captura de foto
    const handleCapturarFoto = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const nuevasFotos = Array.from(files).map(file => ({
            file,
            preview: URL.createObjectURL(file)
        }));

        setFotos(prev => [...prev, ...nuevasFotos]);

        // Si no hay ubicación, intentar obtenerla
        if (!ubicacion) {
            handleObtenerUbicacion();
        }
    };

    const handleRemoverFoto = (index: number) => {
        setFotos(prev => {
            const nuevas = [...prev];
            URL.revokeObjectURL(nuevas[index].preview);
            nuevas.splice(index, 1);
            return nuevas;
        });
    };

    // Enviar formulario
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!ubicacion) {
            setError('Debes obtener la ubicación antes de guardar');
            return;
        }

        if (!titulo.trim()) {
            setError('El título es requerido');
            return;
        }

        if (!user) {
            setError('Debes estar autenticado');
            return;
        }

        setEnviando(true);
        setError(null);

        try {
            // Crear observación
            const observacion = await crearObservacion(orgId, {
                latitude: ubicacion.lat,
                longitude: ubicacion.lng,
                accuracy: ubicacion.accuracy,
                fieldId: initialFieldId,
                plotId: initialPlotId,
                tipo,
                severidad,
                titulo: titulo.trim(),
                descripcion: descripcion.trim(),
                especie: especie.trim() || undefined,
                accionRecomendada: accionRecomendada.trim() || undefined,
                urgente,
                estado: 'pendiente',
                fotos: [],
                createdBy: user.uid
            }, user.uid);

            // Subir fotos
            if (fotos.length > 0) {
                for (const foto of fotos) {
                    await subirFotoScouting(orgId, observacion.id, foto.file, {
                        latitude: ubicacion.lat,
                        longitude: ubicacion.lng,
                        accuracy: ubicacion.accuracy
                    });
                }
            }

            // Limpiar previews
            fotos.forEach(f => URL.revokeObjectURL(f.preview));

            onSuccess?.();
        } catch (err) {
            console.error('Error al guardar observación:', err);
            setError('Error al guardar la observación. Intenta nuevamente.');
        } finally {
            setEnviando(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Ubicación */}
            <div className="space-y-2">
                <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Ubicación GPS
                </Label>

                {ubicacion ? (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-green-700">
                            <Check className="h-4 w-4" />
                            <span className="font-medium">Ubicación obtenida</span>
                        </div>
                        <p className="text-sm text-green-600 mt-1">
                            {ubicacion.lat.toFixed(6)}, {ubicacion.lng.toFixed(6)}
                            {ubicacion.accuracy && ` (±${ubicacion.accuracy.toFixed(0)}m)`}
                        </p>
                    </div>
                ) : (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleObtenerUbicacion}
                        disabled={obteniendoUbicacion}
                        className="w-full"
                    >
                        {obteniendoUbicacion ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Obteniendo ubicación...
                            </>
                        ) : (
                            <>
                                <MapPin className="h-4 w-4 mr-2" />
                                Obtener Ubicación Actual
                            </>
                        )}
                    </Button>
                )}

                {errorUbicacion && (
                    <p className="text-sm text-red-500">{errorUbicacion}</p>
                )}
            </div>

            {/* Fotos */}
            <div className="space-y-2">
                <Label className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Fotos
                </Label>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                />

                <div className="flex flex-wrap gap-2">
                    {fotos.map((foto, index) => (
                        <div key={index} className="relative w-20 h-20">
                            <img
                                src={foto.preview}
                                alt={`Foto ${index + 1}`}
                                className="w-full h-full object-cover rounded-lg"
                            />
                            <button
                                type="button"
                                onClick={() => handleRemoverFoto(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={handleCapturarFoto}
                        className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                        <Camera className="h-6 w-6 text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Tipo de observación */}
            <div className="space-y-2">
                <Label>Tipo de Observación</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as TipoObservacion)}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.entries(TIPOS_OBSERVACION_CONFIG).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                                <span className="flex items-center gap-2">
                                    <span>{config.icon}</span>
                                    <span>{config.label}</span>
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Severidad */}
            <div className="space-y-2">
                <Label>Severidad</Label>
                <Select value={severidad} onValueChange={(v) => setSeveridad(v as SeveridadProblema)}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.entries(SEVERIDAD_CONFIG).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                                <span className={config.color}>{config.label}</span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Título */}
            <div className="space-y-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input
                    id="titulo"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ej: Chinches en cabecera norte"
                    required
                />
            </div>

            {/* Descripción */}
            <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <textarea
                    id="descripcion"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Describe lo que observas..."
                    className="w-full min-h-[100px] px-3 py-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
            </div>

            {/* Especie (opcional) */}
            <div className="space-y-2">
                <Label htmlFor="especie">Especie identificada (opcional)</Label>
                <Input
                    id="especie"
                    value={especie}
                    onChange={(e) => setEspecie(e.target.value)}
                    placeholder="Ej: Nezara viridula"
                />
            </div>

            {/* Acción recomendada */}
            <div className="space-y-2">
                <Label htmlFor="accion">Acción recomendada (opcional)</Label>
                <Input
                    id="accion"
                    value={accionRecomendada}
                    onChange={(e) => setAccionRecomendada(e.target.value)}
                    placeholder="Ej: Aplicar insecticida"
                />
            </div>

            {/* Urgente */}
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="urgente"
                    checked={urgente}
                    onChange={(e) => setUrgente(e.target.checked)}
                    className="h-4 w-4"
                />
                <Label htmlFor="urgente" className="flex items-center gap-2 cursor-pointer">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    Marcar como URGENTE
                </Label>
            </div>

            {/* Error */}
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                </div>
            )}

            {/* Botones */}
            <div className="flex gap-3">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                        Cancelar
                    </Button>
                )}
                <Button type="submit" disabled={enviando || !ubicacion} className="flex-1">
                    {enviando ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Guardando...
                        </>
                    ) : (
                        'Guardar Observación'
                    )}
                </Button>
            </div>
        </form>
    );
}
