/**
 * Script para crear datos de ejemplo con nueva estructura
 * Colecciones: fields, plots, crops
 * 
 * Uso: node scripts/seed-new-structure.js
 */

const admin = require('firebase-admin');

// Cargar credenciales
const serviceAccount = require('../service-account.json');

// Evitar reinicialización
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

// ------------------------------------------
// ORGANIZACIÓN DE EJEMPLO
// ------------------------------------------
const ORG_ID = 'demo-agro-chaco';
const USER_ID = 'seed-script';

// ------------------------------------------
// CAMPOS (FIELDS)
// ------------------------------------------
const FIELDS = [
    {
        nombre: 'Campo La Esperanza',
        codigo: 'CLE-001',
        provincia: 'Chaco',
        departamento: 'San Fernando',
        localidad: 'Resistencia',
        superficieTotal: 850,
        superficieCultivable: 780,
        perimetro: JSON.stringify({
            type: 'Polygon',
            coordinates: [[
                [-58.9200, -27.4200],
                [-58.8800, -27.4200],
                [-58.8800, -27.4600],
                [-58.9200, -27.4600],
                [-58.9200, -27.4200]
            ]]
        }),
        propietario: 'Juan Pérez',
        arrendamiento: false,
        activo: true
    },
    {
        nombre: 'Campo San Miguel',
        codigo: 'CSM-002',
        provincia: 'Chaco',
        departamento: 'Comandante Fernández',
        localidad: 'Sáenz Peña',
        superficieTotal: 1200,
        superficieCultivable: 1100,
        perimetro: JSON.stringify({
            type: 'Polygon',
            coordinates: [[
                [-60.4500, -26.7800],
                [-60.4000, -26.7800],
                [-60.4000, -26.8300],
                [-60.4500, -26.8300],
                [-60.4500, -26.7800]
            ]]
        }),
        propietario: 'María García',
        arrendamiento: true,
        activo: true
    }
];

// ------------------------------------------
// LOTES (PLOTS) - por campo
// ------------------------------------------
const PLOTS_BY_FIELD = {
    'Campo La Esperanza': [
        {
            nombre: 'Lote Norte',
            codigo: 'CLE-LN-01',
            superficie: 280,
            tipoSuelo: 'franco_arcilloso',
            ph: 6.5,
            materiaOrganica: 3.2,
            estado: 'sembrado',
            poligono: JSON.stringify({
                type: 'Polygon',
                coordinates: [[
                    [-58.9200, -27.4200],
                    [-58.9000, -27.4200],
                    [-58.9000, -27.4400],
                    [-58.9200, -27.4400],
                    [-58.9200, -27.4200]
                ]]
            }),
            activo: true
        },
        {
            nombre: 'Lote Sur',
            codigo: 'CLE-LS-02',
            superficie: 350,
            tipoSuelo: 'franco',
            ph: 6.8,
            materiaOrganica: 2.9,
            estado: 'sembrado',
            poligono: JSON.stringify({
                type: 'Polygon',
                coordinates: [[
                    [-58.9000, -27.4400],
                    [-58.8800, -27.4400],
                    [-58.8800, -27.4600],
                    [-58.9000, -27.4600],
                    [-58.9000, -27.4400]
                ]]
            }),
            activo: true
        },
        {
            nombre: 'Lote Este',
            codigo: 'CLE-LE-03',
            superficie: 150,
            tipoSuelo: 'franco_arenoso',
            estado: 'barbecho',
            poligono: JSON.stringify({
                type: 'Polygon',
                coordinates: [[
                    [-58.8900, -27.4200],
                    [-58.8800, -27.4200],
                    [-58.8800, -27.4400],
                    [-58.8900, -27.4400],
                    [-58.8900, -27.4200]
                ]]
            }),
            activo: true
        }
    ],
    'Campo San Miguel': [
        {
            nombre: 'Lote Principal',
            codigo: 'CSM-LP-01',
            superficie: 500,
            tipoSuelo: 'franco_arcilloso',
            ph: 6.2,
            estado: 'sembrado',
            poligono: JSON.stringify({
                type: 'Polygon',
                coordinates: [[
                    [-60.4500, -26.7800],
                    [-60.4250, -26.7800],
                    [-60.4250, -26.8050],
                    [-60.4500, -26.8050],
                    [-60.4500, -26.7800]
                ]]
            }),
            activo: true
        },
        {
            nombre: 'Lote Girasol',
            codigo: 'CSM-LG-02',
            superficie: 400,
            tipoSuelo: 'franco',
            estado: 'desarrollo',
            poligono: JSON.stringify({
                type: 'Polygon',
                coordinates: [[
                    [-60.4250, -26.7800],
                    [-60.4000, -26.7800],
                    [-60.4000, -26.8050],
                    [-60.4250, -26.8050],
                    [-60.4250, -26.7800]
                ]]
            }),
            activo: true
        },
        {
            nombre: 'Lote Reserva',
            codigo: 'CSM-LR-03',
            superficie: 200,
            tipoSuelo: 'arcilloso',
            estado: 'descanso',
            poligono: JSON.stringify({
                type: 'Polygon',
                coordinates: [[
                    [-60.4250, -26.8050],
                    [-60.4000, -26.8050],
                    [-60.4000, -26.8300],
                    [-60.4250, -26.8300],
                    [-60.4250, -26.8050]
                ]]
            }),
            activo: true
        }
    ]
};

// ------------------------------------------
// CULTIVOS (CROPS) - por lote
// ------------------------------------------
const CROPS_BY_PLOT = {
    'Lote Norte': {
        campania: '2024/2025',
        cultivo: 'soja',
        variedad: 'DM 46i17 STS',
        tecnologia: 'RR2 Xtend',
        fechaSiembra: new Date('2024-11-15'),
        densidadSiembra: 320000,
        distanciaEntresurco: 52,
        rendimientoEstimado: 3200,
        estado: 'en_desarrollo'
    },
    'Lote Sur': {
        campania: '2024/2025',
        cultivo: 'maiz',
        variedad: 'DK 7210 VT3P',
        tecnologia: 'VT Triple Pro',
        fechaSiembra: new Date('2024-10-20'),
        densidadSiembra: 75000,
        distanciaEntresurco: 52,
        rendimientoEstimado: 9500,
        estado: 'en_desarrollo'
    },
    'Lote Principal': {
        campania: '2024/2025',
        cultivo: 'algodon',
        variedad: 'DP 1845 B2RF',
        tecnologia: 'Bollgard II',
        fechaSiembra: new Date('2024-10-25'),
        densidadSiembra: 100000,
        distanciaEntresurco: 100,
        rendimientoEstimado: 2800,
        estado: 'en_desarrollo'
    },
    'Lote Girasol': {
        campania: '2024/2025',
        cultivo: 'girasol',
        variedad: 'Paraiso 33 CL',
        tecnologia: 'Clearfield',
        fechaSiembra: new Date('2024-11-01'),
        densidadSiembra: 55000,
        distanciaEntresurco: 70,
        rendimientoEstimado: 2400,
        estado: 'en_desarrollo'
    }
};

// ------------------------------------------
// FUNCIÓN PRINCIPAL
// ------------------------------------------
async function seedNewStructure() {
    console.log('🌱 Creando datos con nueva estructura...\n');
    console.log(`📁 Organización: ${ORG_ID}\n`);

    const now = new Date();
    const fieldIds = {};
    const plotIds = {};

    try {
        // 1. Crear FIELDS
        console.log('🗺️  Creando campos (fields)...');
        for (const fieldData of FIELDS) {
            const fieldRef = await db
                .collection(`organizations/${ORG_ID}/fields`)
                .add({
                    ...fieldData,
                    organizationId: ORG_ID,
                    createdAt: now,
                    updatedAt: now,
                    createdBy: USER_ID
                });

            fieldIds[fieldData.nombre] = fieldRef.id;
            console.log(`   ✅ Field: ${fieldData.nombre} (${fieldData.superficieTotal} ha)`);
        }

        // 2. Crear PLOTS
        console.log('\n📍 Creando lotes (plots)...');
        for (const [fieldName, plots] of Object.entries(PLOTS_BY_FIELD)) {
            const fieldId = fieldIds[fieldName];

            for (const plotData of plots) {
                const plotRef = await db
                    .collection(`organizations/${ORG_ID}/plots`)
                    .add({
                        ...plotData,
                        organizationId: ORG_ID,
                        fieldId: fieldId,
                        createdAt: now,
                        updatedAt: now,
                        createdBy: USER_ID
                    });

                plotIds[plotData.nombre] = plotRef.id;
                console.log(`   ✅ Plot: ${plotData.nombre} (${plotData.superficie} ha) - ${plotData.estado}`);
            }
        }

        // 3. Crear CROPS
        console.log('\n🌾 Creando cultivos (crops)...');
        for (const [plotName, cropData] of Object.entries(CROPS_BY_PLOT)) {
            const plotId = plotIds[plotName];

            // Encontrar el fieldId del plot
            let fieldId = '';
            for (const [fieldName, plots] of Object.entries(PLOTS_BY_FIELD)) {
                if (plots.some(p => p.nombre === plotName)) {
                    fieldId = fieldIds[fieldName];
                    break;
                }
            }

            await db
                .collection(`organizations/${ORG_ID}/crops`)
                .add({
                    ...cropData,
                    organizationId: ORG_ID,
                    fieldId: fieldId,
                    plotId: plotId,
                    createdAt: now,
                    updatedAt: now,
                    createdBy: USER_ID
                });

            console.log(`   ✅ Crop: ${plotName} → ${cropData.cultivo} (${cropData.variedad})`);
        }

        // 4. Resumen
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ ¡Nueva estructura creada exitosamente!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`\n📊 Resumen:`);
        console.log(`   • ${FIELDS.length} Fields (Campos)`);
        console.log(`   • ${Object.values(PLOTS_BY_FIELD).flat().length} Plots (Lotes)`);
        console.log(`   • ${Object.keys(CROPS_BY_PLOT).length} Crops (Cultivos activos)`);
        console.log(`\n🔗 Colecciones creadas:`);
        console.log(`   • organizations/${ORG_ID}/fields`);
        console.log(`   • organizations/${ORG_ID}/plots`);
        console.log(`   • organizations/${ORG_ID}/crops`);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }

    process.exit(0);
}

seedNewStructure();
