import {
    collection,
    doc,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    runTransaction
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Product, StockMovement } from '@/types/accounting';

// ============================================
// PRODUCTOS (ITEMS)
// ============================================

export const crearProducto = async (orgId: string, product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'stockActual'>) => {
    try {
        const collectionRef = collection(db, `organizations/${orgId}/products`);
        const now = new Date();

        const docRef = await addDoc(collectionRef, {
            ...product,
            stockActual: 0, // Inicialmente 0
            createdAt: now,
            updatedAt: now,
            active: true
        });

        return { id: docRef.id, ...product, stockActual: 0 };
    } catch (error) {
        console.error('Error al crear producto:', error);
        throw error;
    }
};

export const obtenerProductos = async (orgId: string): Promise<Product[]> => {
    try {
        const collectionRef = collection(db, `organizations/${orgId}/products`);
        const q = query(
            collectionRef,
            where('active', '==', true),
            orderBy('nombre', 'asc')
        );
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Product));
    } catch (error) {
        console.error('Error al obtener productos:', error);
        throw error;
    }
};

// ============================================
// MOVIMIENTOS DE STOCK
// ============================================

export const registrarMovimiento = async (orgId: string, movement: Omit<StockMovement, 'id' | 'createdAt'>) => {
    try {
        // Usamos transacción para asegurar consistencia del stockActual
        const result = await runTransaction(db, async (transaction) => {
            const productRef = doc(db, `organizations/${orgId}/products/${movement.productId}`);
            const productDoc = await transaction.get(productRef);

            if (!productDoc.exists()) {
                throw new Error("Producto no encontrado");
            }

            const currentStock = productDoc.data().stockActual || 0;
            let newStock = currentStock;

            // Calcular nuevo stock según tipo de movimiento
            // entrada_compra (+)
            // salida_consumo (-)
            // cosecha (+) -> Ingreso de granos a stock
            // ajuste (+/-) -> Depende el signo de la cantidad, asumimos cantidad con signo correcto o lógica explícita

            // Asumimos que 'cantidad' siempre es positiva y el tipo define el signo?
            // O cantidad puede ser negativa?
            // Convención habitual: cantidad positiva. El tipo define la operación.

            switch (movement.tipo) {
                case 'entrada_compra':
                case 'cosecha':
                    newStock += movement.cantidad;
                    break;
                case 'salida_consumo':
                    newStock -= movement.cantidad;
                    break;
                case 'ajuste':
                    // Ajuste puede ser suma o resta. 
                    // Si se pasa cantidad negativa es resta, positiva es suma.
                    // O definimos ajuste_positivo / ajuste_negativo.
                    // Por simplicidad, asumimos que en ajuste la cantidad tiene signo.
                    // Pero para consistencia con los otros, mejor sumar siempre la cantidad signed.
                    newStock += movement.cantidad;
                    break;
            }

            // Validar stock negativo si es necesario (opcional)
            // if (newStock < 0) throw new Error("Stock insuficiente");

            // 1. Crear movimiento
            const movRef = doc(collection(db, `organizations/${orgId}/stock_movements`));
            const now = new Date();
            const newMovement = {
                ...movement,
                createdAt: now
            };
            transaction.set(movRef, newMovement);

            // 2. Actualizar producto
            transaction.update(productRef, {
                stockActual: newStock,
                updatedAt: now
            });

            return { id: movRef.id, ...newMovement, nuevoStock: newStock };
        });

        return result;
    } catch (error) {
        console.error('Error al registrar movimiento:', error);
        throw error;
    }
};

export const obtenerMovimientos = async (orgId: string, productId?: string, limitCount = 50): Promise<StockMovement[]> => {
    try {
        const collectionRef = collection(db, `organizations/${orgId}/stock_movements`);
        let q;

        if (productId) {
            q = query(
                collectionRef,
                where('productId', '==', productId),
                orderBy('fecha', 'desc'),
                limit(limitCount)
            );
        } else {
            q = query(
                collectionRef,
                orderBy('fecha', 'desc'),
                limit(limitCount)
            );
        }

        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                fecha: data.fecha instanceof Timestamp ? data.fecha.toDate() : new Date(data.fecha),
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
            } as StockMovement;
        });
    } catch (error) {
        console.error('Error al obtener movimientos:', error);
        throw error;
    }
};
