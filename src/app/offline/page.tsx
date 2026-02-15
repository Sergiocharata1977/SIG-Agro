'use client';

import { WifiOff, RefreshCw, CloudOff, Database } from 'lucide-react';
import { BaseButton as Button } from '@/components/design-system';
import { useRouter } from 'next/navigation';

/**
 * PÃ¡gina mostrada cuando el usuario estÃ¡ offline
 */
export default function OfflinePage() {
    const router = useRouter();

    const handleRetry = () => {
        // Intentar volver a la pÃ¡gina anterior o al dashboard
        if (navigator.onLine) {
            router.back();
        } else {
            // Forzar recarga para verificar conexiÃ³n
            window.location.reload();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center">
                {/* Icono principal */}
                <div className="mb-8">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-slate-700/50 mb-6">
                        <WifiOff className="w-12 h-12 text-amber-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Sin conexiÃ³n
                    </h1>
                    <p className="text-slate-400">
                        No hay conexiÃ³n a internet. Algunas funciones no estÃ¡n disponibles.
                    </p>
                </div>

                {/* Funciones disponibles offline */}
                <div className="bg-slate-700/30 rounded-xl p-6 mb-8">
                    <h2 className="text-lg font-medium text-white mb-4 flex items-center justify-center gap-2">
                        <Database className="w-5 h-5 text-green-400" />
                        Disponible sin conexiÃ³n
                    </h2>
                    <ul className="text-left space-y-3 text-slate-300">
                        <li className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-green-400"></span>
                            Ver datos cargados previamente
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-green-400"></span>
                            Crear observaciones de scouting
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-green-400"></span>
                            Tomar fotos georreferenciadas
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-green-400"></span>
                            Registrar operaciones
                        </li>
                    </ul>
                </div>

                {/* Funciones no disponibles */}
                <div className="bg-slate-700/20 rounded-xl p-6 mb-8">
                    <h2 className="text-lg font-medium text-slate-400 mb-4 flex items-center justify-center gap-2">
                        <CloudOff className="w-5 h-5 text-slate-500" />
                        Requiere conexiÃ³n
                    </h2>
                    <ul className="text-left space-y-3 text-slate-500">
                        <li className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                            Cargar nuevas imÃ¡genes satelitales
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                            Consultar pronÃ³stico del clima
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                            Sincronizar con el servidor
                        </li>
                    </ul>
                </div>

                {/* Mensaje de sync pendiente */}
                <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-4 mb-6">
                    <p className="text-amber-300 text-sm">
                        Los datos que crees offline se sincronizarÃ¡n automÃ¡ticamente
                        cuando recuperes la conexiÃ³n.
                    </p>
                </div>

                {/* Botones */}
                <div className="flex flex-col gap-3">
                    <Button
                        onClick={handleRetry}
                        className="w-full bg-green-600 hover:bg-green-700"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reintentar conexiÃ³n
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => router.push('/dashboard')}
                        className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                        Continuar sin conexiÃ³n
                    </Button>
                </div>

                {/* Footer */}
                <p className="mt-8 text-xs text-slate-500">
                    SIG-Agro funciona offline gracias a la tecnologÃ­a PWA
                </p>
            </div>
        </div>
    );
}
