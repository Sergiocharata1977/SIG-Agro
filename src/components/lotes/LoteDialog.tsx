'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lote, Campo, GeoJSONPolygon, EstadoLote } from '@/types/agro';
import { crearLote, actualizarLote } from '@/services/campos';
import { useAuth } from '@/contexts/AuthContext';
import MapaEditor from '@/components/mapa/MapaEditor';

interface LoteDialogProps {
    campo: Campo;
    lote?: Lote;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export default function LoteDialog({ campo, lote, open, onOpenChange, onSuccess }: LoteDialogProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [poligono, setPoligono] = useState<GeoJSONPolygon | null>(null);
    const [areaCalculada, setAreaCalculada] = useState<number>(0);

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<Partial<Lote>>({
        defaultValues: {
            nombre: '',
            estado: 'barbecho',
            cultivoActual: '',
            campaniaActual: '',
        }
    });

    useEffect(() => {
        if (lote) {
            reset(lote);
            setPoligono(lote.poligono);
            setAreaCalculada(lote.superficie);
        } else {
            reset({
                nombre: '',
                estado: 'barbecho',
                cultivoActual: '',
                campaniaActual: '',
            });
            setPoligono(null);
            setAreaCalculada(0);
        }
    }, [lote, reset, open]);

    const handlePolygonCreated = (poly: GeoJSONPolygon, area: number) => {
        setPoligono(poly);
        setAreaCalculada(area);
        setValue('superficie', area);
    };

    const onSubmit = async (data: Partial<Lote>) => {
        if (!user?.organizationId || !poligono) {
            alert('Debes dibujar el lote en el mapa');
            return;
        }

        try {
            setLoading(true);

            const loteData = {
                ...data,
                campoId: campo.id,
                productorId: user.uid,
                poligono: poligono,
                superficie: areaCalculada,
                activo: true
            };

            if (lote?.id) {
                await actualizarLote(user.organizationId, campo.id, lote.id, loteData);
            } else {
                await crearLote(user.organizationId, campo.id, loteData as any);
            }

            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error('Error al guardar lote:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calcular centro del mapa basado en el campo
    const centroMapa: [number, number] | undefined = campo.perimetro
        ? [campo.perimetro.coordinates[0][0][1], campo.perimetro.coordinates[0][0][0]]
        : undefined;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[900px]">
                <DialogHeader>
                    <DialogTitle>{lote ? 'Editar Lote' : 'Nuevo Lote'}</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Columna Izquierda: Formulario */}
                    <form id="lote-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="nombre">Nombre del Lote</Label>
                            <Input
                                id="nombre"
                                {...register('nombre', { required: 'El nombre es obligatorio' })}
                                placeholder="Ej: Lote Norte"
                            />
                            {errors.nombre && <p className="text-sm text-red-500">{errors.nombre.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="estado">Estado Actual</Label>
                            <Select
                                onValueChange={(val) => setValue('estado', val as EstadoLote)}
                                defaultValue={lote?.estado || 'barbecho'}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="barbecho">Barbecho</SelectItem>
                                    <SelectItem value="sembrado">Sembrado</SelectItem>
                                    <SelectItem value="desarrollo">En Desarrollo</SelectItem>
                                    <SelectItem value="cosecha">En Cosecha</SelectItem>
                                    <SelectItem value="descanso">Descanso</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {watch('estado') === 'sembrado' && (
                            <div className="space-y-2">
                                <Label htmlFor="cultivo">Cultivo</Label>
                                <Input
                                    id="cultivo"
                                    {...register('cultivoActual')}
                                    placeholder="Ej: Soja"
                                />
                            </div>
                        )}

                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <Label>Superficie Calculada</Label>
                            <div className="text-2xl font-bold text-green-600">
                                {areaCalculada.toFixed(2)} ha
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Calculada automáticamente al dibujar
                            </p>
                        </div>
                    </form>

                    {/* Columna Derecha: Mapa */}
                    <div className="h-[400px] border border-gray-300 rounded-lg overflow-hidden">
                        <MapaEditor
                            centro={centroMapa}
                            zoom={13}
                            poligonoInicial={poligono || undefined}
                            onPolygonCreated={handlePolygonCreated}
                            onPolygonEdited={handlePolygonCreated}
                        // Pasamos el perímetro del campo como referencia visual (opcional si MapaEditor lo soportara)
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button type="submit" form="lote-form" disabled={loading} className="bg-green-600 hover:bg-green-700">
                        {loading ? 'Guardando...' : lote ? 'Actualizar Lote' : 'Crear Lote'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
