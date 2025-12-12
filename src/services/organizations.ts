/**
 * Servicio para gestión de Organizaciones
 * CRUD y operaciones de organizaciones en Firestore
 */

import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    setDoc,
    updateDoc,
    query,
    where,
    Timestamp,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import {
    Organization,
    OrganizationMember,
    User,
    UserRole,
    DEFAULT_FREE_FEATURES,
    DEFAULT_SETTINGS,
} from '@/types/organization';

const ORGANIZATIONS = 'organizations';
const USERS = 'users';

// ============================================
// ORGANIZACIONES
// ============================================

/**
 * Crear nueva organización con el primer usuario como owner
 */
export async function crearOrganizacion(
    data: {
        name: string;
        cuit?: string;
        province: string;
        city?: string;
        email: string;
        phone?: string;
    },
    creatorUserId: string,
    creatorEmail: string,
    creatorDisplayName: string
): Promise<{ organizationId: string; userId: string }> {
    // Generar slug único
    const slug = generarSlug(data.name);

    // Crear organización
    const orgRef = await addDoc(collection(db, ORGANIZATIONS), {
        name: data.name,
        slug,
        cuit: data.cuit || null,
        razonSocial: data.name,
        email: data.email,
        phone: data.phone || null,
        address: null,
        city: data.city || null,
        province: data.province,
        plan: 'free',
        status: 'active',
        settings: DEFAULT_SETTINGS,
        features: DEFAULT_FREE_FEATURES,
        createdBy: creatorUserId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });

    // Crear miembro (owner) en subcolección
    await setDoc(doc(db, ORGANIZATIONS, orgRef.id, 'members', creatorUserId), {
        userId: creatorUserId,
        email: creatorEmail,
        displayName: creatorDisplayName,
        role: 'owner' as UserRole,
        status: 'active',
        modulosHabilitados: null, // Acceso completo
        invitedBy: creatorUserId, // Self
        joinedAt: Timestamp.now(),
    });

    // Crear documento de usuario
    await setDoc(doc(db, USERS, creatorUserId), {
        email: creatorEmail,
        displayName: creatorDisplayName,
        organizationId: orgRef.id,
        role: 'owner' as UserRole,
        status: 'active',
        modulosHabilitados: null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });

    return {
        organizationId: orgRef.id,
        userId: creatorUserId,
    };
}

/**
 * Obtener organización por ID
 */
export async function obtenerOrganizacion(orgId: string): Promise<Organization | null> {
    const docRef = doc(db, ORGANIZATIONS, orgId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) return null;

    const data = snapshot.data();
    return {
        id: snapshot.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Organization;
}

/**
 * Obtener organización por slug
 */
export async function obtenerOrganizacionPorSlug(slug: string): Promise<Organization | null> {
    const q = query(collection(db, ORGANIZATIONS), where('slug', '==', slug));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const docSnapshot = snapshot.docs[0];
    const data = docSnapshot.data();
    return {
        id: docSnapshot.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Organization;
}

/**
 * Actualizar organización
 */
export async function actualizarOrganizacion(
    orgId: string,
    data: Partial<Organization>
): Promise<void> {
    const docRef = doc(db, ORGANIZATIONS, orgId);
    await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
    });
}

// ============================================
// USUARIOS
// ============================================

/**
 * Obtener usuario por ID
 */
export async function obtenerUsuario(userId: string): Promise<User | null> {
    const docRef = doc(db, USERS, userId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) return null;

    const data = snapshot.data();
    return {
        id: snapshot.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        joinedAt: data.joinedAt?.toDate(),
        lastLogin: data.lastLogin?.toDate(),
    } as User;
}

/**
 * Obtener miembros de una organización
 */
export async function obtenerMiembrosOrganizacion(orgId: string): Promise<OrganizationMember[]> {
    const membersRef = collection(db, ORGANIZATIONS, orgId, 'members');
    const snapshot = await getDocs(membersRef);

    return snapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data();
        return {
            userId: docSnapshot.id,
            ...data,
            joinedAt: data.joinedAt?.toDate() || new Date(),
        } as OrganizationMember;
    });
}

/**
 * Agregar miembro a organización
 */
export async function agregarMiembroOrganizacion(
    orgId: string,
    userId: string,
    email: string,
    displayName: string,
    role: UserRole,
    invitedBy: string
): Promise<void> {
    // Agregar a subcolección de miembros
    await setDoc(doc(db, ORGANIZATIONS, orgId, 'members', userId), {
        userId,
        email,
        displayName,
        role,
        status: 'active',
        modulosHabilitados: null,
        invitedBy,
        joinedAt: Timestamp.now(),
    });

    // Crear/actualizar documento de usuario
    await setDoc(doc(db, USERS, userId), {
        email,
        displayName,
        organizationId: orgId,
        role,
        status: 'active',
        modulosHabilitados: null,
        invitedBy,
        joinedAt: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    }, { merge: true });
}

/**
 * Actualizar rol de miembro
 */
export async function actualizarRolMiembro(
    orgId: string,
    userId: string,
    role: UserRole
): Promise<void> {
    // Actualizar en miembros
    await updateDoc(doc(db, ORGANIZATIONS, orgId, 'members', userId), {
        role,
    });

    // Actualizar en usuario
    await updateDoc(doc(db, USERS, userId), {
        role,
        updatedAt: Timestamp.now(),
    });
}

/**
 * Actualizar módulos habilitados de un usuario
 */
export async function actualizarModulosUsuario(
    orgId: string,
    userId: string,
    modulosHabilitados: string[] | null
): Promise<void> {
    // Actualizar en miembros
    await updateDoc(doc(db, ORGANIZATIONS, orgId, 'members', userId), {
        modulosHabilitados,
    });

    // Actualizar en usuario
    await updateDoc(doc(db, USERS, userId), {
        modulosHabilitados,
        updatedAt: Timestamp.now(),
    });
}

/**
 * Actualizar último login
 */
export async function actualizarUltimoLogin(userId: string): Promise<void> {
    try {
        await updateDoc(doc(db, USERS, userId), {
            lastLogin: Timestamp.now(),
        });
    } catch (error) {
        // Silently fail if user doesn't exist yet
        console.warn('Could not update last login:', error);
    }
}

// ============================================
// HELPERS
// ============================================

/**
 * Generar slug único desde nombre
 */
function generarSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
        .replace(/[^a-z0-9]+/g, '-')     // Reemplazar no-alfanuméricos
        .replace(/^-|-$/g, '')           // Quitar guiones al inicio/final
        .substring(0, 50);               // Limitar longitud
}

/**
 * Verificar si usuario tiene acceso a un módulo
 */
export function tieneAccesoModulo(
    modulosHabilitados: string[] | null,
    modulo: string
): boolean {
    // null = acceso completo
    if (modulosHabilitados === null) return true;

    // Array vacío = sin acceso
    if (modulosHabilitados.length === 0) return false;

    // Verificar si el módulo está en la lista
    return modulosHabilitados.includes(modulo);
}

/**
 * Verificar si usuario puede realizar acción según su rol
 */
export function puedeRealizarAccion(
    role: UserRole,
    accion: 'read' | 'write' | 'delete' | 'admin'
): boolean {
    const permisos: Record<UserRole, string[]> = {
        owner: ['read', 'write', 'delete', 'admin'],
        admin: ['read', 'write', 'delete', 'admin'],
        operator: ['read', 'write'],
        viewer: ['read'],
    };

    return permisos[role]?.includes(accion) || false;
}
