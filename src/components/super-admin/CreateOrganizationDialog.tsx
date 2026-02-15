'use client';

import { useState } from 'react';
import { BaseButton as Button } from '@/components/design-system';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BaseInput as Input } from '@/components/design-system';
import { Label } from '@/components/ui/label';
import { BaseSelect as Select, BaseSelectContent as SelectContent, BaseSelectItem as SelectItem, BaseSelectTrigger as SelectTrigger, BaseSelectValue as SelectValue } from '@/components/design-system';
import { Checkbox } from '@/components/ui/checkbox';

interface CreateOrganizationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated: () => void;
}

export default function CreateOrganizationDialog({ open, onOpenChange, onCreated }: CreateOrganizationDialogProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        plan: 'free',
        timezone: 'America/Argentina/Buenos_Aires',
        currency: 'ARS',
        private_sections: true,
        ai_assistant: true,
        max_users: 50,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/super-admin/organizations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    plan: formData.plan,
                    features: {
                        private_sections: formData.private_sections,
                        ai_assistant: formData.ai_assistant,
                        max_users: parseInt(formData.max_users.toString())
                    }
                }),
            });

            if (!res.ok) {
                throw new Error('Error creando organizaciÃ³n');
            }

            onOpenChange(false);
            onCreated();
            // Reset
            setFormData({
                name: '',
                plan: 'free',
                timezone: 'America/Argentina/Buenos_Aires',
                currency: 'ARS',
                private_sections: true,
                ai_assistant: true,
                max_users: 50,
            });

        } catch (err) {
            console.error(err);
            setError('No se pudo crear la organizaciÃ³n');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Nueva OrganizaciÃ³n</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <div className="text-red-500 text-sm p-2 bg-red-50 rounded">{error}</div>}

                    <div className="space-y-2">
                        <Label htmlFor="org-name">Nombre</Label>
                        <Input
                            id="org-name"
                            required
                            placeholder="Ej. Los Algarrobos S.A."
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Plan</Label>
                            <Select
                                value={formData.plan}
                                onValueChange={(v) => setFormData({ ...formData, plan: v })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="free">Free</SelectItem>
                                    <SelectItem value="pro">Professional</SelectItem>
                                    <SelectItem value="enterprise">Enterprise</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="max-users">Max Usuarios</Label>
                            <Input
                                id="max-users"
                                type="number"
                                value={formData.max_users}
                                onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <Label>CaracterÃ­sticas</Label>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="private-sec"
                                checked={formData.private_sections}
                                onCheckedChange={(checked) => setFormData({ ...formData, private_sections: !!checked })}
                            />
                            <label htmlFor="private-sec" className="text-sm cursor-pointer">Secciones Privadas</label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="ai-assist"
                                checked={formData.ai_assistant}
                                onCheckedChange={(checked) => setFormData({ ...formData, ai_assistant: !!checked })}
                            />
                            <label htmlFor="ai-assist" className="text-sm cursor-pointer">Asistente IA</label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>{loading ? 'Creando...' : 'Crear'}</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
