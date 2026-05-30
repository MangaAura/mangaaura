'use client';

import { Hash, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';

import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer';
import { GENRE_DISPLAY, DEFAULT_GENRE_DISPLAY } from '@/constants/genres';
import { useT } from '@/i18n';
import { fetcher } from '@/lib/swr-config';

interface GenreCount {
  slug: string;
  _count: number;
}

export function GenresListPageClient({
  genres,
}: {
  genres: { id: string; name: string; slug: string }[];
}) {
  const t = useT();

  const { data: countsData } = useSWR<{ counts: GenreCount[] }>(
    '/api/genres/counts', fetcher
  );

  const countMap = new Map(
    countsData?.counts?.map((c) => [c.slug, c._count]) || []
  );

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[var(--text-primary)] flex items-center gap-3">
            <Hash className="w-8 h-8 text-[var(--primary)]" />
            Géneros
          </h1>
          <p className="text-[var(--text-muted)] mt-2">
            Explora mangas por categoría
          </p>
        </div>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {genres.map((genre) => {
            const display = GENRE_DISPLAY[genre.slug] || DEFAULT_GENRE_DISPLAY;
            const Icon = display.icon;
            const count = countMap.get(genre.slug) ?? 0;

            return (
              <StaggerItem key={genre.id}>
                <Link
                  href={`/genres/${genre.slug}`}
                  className="group block"
                >
                  <div className={`relative p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-elevated)] transition-all hover:shadow-lg`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${display.color.split(' ').slice(0, 3).join(' ')} bg-opacity-20`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors capitalize text-base">
                          {t(`genres.${genre.slug}`)}
                        </h2>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {count} mangas
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-[var(--text-tertiary)] group-hover:text-[var(--primary)] transition-colors shrink-0" />
                    </div>
                  </div>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </div>
  );
}
