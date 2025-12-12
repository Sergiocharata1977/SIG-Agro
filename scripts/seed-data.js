/**
 * Script para crear datos de ejemplo en SIG Agro
 * Crea una organización de ejemplo con campos y lotes en el Chaco
 * 
 * Uso: node scripts/seed-data.js
 */

const admin = require('firebase-admin');

// Cargar credenciales
const serviceAccount = require('../service-account.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Datos de ejemplo - Campos reales del Chaco
const ORGANIZACION_EJEMPLO = {
    id: 'demo-agro-chaco',
    name: 'Agropecuaria Los Algarrobos',
    slug: 'agro-los-algarrobos',
    email: 'admin@losalgarrobos.com.ar',
    province: 'Chaco',
    city: 'Resistencia',
    plan: 'professional',
    status: 'active',
    features: {
        mapa_gis: true,
        campanias: true,
        contabilidad: true,
        analisis_ia: true,
        documentos: true,
        reportes: true,
        metricas: true,
        max_usuarios: 10,
        max_campos: 50,
        max_hectareas: 10000
    },
    settings: {
        timezone: 'America/Argentina/Buenos_Aires',
        currency: 'ARS',
        language: 'es'
    },
    createdBy: 'seed-script',
    createdAt: new Date(),
    updatedAt: new Date()
};

// Campos con coordenadas reales del Chaco
const CAMPOS_EJEMPLO = [
    {
        nombre: 'Campo La Esperanza',
        provincia: 'Chaco',
        departamento: 'San Fernando',
        superficieTotal: 850,
        activo: true,
        // Coordenadas reales cerca de Resistencia
        perimetro: {
            type: 'Polygon',
            coordinates: [[
                [-58.9200, -27.4200],
                [-58.8800, -27.4200],
                [-58.8800, -27.4600],
                [-58.9200, -27.4600],
                [-58.9200, -27.4200]
            ]]
        },
        lotes: [
            {
                nombre: 'Lote Norte - Soja',
                superficie: 280,
                estado: 'sembrado',
                cultivoActual: 'Soja',
                campaniaActual: '2024/2025',
                poligono: {
                    type: 'Polygon',
                    coordinates: [[
                        [-58.9200, -27.4200],
                        [-58.9000, -27.4200],
                        [-58.9000, -27.4400],
                        [-58.9200, -27.4400],
                        [-58.9200, -27.4200]
                    ]]
                }
            },
            {
                nombre: 'Lote Sur - Maíz',
                superficie: 350,
                estado: 'sembrado',
                cultivoActual: 'Maíz',
                campaniaActual: '2024/2025',
                poligono: {
                    type: 'Polygon',
                    coordinates: [[
                        [-58.9000, -27.4400],
                        [-58.8800, -27.4400],
                        [-58.8800, -27.4600],
                        [-58.9000, -27.4600],
                        [-58.9000, -27.4400]
                    ]]
                }
            },
            {
                nombre: 'Lote Este - Barbecho',
                superficie: 220,
                estado: 'barbecho',
                poligono: {
                    type: 'Polygon',
                    coordinates: [[
                        [-58.8900, -27.4200],
                        [-58.8800, -27.4200],
                        [-58.8800, -27.4400],
                        [-58.8900, -27.4400],
                        [-58.8900, -27.4200]
                    ]]
                }
            }
        ]
    },
    {
        nombre: 'Campo San Miguel',
        provincia: 'Chaco',
        departamento: 'Comandante Fernández',
        superficieTotal: 1200,
        activo: true,
        // Coordenadas cerca de Presidencia Roque Sáenz Peña
        perimetro: {
            type: 'Polygon',
            coordinates: [[
                [-60.4500, -26.7800],
                [-60.4000, -26.7800],
                [-60.4000, -26.8300],
                [-60.4500, -26.8300],
                [-60.4500, -26.7800]
            ]]
        },
        lotes: [
            {
                nombre: 'Lote Principal - Algodón',
                superficie: 500,
                estado: 'sembrado',
                cultivoActual: 'Algodón',
                campaniaActual: '2024/2025',
                poligono: {
                    type: 'Polygon',
                    coordinates: [[
                        [-60.4500, -26.7800],
                        [-60.4250, -26.7800],
                        [-60.4250, -26.8050],
                        [-60.4500, -26.8050],
                        [-60.4500, -26.7800]
                    ]]
                }
            },
            {
                nombre: 'Lote Girasol',
                superficie: 400,
                estado: 'sembrado',
                cultivoActual: 'Girasol',
                campaniaActual: '2024/2025',
                poligono: {
                    type: 'Polygon',
                    coordinates: [[
                        [-60.4250, -26.7800],
                        [-60.4000, -26.7800],
                        [-60.4000, -26.8050],
                        [-60.4250, -26.8050],
                        [-60.4250, -26.7800]
                    ]]
                }
            }
        ]
    }
];

async function seedData() {
    console.log('🌱 Iniciando seed de datos de ejemplo...\n');

    try {
        // 1. Crear organización
        console.log('📁 Creando organización de ejemplo...');
        await db.collection('organizations').doc(ORGANIZACION_EJEMPLO.id).set(ORGANIZACION_EJEMPLO);
        console.log(`   ✅ Organización: ${ORGANIZACION_EJEMPLO.name}`);

        // 2. Crear campos y lotes
        console.log('\n🗺️  Creando campos con coordenadas reales...');

        for (const campoData of CAMPOS_EJEMPLO) {
            const { lotes, ...campo } = campoData;

            // Crear campo - serializar perimetro como JSON string
            const campoParaGuardar = {
                nombre: campo.nombre,
                provincia: campo.provincia,
                departamento: campo.departamento,
                superficieTotal: campo.superficieTotal,
                activo: campo.activo,
                perimetro: JSON.stringify(campo.perimetro),
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const campoRef = await db
                .collection(`organizations/${ORGANIZACION_EJEMPLO.id}/campos`)
                .add(campoParaGuardar);

            console.log(`   ✅ Campo: ${campo.nombre} (${campo.superficieTotal} ha)`);

            // Crear lotes del campo
            for (const loteData of lotes) {
                const loteParaGuardar = {
                    nombre: loteData.nombre,
                    superficie: loteData.superficie,
                    estado: loteData.estado,
                    cultivoActual: loteData.cultivoActual || null,
                    campaniaActual: loteData.campaniaActual || null,
                    poligono: JSON.stringify(loteData.poligono),
                    campoId: campoRef.id,
                    activo: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                await db
                    .collection(`organizations/${ORGANIZACION_EJEMPLO.id}/campos/${campoRef.id}/lotes`)
                    .add(loteParaGuardar);

                console.log(`      📍 Lote: ${loteData.nombre} (${loteData.superficie} ha) - ${loteData.cultivoActual || 'Sin cultivo'}`);
            }
        }

        // 3. Crear usuario de ejemplo asociado a la organización
        console.log('\n👤 Creando usuario de ejemplo...');
        const usuarioId = 'usuario-demo-' + Date.now();
        await db.collection('users').doc(usuarioId).set({
            email: 'demo@losalgarrobos.com.ar',
            displayName: 'Usuario Demo',
            organizationId: ORGANIZACION_EJEMPLO.id,
            role: 'owner',
            status: 'active',
            modulosHabilitados: null, // Acceso total
            createdAt: new Date(),
            updatedAt: new Date()
        });
        console.log('   ✅ Usuario: demo@losalgarrobos.com.ar');

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ ¡Datos de ejemplo creados exitosamente!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`\n📊 Resumen:`);
        console.log(`   • 1 Organización: ${ORGANIZACION_EJEMPLO.name}`);
        console.log(`   • ${CAMPOS_EJEMPLO.length} Campos`);
        console.log(`   • ${CAMPOS_EJEMPLO.reduce((acc, c) => acc + c.lotes.length, 0)} Lotes`);
        console.log(`\n🔗 Para ver los datos, inicia sesión con Super Admin`);
        console.log(`   o registra un nuevo usuario en la organización.`);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }

    process.exit(0);
}

seedData();
