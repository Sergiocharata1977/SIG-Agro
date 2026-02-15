/**
 * Servicio para gestion de Organizaciones
 * CRUD y operaciones de organizaciones en Firestore
 */

import {
    addDoc,
    arrayUnion,
    collection,
    collectionGroup,
    doc,
    getDoc,
    getDocs,
    query,
    setDoc,
    Timestamp,
    updateDoc,
    where,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import {
    DEFAULT_FREE_FEATURES,
    DEFAULT_SETTINGS,
    Organization,
    OrganizationMember,
    User,
    UserRole,
} from '@/types/organization';

const ORGANIZATIONS = 'organizations';
const USERS = 'users';

function mapOrganization(id: string, data: Record<string, unknown>): Organization {
    return {
        ...(data as Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>),
        id,
        createdAt: (data.createdAt as Timestamp | undefined)?.toDate() || new Date(),
        updatedAt: (data.updatedAt as Timestamp | undefined)?.toDate() || new Date(),
    };
}

function mapUser(id: string, data: Record<string, unknown>): User {
    return {
        ...(data as Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'joinedAt' | 'lastLogin'>),
        id,
        organizationIds: Array.isArray(data.organizationIds)
            ? (data.organizationIds as string[])
            : undefined,
        accessAllOrganizations: typeof data.accessAllOrganizations === 'boolean'
            ? (data.accessAllOrganizations as boolean)
            : true,
        createdAt: (data.createdAt as Timestamp | undefined)?.toDate() || new Date(),
        updatedAt: (data.updatedAt as Timestamp | undefined)?.toDate() || new Date(),
        joinedAt: (data.joinedAt as Timestamp | undefined)?.toDate(),
        lastLogin: (data.lastLogin as Timestamp | undefined)?.toDate(),
    };
}

/**
 * Crear nueva organizacion con el primer usuario como owner.
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
    const slug = generarSlug(data.name);

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

    await setDoc(doc(db, ORGANIZATIONS, orgRef.id, 'members', creatorUserId), {
        userId: creatorUserId,
        email: creatorEmail,
        displayName: creatorDisplayName,
        role: 'owner' as UserRole,
        status: 'active',
        modulosHabilitados: null,
        invitedBy: creatorUserId,
        joinedAt: Timestamp.now(),
    });

    await setDoc(doc(db, USERS, creatorUserId), {
        email: creatorEmail,
        displayName: creatorDisplayName,
        organizationId: orgRef.id,
        organizationIds: [orgRef.id],
        accessAllOrganizations: true,
        role: 'owner' as UserRole,
        status: 'active',
        modulosHabilitados: null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    }, { merge: true });

    return { organizationId: orgRef.id, userId: creatorUserId };
}

/**
 * Crear una organizacion para un productor ya existente.
 */
export async function crearOrganizacionParaUsuario(
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
): Promise<string> {
    const created = await crearOrganizacion(data, creatorUserId, creatorEmail, creatorDisplayName);

    await updateDoc(doc(db, USERS, creatorUserId), {
        organizationId: created.organizationId,
        organizationIds: arrayUnion(created.organizationId),
        accessAllOrganizations: true,
        updatedAt: Timestamp.now(),
    });

    return created.organizationId;
}

export async function obtenerOrganizacion(orgId: string): Promise<Organization | null> {
    const snapshot = await getDoc(doc(db, ORGANIZATIONS, orgId));
    if (!snapshot.exists()) return null;
    return mapOrganization(snapshot.id, snapshot.data() as Record<string, unknown>);
}

export async function obtenerOrganizacionPorSlug(slug: string): Promise<Organization | null> {
    const q = query(collection(db, ORGANIZATIONS), where('slug', '==', slug));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const first = snapshot.docs[0];
    return mapOrganization(first.id, first.data() as Record<string, unknown>);
}

export async function obtenerOrganizaciones(): Promise<Organization[]> {
    const snapshot = await getDocs(collection(db, ORGANIZATIONS));
    return snapshot.docs.map((d) => mapOrganization(d.id, d.data() as Record<string, unknown>));
}

/**
 * Organizaciones visibles para un usuario/productor.
 * Regla: si accessAllOrganizations=true, se incluyen las creadas por ese usuario
 * y las que lo tengan como miembro.
 */
export async function obtenerOrganizacionesUsuario(
    userId: string,
    userData?: User | null
): Promise<Organization[]> {
    const user = userData ?? await obtenerUsuario(userId);
    if (!user) return [];

    const ids = new Set<string>();

    if (user.organizationId) ids.add(user.organizationId);
    if (Array.isArray(user.organizationIds)) {
        user.organizationIds.forEach((id) => id && ids.add(id));
    }

    const shouldReadAll = user.accessAllOrganizations !== false;

    if (shouldReadAll) {
        const createdBySnap = await getDocs(
            query(collection(db, ORGANIZATIONS), where('createdBy', '==', userId))
        );
        createdBySnap.docs.forEach((d) => ids.add(d.id));

        const memberships = await getDocs(
            query(collectionGroup(db, 'members'), where('userId', '==', userId))
        );
        memberships.docs.forEach((memberDoc) => {
            const orgRef = memberDoc.ref.parent.parent;
            if (orgRef?.id) ids.add(orgRef.id);
        });
    }

    const organizations = await Promise.all(Array.from(ids).map((id) => obtenerOrganizacion(id)));
    return organizations
        .filter((o): o is Organization => Boolean(o))
        .sort((a, b) => a.name.localeCompare(b.name));
}

export async function actualizarOrganizacion(orgId: string, data: Partial<Organization>): Promise<void> {
    await updateDoc(doc(db, ORGANIZATIONS, orgId), {
        ...data,
        updatedAt: Timestamp.now(),
    });
}

export async function cambiarOrganizacionActiva(userId: string, organizationId: string): Promise<void> {
    await updateDoc(doc(db, USERS, userId), {
        organizationId,
        organizationIds: arrayUnion(organizationId),
        updatedAt: Timestamp.now(),
    });
}

export async function obtenerUsuario(userId: string): Promise<User | null> {
    const snapshot = await getDoc(doc(db, USERS, userId));
    if (!snapshot.exists()) return null;
    return mapUser(snapshot.id, snapshot.data() as Record<string, unknown>);
}

export async function obtenerMiembrosOrganizacion(orgId: string): Promise<OrganizationMember[]> {
    const snapshot = await getDocs(collection(db, ORGANIZATIONS, orgId, 'members'));

    return snapshot.docs.map((d) => {
        const data = d.data();
        return {
            ...(data as Omit<OrganizationMember, 'userId' | 'joinedAt'>),
            userId: d.id,
            joinedAt: (data.joinedAt as Timestamp | undefined)?.toDate() || new Date(),
        };
    });
}

export async function agregarMiembroOrganizacion(
    orgId: string,
    userId: string,
    email: string,
    displayName: string,
    role: UserRole,
    invitedBy: string
): Promise<void> {
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

    await setDoc(doc(db, USERS, userId), {
        email,
        displayName,
        organizationId: orgId,
        organizationIds: arrayUnion(orgId),
        accessAllOrganizations: true,
        role,
        status: 'active',
        modulosHabilitados: null,
        invitedBy,
        joinedAt: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    }, { merge: true });
}

export async function actualizarRolMiembro(orgId: string, userId: string, role: UserRole): Promise<void> {
    await updateDoc(doc(db, ORGANIZATIONS, orgId, 'members', userId), { role });
    await updateDoc(doc(db, USERS, userId), { role, updatedAt: Timestamp.now() });
}

export async function actualizarModulosUsuario(
    orgId: string,
    userId: string,
    modulosHabilitados: string[] | null
): Promise<void> {
    await updateDoc(doc(db, ORGANIZATIONS, orgId, 'members', userId), { modulosHabilitados });
    await updateDoc(doc(db, USERS, userId), { modulosHabilitados, updatedAt: Timestamp.now() });
}

export async function actualizarUltimoLogin(userId: string): Promise<void> {
    try {
        await updateDoc(doc(db, USERS, userId), {
            lastLogin: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
    } catch (error) {
        console.warn('Could not update last login:', error);
    }
}

function generarSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50);
}

export function tieneAccesoModulo(modulosHabilitados: string[] | null, modulo: string): boolean {
    if (modulosHabilitados === null) return true;
    if (modulosHabilitados.length === 0) return false;
    return modulosHabilitados.includes(modulo);
}

export function puedeRealizarAccion(
    role: UserRole,
    accion: 'read' | 'write' | 'delete' | 'admin'
): boolean {
    const permisos: Record<UserRole, string[]> = {
        super_admin: ['read', 'write', 'delete', 'admin'],
        owner: ['read', 'write', 'delete', 'admin'],
        admin: ['read', 'write', 'delete', 'admin'],
        operator: ['read', 'write'],
        viewer: ['read'],
    };

    return permisos[role]?.includes(accion) || false;
}

