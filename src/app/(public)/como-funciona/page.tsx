import { BookOpen, Coins, Sparkles, Users, Trophy, Zap, Shield, Smartphone, ChevronRight, Star, Heart, Globe } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { Container } from '@/components/Layout/Container';
import {
  BreadcrumbStructuredData,
  WebPageStructuredData,
  FAQPageStructuredData,
  HowToStructuredData,
} from '@/components/SEO/StructuredData';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';
import { withCache, generateCacheKey, cacheConfig } from '@/lib/apiCache';
import { prisma } from '@/lib/prisma';
import { withHreflang } from '@/lib/seo';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);

  return {
    title: t('page.comoFunciona.title'),
    description: t('page.comoFunciona.description'),
    robots: { index: true, follow: true },
    openGraph: {
      title: `${t('page.comoFunciona.title')} | MangaAura`,
      description: t('page.comoFunciona.description'),
      type: 'website',
      images: ['/og-image.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${t('page.comoFunciona.title')} | MangaAura`,
      description: t('page.comoFunciona.description'),
      images: ['/og-image.png'],
    },
    ...withHreflang('/como-funciona'),
  };
}

const faqItems = [
  {
    question: '¿Qué es MangaAura?',
    answer: 'MangaAura es una plataforma de manga con inteligencia artificial donde puedes leer manga gratis, crear tus propias series con herramientas IA, crowdfundear capítulos usando la moneda virtual Aura y formar parte de una comunidad activa de lectores y creadores. Es gratuita para lectores y ofrece herramientas de monetización para creadores sin comisiones de plataforma.',
  },
  {
    question: '¿MangaAura es realmente gratis?',
    answer: 'Sí, leer manga en MangaAura es completamente gratis. No hay suscripciones obligatorias ni límites de lectura. Puedes leer todas las series disponibles sin pagar nada. Los creadores ganan dinero mediante crowdfunding con Aura, propinas y patrocinios directos de los lectores.',
  },
  {
    question: '¿Qué es Aura y cómo funciona?',
    answer: 'Aura es la moneda virtual de MangaAura. Los lectores pueden comprar Aura a través de Stripe y usarla para crowdfundear capítulos (apoyar económicamente a los creadores para que publiquen nuevos capítulos), dar propinas a sus creadores favoritos, patrocinar contenido exclusivo y participar en eventos especiales. Los creadores reciben Aura como recompensa por su trabajo.',
  },
  {
    question: '¿Cómo puedo crear mi propio manga?',
    answer: 'Crear tu propio manga es sencillo: regístrate en MangaAura, selecciona el rol de creador (gratuito), completa el perfil de tu serie con título, descripción y portada, y sube tus capítulos usando el dashboard de creador con drag & drop. MangaAura ofrece herramientas de IA para generar descripciones automáticas, traducciones automáticas y recomendaciones inteligentes.',
  },
  {
    question: '¿Cómo funciona el crowdfunding de capítulos?',
    answer: 'El crowdfunding permite a los lectores contribuir con Aura a los capítulos que quieren ver publicados. Cada capítulo tiene una meta de financiamiento. Cuando la comunidad alcanza la meta, el capítulo se publica para todos los lectores. Este sistema permite a los creadores recibir apoyo directo de su audiencia mientras el contenido sigue siendo accesible para toda la comunidad.',
  },
  {
    question: '¿Cómo gano XP y subo de nivel?',
    answer: 'Ganas XP cada vez que lees capítulos, mantienes rachas de lectura diarias, completas logros, participas en la comunidad y contribuyes al crowdfunding. Al acumular XP, subes de nivel (más de 50 niveles disponibles), desbloqueas insignias exclusivas y apareces en los rankings globales de la plataforma.',
  },
  {
    question: '¿Puedo leer manga sin conexión a internet?',
    answer: 'Sí. MangaAura es una Progressive Web App (PWA) que puedes instalar en tu móvil o escritorio desde cualquier navegador moderno. Una vez instalada, puedes descargar capítulos para leerlos sin conexión, perfecto para viajes o cuando no tienes acceso a internet.',
  },
  {
    question: '¿Cómo funcionan los clanes?',
    answer: 'Los clanes son grupos de lectura que puedes crear o a los que puedes unirte. Cada clan tiene un chat propio, rankings internos y compite con otros clanes en eventos especiales. Es una forma excelente de conectar con lectores que comparten tus mismos gustos y descubrir nuevas series recomendadas por tu clan.',
  },
  {
    question: '¿Qué herramientas de IA ofrece MangaAura?',
    answer: 'MangaAura usa inteligencia artificial para recomendaciones personalizadas de manga basadas en tus lecturas, descripciones automáticas para creadores, traducción automática a múltiples idiomas, detección de contenido y moderación, y optimización de imágenes para portadas. Todo diseñado para mejorar la experiencia de lectura y creación.',
  },
];

const steps = [
  { name: 'Regístrate gratis', text: 'Crea tu cuenta en MangaAura en segundos. Solo necesitas un email o puedes usar tu cuenta de Google. No hay suscripciones ni pagos obligatorios. Una vez registrado, tendrás acceso a todo el contenido de la plataforma.' },
  { name: 'Explora y lee manga', text: 'Descubre miles de series de manga organizadas por género, popularidad, últimas actualizaciones y rankings. Usa el explorador inteligente con filtros avanzados o las recomendaciones personalizadas por IA para encontrar tu próxima serie favorita.' },
  { name: 'Únete a la comunidad', text: 'Comenta capítulos, únete a clanes de lectura, participa en rankings semanales, completa logros y mantén rachas de lectura. Interactúa con creadores y otros lectores en los foros de la comunidad.' },
];

export default async function ComoFuncionaPage() {
  const locale = await detectLocale();
  const t = getT(locale);

  // Fetch real stats from DB (cached)
  const stats = await withCache(
    generateCacheKey('stats:homepage', {}),
    cacheConfig.stats.homepage.ttl,
    async () => {
      const [totalMangas, totalReaders, totalChapters] = await Promise.all([
        prisma.mangaSeries.count({ where: { deletedAt: null } }),
        prisma.user.count(),
        prisma.chapter.count(),
      ]);
      return { totalMangas, totalReaders, totalChapters };
    },
  );

  return (
    <>
      <WebPageStructuredData
        name="Cómo funciona MangaAura | Lee, crea y crowdfundea manga"
        description="Descubre cómo funciona MangaAura: la plataforma de manga con IA para leer gratis, crear tus propias series, crowdfundear capítulos con Aura y unirte a una comunidad activa de lectores y creadores."
        url="/como-funciona"
        lastReviewed={new Date().toISOString().split('T')[0]}
        datePublished="2026-05-01"
        dateModified={new Date().toISOString().split('T')[0]}
      />
      <BreadcrumbStructuredData
        items={[
          { name: 'Inicio', item: '/' },
          { name: 'Cómo funciona', item: '/como-funciona' },
        ]}
      />
      <HowToStructuredData
        name="Cómo empezar en MangaAura"
        description="Guía paso a paso para empezar a leer, crear y participar en la comunidad de MangaAura."
        totalTime="PT10M"
        steps={steps}
      />
      <FAQPageStructuredData items={faqItems} />

      {/* Hero */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--surface-sunken)] via-[var(--background)] to-[var(--background)]" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-[10%] w-72 h-72 bg-[var(--primary)] rounded-full blur-[120px] animate-pulse" />
          <div className="absolute top-40 right-[15%] w-96 h-96 bg-accent-purple rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-20 left-[30%] w-80 h-80 bg-accent-blue rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <Container className="relative z-10 py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-full text-sm font-medium text-[var(--primary)]">
                <Sparkles className="w-4 h-4" />
                {t('page.comoFunciona.badge')}
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-[var(--text-primary)] via-[var(--primary)] to-accent-purple bg-clip-text text-transparent">
                {t('page.comoFunciona.heroTitle')}
              </span>
            </h1>

            <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed">
              {t('page.comoFunciona.heroDescription')}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[var(--primary)] to-accent-purple text-[var(--text-inverse)] font-bold rounded-xl hover:opacity-90 transition-all hover:scale-105"
              >
                {t('page.comoFunciona.ctaRegister')}
                <ChevronRight className="w-5 h-5" />
              </Link>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] font-bold rounded-xl hover:bg-[var(--surface-elevated)] transition-all"
              >
                <BookOpen className="w-5 h-5" />
                {t('page.comoFunciona.ctaExplore')}
              </Link>
            </div>

            {/* Stats bar */}
            <div className="mt-16 flex items-center justify-center">
              <div className="flex items-center justify-center gap-8 bg-[var(--surface-elevated)]/80 rounded-xl px-8 py-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[var(--text-primary)]">
                    {stats.totalReaders.toLocaleString()}+
                  </div>
                  <div className="text-sm text-[var(--text-secondary)]">{t('page.comoFunciona.statReaders')}</div>
                </div>
                <div className="w-px h-12 bg-[var(--border)]" />
                <div className="text-center">
                  <div className="text-3xl font-bold text-[var(--text-primary)]">
                    {stats.totalMangas.toLocaleString()}+
                  </div>
                  <div className="text-sm text-[var(--text-secondary)]">{t('page.comoFunciona.statSeries')}</div>
                </div>
                <div className="w-px h-12 bg-[var(--border)]" />
                <div className="text-center">
                  <div className="text-3xl font-bold text-[var(--text-primary)]">
                    {stats.totalChapters.toLocaleString()}+
                  </div>
                  <div className="text-sm text-[var(--text-secondary)]">{t('page.comoFunciona.statChapters')}</div>
                </div>
              </div>
            </div>
          </div>
        </Container>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--background)] to-transparent" />
      </section>

      {/* How it works: 3 steps */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[var(--surface)]" />
        <Container className="relative z-10">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] mb-4">
              <Zap className="w-4 h-4" />
              {t('page.comoFunciona.sectionStepsBadge')}
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-[var(--text-primary)]">
              {t('page.comoFunciona.sectionStepsTitle')}
            </h2>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
              {t('page.comoFunciona.sectionStepsSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Users className="w-8 h-8" />,
                title: t('page.comoFunciona.step1Title'),
                desc: t('page.comoFunciona.step1Desc'),
                accent: 'from-violet-500 to-purple-600',
              },
              {
                icon: <BookOpen className="w-8 h-8" />,
                title: t('page.comoFunciona.step2Title'),
                desc: t('page.comoFunciona.step2Desc'),
                accent: 'from-cyan-500 to-blue-600',
              },
              {
                icon: <Star className="w-8 h-8" />,
                title: t('page.comoFunciona.step3Title'),
                desc: t('page.comoFunciona.step3Desc'),
                accent: 'from-amber-500 to-orange-600',
              },
            ].map((step, i) => (
              <div
                key={step.title}
                className="relative bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl p-8 hover:border-[var(--primary)]/30 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-[var(--primary)] text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </div>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.accent} flex items-center justify-center mb-5 text-white`}>
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">{step.title}</h3>
                <p className="text-[var(--text-muted)] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Key features grid */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[var(--background)]" />
        <Container className="relative z-10">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] mb-4">
              <Sparkles className="w-4 h-4" />
              {t('page.comoFunciona.sectionFeaturesBadge')}
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-[var(--text-primary)]">
              {t('page.comoFunciona.sectionFeaturesTitle')}
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <BookOpen className="w-6 h-6" />,
                title: t('page.comoFunciona.featureReadTitle'),
                desc: t('page.comoFunciona.featureReadDesc'),
                color: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
              },
              {
                icon: <Sparkles className="w-6 h-6" />,
                title: t('page.comoFunciona.featureCreateTitle'),
                desc: t('page.comoFunciona.featureCreateDesc'),
                color: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
              },
              {
                icon: <Coins className="w-6 h-6" />,
                title: t('page.comoFunciona.featureCrowdfundTitle'),
                desc: t('page.comoFunciona.featureCrowdfundDesc'),
                color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
              },
              {
                icon: <Trophy className="w-6 h-6" />,
                title: t('page.comoFunciona.featureXpTitle'),
                desc: t('page.comoFunciona.featureXpDesc'),
                color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
              },
              {
                icon: <Smartphone className="w-6 h-6" />,
                title: t('page.comoFunciona.featureOfflineTitle'),
                desc: t('page.comoFunciona.featureOfflineDesc'),
                color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: t('page.comoFunciona.featureFreeTitle'),
                desc: t('page.comoFunciona.featureFreeDesc'),
                color: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group relative bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 border ${feature.color}`}>
                  {feature.icon}
                </div>
                <h3 className="font-bold text-lg text-[var(--text-primary)] mb-2">{feature.title}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* FAQ section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[var(--surface)]" />
        <Container className="relative z-10">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] mb-4">
              <Heart className="w-4 h-4" />
              {t('page.comoFunciona.sectionFaqBadge')}
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-[var(--text-primary)]">
              {t('page.comoFunciona.sectionFaqTitle')}
            </h2>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
              {t('page.comoFunciona.sectionFaqSubtitle')}
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqItems.map((item, i) => (
              <details
                key={i}
                className="group bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--primary)]/20 transition-colors"
              >
                <summary className="flex items-center justify-between p-5 cursor-pointer text-[var(--text-primary)] font-semibold hover:text-[var(--primary)] transition-colors list-none">
                  {item.question}
                  <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-open:rotate-90 transition-transform flex-shrink-0 ml-4" />
                </summary>
                <div className="px-5 pb-5 text-[var(--text-secondary)] leading-relaxed">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[var(--background)]" />
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/10 via-transparent to-accent-purple/10" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent" />
        </div>

        <Container>
          <div className="relative max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-[var(--primary)] to-accent-purple mb-6">
              <Globe className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-[var(--text-primary)]">
              {t('page.comoFunciona.ctaTitle')}
            </h2>
            <p className="text-lg text-[var(--text-secondary)] mb-8">
              {t('page.comoFunciona.ctaDescription')}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[var(--primary)] to-accent-purple text-[var(--text-inverse)] font-bold rounded-xl hover:opacity-90 transition-all hover:scale-105"
              >
                {t('page.comoFunciona.ctaRegister')}
                <ChevronRight className="w-5 h-5" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] font-bold rounded-xl hover:bg-[var(--surface-elevated)] transition-all"
              >
                <Coins className="w-5 h-5" />
                {t('page.comoFunciona.ctaPricing')}
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
