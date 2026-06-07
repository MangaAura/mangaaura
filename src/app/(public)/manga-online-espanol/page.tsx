import { BookOpen, Globe, Sparkles, MessageCircle, Shield, Zap } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { Container } from '@/components/Layout/Container';
import { BreadcrumbStructuredData, WebPageStructuredData, FAQPageStructuredData } from '@/components/SEO/StructuredData';
import { withHreflang } from '@/lib/seo';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Manga Online Español | Leer y Crear Manga | MangaAura',
    description: 'Manga online en español. Lee cientos de mangas, manhwas y webtoons creados por la comunidad hispanohablante. Gratis, sin suscripciones y con herramientas IA para crear tu propia obra.',
    robots: { index: true, follow: true },
    openGraph: {
      title: 'Manga Online Español | MangaAura',
      description: 'Manga online en español. Lee y crea mangas con la comunidad hispanohablante. Gratis.',
      type: 'website',
      images: ['/og-image.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Manga Online Español | MangaAura',
      description: 'Manga online en español. Lee y crea mangas con la comunidad hispanohablante. Gratis.',
      images: ['/og-image.png'],
    },
    ...withHreflang('/manga-online-espanol'),
  };
}

const reasons = [
  { icon: Globe, title: 'Contenido en tu idioma', desc: 'Mangas, manhwas y webtoons creados por la comunidad hispanohablante. Sin traducciones automáticas, contenido nativo en español.' },
  { icon: BookOpen, title: 'Catálogo gratuito y variado', desc: 'Accede a cientos de series sin pagar nada. Acción, romance, fantasy, horror, comedia… hay para todos los gustos.' },
  { icon: Sparkles, title: 'Creadores emergentes', desc: 'Descubre talento nuevo antes de que se haga famoso. Apoya a creadores independientes hispanohablantes.' },
  { icon: Shield, title: 'Plataforma legal y segura', desc: 'Todo el contenido es original y está creado por la comunidad. Sin riesgos de malware ni contenido pirateado.' },
  { icon: Zap, title: 'Herramientas de IA', desc: 'Crea personajes, genera escenarios y escribe diálogos con inteligencia artificial. Todo desde tu navegador.' },
  { icon: MessageCircle, title: 'Comunidad activa', desc: 'Comenta capítulos, valora series, únete a clanes y participa en eventos. El manga se disfruta en comunidad.' },
];

const faqItems = [
  { question: '¿Puedo leer manga online en español gratis?', answer: 'Sí. MangaAura ofrece cientos de mangas, manhwas y webtoons en español completamente gratis. No hay suscripciones ni límites de lectura.' },
  { question: '¿Qué diferencia a MangaAura de otros sitios de manga online?', answer: 'MangaAura es una plataforma de contenido original creado por la comunidad, no un agregador de contenido pirateado. Además, ofrece herramientas de IA para crear manga, gamificación con recompensas y un sistema de crowdfunding para apoyar a tus creadores favoritos.' },
  { question: '¿Puedo crear mi propio manga online?', answer: 'Sí. Regístrate como creador y usa nuestro dashboard con herramientas IA para generar personajes, escenarios y capítulos. Publica tu obra y recibe apoyo de la comunidad mediante la moneda virtual Aura.' },
  { question: '¿MangaAura funciona en móvil?', answer: 'Sí. MangaAura es completamente responsive y además es una Progressive Web App (PWA). Puedes instalarla en tu móvil como una app nativa desde Chrome o Safari.' },
  { question: '¿Cómo gana dinero MangaAura si es gratis?', answer: 'Leer es gratis. Los creadores ganan dinero mediante el sistema de crowdfunding con Aura: los lectores pueden comprar Aura y apoyar a sus creadores favoritos. MangaAura no cobra comisiones a los creadores.' },
];

export default function MangaOnlineEspanolPage() {
  return (
    <>
      <WebPageStructuredData
        name="Manga Online Español | Leer y Crear Manga | MangaAura"
        description="Manga online en español. Lee y crea mangas con la comunidad hispanohablante. Gratis, sin suscripciones."
        url="/manga-online-espanol"
      />
      <BreadcrumbStructuredData
        items={[
          { name: 'Manga online español', item: '/manga-online-espanol' },
        ]}
      />
      <FAQPageStructuredData items={faqItems} />

      <div className="min-h-screen">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[var(--accent-purple)]/10 via-transparent to-background pt-20 pb-16">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-[var(--primary)]/20 rounded-full blur-3xl pointer-events-none" />
          <Container size="large">
            <div className="relative z-10 text-center max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
                Manga Online en Español
              </h1>
              <p className="text-lg md:text-xl text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto">
                Lee y crea manga en español con la comunidad hispanohablante.  
                Gratis, sin suscripciones y con herramientas de inteligencia artificial.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/explore"
                  className="inline-flex items-center h-12 px-8 rounded-xl text-base font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, var(--accent-purple), var(--primary))' }}
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Explorar manga en español
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

        {/* Reasons */}
        <Container size="large">
          <section className="py-16">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
              ¿Por qué elegir MangaAura para leer manga online?
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reasons.map((r) => (
                <div key={r.title} className="p-6 rounded-2xl bg-[var(--surface-secondary)]/50 border border-[var(--border)] hover:border-[var(--accent-purple)]/30 transition-colors">
                  <r.icon className="w-10 h-10 text-[var(--accent-purple)] mb-4" />
                  <h3 className="text-lg font-bold mb-2">{r.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">{r.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="py-16 text-center">
            <div className="max-w-2xl mx-auto p-10 rounded-2xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--accent-purple)]/10 border border-[var(--primary)]/20">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Únete a la comunidad de manga en español
              </h2>
              <p className="text-[var(--text-secondary)] mb-8">
                Cientos de lectores y creadores ya forman parte de MangaAura.  
                Registrarse es gratis y solo toma unos segundos.
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
              Preguntas frecuentes sobre manga online
            </h2>
            <p className="text-[var(--text-secondary)] text-center mb-10">
              Todo lo que necesitas saber sobre leer manga online en español
            </p>
            <div className="max-w-3xl mx-auto space-y-4">
              {faqItems.map((item) => (
                <details key={item.question} className="group p-5 rounded-xl bg-[var(--surface-secondary)]/50 border border-[var(--border)] open:border-[var(--accent-purple)]/30 transition-colors">
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
