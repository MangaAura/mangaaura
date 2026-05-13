'use client';

import { useMemo, memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface MangaCardProps {
  manga: {
    id: string;
    title: string;
    slug?: string;
    coverUrl?: string | null;
    status?: string;
    tags?: string[];
    authorName?: string | null;
    authorUsername?: string;
    rating?: number | null;
    totalViews?: number;
    chapterCount?: number;
    similarity?: number | null;
  };
  size?: 'sm' | 'md' | 'lg';
  showSimilarity?: boolean;
  priority?: boolean;
}

const sizeClasses = {
  sm: 'w-32',
  md: 'w-44',
  lg: 'w-56',
};

const imageSizes = {
  sm: { width: 128, height: 180 },
  md: { width: 176, height: 250 },
  lg: { width: 224, height: 320 },
};

const statusColors: Record<string, string> = {
  ONGOING: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20',
  COMPLETED: 'bg-blue-500/15 text-blue-500 border-blue-500/20',
  HIATUS: 'bg-amber-500/15 text-amber-500 border-amber-500/20',
  DROPPED: 'bg-red-500/15 text-red-500 border-red-500/20',
};

const statusLabels: Record<string, string> = {
  ONGOING: 'En emisión',
  COMPLETED: 'Completado',
  HIATUS: 'Pausado',
  DROPPED: 'Abandonado',
};

export const MangaCard = memo(function MangaCard({
  manga,
  size = 'md',
  showSimilarity = false,
  priority = false,
}: MangaCardProps) {
  const statusColor = statusColors[manga.status || ''] || 'bg-[var(--surface-elevated)] text-[var(--text-secondary)]';
  const statusLabel = statusLabels[manga.status || ''] || 'Desconocido';
  const imageSize = imageSizes[size];
  const sizeClass = sizeClasses[size];
  const href = `/manga/${manga.slug || manga.id}`;
  const imageSrc = manga.coverUrl || '';
  const displayedTags = (manga.tags ?? []).slice(0, 3);
  const hasRating = manga.rating && manga.rating > 0;

  return (
    <Link href={href} className="group block" prefetch={true}>
      <div className={cn('relative', sizeClass)}>
        <div
          className={cn(
            'relative rounded-xl overflow-hidden shadow-md transition-all duration-300',
            'group-hover:shadow-xl group-hover:scale-[1.02] group-hover:-translate-y-1',
            'group-active:scale-[1.01] group-active:translate-y-0',
            'bg-[var(--border)]'
          )}
          style={{ aspectRatio: `${imageSize.width}/${imageSize.height}` }}
        >
          {imageSrc ? (
            <>
              <Image
                src={imageSrc}
                alt={manga.title}
                width={imageSize.width}
                height={imageSize.height}
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes={`(max-width: 640px) 50vw, ${imageSize.width}px`}
                loading={priority ? 'eager' : 'lazy'}
                priority={priority}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)] text-[var(--text-inverse)] font-bold text-lg">
              {manga.title.charAt(0)}
            </div>
          )}

          {hasRating && (
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-xs font-medium shadow-sm">
              <svg className="w-3 h-3 text-amber-400 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {manga.rating!.toFixed(1)}
            </div>
          )}

          {showSimilarity && manga.similarity && (
            <div className="absolute top-2 left-2">
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-[var(--primary)]/90 backdrop-blur-sm text-white shadow-sm">
                {manga.similarity}%
              </span>
            </div>
          )}

          <div className="absolute bottom-2 left-2 flex gap-1.5">
            <span className={cn('px-2 py-0.5 text-[10px] font-semibold rounded-full border backdrop-blur-sm shadow-sm', statusColor)}>
              {statusLabel}
            </span>
          </div>
        </div>

        <div className="mt-2.5 px-0.5">
          <h3
            className="font-semibold text-[var(--text-primary)] text-sm leading-tight line-clamp-2 group-hover:text-[var(--primary)] transition-colors duration-200"
            title={manga.title}
          >
            {manga.title}
          </h3>
          {manga.authorUsername ? (
            <Link
              href={`/user/${manga.authorUsername}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-[var(--text-tertiary)] mt-0.5 truncate block hover:text-[var(--primary)] transition-colors duration-200"
            >
              {manga.authorName || 'Autor desconocido'}
            </Link>
          ) : (
            <span className="text-xs text-[var(--text-tertiary)] mt-0.5 truncate block">
              {manga.authorName || 'Autor desconocido'}
            </span>
          )}

          <div className="flex flex-wrap gap-1 mt-1.5">
            {displayedTags.map((tag, i) => (
              <Link
                key={`tag-${i}`}
                href={`/search?genres[]=${tag}`}
                onClick={(e) => e.stopPropagation()}
                className="text-[10px] px-1.5 py-0.5 bg-[var(--surface-sunken)] text-[var(--text-muted)] rounded-md border border-[var(--border-subtle)] hover:bg-[var(--surface-elevated)] hover:text-[var(--primary)] transition-colors duration-200"
              >
                {tag}
              </Link>
            ))}
          </div>

          {manga.chapterCount ? (
            <p className="text-xs text-[var(--text-secondary)] mt-1.5 font-medium">
              {manga.chapterCount} {manga.chapterCount === 1 ? 'capítulo' : 'capítulos'}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
});
