'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';

import { GENRE_CATEGORIES } from '@/constants/genres';
import { useT } from '@/i18n';

function GenreCard({
  genre,
  className = '',
  hidden = false,
}: {
  genre: (typeof GENRE_CATEGORIES)[number];
  className?: string;
  hidden?: boolean;
}) {
  const t = useT();
  const Icon = genre.icon;
  return (
    <Link
      href={`/explore?genres[]=${genre.tag}&sort=popularity`}
      tabIndex={hidden ? -1 : 0}
      aria-hidden={hidden || undefined}
      className={`flex-shrink-0 w-[132px] snap-start flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 hover:scale-105 hover:-translate-y-0.5 active:scale-100 active:translate-y-0 ${genre.color} ${className}`}
      aria-label={t(`genres.${genre.labelKey}`)}
    >
      <Icon className="w-6 h-6" />
      <span className="text-sm font-bold text-center leading-tight">
        {t(`genres.${genre.labelKey}`)}
      </span>
    </Link>
  );
}

export function GenreMarquee() {
  const t = useT();
  const prefersReducedMotion = useReducedMotion();

  const firstSet = GENRE_CATEGORIES;
  const duplicateSets = [GENRE_CATEGORIES, GENRE_CATEGORIES];

  return (
    <section className="relative">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="mb-6"
      >
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-accent-blue to-accent-purple inline-block" />
          {t('home.exploreByGenre')}
        </h2>
      </motion.div>

      {/* Track wrapper — gradient fades on edges */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="relative overflow-hidden"
      >
        {/* Left gradient fade */}
        <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none bg-gradient-to-r from-background to-transparent" />

        {/* Right gradient fade */}
        <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none bg-gradient-to-l from-background to-transparent" />

        {/* Scrolling track */}
        <div className="marquee-track flex gap-3 py-2">
          {/* First set — fully accessible */}
          {firstSet.map((genre) => (
            <GenreCard key={genre.slug} genre={genre} />
          ))}
          {/* Duplicates — hidden from screen readers & keyboard */}
          {duplicateSets.map((set, setIdx) =>
            set.map((genre) => (
              <GenreCard
                key={`${genre.slug}-dup-${setIdx}`}
                genre={genre}
                hidden
              />
            ))
          )}
        </div>
      </motion.div>

      {/* Inline keyframes */}
      <style jsx>{`
        .marquee-track {
          animation: ${prefersReducedMotion ? 'none' : 'marquee 60s linear infinite'};
          width: max-content;
        }

        .marquee-track:hover {
          animation-play-state: ${prefersReducedMotion ? 'running' : 'paused'};
        }

        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
      `}</style>
    </section>
  );
}
