import { db } from '@/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Verificar si un usuario es super admin
 * @param userId ID del usuario en Firebase Auth
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));

    if (!userDoc.exists()) return false;

    // Verificar campo role
    return userDoc.data().role === 'super_admin';
  } catch (error) {
    console.error('Error al verificar super admin:', error);
    return false;
  }
}

/**
 * Verificar si un usuario es super admin (Lado del servidor - requiere admin SDK si se usara en API route puro, 
 * pero aqui usamos cliente o helper compartido. Para API Routes usar la verificación en el handler)
 */
