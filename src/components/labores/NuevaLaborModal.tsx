'use client';

/**
 * Modal para registrar una nueva labor agrÃ­cola en un lote
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BaseButton as Button } from '@/components/design-system';
import { BaseInput as Input } from '@/components/design-system';
import { Label } from '@/components/ui/label';
import { BaseSelect as Select, BaseSelectContent as SelectContent, BaseSelectItem as SelectItem, BaseSelectTrigger as SelectTrigger, BaseSelectValue as SelectValue } from '@/components/design-system';
import { TIPOS_LABOR, PRODUCTOS_COMUNES, crearEventoLote } from '@/services/labores';
import type { TipoEvento, ProductoAplicado } from '@/types';

interface NuevaLaborModalProps {
    isOpen: boolean;
    onClose: () => void;
    orgId: string;
    campoId: string;
    loteId: string;
    loteName: string;
    onSuccess?: () => void;
}

export default function NuevaLaborModal({
    isOpen,
    onClose,
    orgId,
    campoId,
    loteId,
    loteName,
    onSuccess
}: NuevaLaborModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form state
    const [tipo, setTipo] = useState<TipoEvento>('observacion');
    const [descripcion, setDescripcion] = useState('');
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [superficieAplicada, setSuperficieAplicada] = useState('');
    const [observaciones, setObservaciones] = useState('');

    // Para siembra
    const [cultivo, setCultivo] = useState('');
    const [variedad, setVariedad] = useState('');
    const [densidad, setDensidad] = useState('');

    // Para cosecha
    const [rendimiento, setRendimiento] = useState('');
    const [humedad, setHumedad] = useState('');

    // Para fertilizaciÃ³n/pulverizaciÃ³n
    const [productos, setProductos] = useState<ProductoAplicado[]>([]);
    const [productoSeleccionado, setProductoSeleccionado] = useState('');
    const [dosisProducto, setDosisProducto] = useState('');

    // Condiciones climÃ¡ticas
    const [temperatura, setTemperatura] = useState('');
    const [humedadAmb, setHumedadAmb] = useState('');
    const [viento, setViento] = useState('');

    const tipoConfig = TIPOS_LABOR[tipo];

    const agregarProducto = () => {
        if (!productoSeleccionado || !dosisProducto) return;

        const productoBase = PRODUCTOS_COMUNES.find(p => p.nombre === productoSeleccionado);
        const nuevoProducto: ProductoAplicado = {
            nombre: productoSeleccionado,
            dosis: parseFloat(dosisProducto),
            unidad: productoBase?.unidad || 'lt/ha',
            ingredienteActivo: productoBase?.ingredienteActivo
        };

        setProductos([...productos, nuevoProducto]);
        setProductoSeleccionado('');
        setDosisProducto('');
    };

    const quitarProducto = (index: number) => {
        setProductos(productos.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Construir descripciÃ³n automÃ¡tica si estÃ¡ vacÃ­a
            let desc = descripcion;
            if (!desc) {
                if (tipo === 'siembra' && cultivo) {
                    desc = `Siembra de ${cultivo}${variedad ? ` (${variedad})` : ''}`;
                } else if (tipo === 'cosecha' && rendimiento) {
                    desc = `Cosecha - Rendimiento: ${rendimiento} kg/ha`;
                } else if ((tipo === 'fertilizacion' || tipo === 'pulverizacion') && productos.length > 0) {
                    desc = `${tipoConfig.label} con ${productos.map(p => p.nombre).join(', ')}`;
                } else {
                    desc = tipoConfig.label;
                }
            }

            // Construir evento
            const evento = {
                loteId,
                campaniaId: '', // TODO: Seleccionar campaÃ±a
                productorId: '', // TODO: Obtener del contexto
                tipo,
                descripcion: desc,
                fecha: new Date(fecha),
                superficieAplicada: superficieAplicada ? parseFloat(superficieAplicada) : undefined,
                productos: productos.length > 0 ? productos : undefined,
                temperatura: temperatura ? parseFloat(temperatura) : undefined,
                humedad: humedadAmb ? parseFloat(humedadAmb) : undefined,
                viento: viento ? parseFloat(viento) : undefined,
                observaciones: observaciones || undefined,
                creadoPor: 'user' // TODO: Obtener userId real
            };

            await crearEventoLote(orgId, campoId, loteId, evento);

            // Reset form
            setTipo('observacion');
            setDescripcion('');
            setFecha(new Date().toISOString().split('T')[0]);
            setSuperficieAplicada('');
            setObservaciones('');
            setCultivo('');
            setVariedad('');
            setDensidad('');
            setRendimiento('');
            setHumedad('');
            setProductos([]);
            setTemperatura('');
            setHumedadAmb('');
            setViento('');

            onSuccess?.();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Error al registrar la labor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span className="text-2xl">{tipoConfig.icon}</span>
                        Registrar Labor - {loteName}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Tipo de labor */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Tipo de Labor *</Label>
                            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoEvento)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(TIPOS_LABOR).map(([key, config]) => (
                                        <SelectItem key={key} value={key}>
                                            <span className="flex items-center gap-2">
                                                <span>{config.icon}</span>
                                                {config.label}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Fecha *</Label>
                            <Input
                                type="date"
                                value={fecha}
                                onChange={(e) => setFecha(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Campos especÃ­ficos por tipo */}
                    {tipo === 'siembra' && (
                        <div className="grid grid-cols-3 gap-4 p-4 bg-green-50 rounded-lg">
                            <div>
                                <Label>Cultivo *</Label>
                                <Select value={cultivo} onValueChange={setCultivo}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Soja">Soja</SelectItem>
                                        <SelectItem value="MaÃ­z">MaÃ­z</SelectItem>
                                        <SelectItem value="Trigo">Trigo</SelectItem>
                                        <SelectItem value="Girasol">Girasol</SelectItem>
                                        <SelectItem value="AlgodÃ³n">AlgodÃ³n</SelectItem>
                                        <SelectItem value="Sorgo">Sorgo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Variedad/HÃ­brido</Label>
                                <Input
                                    value={variedad}
                                    onChange={(e) => setVariedad(e.target.value)}
                                    placeholder="Ej: DM 46i17"
                                />
                            </div>
                            <div>
                                <Label>Densidad (sem/ha)</Label>
                                <Input
                                    type="number"
                                    value={densidad}
                                    onChange={(e) => setDensidad(e.target.value)}
                                    placeholder="Ej: 320000"
                                />
                            </div>
                        </div>
                    )}

                    {tipo === 'cosecha' && (
                        <div className="grid grid-cols-2 gap-4 p-4 bg-yellow-50 rounded-lg">
                            <div>
                                <Label>Rendimiento (kg/ha) *</Label>
                                <Input
                                    type="number"
                                    value={rendimiento}
                                    onChange={(e) => setRendimiento(e.target.value)}
                                    placeholder="Ej: 3500"
                                />
                            </div>
                            <div>
                                <Label>Humedad (%)</Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    value={humedad}
                                    onChange={(e) => setHumedad(e.target.value)}
                                    placeholder="Ej: 13.5"
                                />
                            </div>
                        </div>
                    )}

                    {tipoConfig.requiereProductos && (
                        <div className="p-4 bg-purple-50 rounded-lg space-y-3">
                            <Label>Productos Aplicados</Label>

                            <div className="flex gap-2">
                                <Select value={productoSeleccionado} onValueChange={setProductoSeleccionado}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Seleccionar producto" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PRODUCTOS_COMUNES.map((p, i) => (
                                            <SelectItem key={i} value={p.nombre}>
                                                {p.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input
                                    type="number"
                                    step="0.1"
                                    value={dosisProducto}
                                    onChange={(e) => setDosisProducto(e.target.value)}
                                    placeholder="Dosis"
                                    className="w-24"
                                />
                                <Button type="button" onClick={agregarProducto} variant="outline">
                                    Agregar
                                </Button>
                            </div>

                            {productos.length > 0 && (
                                <div className="space-y-2">
                                    {productos.map((p, i) => (
                                        <div key={i} className="flex items-center justify-between bg-white p-2 rounded">
                                            <span>{p.nombre} - {p.dosis} {p.unidad}</span>
                                            <button
                                                type="button"
                                                onClick={() => quitarProducto(i)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                âœ•
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Superficie aplicada */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Superficie (ha)</Label>
                            <Input
                                type="number"
                                step="0.1"
                                value={superficieAplicada}
                                onChange={(e) => setSuperficieAplicada(e.target.value)}
                                placeholder="Total del lote si vacÃ­o"
                            />
                        </div>
                        <div>
                            <Label>DescripciÃ³n</Label>
                            <Input
                                value={descripcion}
                                onChange={(e) => setDescripcion(e.target.value)}
                                placeholder="AutomÃ¡tica si vacÃ­a"
                            />
                        </div>
                    </div>

                    {/* Condiciones climÃ¡ticas */}
                    <details className="border rounded-lg">
                        <summary className="p-3 cursor-pointer bg-gray-50 rounded-t-lg">
                            ðŸŒ¡ï¸ Condiciones ClimÃ¡ticas (opcional)
                        </summary>
                        <div className="p-4 grid grid-cols-3 gap-4">
                            <div>
                                <Label>Temperatura (Â°C)</Label>
                                <Input
                                    type="number"
                                    value={temperatura}
                                    onChange={(e) => setTemperatura(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Humedad (%)</Label>
                                <Input
                                    type="number"
                                    value={humedadAmb}
                                    onChange={(e) => setHumedadAmb(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Viento (km/h)</Label>
                                <Input
                                    type="number"
                                    value={viento}
                                    onChange={(e) => setViento(e.target.value)}
                                />
                            </div>
                        </div>
                    </details>

                    {/* Observaciones */}
                    <div>
                        <Label>Observaciones</Label>
                        <textarea
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            className="w-full border rounded-lg p-3 text-sm"
                            rows={3}
                            placeholder="Notas adicionales..."
                        />
                    </div>

                    {error && (
                        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Botones */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Guardando...' : 'Registrar Labor'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
