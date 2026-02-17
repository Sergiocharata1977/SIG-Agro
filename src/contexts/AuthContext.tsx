'use client';

/**
 * Multi-tenant auth context.
 * Handles auth, active organization and user permissions.
 */

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    updateProfile,
    User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';
import { Organization, User, UserRole } from '@/types/organization';
import {
    actualizarUltimoLogin,
    cambiarOrganizacionActiva,
    crearOrganizacion,
    obtenerOrganizacion,
    obtenerOrganizacionesUsuario,
    obtenerUsuario,
} from '@/services/organizations';
import { isSuperAdminEmail, resolveUserRole } from '@/lib/auth-utils';

interface AuthContextType {
    firebaseUser: FirebaseUser | null;
    user: User | null;
    organization: Organization | null;
    organizations: Organization[];
    organizationId: string | null;
    loading: boolean;
    error: string | null;

    signIn: (email: string, password: string) => Promise<void>;
    signUp: (data: SignUpData) => Promise<void>;
    signOut: () => Promise<void>;
    clearError: () => void;
    setActiveOrganization: (organizationId: string) => Promise<void>;

    hasModuleAccess: (module: string) => boolean;
    canPerformAction: (action: 'read' | 'write' | 'delete' | 'admin') => boolean;
}

interface SignUpData {
    email: string;
    password: string;
    displayName: string;
    organizationName: string;
    cuit?: string;
    province: string;
    city?: string;
    phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export function AuthProvider({ children }: { children: ReactNode }) {
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            setFirebaseUser(fbUser);

            if (fbUser) {
                await loadUserData(fbUser);
            } else {
                setUser(null);
                setOrganization(null);
                setOrganizations([]);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const loadUserData = async (fbUser: FirebaseUser) => {
        let tokenClaims: Record<string, unknown> = {};
        try {
            const userId = fbUser.uid;
            const tokenResult = await fbUser.getIdTokenResult(true);
            tokenClaims = tokenResult.claims as Record<string, unknown>;
            const userData = await obtenerUsuario(userId);

            if (userData) {
                const orgs = await obtenerOrganizacionesUsuario(userId, userData);
                setOrganizations(orgs);

                const fallbackOrgId = orgs[0]?.id || null;
                const activeOrgId = userData.organizationId || fallbackOrgId;

                if (activeOrgId && activeOrgId !== userData.organizationId) {
                    await cambiarOrganizacionActiva(userId, activeOrgId);
                }

                const activeOrg = activeOrgId
                    ? orgs.find((org) => org.id === activeOrgId) || await obtenerOrganizacion(activeOrgId)
                    : null;

                const resolvedRole = resolveUserRole(userData, tokenClaims, fbUser.email);

                setUser({
                    ...userData,
                    role: resolvedRole,
                    organizationId: activeOrgId || '',
                    organizationIds: Array.from(new Set([...(userData.organizationIds || []), ...orgs.map((o) => o.id)])),
                    accessAllOrganizations: userData.accessAllOrganizations !== false,
                });
                setOrganization(activeOrg || null);
                await actualizarUltimoLogin(userId);
                console.info('[AuthDebug] user loaded', {
                    uid: userId,
                    email: fbUser.email || '',
                    claimRole: tokenClaims.role || tokenClaims.rol || null,
                    firestoreRole: (userData as { role?: string }).role || null,
                    firestoreRol: (userData as { rol?: string }).rol || null,
                    resolvedRole,
                });
                return;
            }

            const resolvedRole = resolveUserRole(null, tokenClaims, fbUser.email);

            // Autobootstrap para super admin cuando la coleccion users fue eliminada.
            if (resolvedRole === 'super_admin') {
                await setDoc(doc(db, 'users', userId), {
                    email: fbUser.email || '',
                    displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Super Admin',
                    role: 'super_admin',
                    status: 'active',
                    organizationId: '',
                    organizationIds: [],
                    accessAllOrganizations: true,
                    modulosHabilitados: null,
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                    lastLogin: Timestamp.now(),
                }, { merge: true });

                setUser({
                    id: userId,
                    email: fbUser.email || '',
                    displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Super Admin',
                    role: 'super_admin',
                    status: 'active',
                    organizationId: '',
                    organizationIds: [],
                    accessAllOrganizations: true,
                    modulosHabilitados: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    lastLogin: new Date(),
                });
                setOrganization(null);
                setOrganizations([]);
                console.info('[AuthDebug] super admin auto-bootstrapped', {
                    uid: userId,
                    email: fbUser.email || '',
                    claimRole: tokenClaims.role || tokenClaims.rol || null,
                });
                return;
            }

            // Autobootstrap generico para productores sin perfil en users/{uid}.
            // Evita depender de lecturas legacy que pueden estar bloqueadas por reglas.
            const email = (fbUser.email || '').trim().toLowerCase();
            const displayName = (fbUser.displayName || email.split('@')[0] || 'Productor').trim();
            await setDoc(doc(db, 'users', userId), {
                email,
                displayName,
                role: 'owner',
                status: 'active',
                organizationId: '',
                organizationIds: [],
                accessAllOrganizations: true,
                modulosHabilitados: null,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                lastLogin: Timestamp.now(),
            }, { merge: true });

            setUser({
                id: userId,
                email,
                displayName,
                role: 'owner',
                status: 'active',
                organizationId: '',
                organizationIds: [],
                accessAllOrganizations: true,
                modulosHabilitados: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastLogin: new Date(),
            });
            setOrganization(null);
            setOrganizations([]);
            console.info('[AuthDebug] productor auto-bootstrapped in users', {
                uid: userId,
                email,
            });
            return;

            setUser(null);
            setOrganization(null);
            setOrganizations([]);
            console.info('[AuthDebug] user profile not found', {
                uid: userId,
                email: fbUser.email || '',
                claimRole: tokenClaims.role || tokenClaims.rol || null,
            });
        } catch (err) {
            console.error('Error loading user data:', err);
            const roleFromFallback = resolveUserRole(null, tokenClaims, fbUser.email);
            if (roleFromFallback === 'super_admin' || isSuperAdminEmail(fbUser.email)) {
                setUser({
                    id: fbUser.uid,
                    email: fbUser.email || '',
                    displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Super Admin',
                    role: 'super_admin',
                    status: 'active',
                    organizationId: '',
                    organizationIds: [],
                    accessAllOrganizations: true,
                    modulosHabilitados: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    lastLogin: new Date(),
                });
                setOrganization(null);
                setOrganizations([]);
                console.info('[AuthDebug] super admin fallback enabled after error', {
                    uid: fbUser.uid,
                    email: fbUser.email || '',
                    claimRole: tokenClaims.role || tokenClaims.rol || null,
                });
                return;
            }
        }
    };

    const signIn = async (email: string, password: string) => {
        try {
            setLoading(true);
            setError(null);
            const result = await signInWithEmailAndPassword(auth, email, password);
            await loadUserData(result.user);
        } catch (err: unknown) {
            const errorMessage = getErrorMessage(err);
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (data: SignUpData) => {
        try {
            setLoading(true);
            setError(null);

            const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            const newFirebaseUser = userCredential.user;

            await updateProfile(newFirebaseUser, { displayName: data.displayName });

            await crearOrganizacion(
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

            await loadUserData(newFirebaseUser);
        } catch (err: unknown) {
            const errorMessage = getErrorMessage(err);
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        try {
            setLoading(true);
            await firebaseSignOut(auth);
            setUser(null);
            setOrganization(null);
            setOrganizations([]);
        } catch (err: unknown) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const setActiveOrganization = async (organizationId: string) => {
        if (!firebaseUser || !user) return;

        const org = organizations.find((item) => item.id === organizationId);
        if (!org) {
            throw new Error('No tenes acceso a esa organizacion');
        }

        await cambiarOrganizacionActiva(firebaseUser.uid, organizationId);

        setUser((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                organizationId,
                organizationIds: Array.from(new Set([...(prev.organizationIds || []), organizationId])),
            };
        });
        setOrganization(org);
    };

    const clearError = () => setError(null);

    const hasModuleAccess = (module: string): boolean => {
        if (!user) return false;
        if (user.role === 'super_admin') return true;

        const enabledModules = user.modulosHabilitados;
        if (enabledModules === null || enabledModules === undefined) return true;
        if (!Array.isArray(enabledModules)) return false;
        if (enabledModules.length === 0) return true;

        return (enabledModules as string[]).includes(module);
    };

    const canPerformAction = (action: 'read' | 'write' | 'delete' | 'admin'): boolean => {
        if (!user) return false;

        const permissions: Record<UserRole, string[]> = {
            super_admin: ['read', 'write', 'delete', 'admin'],
            owner: ['read', 'write', 'delete', 'admin'],
            admin: ['read', 'write', 'delete', 'admin'],
            operator: ['read', 'write'],
            viewer: ['read'],
        };

        return permissions[user.role]?.includes(action) || false;
    };

    const value = useMemo<AuthContextType>(() => ({
        firebaseUser,
        user,
        organization,
        organizations,
        organizationId: user?.organizationId || organization?.id || null,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        clearError,
        setActiveOrganization,
        hasModuleAccess,
        canPerformAction,
    }), [firebaseUser, user, organization, organizations, loading, error]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used inside AuthProvider');
    }
    return context;
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        const code = (error as { code?: string }).code;

        switch (code) {
            case 'auth/email-already-in-use':
                return 'Este email ya esta registrado';
            case 'auth/weak-password':
                return 'La contrasena debe tener al menos 6 caracteres';
            case 'auth/invalid-email':
                return 'Email invalido';
            case 'auth/user-not-found':
                return 'Usuario no encontrado';
            case 'auth/wrong-password':
                return 'Contrasena incorrecta';
            case 'auth/too-many-requests':
                return 'Demasiados intentos. Intenta mas tarde';
            case 'auth/invalid-credential':
                return 'Credenciales invalidas';
            default:
                return error.message || 'Error de autenticacion';
        }
    }

    return 'Error desconocido';
}
