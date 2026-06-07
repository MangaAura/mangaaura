import { BookOpen, Sparkles, TrendingUp, Users, Zap, Star } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { Container } from '@/components/Layout/Container';
import { BreadcrumbStructuredData, WebPageStructuredData, FAQPageStructuredData } from '@/components/SEO/StructuredData';
import { withHreflang } from '@/lib/seo';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Leer Manga Gratis Online | MangaAura',
    description: 'Leer manga gratis online nunca fue tan fácil. Descubre cientos de mangas, manhwas y webtoons creados por la comunidad. Sin suscripciones, sin límites. Empieza ahora.',
    robots: { index: true, follow: true },
    openGraph: {
      title: 'Leer Manga Gratis Online | MangaAura',
      description: 'Descubre cientos de mangas gratis creados por la comunidad. Sin suscripciones, sin límites.',
      type: 'website',
      images: ['/og-image.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Leer Manga Gratis Online | MangaAura',
      description: 'Descubre cientos de mangas gratis creados por la comunidad. Sin suscripciones, sin límites.',
      images: ['/og-image.png'],
    },
    ...withHreflang('/leer-manga-gratis'),
  };
}

const features = [
  { icon: BookOpen, title: 'Biblioteca en crecimiento', desc: 'Cientos de mangas, manhwas y webtoons creados por talento emergente.' },
  { icon: TrendingUp, title: 'Sin límites ni suscripciones', desc: 'Lee todo lo que quieras, cuando quieras. Completamente gratis.' },
  { icon: Sparkles, title: 'Herramientas IA', desc: 'Crea tus propios personajes, escenarios e historias con inteligencia artificial.' },
  { icon: Users, title: 'Comunidad activa', desc: 'Comenta, valora y conecta con otros lectores y creadores de manga.' },
  { icon: Zap, title: 'Gamificación', desc: 'Gana XP, sube de nivel, completa misiones y desbloquea logros mientras lees.' },
  { icon: Star, title: 'Contenido en español', desc: 'Mangas creados por la comunidad hispanohablante. Lectura en tu idioma.' },
];

const faqItems = [
  { question: '¿Es realmente gratis leer manga en MangaAura?', answer: 'Sí. Leer manga en MangaAura es completamente gratis. No hay suscripciones obligatorias, límites de lectura ni tarifas ocultas. Puedes acceder a todo el catálogo sin pagar nada.' },
  { question: '¿Necesito registrarme para leer?', answer: 'Puedes explorar el catálogo sin registro. Para leer capítulos completos, comentar, valorar y guardar tu progreso, solo necesitas una cuenta gratuita que se crea en segundos.' },
  { question: '¿Qué tipo de manga puedo encontrar?', answer: 'MangaAura tiene contenido original creado por la comunidad: manga, manhwa, webtoon y novelas ligeras. Hay acción, romance, fantasy, horror, comedia, y muchos géneros más.' },
  { question: '¿MangaAura tiene app móvil?', answer: 'MangaAura es una Progressive Web App (PWA). Puedes instalarla en tu móvil como una app nativa desde Chrome o Safari sin necesidad de descargar nada de tiendas.' },
  { question: '¿Puedo crear mi propio manga?', answer: 'Sí. Regístrate como creador y usa nuestras herramientas IA para generar personajes, escenarios y capítulos. Publica tu obra y monetízala con la moneda virtual Aura.' },
];

export default function LeerMangaGratisPage() {
  return (
    <>
      <WebPageStructuredData
        name="Leer Manga Gratis Online | MangaAura"
        description="Leer manga gratis online nunca fue tan fácil. Descubre cientos de mangas creados por la comunidad. Sin suscripciones ni límites."
        url="/leer-manga-gratis"
      />
      <BreadcrumbStructuredData
        items={[
          { name: 'Leer manga gratis', item: '/leer-manga-gratis' },
        ]}
      />
      <FAQPageStructuredData items={faqItems} />

      <div className="min-h-screen">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[var(--primary)]/10 via-transparent to-background pt-20 pb-16">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-[var(--accent-purple)]/20 rounded-full blur-3xl pointer-events-none" />
          <Container size="large">
            <div className="relative z-10 text-center max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
                Leer Manga Gratis Online
              </h1>
              <p className="text-lg md:text-xl text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto">
                Descubre cientos de mangas, manhwas y webtoons creados por talento emergente.  
                Sin suscripciones, sin límites, completamente gratis.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/explore"
                  className="inline-flex items-center h-12 px-8 rounded-xl text-base font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent-purple))' }}
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Explorar mangas gratis
                </Link>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center h-12 px-8 rounded-xl text-base font-semibold border border-[var(--border)] hover:bg-[var(--surface-secondary)] transition-colors"
                >
                  Crear cuenta gratis
                </Link>
              </div>
            </div>
          </Container>
        </section>

        {/* Features */}
        <Container size="large">
          <section className="py-16">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
              ¿Por qué leer manga gratis en MangaAura?
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f) => (
                <div key={f.title} className="p-6 rounded-2xl bg-[var(--surface-secondary)]/50 border border-[var(--border)] hover:border-[var(--primary)]/30 transition-colors">
                  <f.icon className="w-10 h-10 text-[var(--primary)] mb-4" />
                  <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="py-16 text-center">
            <div className="max-w-2xl mx-auto p-10 rounded-2xl bg-gradient-to-br from-[var(--accent-purple)]/10 to-[var(--primary)]/10 border border-[var(--accent-purple)]/20">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Empieza a leer manga gratis ahora
              </h2>
              <p className="text-[var(--text-secondary)] mb-8">
                No esperes más. Cientos de historias te esperan. Regístrate en segundos y empieza tu aventura.
              </p>
              <Link
                href="/auth/register"
                className="inline-flex items-center h-12 px-10 rounded-xl text-base font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent-purple))' }}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Crear cuenta gratis
              </Link>
            </div>
          </section>

          {/* FAQ */}
          <section className="py-16">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">
              Preguntas frecuentes
            </h2>
            <p className="text-[var(--text-secondary)] text-center mb-10">
              Todo lo que necesitas saber sobre leer manga gratis en MangaAura
            </p>
            <div className="max-w-3xl mx-auto space-y-4">
              {faqItems.map((item) => (
                <details key={item.question} className="group p-5 rounded-xl bg-[var(--surface-secondary)]/50 border border-[var(--border)] open:border-[var(--primary)]/30 transition-colors">
                  <summary className="font-semibold cursor-pointer list-none flex items-center justify-between">
                    {item.question}
                    <span className="text-[var(--text-muted)] group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>
        </Container>
      </div>
    </>
  );
}
