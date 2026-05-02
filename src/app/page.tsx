'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Bot,
  ChartNoAxesCombined,
  CircleHelp,
  CloudSun,
  Cpu,
  FileText,
  Layers3,
  Leaf,
  Map,
  Menu,
  Radar,
  Satellite,
  Sprout,
  Tractor,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

function HeaderNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = [
    { href: '#tecnologia', label: 'Tecnologia' },
    { href: '#modulos', label: 'Modulos' },
    { href: '#beneficios', label: 'Beneficios' },
    { href: '#contacto', label: 'Contacto' },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-white/10 bg-[#081c15]/92 shadow-2xl shadow-black/10 backdrop-blur-xl'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 text-white">
          <img src="/logo-sig-agro.png" alt="Don Juan GIS" className="h-10 w-10 rounded-xl object-cover shadow-lg shadow-lime-300/10" />
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-lime-300">Don Juan GIS</div>
            <div className="text-xs text-white/65">GIS agricola + IA operativa</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="text-sm font-medium text-white/75 transition hover:text-lime-300">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/auth/login" className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/85 transition hover:border-lime-300/40 hover:text-lime-300">
            Ingresar
          </Link>
          <Link
            href="/auth/registro"
            className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-5 py-2.5 text-sm font-semibold text-[#0c2418] transition hover:bg-lime-200"
          >
            Probar gratis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <button
          type="button"
          aria-label="Abrir menu"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex rounded-full border border-white/15 p-2 text-white lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-white/10 bg-[#081c15]/96 px-4 py-4 backdrop-blur-xl lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-3">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-2xl border border-white/8 px-4 py-3 text-sm text-white/80 transition hover:border-lime-300/30 hover:text-lime-300"
              >
                {item.label}
              </a>
            ))}
            <Link href="/auth/login" className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/85">
              Ingresar
            </Link>
            <Link href="/auth/registro" className="rounded-2xl bg-lime-300 px-4 py-3 text-sm font-semibold text-[#0c2418]">
              Probar gratis
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function HeroSection() {
  return (
    <section className="landing-grid relative overflow-hidden bg-[#071a13] pt-28 text-white sm:pt-32">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80"
          alt="Cultivo visto desde arriba"
          className="h-full w-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(163,230,53,0.22),transparent_25%),linear-gradient(90deg,rgba(7,26,19,0.96)_0%,rgba(7,26,19,0.88)_48%,rgba(7,26,19,0.56)_100%)]" />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-16 px-4 pb-24 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-28">
        <div className="max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-lime-200">
            <Radar className="h-4 w-4" />
            Tecnologia de vanguardia
          </div>

          <h1 className="max-w-xl text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
            Transforma datos de campo en decisiones rentables.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-white/70">
            Gestion agricola de precision con GIS, inteligencia artificial y control operativo en una sola plataforma.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/auth/registro"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-lime-300 px-7 py-4 text-sm font-semibold text-[#0c2418] shadow-xl shadow-lime-300/20 transition hover:bg-lime-200"
            >
              Comenzar ahora
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#modulos"
              className="inline-flex items-center justify-center rounded-2xl border border-white/30 px-7 py-4 text-sm font-semibold text-white transition hover:bg-white/8"
            >
              Ver modulos
            </a>
          </div>

          <div className="mt-10 grid gap-4 text-sm text-white/72 sm:grid-cols-3">
            {[
              'Mapas satelitales activos',
              'IA agronomica integrada',
              'Contabilidad por campana',
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-center lg:justify-end">
          <div className="relative w-full max-w-[34rem] rounded-[28px] border border-white/15 bg-white/12 p-4 shadow-2xl shadow-black/25 backdrop-blur-md sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-white/85">
                <Layers3 className="h-4 w-4 text-lime-300" />
                Capas satelitales activas
              </div>
              <span className="rounded-full bg-lime-300 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#0c2418]">
                Live
              </span>
            </div>

            <img
              src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80"
              alt="Mapa satelital"
              className="h-64 w-full rounded-[22px] border border-white/10 object-cover shadow-inner sm:h-80"
            />

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-100 px-4 py-4 text-slate-900">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Vigor vegetativo</div>
                <div className="mt-1 text-3xl font-semibold">0.82 NDVI</div>
              </div>
              <div className="rounded-2xl bg-slate-100 px-4 py-4 text-slate-900">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Humedad suelo</div>
                <div className="mt-1 text-3xl font-semibold text-emerald-700">24.5%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SatelliteSection() {
  return (
    <section id="tecnologia" className="bg-[#f5f7fb] py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">Tecnologia satelital</div>
          <h2 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">Monitoreo constante con datos listos para decidir.</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Integramos Sentinel, mapas NDVI y analisis por ambiente para detectar desvio de rendimiento antes de que impacte la campana.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
              <Satellite className="h-7 w-7" />
            </div>
            <h3 className="mt-6 text-2xl font-semibold text-slate-950">Sentinel-2 Hub</h3>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Acceso a imagenes multiespectrales cada 5 dias con resolucion suficiente para seguir vigor, humedad y variabilidad de cada lote.
            </p>
          </article>

          <article className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-[#0f2e21] p-8 text-white shadow-sm">
            <img
              src="https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?auto=format&fit=crop&w=1400&q=80"
              alt="Mapa NDVI"
              className="absolute inset-0 h-full w-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f2e21] via-[#0f2e21]/75 to-[#0f2e21]/20" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/30 bg-lime-300/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-lime-200">
                <Map className="h-4 w-4" />
                Capas en tiempo real
              </div>
              <h3 className="mt-20 text-3xl font-semibold">Mapas NDVI y alertas por ambiente</h3>
              <p className="mt-4 max-w-xl text-base leading-7 text-white/75">
                Identifica anomalias, estres hidrico y desuniformidad de desarrollo con una lectura visual clara para el equipo tecnico.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function AiSection() {
  const bullets = [
    'Prescripciones de siembra variable orientadas a rentabilidad.',
    'Alertas tempranas de plagas y riesgos climaticos por zona.',
    'Consultas en lenguaje natural sobre el estado real del campo.',
  ];

  return (
    <section className="relative overflow-hidden bg-[#123524] py-20 text-white">
      <div className="absolute right-[-10rem] top-[-4rem] h-80 w-80 rounded-full bg-lime-300/12 blur-3xl" />
      <div className="absolute left-[-8rem] bottom-[-6rem] h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:px-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/20 bg-lime-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-lime-200">
            <Bot className="h-4 w-4" />
            Powered by Don Juan GIS IA
          </div>

          <h2 className="mt-6 text-3xl font-semibold sm:text-4xl">Asistencia agronomica integrada a tu flujo diario.</h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/72">
            Don Juan GIS cruza clima, lote, historial y operacion para entregar recomendaciones accionables sin salir del sistema.
          </p>

          <div className="mt-8 space-y-4">
            {bullets.map((bullet) => (
              <div key={bullet} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <div className="mt-0.5 rounded-full bg-lime-300/15 p-1 text-lime-300">
                  <Leaf className="h-4 w-4" />
                </div>
                <p className="text-sm leading-6 text-white/82">{bullet}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[#0b2418] p-6 shadow-2xl shadow-black/20">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-lime-300 text-[#0c2418]">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <div className="font-semibold">Don Juan GIS</div>
              <div className="text-sm text-white/50">Analizando contexto del lote...</div>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4 text-sm leading-6 text-white/70">
              "Don Juan GIS, que me recomendas para el lote Norte con pronostico de helada y baja amplitud termica?"
            </div>
            <div className="rounded-2xl border border-lime-300/20 bg-lime-300/10 p-4 text-sm leading-6 text-white/88">
              "Para el lote Norte conviene pausar aplicaciones foliares hoy, revisar humedad superficial y priorizar monitoreo temprano. El lote tiene buena reserva y menor riesgo de dano si mantenes esa secuencia."
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ModulesSection() {
  const modules = [
    {
      icon: Map,
      title: 'GIS avanzado',
      description: 'Dibujo de lotes, capas historicas, analisis espacial e integracion con mapas de ambiente.',
      image:
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    },
    {
      icon: Sprout,
      title: 'Scouting e IA',
      description: 'Monitoreo offline, registro geolocalizado y ayuda inteligente para el asesor y el productor.',
      image:
        'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=1200&q=80',
    },
    {
      icon: ChartNoAxesCombined,
      title: 'Administracion',
      description: 'Costos por lote, margen bruto, stock de insumos y control economico de cada campana.',
      image:
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    },
  ];

  return (
    <section id="modulos" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">Gestion integral</div>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">Un ecosistema pensado para decisiones de punta a punta.</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              El GIS se conecta con el monitoreo y la administracion para que el dato tecnico termine en una accion concreta.
            </p>
          </div>

          <Link
            href="/auth/registro"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0f2e21] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#174531]"
          >
            Explorar dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <article
                key={module.title}
                className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <img src={module.image} alt={module.title} className="h-56 w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                <div className="p-6">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    <Icon className="h-4 w-4" />
                    Modulo
                  </div>
                  <h3 className="mt-4 text-2xl font-semibold text-slate-950">{module.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{module.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function BenefitsSection() {
  const benefits = [
    {
      icon: CloudSun,
      title: 'Clima en tiempo real',
      description: 'Pronosticos e indicadores listos para decidir ventanas operativas.',
    },
    {
      icon: Tractor,
      title: 'Mapas VRA',
      description: 'Exportes de prescripcion para maquinaria de agricultura de precision.',
    },
    {
      icon: FileText,
      title: 'Reportes PDF',
      description: 'Informes profesionales para socios, clientes y asesor tecnico.',
    },
    {
      icon: Cpu,
      title: 'Trazabilidad',
      description: 'Historial de labores y decisiones por lote para seguimiento completo.',
    },
  ];

  return (
    <section id="beneficios" className="border-y border-slate-200 bg-[#f2f5fb] py-16">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {benefits.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section id="contacto" className="bg-white py-20">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f5f8ff_100%)] px-6 py-14 shadow-sm sm:px-10">
          <h2 className="mx-auto max-w-2xl text-4xl font-semibold text-slate-950">Listo para dar el salto a una operacion mas precisa?</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600">
            Arranca con una prueba guiada y ordena mapa, monitoreo, costos y decisiones en un mismo flujo.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/auth/registro"
              className="inline-flex items-center justify-center rounded-2xl bg-[#0f2e21] px-7 py-4 text-sm font-semibold text-white transition hover:bg-[#174531]"
            >
              Empezar prueba gratuita
            </Link>
            <a
              href="mailto:info@sigagro.com.ar"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-7 py-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Contactar a ventas
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function FooterSection() {
  return (
    <footer className="border-t border-white/8 bg-[#091710] py-12 text-white/72">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
        <div>
          <div className="text-lg font-semibold text-white">Don Juan GIS</div>
          <p className="mt-3 max-w-xs text-sm leading-6 text-white/52">
            Plataforma de gestion agricola con GIS, IA y control operativo para equipos tecnicos y productores.
          </p>
          <div className="mt-5 flex items-center gap-3 text-white/55">
            <Map className="h-4 w-4" />
            <CircleHelp className="h-4 w-4" />
            <Leaf className="h-4 w-4" />
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-300">Producto</div>
          <div className="mt-4 space-y-3 text-sm">
            <a href="#tecnologia" className="block hover:text-white">Tecnologia satelital</a>
            <a href="#modulos" className="block hover:text-white">Modulos</a>
            <a href="#beneficios" className="block hover:text-white">Beneficios</a>
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-300">Acceso</div>
          <div className="mt-4 space-y-3 text-sm">
            <Link href="/auth/login" className="block hover:text-white">Login</Link>
            <Link href="/auth/registro" className="block hover:text-white">Registro</Link>
            <a href="mailto:info@sigagro.com.ar" className="block hover:text-white">Ventas</a>
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-300">Operacion</div>
          <div className="mt-4 space-y-3 text-sm">
            <div>Mapas y GIS</div>
            <div>Scouting a campo</div>
            <div>Contabilidad por campana</div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [loading, router, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#071a13]">
        <div className="flex items-center gap-3 rounded-full border border-lime-300/20 bg-lime-300/10 px-5 py-3 text-sm font-medium text-lime-200">
          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-lime-300" />
          Cargando experiencia Don Juan GIS...
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <HeaderNav />
      <HeroSection />
      <SatelliteSection />
      <AiSection />
      <ModulesSection />
      <BenefitsSection />
      <CtaSection />
      <FooterSection />
    </main>
  );
}
