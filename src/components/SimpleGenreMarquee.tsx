'use client';

import Link from 'next/link';
import { GENRE_CATEGORIES } from '@/constants/genres';
import { useT } from '@/i18n';

export function SimpleGenreMarquee() {
  const t = useT();
  return (
    <section className="relative">
      <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
        <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-accent-blue to-accent-purple inline-block" />
        {t('home.exploreByGenre')}
      </h2>
      <div className="flex gap-3 py-2 overflow-x-auto">
        {GENRE_CATEGORIES.map((genre) => {
          const Icon = genre.icon;
          return (
            <Link
              key={genre.slug}
              href={`/explore?genres[]=${genre.tag}&sort=popularity`}
              className={`flex-shrink-0 w-[132px] flex flex-col items-center gap-2 p-4 rounded-xl border transition-all hover:scale-105 ${genre.color}`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-sm font-bold text-center leading-tight">
                {t(`genres.${genre.labelKey}`)}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
