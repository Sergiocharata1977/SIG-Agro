'use client';

/**
 * Contexto de Autenticación Multi-Tenant
 * Maneja autenticación, organización activa y usuario
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
    User as FirebaseUser,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    updateProfile,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';
import {
    Organization,
    User,
    UserRole,
} from '@/types/organization';
import {
    crearOrganizacion,
    obtenerOrganizacion,
    obtenerUsuario,
    actualizarUltimoLogin,
} from '@/services/organizations';

// ============================================
// TIPOS
// ============================================

interface AuthContextType {
    // Estado
    firebaseUser: FirebaseUser | null;
    user: User | null;
    organization: Organization | null;
    loading: boolean;
    error: string | null;

    // Acciones de autenticación
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (data: SignUpData) => Promise<void>;
    signOut: () => Promise<void>;
    clearError: () => void;

    // Helpers
    hasModuleAccess: (module: string) => boolean;
    canPerformAction: (action: 'read' | 'write' | 'delete' | 'admin') => boolean;
}

interface SignUpData {
    email: string;
    password: string;
    displayName: string;
    // Datos de organización (nuevo registro)
    organizationName: string;
    cuit?: string;
    province: string;
    city?: string;
    phone?: string;
}

// ============================================
// CONTEXTO
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

export function AuthProvider({ children }: { children: ReactNode }) {
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Escuchar cambios de autenticación
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            setFirebaseUser(fbUser);

            if (fbUser) {
                await loadUserData(fbUser.uid);
            } else {
                setUser(null);
                setOrganization(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Cargar datos de usuario y organización
    const loadUserData = async (userId: string) => {
        try {
            // Intentar cargar desde nueva estructura (users collection)
            const userData = await obtenerUsuario(userId);

            if (userData) {
                setUser(userData);

                // Cargar organización
                if (userData.organizationId) {
                    const orgData = await obtenerOrganizacion(userData.organizationId);
                    setOrganization(orgData);
                }

                // Actualizar último login
                await actualizarUltimoLogin(userId);
            } else {
                // Fallback: verificar si existe en agro_productores (migración)
                const productorRef = doc(db, 'agro_productores', userId);
                const productorDoc = await getDoc(productorRef);

                if (productorDoc.exists()) {
                    // Usuario antiguo sin migrar - mostrar como viewer
                    console.log('Usuario antiguo detectado, necesita migrar a organización');
                    setUser(null);
                    setOrganization(null);
                }
            }
        } catch (err) {
            console.error('Error al cargar datos de usuario:', err);
        }
    };

    // ============================================
    // ACCIONES
    // ============================================

    /**
     * Iniciar sesión
     */
    const signIn = async (email: string, password: string) => {
        try {
            setLoading(true);
            setError(null);
            const result = await signInWithEmailAndPassword(auth, email, password);
            await loadUserData(result.user.uid);
        } catch (err: unknown) {
            const errorMessage = getErrorMessage(err);
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Registrar nuevo usuario + organización
     */
    const signUp = async (data: SignUpData) => {
        try {
            setLoading(true);
            setError(null);

            // Crear usuario en Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                data.email,
                data.password
            );
            const newFirebaseUser = userCredential.user;

            // Actualizar perfil
            await updateProfile(newFirebaseUser, {
                displayName: data.displayName,
            });

            // Crear organización con usuario como owner
            const result = await crearOrganizacion(
                {
                    name: data.organizationName,
                    cuit: data.cuit,
                    province: data.province,
                    city: data.city,
                    email: data.email,
                    phone: data.phone,
                },
                newFirebaseUser.uid,
                data.email,
                data.displayName
            );

            console.log('Organización creada:', result);

            // Cargar datos
            await loadUserData(newFirebaseUser.uid);

        } catch (err: unknown) {
            const errorMessage = getErrorMessage(err);
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Cerrar sesión
     */
    const signOut = async () => {
        try {
            setLoading(true);
            await firebaseSignOut(auth);
            setUser(null);
            setOrganization(null);
        } catch (err: unknown) {
            const errorMessage = getErrorMessage(err);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Limpiar error
     */
    const clearError = () => setError(null);

    // ============================================
    // HELPERS
    // ============================================

    /**
     * Verificar si usuario tiene acceso a un módulo
     */
    const hasModuleAccess = (module: string): boolean => {
        if (!user) return false;

        // Super Admin tiene acceso a todo
        if (user.role === 'super_admin') return true;

        const modulosHabilitados = user.modulosHabilitados;

        // null o undefined = acceso completo
        if (modulosHabilitados === null || modulosHabilitados === undefined) return true;

        // Array vacío = sin acceso
        if (!Array.isArray(modulosHabilitados) || modulosHabilitados.length === 0) return false;

        // Verificar si el módulo está en la lista
        return modulosHabilitados.includes(module as any);
    };

    /**
     * Verificar si usuario puede realizar acción según su rol
     */
    const canPerformAction = (action: 'read' | 'write' | 'delete' | 'admin'): boolean => {
        if (!user) return false;

        const permisos: Record<UserRole, string[]> = {
            super_admin: ['read', 'write', 'delete', 'admin'],
            owner: ['read', 'write', 'delete', 'admin'],
            admin: ['read', 'write', 'delete', 'admin'],
            operator: ['read', 'write'],
            viewer: ['read'],
        };

        return permisos[user.role]?.includes(action) || false;
    };

    // ============================================
    // RENDER
    // ============================================

    return (
        <AuthContext.Provider
            value={{
                firebaseUser,
                user,
                organization,
                loading,
                error,
                signIn,
                signUp,
                signOut,
                clearError,
                hasModuleAccess,
                canPerformAction,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// ============================================
// HOOK
// ============================================

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }
    return context;
}

// ============================================
// HELPERS
// ============================================

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        const code = (error as { code?: string }).code;

        switch (code) {
            case 'auth/email-already-in-use':
                return 'Este email ya está registrado';
            case 'auth/weak-password':
                return 'La contraseña debe tener al menos 6 caracteres';
            case 'auth/invalid-email':
                return 'Email inválido';
            case 'auth/user-not-found':
                return 'Usuario no encontrado';
            case 'auth/wrong-password':
                return 'Contraseña incorrecta';
            case 'auth/too-many-requests':
                return 'Demasiados intentos. Intenta más tarde';
            case 'auth/invalid-credential':
                return 'Credenciales inválidas';
            default:
                return error.message || 'Error de autenticación';
        }
    }
    return 'Error desconocido';
}
