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
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-sm' : 'bg-transparent'
      }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">🌾</span>
            </div>
            <div>
              <span className={`font-semibold ${scrolled ? 'text-gray-900' : 'text-white'}`}>Don Cándido IA</span>
              <span className={`text-xs block -mt-1 ${scrolled ? 'text-gray-500' : 'text-gray-400'}`}>SIG Agro</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {['Producto', 'Funcionalidades', 'Beneficios', 'Contacto'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className={`text-sm transition ${scrolled ? 'text-gray-600 hover:text-gray-900' : 'text-gray-300 hover:text-white'}`}>
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/auth/login" className={`text-sm ${scrolled ? 'text-gray-600 hover:text-gray-900' : 'text-gray-300 hover:text-white'}`}>
              Iniciar Sesión
            </Link>
            <Link
              href="/auth/registro"
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition"
            >
              Probar Gratis
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

// Hero Section - Dark Mode
function HeroSection() {
  return (
    <section className="pt-32 pb-20 bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-800 border border-gray-700 rounded-full text-green-400 text-sm mb-8">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
          Tecnología GIS + Inteligencia Artificial
        </div>

        {/* Título */}
        <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
          Gestioná tus campos con IA, mapas satelitales y trazabilidad completa
        </h1>

        {/* Subtítulo */}
        <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
          Software agrícola inteligente basado en Next.js, IA, GIS y Firebase.
          Todo lo que necesitás para digitalizar tu producción en un solo lugar.
        </p>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
          <Link
            href="/auth/registro"
            className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition flex items-center gap-2"
          >
            Probar Gratis <span>→</span>
          </Link>
          <button className="px-6 py-3 bg-transparent text-white font-medium rounded-lg border border-gray-600 hover:border-gray-500 hover:bg-gray-800 transition flex items-center gap-2">
            <span>▷</span> Ver Demo
          </button>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
          {['Sin tarjeta de crédito', '14 días de prueba', 'Soporte incluido'].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <span className="w-4 h-4 text-green-500">✓</span>
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
    { icon: '🗺️', title: 'Mapas GIS', desc: 'Visualización de polígonos de lotes con tecnología de última generación.' },
    { icon: '🛰️', title: 'Capas NDVI', desc: 'Análisis de índices vegetativos, humedad del suelo y elevación.' },
    { icon: '📊', title: 'Gráficos', desc: 'Análisis de rendimiento con visualizaciones claras e intuitivas.' },
    { icon: '⚙️', title: 'Panel Admin', desc: 'Control total de tu operación desde un solo lugar.' },
  ];

  return (
    <section id="producto" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">¿Qué hace Don Cándido IA?</h2>
          <p className="text-gray-600">Una plataforma completa para la gestión inteligente de tus campos agrícolas</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div key={i} className="bg-white rounded-xl p-6 text-center border border-gray-100 hover:border-green-200 transition shadow-sm">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl">
                {f.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
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
    { icon: '🛰️', title: 'Mapas Satelitales', desc: 'Integración con ESRI, MapBox, ArcGIS. Todo integrado para tomar las mejores decisiones.' },
    { icon: '📍', title: 'Gestión de Campos y Lotes', desc: 'Dibujá y editá los polígonos de tus lotes con herramientas simples y precisas.' },
    { icon: '🤖', title: 'Análisis con IA', desc: 'Procesamiento inteligente y predicciones basadas en tus datos.' },
    { icon: '📄', title: 'Documentación Agrícola', desc: 'Mapas, informes, reportes y auditorías. Todo documentado y exportable.' },
    { icon: '📊', title: 'Panel de Campañas', desc: 'Seguimiento de siembras y cosechas en tiempo real.' },
    { icon: '📱', title: 'Compatible con Celular', desc: 'Registro de datos desde el campo. Accedé desde cualquier dispositivo.' },
  ];

  return (
    <section id="funcionalidades" className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Funcionalidades Principales</h2>
          <p className="text-gray-600">Herramientas diseñadas específicamente para el productor agrícola argentino</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="p-6 rounded-xl bg-white border border-gray-100 hover:border-green-200 hover:shadow-sm transition">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-4 text-xl">
                {f.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
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
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">¿Cómo funciona?</h2>
          <p className="text-gray-600">En 6 simples pasos, comenzá a digitalizar tu producción</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {steps.map((s, i) => (
            <div key={i} className="text-center">
              <div className="w-12 h-12 bg-green-600 text-white rounded-xl flex items-center justify-center mx-auto mb-3 text-sm font-bold">
                {s.num}
              </div>
              <h4 className="font-medium text-gray-900 text-sm mb-1">{s.title}</h4>
              <p className="text-xs text-gray-500">{s.desc}</p>
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
    <section id="beneficios" className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Beneficios para tu campo</h2>
          <p className="text-gray-600">Resultados reales para productores como vos</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {benefits.map((b, i) => (
            <div key={i} className="flex items-start gap-3 p-4">
              <span className="text-green-500 text-lg">✓</span>
              <div>
                <h4 className="font-medium text-gray-900">{b.title}</h4>
                <p className="text-sm text-gray-500">{b.desc}</p>
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
          Unite a cientos de productores argentinos que ya están transformando su forma de trabajar con tecnología de punta.
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
              <span className="font-semibold text-white">Don Cándido IA</span>
              <span className="text-xs text-gray-500 block">SIG Agro</span>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-gray-300 transition">Términos</a>
            <a href="#" className="hover:text-gray-300 transition">Privacidad</a>
            <a href="#" className="hover:text-gray-300 transition">Contacto</a>
          </div>
          <div className="text-sm text-gray-500">
            © 2024 Don Cándido IA - SIG Agro. Todos los derechos reservados.
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
