'use client';

import React, { useMemo, memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
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
  ONGOING: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  HIATUS: 'bg-amber-100 text-amber-700',
  DROPPED: 'bg-red-100 text-red-700',
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
  // Memoized computed values
  const statusColor = useMemo(() => 
    statusColors[manga.status || ''] || 'bg-slate-100 text-slate-700',
    [manga.status]
  );

  const statusLabel = useMemo(() => 
    statusLabels[manga.status || ''] || 'Abandonado',
    [manga.status]
  );

  const imageSize = useMemo(() => imageSizes[size], [size]);
  const sizeClass = useMemo(() => sizeClasses[size], [size]);

  // Memoized href to prevent unnecessary re-renders
  const href = useMemo(() => `/manga/${manga.slug || manga.id}`, [manga.slug, manga.id]);

  // Memoized image src with fallback
  const imageSrc = useMemo(() => 
    manga.coverUrl || '',
    [manga.coverUrl]
  );

  // Memoized tags slice
  const displayedTags = useMemo(() => 
    (manga.tags ?? []).slice(0, 3),
    [manga.tags]
  );

  return (
    <Link href={href} className="group block" prefetch={true}>
      <div className={cn('relative', sizeClass)}>
        {/* Cover Image */}
        <div
          className={cn(
            'relative rounded-lg overflow-hidden shadow-md transition-transform group-hover:scale-105 group-hover:shadow-xl',
            'bg-slate-200'
          )}
          style={{ aspectRatio: `${imageSize.width}/${imageSize.height}` }}
        >
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={manga.title}
              width={imageSize.width}
              height={imageSize.height}
              className="object-cover"
              sizes={`(max-width: 640px) 50vw, ${imageSize.width}px`}
              loading={priority ? 'eager' : 'lazy'}
              priority={priority}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-400 to-purple-500 text-white font-bold text-lg">
              {manga.title.charAt(0)}
            </div>
          )}

        {/* Status Badge */}
        <div className="absolute top-2 left-2">
          <span
            className={cn(
              'px-2 py-0.5 text-xs font-medium rounded-full',
              statusColor
            )}
          >
            {statusLabel}
          </span>
        </div>

          {/* Similarity Score */}
          {showSimilarity && manga.similarity && (
            <div className="absolute top-2 right-2">
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-indigo-600 text-white">
                {manga.similarity}% match
              </span>
            </div>
          )}

          {/* Rating */}
          {manga.rating && (
            <div className="absolute bottom-2 right-2 flex items-center gap-0.5 bg-black/60 text-white px-2 py-0.5 rounded-full text-xs">
              <svg className="w-3 h-3 text-amber-400 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {manga.rating.toFixed(1)}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-2">
          <h3
            className="font-semibold text-slate-900 text-sm leading-tight line-clamp-2 group-hover:text-indigo-600 transition-colors"
            title={manga.title}
          >
            {manga.title}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{manga.authorName ?? 'Autor desconocido'}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-1">
          {displayedTags.map((tag, i) => (
            <span
              key={i}
              className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded"
            >
              {tag}
            </span>
          ))}
        </div>

          {/* Chapter count */}
          {manga.chapterCount && (
            <p className="text-xs text-slate-400 mt-1">
              {manga.chapterCount} capítulos
            </p>
          )}
        </div>
      </div>
      </Link>
    );
  }
)
