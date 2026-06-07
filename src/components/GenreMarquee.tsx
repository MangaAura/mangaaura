'use client';

import { Hash } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { GENRE_DISPLAY, DEFAULT_GENRE_DISPLAY } from '@/constants/genres';
import { useGenres } from '@/hooks/useGenres';
import { useT } from '@/i18n';

interface GenreCardData {
  slug: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

function buildGenreCards(genres: Array<{ slug: string; name: string }>): GenreCardData[] {
  return genres.map((g) => {
    const display = GENRE_DISPLAY[g.slug] || DEFAULT_GENRE_DISPLAY;
    return {
      slug: g.slug,
      name: g.name,
      icon: display.icon,
      color: display.color,
    };
  });
}

function GenreCard({
  genre,
  hidden = false,
}: {
  genre: GenreCardData;
  hidden?: boolean;
}) {
  const t = useT();
  const Icon = genre.icon;
  return (
    <Link
      href={`/explore?genres[]=${encodeURIComponent(genre.name)}&sort=popularity`}
      tabIndex={hidden ? -1 : 0}
      aria-hidden={hidden || undefined}
      className={`flex-shrink-0 w-[132px] snap-start flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 hover:scale-105 hover:-translate-y-0.5 active:scale-100 active:translate-y-0 ${genre.color}`}
      aria-label={genre.name}
    >
      <Icon className="w-6 h-6" />
      <span className="text-sm font-bold text-center leading-tight">
        {(() => { const label = t(`genres.${genre.slug}`); return label.startsWith('genres.') ? genre.name.charAt(0).toUpperCase() + genre.name.slice(1) : label; })()}
      </span>
    </Link>
  );
}

export function GenreMarquee() {
  const t = useT();
  const { genres, isLoading } = useGenres();

  // CSS-animated scroll — pauses on hover/drag, no JS rAF loop
  const [isPaused, setIsPaused] = useState(false);

  const genreCards = buildGenreCards(genres);
  const allItems = [...genreCards, ...genreCards];

  return (
    <section className="relative">
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Hash className="w-6 h-6 text-[var(--primary)]" />
            {t('home.exploreByGenre')}
          </h2>
        </div>
      </div>

      <div
        className="relative overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none bg-gradient-to-r from-background to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none bg-gradient-to-l from-background to-transparent" />

        <div
          className={`flex gap-3 py-2 ${genreCards.length > 0 ? 'genre-marquee-track' : ''}`}
          style={{
            animationPlayState: isPaused ? 'paused' : 'running',
          } as React.CSSProperties}
        >
          {allItems.length > 0 ? allItems.map((genre, i) => (
            <GenreCard
              key={`${genre.slug}-${i}`}
              genre={genre}
              hidden={i >= genreCards.length}
            />
          )) : !isLoading && (
            <div className="flex gap-3 py-2 text-sm text-[var(--text-tertiary)]">
              {t('common.noResults')}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
