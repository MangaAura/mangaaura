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
import { motion } from 'framer-motion';

import { Container } from '@/components/Layout/Container';
import { cn } from '@/lib/utils';

const guides = [
  {
    href: '/guides/where-to-read-manga-legally',
    title: '¿Dónde leer manga online de forma legal y segura?',
    description: 'Descubre las mejores plataformas legales para leer manga en español. Alternativas seguras a sitios piratas con contenido de calidad.',
    icon: Search,
    gradient: 'from-indigo-500/20 to-purple-500/20',
    iconBg: 'bg-indigo-500/20',
    iconColor: 'text-indigo-400',
    accent: 'border-indigo-500/30',
    hoverAccent: 'hover:border-indigo-500/50',
  },
  {
    href: '/guides/best-apps-to-read-manga',
    title: 'Mejores aplicaciones para leer manga digitalmente',
    description: 'Comparativa de las mejores apps para leer manga en Android, iOS y PC. Lectores CBR, CBZ y plataformas oficiales.',
    icon: BookOpen,
    gradient: 'from-emerald-500/20 to-teal-500/20',
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
    accent: 'border-emerald-500/30',
    hoverAccent: 'hover:border-emerald-500/50',
  },
  {
    href: '/guides/buying-manga-digital-spain',
    title: 'Plataformas para comprar manga digital en España',
    description: '¿Dónde comprar manga digital en España? Precios, catálogo y ventajas de cada plataforma para coleccionistas y lectores.',
    icon: ShoppingCart,
    gradient: 'from-amber-500/20 to-orange-500/20',
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
    accent: 'border-amber-500/30',
    hoverAccent: 'hover:border-amber-500/50',
  },
  {
    href: '/guides/personalized-recommendations-apps',
    title: 'Apps para seguir mangas con recomendaciones personalizadas',
    description: 'Aplicaciones móviles que recomiendan mangas basados en tus gustos. Descubre tu próxima serie favorita.',
    icon: Sparkles,
    gradient: 'from-rose-500/20 to-pink-500/20',
    iconBg: 'bg-rose-500/20',
    iconColor: 'text-rose-400',
    accent: 'border-rose-500/30',
    hoverAccent: 'hover:border-rose-500/50',
  },
  {
    href: '/guides/beginners-guide-to-manga',
    title: 'Guía para principiantes en la lectura de cómics japoneses',
    description: 'Todo lo que necesitas saber para empezar a leer manga: géneros, formatos, dónde empezar y cómo leer correctamente.',
    icon: Compass,
    gradient: 'from-sky-500/20 to-cyan-500/20',
    iconBg: 'bg-sky-500/20',
    iconColor: 'text-sky-400',
    accent: 'border-sky-500/30',
    hoverAccent: 'hover:border-sky-500/50',
  },
  {
    href: '/guides/best-selling-manga-history',
    title: '¿Cuál es el manga más vendido de la historia?',
    description: 'El ranking de los mangas más vendidos de todos los tiempos. One Piece, Golgo 13, Dragon Ball y más.',
    icon: Trophy,
    gradient: 'from-yellow-500/20 to-amber-500/20',
    iconBg: 'bg-yellow-500/20',
    iconColor: 'text-yellow-400',
    accent: 'border-yellow-500/30',
    hoverAccent: 'hover:border-yellow-500/50',
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: 'easeOut' as const,
    },
  },
};

export function GuidesPageClient() {
  return (
    <div className="relative min-h-screen">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-indigo-500/2 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-amber-500/2 blur-3xl" />
      </div>

      <Container className="relative py-12 md:py-20">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-12 md:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            Biblioteca de guías
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight mb-4">
            Guías de Manga
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
            Aprende todo sobre el mundo del manga: dónde leer, qué apps usar,
            cómo empezar y descubre las series más vendidas de la historia.
          </p>
        </motion.div>

        {/* Guides Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-2 gap-5 md:gap-6"
        >
          {guides.map((guide) => {
            const Icon = guide.icon;
            return (
              <motion.div key={guide.href} variants={cardVariants}>
                <Link href={guide.href} className="block h-full group">
                  <article
                    className={cn(
                      'relative h-full overflow-hidden rounded-2xl border bg-[var(--surface-elevated)] p-6 md:p-7',
                      'transition-all duration-300 hover:shadow-lg hover:-translate-y-1',
                      guide.accent,
                      guide.hoverAccent
                    )}
                  >
                    {/* Hover gradient overlay */}
                    <div
                      className={cn(
                        'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br',
                        guide.gradient
                      )}
                    />

                    <div className="relative">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div
                          className={cn(
                            'p-3 rounded-xl shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-110',
                            guide.iconBg
                          )}
                        >
                          <Icon className={cn('w-6 h-6', guide.iconColor)} />
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5, ease: 'easeOut' }}
          className="mt-12 md:mt-16 text-center"
        >
          <p className="text-sm text-[var(--text-tertiary)]">
            ¿No encuentras lo que buscas?{' '}
            <Link
              href="/help"
              className="text-[var(--primary)] hover:text-[var(--primary-hover)] underline underline-offset-2 transition-colors font-medium"
            >
              Visita nuestro centro de ayuda
            </Link>
          </p>
        </motion.div>
      </Container>
    </div>
  );
}


