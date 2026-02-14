
/**
 * Script para poblar datos contables iniciales
 * - Plan de Cuentas Básico (Agro)
 * - Productos Iniciales (Insumos)
 */
const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
const ORG_ID = process.env.ORG_ID || 'demo-agro-chaco'; // Organización destino

const CUENTAS_BASE = [
    // ACTIVO
    { codigo: '1.0.00.000', nombre: 'ACTIVO', tipo: 'activo', naturaleza: 'deudora', nivel: 1, admiteMovimientos: false },
    { codigo: '1.1.00.000', nombre: 'ACTIVO CORRIENTE', tipo: 'activo', naturaleza: 'deudora', nivel: 2, admiteMovimientos: false },
    { codigo: '1.1.01.000', nombre: 'DISPONIBILIDADES', tipo: 'activo', naturaleza: 'deudora', nivel: 3, admiteMovimientos: false },
    { codigo: '1.1.01.001', nombre: 'Caja', tipo: 'activo', naturaleza: 'deudora', nivel: 4, admiteMovimientos: true },
    { codigo: '1.1.01.002', nombre: 'Banco Nación CC', tipo: 'activo', naturaleza: 'deudora', nivel: 4, admiteMovimientos: true },

    { codigo: '1.1.02.000', nombre: 'BIENES DE CAMBIO', tipo: 'activo', naturaleza: 'deudora', nivel: 3, admiteMovimientos: false },
    { codigo: '1.1.02.001', nombre: 'Silo Bolsa Soja', tipo: 'activo', naturaleza: 'deudora', nivel: 4, admiteMovimientos: true, esCuentaStock: true },
    { codigo: '1.1.02.002', nombre: 'Insumos - Semillas', tipo: 'activo', naturaleza: 'deudora', nivel: 4, admiteMovimientos: true, esCuentaStock: true },
    { codigo: '1.1.02.003', nombre: 'Insumos - Agroquímicos', tipo: 'activo', naturaleza: 'deudora', nivel: 4, admiteMovimientos: true, esCuentaStock: true },

    // PASIVO
    { codigo: '2.0.00.000', nombre: 'PASIVO', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 1, admiteMovimientos: false },
    { codigo: '2.1.00.000', nombre: 'PASIVO CORRIENTE', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 2, admiteMovimientos: false },
    { codigo: '2.1.01.001', nombre: 'Proveedores', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 4, admiteMovimientos: true },

    // PATRIMONIO
    { codigo: '3.0.00.000', nombre: 'PATRIMONIO NETO', tipo: 'patrimonio', naturaleza: 'acreedora', nivel: 1, admiteMovimientos: false },
    { codigo: '3.1.00.000', nombre: 'Capital Social', tipo: 'patrimonio', naturaleza: 'acreedora', nivel: 3, admiteMovimientos: true },

    // INGRESOS
    { codigo: '4.0.00.000', nombre: 'INGRESOS', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 1, admiteMovimientos: false },
    { codigo: '4.1.00.001', nombre: 'Ventas de Soja', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 4, admiteMovimientos: true },
    { codigo: '4.1.00.002', nombre: 'Ventas de Maíz', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 4, admiteMovimientos: true },

    // EGRESOS
    { codigo: '5.0.00.000', nombre: 'EGRESOS', tipo: 'gasto', naturaleza: 'deudora', nivel: 1, admiteMovimientos: false },
    { codigo: '5.1.00.000', nombre: 'COSTOS DIRECTOS', tipo: 'gasto', naturaleza: 'deudora', nivel: 2, admiteMovimientos: false },
    { codigo: '5.1.01.001', nombre: 'Semillas', tipo: 'gasto', naturaleza: 'deudora', nivel: 4, admiteMovimientos: true },
    { codigo: '5.1.01.002', nombre: 'Fertilizantes', tipo: 'gasto', naturaleza: 'deudora', nivel: 4, admiteMovimientos: true },
    { codigo: '5.1.01.003', nombre: 'Labores Contratadas', tipo: 'gasto', naturaleza: 'deudora', nivel: 4, admiteMovimientos: true },
];

const PRODUCTOS_BASE = [
    {
        codigo: 'INS-SEM-SOJ-01',
        nombre: 'Semilla Soja Don Mario 46i20',
        categoria: 'insumo',
        unidadMedida: 'kg',
        precioCompra: 1.5, // USD
        precioVenta: 0,
        stockMinimo: 1000
    },
    {
        codigo: 'INS-FERT-URE',
        nombre: 'Urea Granulada',
        categoria: 'insumo',
        unidadMedida: 'kg',
        precioCompra: 0.8,
        precioVenta: 0,
        stockMinimo: 5000
    },
    {
        codigo: 'INS-HERB-GLI',
        nombre: 'Glifosato Premium',
        categoria: 'insumo',
        unidadMedida: 'lt',
        precioCompra: 5.5,
        precioVenta: 0,
        stockMinimo: 200
    }
];

async function seedAccounting() {
    console.log(`🌱 Sembrando datos contables para: ${ORG_ID}`);

    // 1. Crear Plan de Cuentas
    console.log('\n📚 Creando Plan de Cuentas...');
    const accountsRef = db.collection(`organizations/${ORG_ID}/accounts`);

    // Limpiar cuentas existentes? (Opcional, mejor no borrar si ya hay)
    // Para simplificar, asumimos base limpia o merge

    const batch = db.batch();

    for (const cuenta of CUENTAS_BASE) {
        // Usar código como ID para evitar duplicados si se corre varias veces
        // Pero Firestore doc IDs no suelen llevar puntos.
        // Usaremos slug o ID auto-generado, pero checkeando si existe por código.

        const q = accountsRef.where('codigo', '==', cuenta.codigo).limit(1);
        const snapshot = await q.get();

        const now = new Date();
        const baseData = {
            ...cuenta,
            orgId: ORG_ID,
            active: true,
            updatedAt: now,
            // defaults
            esCuentaStock: cuenta.esCuentaStock || false,
            moneda: 'ARS'
        };

        if (snapshot.empty) {
            const docRef = accountsRef.doc();
            batch.set(docRef, { ...baseData, createdAt: now });
        } else {
            console.log(`   Cuenta existente: ${cuenta.codigo}`);
        }
    }

    await batch.commit();
    console.log('✅ Plan de Cuentas creado/actualizado.');

    // 2. Crear Productos
    console.log('\n📦 Creando Productos...');
    const productsRef = db.collection(`organizations/${ORG_ID}/products`);

    for (const prod of PRODUCTOS_BASE) {
        const q = productsRef.where('codigo', '==', prod.codigo).limit(1);
        const snapshot = await q.get();

        if (snapshot.empty) {
            await productsRef.add({
                ...prod,
                orgId: ORG_ID,
                stockActual: 0,
                active: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log(`   + Producto: ${prod.nombre}`);
        } else {
            console.log(`   Producto existente: ${prod.codigo}`);
        }
    }

    console.log('\n✅ Seed Contable finalizado con éxito.');
    process.exit(0);
}

seedAccounting();

