'use client';

import { Hash, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { GENRE_DISPLAY, DEFAULT_GENRE_DISPLAY } from '@/constants/genres';
import { useGenres } from '@/hooks/useGenres';
import { useT } from '@/i18n';

export function SimpleGenreMarquee() {
  const t = useT();
  const { genres, isLoading } = useGenres();

  if (isLoading) {
    return (
      <section className="relative">
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
          <Hash className="w-5 h-5 text-[var(--primary)]" />
          {t('home.exploreByGenre')}
        </h2>
        <div className="flex items-center gap-2 py-4 text-[var(--text-tertiary)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">{t('common.loading')}</span>
        </div>
      </section>
    );
  }

  return (
    <section className="relative">
      <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
        <Hash className="w-5 h-5 text-[var(--primary)]" />
        {t('home.exploreByGenre')}
      </h2>
      <div className="flex gap-3 py-2 overflow-x-auto">
        {genres.map((genre) => {
          const display = GENRE_DISPLAY[genre.slug] || DEFAULT_GENRE_DISPLAY;
          const Icon = display.icon;
          return (
            <Link
              key={genre.slug}
              href={`/explore?genres[]=${genre.name}&sort=popularity`}
              className={`flex-shrink-0 w-[132px] flex flex-col items-center gap-2 p-4 rounded-xl border transition-all hover:scale-105 ${display.color}`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-sm font-bold text-center leading-tight">
                {(() => { const label = t(`genres.${genre.slug}`); return label.startsWith('genres.') ? genre.name.charAt(0).toUpperCase() + genre.name.slice(1) : label; })()}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
