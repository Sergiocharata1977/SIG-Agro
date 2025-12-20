'use client';

import { useState } from 'react';
import { Plus, List, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ScoutingForm from '@/components/scouting/ScoutingForm';
import ScoutingList from '@/components/scouting/ScoutingList';
import { useAuth } from '@/contexts/AuthContext';

export default function ScoutingPage() {
    const { user, organizationId } = useAuth();
    const [showForm, setShowForm] = useState(false);
    const [view, setView] = useState<'list' | 'map'>('list');
    const [refreshKey, setRefreshKey] = useState(0);

    const handleSuccess = () => {
        setShowForm(false);
        setRefreshKey(prev => prev + 1);
    };

    if (!user || !organizationId) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Cargando...</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Scouting</h1>
                    <p className="text-gray-500">Observaciones de campo georreferenciadas</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Toggle vista */}
                    <div className="flex border rounded-lg">
                        <button
                            onClick={() => setView('list')}
                            className={`px-3 py-2 flex items-center gap-2 ${view === 'list'
                                    ? 'bg-primary text-white'
                                    : 'hover:bg-gray-100'
                                } rounded-l-lg transition-colors`}
                        >
                            <List className="h-4 w-4" />
                            Lista
                        </button>
                        <button
                            onClick={() => setView('map')}
                            className={`px-3 py-2 flex items-center gap-2 ${view === 'map'
                                    ? 'bg-primary text-white'
                                    : 'hover:bg-gray-100'
                                } rounded-r-lg transition-colors`}
                        >
                            <Map className="h-4 w-4" />
                            Mapa
                        </button>
                    </div>

                    {/* Botón nueva observación */}
                    <Button onClick={() => setShowForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nueva Observación
                    </Button>
                </div>
            </div>

            {/* Contenido */}
            <Card className="p-4">
                {view === 'list' ? (
                    <ScoutingList
                        key={refreshKey}
                        orgId={organizationId}
                        onSelectObservation={(obs) => {
                            console.log('Seleccionado:', obs);
                            // TODO: Abrir detalle
                        }}
                    />
                ) : (
                    <div className="h-[500px] flex items-center justify-center bg-gray-100 rounded-lg">
                        <p className="text-gray-500">
                            Vista de mapa - Próximamente
                        </p>
                    </div>
                )}
            </Card>

            {/* Modal de nueva observación */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Nueva Observación de Campo</DialogTitle>
                    </DialogHeader>
                    <ScoutingForm
                        orgId={organizationId}
                        onSuccess={handleSuccess}
                        onCancel={() => setShowForm(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
