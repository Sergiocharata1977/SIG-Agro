'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Campo } from '@/types/agro';
import { crearCampo, actualizarCampo } from '@/services/campos';
import { useAuth } from '@/contexts/AuthContext';

interface CampoDialogProps {
    campo?: Campo;
    trigger?: React.ReactNode;
    onSuccess?: () => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export default function CampoDialog({ campo, trigger, onSuccess, open: controlledOpen, onOpenChange }: CampoDialogProps) {
    const { user } = useAuth();
    const [internalOpen, setInternalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? onOpenChange : setInternalOpen;

    const { register, handleSubmit, reset, formState: { errors } } = useForm<Partial<Campo>>({
        defaultValues: campo || {
            nombre: '',
            provincia: 'Chaco',
            departamento: '',
            localidad: '',
            superficieTotal: 0
        }
    });

    useEffect(() => {
        if (campo) {
            reset(campo);
        } else {
            reset({
                nombre: '',
                provincia: 'Chaco',
                departamento: '',
                localidad: '',
                superficieTotal: 0
            });
        }
    }, [campo, reset, open]);

    const onSubmit = async (data: Partial<Campo>) => {
        if (!user?.organizationId) return;

        try {
            setLoading(true);

            if (campo?.id) {
                // Editar
                await actualizarCampo(user.organizationId, campo.id, data);
            } else {
                // Crear
                await crearCampo(user.organizationId, {
                    ...data,
                    productorId: user.uid, // Asumimos usuario actual como productor por ahora
                } as any);
            }

            if (onSuccess) onSuccess();
            if (setOpen) setOpen(false);
            if (!campo) reset();
        } catch (error) {
            console.error('Error al guardar campo:', error);
            // TODO: Toast error
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{campo ? 'Editar Campo' : 'Nuevo Campo'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre del Campo</Label>
                        <Input
                            id="nombre"
                            {...register('nombre', { required: 'El nombre es requerido' })}
                            placeholder="Ej: La Estancia"
                        />
                        {errors.nombre && <p className="text-sm text-red-500">{errors.nombre.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="provincia">Provincia</Label>
                            <Input
                                id="provincia"
                                {...register('provincia', { required: true })}
                                placeholder="Chaco"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="departamento">Departamento</Label>
                            <Input
                                id="departamento"
                                {...register('departamento')}
                                placeholder="San Fernando"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="localidad">Localidad</Label>
                            <Input
                                id="localidad"
                                {...register('localidad')}
                                placeholder="Resistencia"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="superficie">Superficie (ha)</Label>
                            <Input
                                id="superficie"
                                type="number"
                                step="any"
                                {...register('superficieTotal', {
                                    required: true,
                                    min: 0,
                                    valueAsNumber: true
                                })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Guardando...' : campo ? 'Actualizar' : 'Crear Campo'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
