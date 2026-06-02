'use client';

import {
  BookOpen,
  Search,
  ShoppingCart,
  Sparkles,
  Compass,
  Trophy,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { motion, useReducedMotion, type Variants } from 'framer-motion';

import { Container } from '@/components/Layout/Container';
import { useT } from '@/i18n';

const guides = [
  {
    href: '/guides/where-to-read-manga-legally',
    title: '¿Dónde leer manga online de forma legal y segura?',
    description: 'Descubre las mejores plataformas legales para leer manga en español. Alternativas seguras a sitios piratas con contenido de calidad.',
    icon: Search,
    iconBg: 'bg-indigo-500/15',
    iconColor: 'text-indigo-500',
    accent: 'border-indigo-500/30',
    hoverAccent: 'hover:border-indigo-500/50',
    gradient: 'from-indigo-500/10 to-purple-500/5',
  },
  {
    href: '/guides/best-apps-to-read-manga',
    title: 'Mejores aplicaciones para leer manga digitalmente',
    description: 'Comparativa de las mejores apps para leer manga en Android, iOS y PC. Lectores CBR, CBZ y plataformas oficiales.',
    icon: BookOpen,
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-500',
    accent: 'border-emerald-500/30',
    hoverAccent: 'hover:border-emerald-500/50',
    gradient: 'from-emerald-500/10 to-teal-500/5',
  },
  {
    href: '/guides/buying-manga-digital-spain',
    title: 'Plataformas para comprar manga digital en España',
    description: '¿Dónde comprar manga digital en España? Precios, catálogo y ventajas de cada plataforma para coleccionistas y lectores.',
    icon: ShoppingCart,
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-500',
    accent: 'border-amber-500/30',
    hoverAccent: 'hover:border-amber-500/50',
    gradient: 'from-amber-500/10 to-orange-500/5',
  },
  {
    href: '/guides/personalized-recommendations-apps',
    title: 'Apps para seguir mangas con recomendaciones personalizadas',
    description: 'Aplicaciones móviles que recomiendan mangas basados en tus gustos. Descubre tu próxima serie favorita.',
    icon: Sparkles,
    iconBg: 'bg-rose-500/15',
    iconColor: 'text-rose-500',
    accent: 'border-rose-500/30',
    hoverAccent: 'hover:border-rose-500/50',
    gradient: 'from-rose-500/10 to-pink-500/5',
  },
  {
    href: '/guides/beginners-guide-to-manga',
    title: 'Guía para principiantes en la lectura de cómics japoneses',
    description: 'Todo lo que necesitas saber para empezar a leer manga: géneros, formatos, dónde empezar y cómo leer correctamente.',
    icon: Compass,
    iconBg: 'bg-sky-500/15',
    iconColor: 'text-sky-500',
    accent: 'border-sky-500/30',
    hoverAccent: 'hover:border-sky-500/50',
    gradient: 'from-sky-500/10 to-cyan-500/5',
  },
  {
    href: '/guides/best-selling-manga-history',
    title: '¿Cuál es el manga más vendido de la historia?',
    description: 'El ranking de los mangas más vendidos de todos los tiempos. One Piece, Golgo 13, Dragon Ball y más.',
    icon: Trophy,
    iconBg: 'bg-yellow-500/15',
    iconColor: 'text-yellow-500',
    accent: 'border-yellow-500/30',
    hoverAccent: 'hover:border-yellow-500/50',
    gradient: 'from-yellow-500/10 to-amber-500/5',
  },
];

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: 'easeOut' },
  },
};

export function GuidesPageClient() {
  const t = useT();
  const isReduced = useReducedMotion() ?? false;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--surface-sunken)] via-[var(--background)] to-[var(--background)]" />
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-[var(--primary)]/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-[var(--accent-purple)]/5 blur-3xl" />
        </div>

        <Container className="relative z-10 py-16 md:py-20">
          <motion.div
            initial={isReduced ? undefined : { opacity: 0, y: 20 }}
            animate={isReduced ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-center"
          >
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-[var(--primary)]/20 to-[var(--accent-purple)]/20 text-[var(--primary)] border border-[var(--primary)]/20 mb-5">
              <BookOpen className="w-3.5 h-3.5" />
              {t('guides.badge')}
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              <span className="bg-gradient-to-r from-[var(--text-primary)] via-[var(--primary)] to-[var(--accent-purple)] bg-clip-text text-transparent">
                {t('guides.title')}
              </span>
            </h1>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
              {t('guides.subtitle')}
            </p>
          </motion.div>
        </Container>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--background)] to-transparent pointer-events-none" />
      </section>

      {/* Guides Grid */}
      <section className="relative pb-20 md:pb-24">
        <Container>
          <motion.div
            variants={isReduced ? undefined : containerVariants}
            initial={isReduced ? undefined : 'hidden'}
            whileInView={isReduced ? undefined : 'visible'}
            viewport={{ once: true, margin: '-40px' }}
            className="grid md:grid-cols-2 gap-5 md:gap-6"
          >
            {guides.map((guide) => {
              const Icon = guide.icon;
              return (
                <motion.div key={guide.href} variants={cardVariants}>
                  <Link href={guide.href} className="block h-full group">
                    <article
                      className={`
                        relative h-full overflow-hidden rounded-2xl border bg-[var(--surface-elevated)] p-6 md:p-7
                        transition-all duration-300 hover:shadow-lg hover:-translate-y-1
                        ${guide.accent} ${guide.hoverAccent}
                      `}
                    >
                      {/* Hover gradient overlay */}
                      <div
                        className={`
                          absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br
                          ${guide.gradient}
                        `}
                      />

                      <div className="relative">
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div
                            className={`
                              p-3 rounded-xl shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-110
                              ${guide.iconBg}
                            `}
                          >
                            <Icon className={`w-6 h-6 ${guide.iconColor}`} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h2 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors duration-200 mb-2">
                              {guide.title}
                            </h2>
                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                              {guide.description}
                            </p>
                          </div>

                          {/* Arrow */}
                          <ArrowRight className="w-5 h-5 text-[var(--text-tertiary)] shrink-0 mt-3 transition-all duration-300 group-hover:translate-x-1 group-hover:text-[var(--primary)]" />
                        </div>

                        {/* Bottom accent line on hover */}
                        <div className="mt-5 h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-[var(--primary)]/50 to-transparent transition-all duration-500 rounded-full" />
                      </div>
                    </article>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Bottom CTA */}
          <motion.div
            initial={isReduced ? undefined : { opacity: 0, y: 20 }}
            whileInView={isReduced ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8, duration: 0.5, ease: 'easeOut' }}
            className="mt-12 md:mt-16 text-center"
          >
            <p className="text-sm text-[var(--text-tertiary)]">
              {t('guides.ctaText')}{' '}
              <Link
                href="/help"
                className="text-[var(--primary)] hover:text-[var(--primary-hover)] underline underline-offset-2 transition-colors font-medium"
              >
                {t('guides.ctaLink')}
              </Link>
            </p>
          </motion.div>
        </Container>
      </section>
    </div>
  );
}
