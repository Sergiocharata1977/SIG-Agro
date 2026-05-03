'use client';

import { useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Map,
  CalendarDays,
  ShoppingCart,
  Tractor,
  Truck,
  Settings,
  Landmark,
  Users,
  Bot,
  Bell,
  Puzzle,
  FileText,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
} from 'lucide-react';

type Section = {
  id: string;
  icon: typeof BookOpen;
  title: string;
  summary: string;
  content: string[];
  tips?: string[];
};

const SECTIONS: Section[] = [
  {
    id: 'inicio',
    icon: Lightbulb,
    title: 'Primeros pasos',
    summary: 'Cómo crear tu organización y configurar el sistema por primera vez.',
    content: [
      'Al ingresar por primera vez, el sistema te pedirá crear una organización. Esta es la unidad base que agrupa todos tus campos, campañas y registros operativos.',
      'Una vez creada la organización, accedés al dashboard principal con indicadores de estado del establecimiento.',
      'Desde el sidebar izquierdo podés navegar a todos los módulos. Los hubs (botones con ícono y flecha) abren paneles con accesos agrupados por área operativa.',
      'Si tenés más de una organización, el selector en el panel superior del sidebar te permite cambiar de contexto sin cerrar sesión.',
    ],
    tips: [
      'Cargá primero tus Campos y Lotes — todos los módulos de operaciones los usan como referencia.',
      'Activá los plugins que necesitás desde Configuración → Plugins antes de buscar las rutas de módulos avanzados.',
    ],
  },
  {
    id: 'gis',
    icon: Map,
    title: 'Campos y GIS',
    summary: 'Gestión de establecimientos, lotes y cartografía operativa.',
    content: [
      'El módulo Campos y GIS es el punto de partida territorial. Desde el hub "Campos y GIS" en el sidebar accedés al mapa interactivo, al ABM de campos y a la gestión de lotes.',
      'El Mapa GIS muestra la cartografía del establecimiento con los lotes definidos, permitiendo interacción directa para ver estado productivo y alertas por zona.',
      'Los Campos son los establecimientos o fracciones catastrales. Cada campo tiene lotes asociados con superficie, coordenadas y atributos productivos.',
      'Los Lotes son las unidades de producción. Se pueden cargar con polígono GIS o con datos básicos (superficie, cultivo actual).',
      'La sección Mapas satelitales muestra imágenes NDVI y análisis de cobertura vegetal por períodos para detectar variabilidad dentro del lote.',
    ],
    tips: [
      'Cargá los lotes con la mayor precisión posible — el sistema usa la superficie para calcular costos por hectárea.',
      'El plotId del lote aparece en la URL: usalo para acceder directo al contexto de ese lote desde otros módulos.',
    ],
  },
  {
    id: 'planificacion',
    icon: CalendarDays,
    title: 'Planificación de Campaña',
    summary: 'Campañas, cuaderno de campo, cultivos y seguimiento de rendimientos.',
    content: [
      'Una Campaña es el ciclo productivo anual (ej: "Campaña 2025/26"). Agrupa todos los cultivos, labores y resultados de un período.',
      'El Cuaderno de campo registra todas las actividades por cultivo: siembras, tratamientos, observaciones y eventos. Es el historial trazable de cada lote.',
      'Rendimientos muestra los resultados económicos por campaña y lote: ingresos, costos, margen bruto y comparativa interanual.',
      'Con el plugin Agro Gestión activo, accedés a Resultado Económico completo en /campanas/resultado con desglose por concepto y por lote.',
    ],
    tips: [
      'Creá la campaña antes de registrar operaciones — cada operación queda asociada a una campaña para los reportes.',
      'El cuaderno es la base del análisis de rentabilidad: cuanto más completo, mejores los informes de cierre.',
    ],
  },
  {
    id: 'compras',
    icon: ShoppingCart,
    title: 'Compras',
    summary: 'Insumos, órdenes de compra, proveedores y gestión de pagos.',
    content: [
      'El módulo Insumos contiene el catálogo de semillas, fitosanitarios, fertilizantes y otros consumibles del establecimiento.',
      'Las Órdenes de compra permiten gestionar el proceso de adquisición: solicitud, aprobación y recepción de mercadería.',
      'El ABM de Proveedores mantiene el maestro de empresas proveedoras con condiciones comerciales e historial de operaciones.',
      'La sección Pagos muestra la agenda de vencimientos y compromisos pendientes con proveedores.',
    ],
    tips: [
      'Mantené el catálogo de insumos actualizado con precios para que los costos de las labores sean precisos.',
      'Vinculá cada compra a la campaña y al lote destino para tener trazabilidad de costos.',
    ],
  },
  {
    id: 'operaciones',
    icon: Tractor,
    title: 'Gestión Operaciones y Stock',
    summary: 'Labores agrícolas, cosecha, depósitos y control de inventario.',
    content: [
      'Desde el hub "Gestión Operaciones y Stock" registrás todas las labores: siembra, fertilización, aplicaciones de fitosanitarios y cosecha.',
      'Cada operación queda asociada a un lote, campaña y fecha, generando un asiento automático en el módulo contable.',
      'Depósitos gestiona las ubicaciones físicas del establecimiento (silos, galpones, tinglados) con disponibilidad actual.',
      'Stock y movimientos muestra el inventario consolidado con entradas, salidas y saldo por depósito.',
      'Scouting (próximamente) permitirá registrar monitoreos de plagas, enfermedades y estado sanitario por lote.',
    ],
    tips: [
      'Registrá las operaciones en el momento o al final del día — la retroactividad está permitida pero dificulta el análisis en tiempo real.',
      'Las cosechas generan el movimiento de stock automático si tenés el módulo de granos configurado.',
    ],
  },
  {
    id: 'ventas',
    icon: Truck,
    title: 'Stock Terceros y Ventas',
    summary: 'Granos en acopiador, entregas, cartas de porte, ventas y cobranzas.',
    content: [
      'El módulo Granos en acopiador registra el stock de granos custodiado por terceros (acopios, corredores): especie, calidad y saldo disponible.',
      'Las Entregas son los despachos logísticos: remitos, salidas de grano y recepciones en destino.',
      'Cartas de porte gestiona la documentación obligatoria para transporte de granos: emisión, estado y trazabilidad.',
      'Ventas registra la facturación comercial: contratos a precio fijo, precio a fijar y seguimiento de pedidos.',
      'Cobranzas controla el recupero de ingresos: facturas pendientes, cuentas a cobrar y agenda de percepción.',
    ],
    tips: [
      'Las cartas de porte se vinculan a la entrega y al remito — cargalas antes de mover el grano.',
      'El módulo de Tesorería (próximamente) complementa este módulo con el control del efectivo y cuentas bancarias.',
    ],
  },
  {
    id: 'contabilidad',
    icon: Landmark,
    title: 'Contabilidad y Finanzas',
    summary: 'Libro diario, terceros, mayor contable y exportación de reportes.',
    content: [
      'El Libro Diario muestra todos los asientos contables generados (automáticos por operaciones + manuales). Permite agregar asientos manuales desde el botón "Nuevo asiento".',
      'Los asientos automáticos se generan cada vez que registrás una operación (compra, venta, pago, cobro). No necesitás cargarlos manualmente.',
      'Con el plugin Contabilidad Avanzada activo, accedés al Mayor Contable (/contabilidad/mayor) para ver el saldo acumulado por cuenta.',
      'El ABM de Terceros centraliza clientes, proveedores, socios y contratistas. Con plugin activo, /terceros/[id] muestra la cuenta corriente individual.',
      'Los botones de exportación (Excel / PDF) aparecen en reportes cuando el plugin Exportación está activo.',
    ],
    tips: [
      'No modifiques manualmente asientos automáticos — para correcciones usá asientos de ajuste.',
      'El plan de cuentas base sigue el esquema argentino estándar. Podés agregar subcuentas desde Configuración.',
    ],
  },
  {
    id: 'terceros',
    icon: Users,
    title: 'Terceros',
    summary: 'Clientes, proveedores, socios y contratistas del establecimiento.',
    content: [
      'El módulo Terceros es el maestro de personas y empresas vinculadas al establecimiento.',
      'Cada tercero puede ser clasificado como cliente, proveedor, ambos, o contratista.',
      'Con el plugin Contabilidad Avanzada activo, cada tercero tiene su cuenta corriente individual accesible desde /terceros/[id].',
      'El formulario de alta y edición es un Dialog popup: botón "Nuevo tercero" o botón "Editar" en cada fila de la tabla.',
    ],
    tips: [
      'Usá el campo CUIT para identificar univocamente a cada tercero y evitar duplicados.',
      'Los terceros se referencian desde Compras, Ventas, Cobranzas y Pagos — mantené el maestro actualizado.',
    ],
  },
  {
    id: 'ia',
    icon: Bot,
    title: 'Análisis IA',
    summary: 'Asistente agrícola, análisis satelital y alertas inteligentes.',
    content: [
      'El módulo de Análisis IA ofrece un asistente conversacional especializado en agronomía. Podés preguntarle sobre condiciones de cultivo, alertas de plagas, rendimientos esperados y más.',
      'El router LLM usa Groq como proveedor primario y Claude de Anthropic como fallback automático en caso de indisponibilidad.',
      'Las conversaciones quedan persistidas en Firestore por organización y usuario para mantener el contexto entre sesiones.',
      'El asistente puede hablar usando síntesis de voz (ElevenLabs TTS) si está configurado.',
    ],
    tips: [
      'Cuanto más contexto le des al asistente (lote, cultivo, fecha, problema observado), mejor la respuesta.',
      'Las alertas DSS (sistema de soporte a decisiones) se pueden configurar para dispararse automáticamente por condiciones de campo.',
    ],
  },
  {
    id: 'comunicaciones',
    icon: Bell,
    title: 'Comunicaciones',
    summary: 'WhatsApp, notificaciones push y alertas por email o SMS.',
    content: [
      'El sistema envía alertas por email (vía Resend), SMS (vía Twilio) y WhatsApp (vía Meta Business API).',
      'Las notificaciones push se envían a dispositivos registrados usando Firebase Cloud Messaging (FCM).',
      'WhatsApp funciona de forma bidireccional: el sistema puede enviar mensajes y también recibir respuestas a través del webhook configurado.',
      'La configuración del canal WhatsApp está en Configuración → WhatsApp.',
    ],
    tips: [
      'Para recibir notificaciones push en el navegador, aceptá el permiso cuando el sistema lo solicite.',
      'Las alertas automáticas (por sensor IoT o por reglas DSS) requieren configuración previa en el módulo de integraciones.',
    ],
  },
  {
    id: 'plugins',
    icon: Puzzle,
    title: 'Sistema de Plugins',
    summary: 'Cómo activar módulos opcionales para tu organización.',
    content: [
      'Los plugins son módulos de funcionalidad opcional que se activan por organización. Permiten habilitar solo las capacidades que cada establecimiento necesita.',
      'Para activar un plugin: ir a Configuración → Plugins, hacer clic en el toggle del plugin deseado.',
      'Cuando un plugin está inactivo, sus rutas muestran una pantalla de bloqueo (PluginGate) con descripción y opción de activación.',
      'Los superadministradores pueden gestionar plugins de todas las organizaciones desde /super-admin/plugins.',
    ],
    tips: [
      'Activá primero el plugin Contabilidad Avanzada si querés usar Mayor Contable y Cuentas Corrientes.',
      'El plugin Exportación es independiente y agrega botones Excel/PDF a todos los reportes sin cambiar el flujo de datos.',
    ],
  },
  {
    id: 'configuracion',
    icon: Settings,
    title: 'Configuración',
    summary: 'Parámetros de organización, usuarios, WhatsApp y ajustes del sistema.',
    content: [
      'La sección Configuración agrupa todos los ajustes administrativos del sistema.',
      'ABM Organizaciones: gestión de datos, nombre, CUIT y parámetros de cada organización.',
      'Configuración → WhatsApp: número, token y configuración del canal de mensajería.',
      'Configuración → Plugins: activación y desactivación de módulos opcionales.',
      'El cambio de tema visual (verde, azul, negro) está en el pie del sidebar.',
    ],
    tips: [
      'Solo los usuarios con rol administrador pueden acceder a Configuración.',
      'Si cambiás de organización activa, los plugins activos también cambian — son por organización.',
    ],
  },
  {
    id: 'iso',
    icon: FileText,
    title: 'ISO y Control Interno',
    summary: 'Auditoría de cambios, aprobaciones y gestión documental (plugin).',
    content: [
      'Con el plugin ISO y Control Interno activo, accedés a los módulos de auditoría y aprobaciones.',
      'Auditoría (/auditoria): registro completo de todos los cambios realizados en el sistema, con diff de valores anterior/nuevo, usuario y fecha.',
      'Aprobaciones (/aprobaciones): flujo de aprobación para operaciones que superan umbrales definidos (pagos grandes, ajustes contables, notas de crédito).',
      'El componente GestorAdjuntos permite adjuntar archivos (PDF, imágenes) a cualquier entidad del sistema, almacenados en Firebase Storage.',
    ],
    tips: [
      'Configurá los umbrales de aprobación en el servicio de aprobaciones según la política de la organización.',
      'Los registros de auditoría no se pueden modificar ni eliminar — son inmutables por diseño.',
    ],
  },
];

export default function DocumentosPage() {
  const [openSection, setOpenSection] = useState<string | null>('inicio');

  const toggleSection = (id: string) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-start gap-4">
        <div className="grid h-14 w-14 place-items-center rounded-[20px]" style={{ background: 'var(--dashboard-accent-soft)', color: 'var(--dashboard-accent-strong)' }}>
          <BookOpen className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em]" style={{ color: 'var(--dashboard-text)' }}>
            Manual de usuario
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--dashboard-muted)' }}>
            Don Juan GIS — Guía operativa completa del sistema
          </p>
        </div>
      </div>

      <div className="rounded-[24px] border px-5 py-4" style={{ background: 'var(--dashboard-accent-soft)', borderColor: 'var(--dashboard-accent)' }}>
        <div className="flex items-center gap-3">
          <HelpCircle className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--dashboard-accent-strong)' }} />
          <p className="text-sm leading-6" style={{ color: 'var(--dashboard-accent-strong)' }}>
            Este manual describe cómo usar cada módulo del sistema. Hacé clic en cualquier sección para expandirla. Las secciones marcadas con&nbsp;
            <strong>plugin requerido</strong> necesitan que el plugin correspondiente esté activo en tu organización.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const isOpen = openSection === section.id;

          return (
            <div
              key={section.id}
              className="overflow-hidden rounded-[24px] border transition-all"
              style={{
                borderColor: isOpen ? 'var(--dashboard-accent)' : 'var(--dashboard-sidebar-border)',
                background: 'white',
                boxShadow: isOpen ? '0 8px 24px rgba(15,23,42,0.08)' : '0 2px 8px rgba(15,23,42,0.04)',
              }}
            >
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:-translate-y-0.5"
              >
                <div
                  className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-[16px]"
                  style={{ background: 'var(--dashboard-accent-soft)', color: 'var(--dashboard-accent-strong)' }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-base font-semibold" style={{ color: 'var(--dashboard-text)' }}>
                    {section.title}
                  </div>
                  <div className="mt-0.5 text-sm" style={{ color: 'var(--dashboard-muted)' }}>
                    {section.summary}
                  </div>
                </div>
                {isOpen ? (
                  <ChevronDown className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--dashboard-muted)' }} />
                ) : (
                  <ChevronRight className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--dashboard-muted)' }} />
                )}
              </button>

              {isOpen && (
                <div className="border-t px-5 pb-5 pt-4" style={{ borderColor: 'var(--dashboard-sidebar-border)' }}>
                  <div className="space-y-3">
                    {section.content.map((paragraph, i) => (
                      <p key={i} className="text-sm leading-7" style={{ color: 'var(--dashboard-text)' }}>
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  {section.tips && section.tips.length > 0 && (
                    <div
                      className="mt-4 rounded-[20px] border-l-4 p-4"
                      style={{ background: 'var(--dashboard-accent-soft)', borderColor: 'var(--dashboard-accent)' }}
                    >
                      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--dashboard-accent-strong)' }}>
                        Consejos
                      </p>
                      <ul className="space-y-2">
                        {section.tips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm leading-6" style={{ color: 'var(--dashboard-accent-strong)' }}>
                            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div
        className="rounded-[24px] border px-6 py-5"
        style={{ borderColor: 'var(--dashboard-sidebar-border)', background: 'var(--dashboard-sidebar-panel)' }}
      >
        <h3 className="text-base font-semibold" style={{ color: 'var(--dashboard-text)' }}>
          ¿Necesitás más ayuda?
        </h3>
        <p className="mt-2 text-sm leading-6" style={{ color: 'var(--dashboard-muted)' }}>
          Este manual se actualiza con cada versión del sistema. Para consultas específicas sobre configuración avanzada, integraciones o el sistema de plugins, contactá al administrador de tu cuenta o revisá la documentación técnica en el repositorio del proyecto.
        </p>
      </div>
    </div>
  );
}
