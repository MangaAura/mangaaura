'use client';

import { BookOpen, Eye, Star, TrendingUp, Hash, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import useSWR from 'swr';

import { OptimizedImage } from '@/components/Image/OptimizedImage';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer';
import { GENRE_DISPLAY, DEFAULT_GENRE_DISPLAY } from '@/constants/genres';
import { useT } from '@/i18n';
import { fetcher } from '@/lib/swr-config';

interface MangaItem {
  id: string; title: string; slug: string; coverUrl?: string;
  description?: string; authorName?: string; status: string;
  rating: number; totalViews: number; tags: string[];
  chapterCount: number; libraryCount: number; createdAt: string;
}

interface GenreResponse {
  genre: { id: string; name: string; slug: string };
  mangas: MangaItem[];
  totalMangas: number;
}

const SORT_OPTIONS = [
  { key: 'popular', label: 'Más populares', icon: TrendingUp },
  { key: 'newest', label: 'Más recientes', icon: BookOpen },
  { key: 'rating', label: 'Mejor valorados', icon: Star },
];

export function GenrePageClient({ slug }: { slug: string }) {
  const t = useT();
  const [sort, setSort] = useState('popular');

  const { data, error, isLoading } = useSWR<GenreResponse>(`/api/genres/${slug}`, fetcher);

  const display = GENRE_DISPLAY[slug] || DEFAULT_GENRE_DISPLAY;
  const Icon = display.icon;
  const mangas = data?.mangas || [];

  const sortedMangas = [...mangas].sort((a, b) => {
    if (sort === 'popular') return b.totalViews - a.totalViews;
    if (sort === 'rating') return (b.rating || 0) - (a.rating || 0);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className={`p-4 rounded-2xl ${display.color.split(' ')[0]} bg-opacity-20`}>
            <Icon className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-[var(--text-primary)] capitalize">
              {t(`genres.${slug}`)}
            </h1>
            <p className="text-[var(--text-muted)] mt-1">
              {data?.totalMangas || 0} mangas disponibles
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2">
          {SORT_OPTIONS.map((opt) => {
            const OptIcon = opt.icon;
            return (
              <Button
                key={opt.key}
                variant={sort === opt.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSort(opt.key)}
                className="flex items-center gap-2 shrink-0"
              >
                <OptIcon className="w-4 h-4" />
                {opt.label}
              </Button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-[var(--primary)]" />
          </div>
        ) : error ? (
          <div className="text-center py-20 text-[var(--error)]">
            Error al cargar mangas
          </div>
        ) : sortedMangas.length === 0 ? (
          <div className="text-center py-20 text-[var(--text-tertiary)]">
            <Hash className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No hay mangas en este género aún</p>
          </div>
        ) : (
          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {sortedMangas.map((manga) => (
              <StaggerItem key={manga.id}>
                <Link
                  href={`/manga/${manga.slug}`}
                  className="group block"
                >
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[var(--surface-sunken)] mb-3">
                    {manga.coverUrl ? (
                      <OptimizedImage
                        src={manga.coverUrl}
                        alt={manga.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-[var(--text-tertiary)]" />
                      </div>
                    )}
                    <Badge
                      variant={manga.status === 'ONGOING' ? 'default' : 'secondary'}
                      className="absolute top-2 left-2 text-[10px]"
                    >
                      {manga.status === 'ONGOING' ? t('manga.ongoing') : t('manga.completed')}
                    </Badge>
                  </div>
                  <h3 className="font-medium text-[var(--text-primary)] text-sm leading-tight line-clamp-2 group-hover:text-[var(--primary)] transition-colors">
                    {manga.title}
                  </h3>
                  {manga.authorName && (
                    <p className="text-xs text-[var(--text-tertiary)] mt-1 truncate">
                      {manga.authorName}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-tertiary)]">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {manga.totalViews.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {manga.rating?.toFixed(1) || '-'}
                    </span>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>
    </div>
  );
}
