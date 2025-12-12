'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { isSuperAdmin } from '@/lib/superAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Building2, Users } from 'lucide-react';
import CreateOrganizationDialog from '@/components/super-admin/CreateOrganizationDialog';

export default function SuperAdminOrganizationsPage() {
    const { user, firebaseUser } = useAuth(); // Usamos firebaseUser si user context no carga super admin aun
    const router = useRouter();
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSuper, setIsSuper] = useState(false);
    const [showCreateDialog, setShowCreateDialog] = useState(false);

    useEffect(() => {
        const checkRole = async () => {
            if (!firebaseUser) return;

            // Si el contexto ya dice super_admin (si lo agregamos al User type) bien, sino check manual
            const isSuperRole = await isSuperAdmin(firebaseUser.uid);

            if (!isSuperRole) {
                // router.push('/dashboard');
                // Comentado para dev por si acaso, pero deberia redirigir
                console.warn('Usuario no es super admin');
            }
            setIsSuper(isSuperRole);

            if (isSuperRole) {
                fetchOrgs();
            } else {
                setLoading(false);
            }
        };

        checkRole();
    }, [firebaseUser]);

    const fetchOrgs = async () => {
        try {
            const res = await fetch('/api/super-admin/organizations');
            const data = await res.json();
            if (data.organizations) {
                setOrganizations(data.organizations);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    if (!isSuper && !loading) {
        return <div className="p-8 text-center text-red-600">Acceso Denegado: Requiere rol Super Admin</div>;
    }

    return (
        <div className="p-8 space-y-6 bg-gray-50 min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Panel Super Admin</h1>
                    <p className="text-gray-600">Gestión Global de Organizaciones</p>
                </div>
                <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Organización
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* KPI Cards */}
                <Card>
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                            <Building2 />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Organizaciones</p>
                            <p className="text-2xl font-bold">{organizations.length}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Listado de Organizaciones</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {organizations.map(org => (
                            <div key={org.id} className="flex items-center justify-between p-4 border rounded-lg bg-white hover:shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center font-bold text-gray-600">
                                        {org.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{org.name}</h3>
                                        <p className="text-xs text-gray-500">ID: {org.id}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full uppercase">
                                        {org.plan}
                                    </span>
                                    <div className="text-sm text-gray-500">
                                        {/* TODO: Count users */}
                                        -- usuarios
                                    </div>
                                </div>
                            </div>
                        ))}
                        {organizations.length === 0 && !loading && (
                            <div className="text-center py-8 text-gray-500">No hay organizaciones creadas.</div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <CreateOrganizationDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                onCreated={fetchOrgs}
            />
        </div>
    );
}
