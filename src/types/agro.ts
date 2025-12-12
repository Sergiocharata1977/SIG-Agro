/**
 * Tipos para el sistema SIG Agro
 * Modelo de datos para campos, lotes y producción agrícola
 */

// ============================================
// TIPOS BASE
// ============================================

export interface GeoJSONPolygon {
    type: 'Polygon';
    coordinates: number[][][]; // [[[lng, lat], [lng, lat], ...]]
}

export interface GeoJSONPoint {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
}

// ============================================
// PRODUCTOR
// ============================================

export interface Productor {
    id: string;
    // Datos del usuario (AUTH)
    userId: string;           // ID de Firebase Auth
    email: string;

    // Datos personales
    nombre: string;
    apellido: string;
    telefono?: string;
    dni?: string;

    // Ubicación
    provincia: string;        // "Chaco"
    localidad: string;
    direccion?: string;

    // Datos empresariales
    razonSocial?: string;
    cuit?: string;

    // Metadatos
    createdAt: Date;
    updatedAt: Date;
}

// ============================================
// CAMPO (Establecimiento)
// ============================================

export interface Campo {
    id: string;
    productorId: string;

    // Identificación
    nombre: string;           // "Campo Los Algarrobos"
    codigo?: string;          // Código interno

    // Ubicación
    provincia: string;
    departamento: string;
    localidad?: string;

    // Superficie
    superficieTotal: number;  // Hectáreas totales
    superficieCultivable?: number;

    // GIS
    ubicacion?: GeoJSONPoint;   // Centro del campo
    perimetro?: GeoJSONPolygon; // Polígono del campo

    // Documentación
    matricula?: string;       // Título de propiedad

    // Estado
    activo: boolean;

    // Metadatos
    createdAt: Date;
    updatedAt: Date;
}

// ============================================
// LOTE
// ============================================

export type TipoSuelo = 'arcilloso' | 'arenoso' | 'franco' | 'humifero' | 'mixto';
export type EstadoLote = 'barbecho' | 'sembrado' | 'desarrollo' | 'cosecha' | 'descanso';

export interface Lote {
    id: string;
    campoId: string;
    productorId: string;

    // Identificación
    nombre: string;           // "Lote 1", "Norte", etc.
    codigo?: string;

    // Superficie
    superficie: number;       // Hectáreas

    // GIS
    poligono: GeoJSONPolygon; // Polígono del lote (OBLIGATORIO)
    centroide?: GeoJSONPoint; // Centro calculado

    // Características del suelo
    tipoSuelo?: TipoSuelo;
    capacidadUso?: string;    // Clase de capacidad de uso

    // Estado actual
    estado: EstadoLote;
    cultivoActual?: string;   // "Soja", "Maíz", etc.
    campaniaActual?: string;  // "2024/2025"

    // Historial (referencias)
    ultimaCosecha?: Date;
    ultimoRendimiento?: number; // kg/ha

    // Metadatos
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// ============================================
// CAMPAÑA AGRÍCOLA
// ============================================

export interface Campania {
    id: string;
    loteId: string;
    campoId: string;
    productorId: string;

    // Identificación
    nombre: string;           // "2024/2025"
    fechaInicio: Date;
    fechaFin?: Date;

    // Cultivo
    cultivo: string;          // "Soja", "Maíz", "Algodón", etc.
    variedad?: string;        // "DM 46i17"
    tecnologia?: string;      // "RR", "Bt", "Convencional"

    // Siembra
    fechaSiembra?: Date;
    densidadSiembra?: number; // semillas/ha
    distanciaEntresurco?: number; // cm

    // Cosecha
    fechaCosecha?: Date;
    rendimiento?: number;     // kg/ha
    humedad?: number;         // %

    // Económico
    costoTotal?: number;
    ingresoTotal?: number;

    // Estado
    estado: 'planificada' | 'en_curso' | 'finalizada' | 'cancelada';

    // Metadatos
    createdAt: Date;
    updatedAt: Date;
}

// ============================================
// EVENTOS DE LOTE (Labores, Aplicaciones, etc.)
// ============================================

export type TipoEvento =
    | 'siembra'
    | 'fertilizacion'
    | 'pulverizacion'
    | 'laboreo'
    | 'riego'
    | 'cosecha'
    | 'observacion'
    | 'analisis_suelo'
    | 'otro';

export interface EventoLote {
    id: string;
    loteId: string;
    campaniaId: string;
    productorId: string;

    // Tipo
    tipo: TipoEvento;
    descripcion: string;

    // Fecha y hora
    fecha: Date;
    horaInicio?: string;
    horaFin?: string;

    // Superficie afectada
    superficieAplicada?: number; // ha

    // Productos (para fertilización/pulverización)
    productos?: ProductoAplicado[];

    // Dosis (simplificado)
    dosis?: string;           // "200 lt/ha", "150 kg/ha"

    // Condiciones climáticas
    temperatura?: number;
    humedad?: number;
    viento?: number;          // km/h

    // Documentación
    fotos?: string[];         // URLs en Firebase Storage
    observaciones?: string;

    // Metadatos
    createdAt: Date;
    updatedAt: Date;
    creadoPor: string;        // userId
}

export interface ProductoAplicado {
    nombre: string;           // "Glifosato", "Urea granulada"
    marca?: string;
    dosis: number;
    unidad: string;           // "lt/ha", "kg/ha"
    ingredienteActivo?: string;
}

// ============================================
// ANÁLISIS DE IA
// ============================================

export type TipoAlerta = 'info' | 'warning' | 'critical';

export interface AnalisisIA {
    id: string;
    loteId: string;
    campaniaId?: string;

    // Tipo de análisis
    tipoAnalisis: 'ndvi' | 'estres' | 'rendimiento' | 'completo';

    // Fecha del análisis
    fechaAnalisis: Date;
    fechaDatosSatelitales?: Date;

    // Resultados
    resumen: string;
    detalles: string;

    // Métricas
    ndviPromedio?: number;
    ndviMinimo?: number;
    ndviMaximo?: number;

    // Alertas generadas
    alertas: AlertaIA[];

    // Recomendaciones
    recomendaciones: string[];

    // Metadatos
    createdAt: Date;
}

export interface AlertaIA {
    tipo: TipoAlerta;
    titulo: string;
    descripcion: string;
    accionSugerida?: string;
}

// ============================================
// DOCUMENTO / EVIDENCIA
// ============================================

export interface Documento {
    id: string;
    productorId: string;
    campoId?: string;
    loteId?: string;
    campaniaId?: string;

    // Identificación
    nombre: string;
    descripcion?: string;
    tipo: 'foto' | 'documento' | 'certificado' | 'analisis' | 'otro';

    // Archivo
    url: string;              // URL en Firebase Storage
    mimeType: string;
    tamano: number;           // bytes

    // Metadatos
    createdAt: Date;
    creadoPor: string;

    // Categorías para trazabilidad
    categorias?: string[];    // ["BPA", "ISO9001", "trazabilidad"]
}

// ============================================
// COLECCIONES FIRESTORE
// ============================================
/*
Estructura de colecciones:

agro_productores/{productorId}
  - Datos del productor

agro_productores/{productorId}/campos/{campoId}
  - Campos del productor

agro_productores/{productorId}/campos/{campoId}/lotes/{loteId}
  - Lotes del campo

agro_productores/{productorId}/campanias/{campaniaId}
  - Campañas (puede estar a nivel productor para acceso más fácil)

agro_productores/{productorId}/eventos/{eventoId}
  - Eventos de todos los lotes

agro_productores/{productorId}/analisis/{analisisId}
  - Análisis de IA

agro_productores/{productorId}/documentos/{documentoId}
  - Documentos y fotos
*/
