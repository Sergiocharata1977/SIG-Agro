'use client';

/**
 * Landing Page - SIG Agro Don Cándido IA
 * Diseño minimalista y limpio
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

// Header con navegación
function HeaderNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-sm' : 'bg-white/80 backdrop-blur-md'
      }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">🌾</span>
            </div>
            <div>
              <span className="font-semibold text-gray-900">Don Juan GIS</span>
              <span className="text-xs block -mt-1 text-gray-500">SIG Agro</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {['Producto', 'Funcionalidades', 'Beneficios', 'Contacto'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm transition text-gray-600 hover:text-green-600 font-medium">
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-gray-600 hover:text-green-600 font-medium">
              Iniciar Sesión
            </Link>
            <Link
              href="/auth/registro"
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition shadow-sm hover:shadow-md"
            >
              Probar Gratis
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

// Hero Section - Cotton Light Theme with "White Tone" Satellite effect
function HeroSection() {
  return (
    <section className="relative pt-32 pb-24 overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        {/* Placeholder for satellite image - replaced with a subtle pattern for now to ensure reliability */}
        <div
          className="w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2832&auto=format&fit=crop")', // Field/Satellite vibe
            filter: 'grayscale(100%)'
          }}
        />
        {/* Sophisticated Gradient Mask for "Clean Horizon" look */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/70 to-white/10" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 pt-12">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-200 rounded-full text-green-700 text-sm mb-10 shadow-sm transition-transform hover:scale-105 cursor-default">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Más rentabilidad por hectárea
        </div>

        {/* Título */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-8 tracking-tight">
          Transformá datos en <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-800">decisiones rentables</span>
        </h1>

        {/* Subtítulo */}
        <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          Gestioná tu producción, controlá tus costos y llevá la administración al día.
          Información clara para agregar valor real a cada campaña.
        </p>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link
            href="/auth/registro"
            className="px-8 py-4 bg-green-700 text-white font-medium rounded-xl hover:bg-green-800 transition-all shadow-lg hover:shadow-green-200 hover:-translate-y-1 flex items-center gap-2"
          >
            Comenzar Ahora <span>→</span>
          </Link>
          <button className="px-8 py-4 bg-white text-gray-700 font-medium rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm hover:shadow-md flex items-center gap-2">
            <span>▷</span> Ver Video
          </button>
        </div>

        {/* Trust badges - More elegant */}
        <div className="pt-8 border-t border-gray-200/60 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-gray-500">
          {['Sin tarjeta de crédito', 'Prueba gratuita', 'Soporte personalizado'].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Sección: ¿Qué hace Don Cándido IA?
function ProductSection() {
  const features = [
    { icon: '🗺️', title: 'Mapeo Productivo', desc: 'Visualización clara de tus lotes y ambientes productivos.' },
    { icon: '📈', title: 'Gestión Contable', desc: 'Márgenes brutos, control de stock y cuentas al día.' },
    { icon: '🌾', title: 'Rendimiento', desc: 'Análisis histórico de rinde para mejorar tu producción.' },
    { icon: '📋', title: 'Administración', desc: 'Control total de tu negocio agrícola en un solo lugar.' },
  ];

  return (
    <section id="producto" className="py-24 bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">¿Qué hace Don Juan GIS?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">La evolución de la gestión agrícola. Simple, potente y rentable.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {features.map((f, i) => (
            <div key={i} className="bg-white rounded-2xl p-8 text-center border border-gray-100 hover:border-green-100 transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-1">
              <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-6 text-2xl group-hover:scale-110 transition-transform">
                {f.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-3 text-lg">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Sección: Funcionalidades Principales
function FeaturesSection() {
  const features = [
    { icon: '💼', title: 'Gestión Económica', desc: 'Calculá márgenes brutos, costos directos y rentabilidad por lote en tiempo real.' },
    { icon: '📍', title: 'Control de Lotes', desc: 'Delimitá tus lotes y registrá cada labor realizada de forma simple.' },
    { icon: '📊', title: 'Reportes Inteligentes', desc: 'Información procesada para tomar decisiones de venta y compra de insumos.' },
    { icon: '🚜', title: 'Registro de Labores', desc: 'Historial completo de siembras, aplicaciones y cosechas. Todo documentado.' },
    { icon: '📉', title: 'Stock de Insumos', desc: 'Control de depósitos al detalle. Sabé siempre qué tenés y cuánto vale.' },
    { icon: '📱', title: 'Oficina en el Campo', desc: 'Llevá tu administración en el bolsillo. Acceso desde cualquier lugar.' },
  ];

  return (
    <section id="funcionalidades" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Funcionalidades Principales</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Herramientas diseñadas específicamente para el productor agrícola moderno.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div key={i} className="group p-8 rounded-2xl bg-white border border-gray-100 hover:border-green-200 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-6 text-xl group-hover:bg-green-600 group-hover:text-white transition-colors">
                {f.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-3 text-lg">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Sección: ¿Cómo funciona?
function WorkflowSection() {
  const steps = [
    { num: '01', title: 'Crear cuenta', desc: 'Registrate en segundos' },
    { num: '02', title: 'Registrar campo', desc: 'Ingresá tus establecimientos' },
    { num: '03', title: 'Dibujar lotes', desc: 'Dibujá tus lotes en el mapa' },
    { num: '04', title: 'Cargar datos', desc: 'Ingresá tus productos' },
    { num: '05', title: 'La IA analiza', desc: 'Procesamos tus datos' },
    { num: '06', title: 'Ver resultados', desc: 'Visualizá tus informes' },
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">¿Cómo funciona?</h2>
          <p className="text-gray-600">En 6 simples pasos, comenzá a digitalizar tu producción</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
          {steps.map((s, i) => (
            <div key={i} className="text-center group relative">
              <div className="w-14 h-14 bg-white border-2 border-green-100 text-green-700 rounded-2xl flex items-center justify-center mx-auto mb-4 text-lg font-bold shadow-sm group-hover:border-green-500 group-hover:text-green-600 transition-colors z-10 relative">
                {s.num}
              </div>
              <h4 className="font-medium text-gray-900 text-sm mb-2">{s.title}</h4>
              <p className="text-xs text-gray-500 leading-relaxed px-2">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Sección: Beneficios
function BenefitsSection() {
  const benefits = [
    { title: 'Reducí costos', desc: 'Optimizá uso de insumos y recursos con datos precisos.' },
    { title: 'Mejores decisiones', desc: 'Basá tus decisiones en información real y actualizada.' },
    { title: 'Mayor trazabilidad', desc: 'Documentá cada paso para productores y auditorías.' },
    { title: 'Info centralizada', desc: 'Todo tu información en un solo lugar.' },
    { title: 'Alertas tempranas', desc: 'Recibí avisos antes de que los problemas escalen.' },
    { title: 'Mayor rendimiento', desc: 'Aumentá la productividad de tus lotes.' },
  ];

  return (
    <section id="beneficios" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Beneficios para tu campo</h2>
          <p className="text-gray-600">Resultados reales para productores que buscan eficiencia</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefits.map((b, i) => (
            <div key={i} className="flex items-start gap-4 p-6 rounded-2xl hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 flex-shrink-0 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 font-bold text-sm">✓</span>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">{b.title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// CTA Final - Verde oscuro
function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Empezá hoy a digitalizar tus campos
        </h2>
        <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
          Sumate a los productores que ya están mejorando su rentabilidad con información precisa.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link
            href="/auth/registro"
            className="px-8 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-500 transition"
          >
            Crear mi cuenta
          </Link>
          <a
            href="mailto:info@sigagro.com.ar"
            className="px-8 py-3 bg-transparent text-white font-medium rounded-lg border border-gray-600 hover:border-gray-500 transition"
          >
            Hablar con ventas
          </a>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
          <span>✓ Sin compromiso</span>
          <span>✓ Configuración asistida</span>
          <span>✓ Soporte personalizado</span>
        </div>
      </div>
    </section>
  );
}

// Footer
function FooterSection() {
  return (
    <footer className="py-12 bg-gray-900 border-t border-gray-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">🌾</span>
            </div>
            <div>
              <span className="font-semibold text-white">Don Juan GIS</span>
              <span className="text-xs text-gray-500 block">www.donjuangis.com</span>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-gray-300 transition">Términos</a>
            <a href="#" className="hover:text-gray-300 transition">Privacidad</a>
            <a href="#" className="hover:text-gray-300 transition">Contacto</a>
          </div>
          <div className="text-sm text-gray-500">
            © 2024 Don Juan GIS. Todos los derechos reservados.
          </div>
        </div>
      </div>
    </footer>
  );
}

// Página principal
export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center animate-pulse">
          <span className="text-2xl">🌾</span>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <HeaderNav />
      <HeroSection />
      <ProductSection />
      <FeaturesSection />
      <WorkflowSection />
      <BenefitsSection />
      <CTASection />
      <FooterSection />
    </main>
  );
}
