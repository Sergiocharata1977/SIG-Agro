'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { actualizarOrganizacion, actualizarModulosUsuario } from '@/services/organizations';
import { DEFAULT_FREE_FEATURES } from '@/types/organization';
// Usamos botones simples por si shadcn no estÃ¡ compilado completamente en este punto, 
// para asegurar que esta pÃ¡gina siempre funcione.
// import { BaseButton as Button } from '@/components/design-system'; 

export default function FixPermissionsPage() {
    const { user, organization } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleFix = async () => {
        if (!user || !organization) {
            setMessage('Error: No se detectÃ³ usuario u organizaciÃ³n activa.');
            return;
        }

        try {
            setLoading(true);
            setMessage('Aplicando correcciones...');

            // 1. Activar todas las features de la organizaciÃ³n
            const featuresActivas = { ...DEFAULT_FREE_FEATURES };
            // Aseguramos que todo estÃ© en true para dev
            Object.keys(featuresActivas).forEach(k => {
                if (typeof featuresActivas[k as keyof typeof featuresActivas] === 'boolean') {
                    (featuresActivas as any)[k] = true;
                }
            });

            await actualizarOrganizacion(organization.id, {
                features: featuresActivas
            });

            // 2. Dar permisos completos al usuario (null = Full Admin)
            await actualizarModulosUsuario(organization.id, user.id, null);

            setMessage('âœ… Â¡Ã‰xito! Permisos actualizados. Recarga la pÃ¡gina para ver el menÃº completo.');

            // Forzar recarga tras 2 segundos
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 2000);

        } catch (error) {
            console.error(error);
            setMessage('âŒ Error al actualizar: ' + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center space-y-6">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto text-3xl">
                    ðŸ”§
                </div>

                <h1 className="text-2xl font-bold text-gray-900">Reparar Permisos</h1>

                <p className="text-gray-600 text-sm">
                    Utilice esta herramienta si su usuario <strong>{user?.displayName || 'Desconocido'}</strong> no ve las opciones del menÃº.
                </p>

                <div className="text-left text-xs bg-gray-50 p-4 rounded border border-gray-200 space-y-2">
                    <p><strong>OrganizaciÃ³n:</strong> {organization?.name}</p>
                    <p><strong>Usuario ID:</strong> {user?.id}</p>
                    <p><strong>AcciÃ³n:</strong> Habilitar todos los mÃ³dulos y caracterÃ­sticas.</p>
                </div>

                {message && (
                    <div className={`p-3 rounded text-sm ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {message}
                    </div>
                )}

                <button
                    onClick={handleFix}
                    disabled={loading || !user}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Aplicando...' : 'ðŸ› ï¸ Reparar Permisos Ahora'}
                </button>

                <div className="text-xs text-gray-400 mt-4">
                    Esto habilitarÃ¡ el acceso completo a todos los mÃ³dulos.
                </div>
            </div>
        </div>
    );
}
