'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { memo } from 'react';

import { useT } from '@/i18n';
import { cn } from '@/lib/utils';
import { normalizeGenreKey, ENGLISH_TO_SLUG, SLUG_TO_ENGLISH } from '@/constants/genres';

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
  ONGOING: 'bg-[var(--success)]/80 text-[var(--text-inverse)] border-[var(--success)]/30',
  COMPLETED: 'bg-[var(--info)]/80 text-[var(--text-inverse)] border-[var(--info)]/30',
  HIATUS: 'bg-[var(--warning)]/80 text-[var(--text-inverse)] border-[var(--warning)]/30',
  DROPPED: 'bg-[var(--error)]/80 text-[var(--text-inverse)] border-[var(--error)]/30',
};

const STATUS_KEYS: Record<string, string> = {
  ONGOING: 'manga.ongoing',
  COMPLETED: 'manga.completed',
  HIATUS: 'manga.hiatus',
  DROPPED: 'manga.dropped',
};

export const MangaCard = memo(function MangaCard({
  manga,
  size = 'md',
  showSimilarity = false,
  priority = false,
}: MangaCardProps) {
  const statusColor = statusColors[manga.status || ''] || 'bg-[var(--surface-elevated)] text-[var(--text-secondary)]';
  const t = useT();
  const router = useRouter();
  const statusLabel = t(STATUS_KEYS[manga.status || ''] || '') || manga.status || '';
  const displayGenreTag = (genre: string): string => {
    let slug = ENGLISH_TO_SLUG[genre];
    if (!slug) {
      const normalized = normalizeGenreKey(genre);
      slug = ENGLISH_TO_SLUG[normalized];
      if (!slug) {
        const englishTag = SLUG_TO_ENGLISH[normalized];
        if (englishTag) slug = ENGLISH_TO_SLUG[englishTag];
      }
    }
    return slug ? t(`genres.${slug}`) : genre.charAt(0).toUpperCase() + genre.slice(1);
  };
  const imageSize = imageSizes[size];
  const sizeClass = sizeClasses[size];
  const href = `/manga/${manga.slug || manga.id}`;
  const imageSrc = manga.coverUrl || '';
  const tagMap = new Map<string, string>();
  (manga.tags ?? []).forEach(t => {
    const n = normalizeGenreKey(t);
    if (!tagMap.has(n)) tagMap.set(n, t);
  });
  const displayedTags = [...tagMap.values()].slice(0, 3);
  const hasRating = manga.rating && manga.rating > 0;

  return (
    <Link href={href} className="group block" prefetch={true}>
      <article className={cn('relative', sizeClass)}>
        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className={cn(
            'relative rounded-xl overflow-hidden shadow-md transition-shadow duration-300',
            'group-hover:shadow-xl',
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
        </motion.div>

        <div className="mt-2.5 px-0.5">
          <h3
            className="font-semibold text-[var(--text-primary)] text-sm leading-tight line-clamp-2 group-hover:text-[var(--primary)] transition-colors duration-200"
            title={manga.title}
          >
            {manga.title}
          </h3>
          {manga.authorUsername ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); router.push(`/user/${manga.authorUsername}`); }}
              className="text-xs text-[var(--text-tertiary)] mt-0.5 truncate block hover:text-[var(--primary)] transition-colors duration-200 px-1 py-1 min-h-[24px] inline-flex items-center cursor-pointer"
            >
              {manga.authorName || 'Autor desconocido'}
            </button>
          ) : (
            <span className="text-xs text-[var(--text-tertiary)] mt-0.5 truncate block px-1 py-1 min-h-[24px] inline-flex items-center">
              {manga.authorName || 'Autor desconocido'}
            </span>
          )}

          <div className="flex flex-wrap gap-1 mt-1.5">
            {displayedTags.map((tag, i) => (
              <span
                key={`tag-${i}`}
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/explore?genres[]=${encodeURIComponent(tag)}`);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    router.push(`/explore?genres[]=${encodeURIComponent(tag)}`);
                  }
                }}
                role="link"
                tabIndex={0}
                className="text-[10px] px-2 py-1 min-w-[24px] min-h-[24px] inline-flex items-center justify-center bg-[var(--surface-sunken)] text-[var(--text-muted)] rounded-md border border-[var(--border-subtle)] hover:bg-[var(--surface-elevated)] hover:text-[var(--primary)] transition-colors duration-200 cursor-pointer"
              >
                {displayGenreTag(tag)}
              </span>
            ))}
          </div>

          {manga.chapterCount ? (
            <p className="text-xs text-[var(--text-secondary)] mt-1.5 font-medium">
              {manga.chapterCount} {t(manga.chapterCount === 1 ? 'manga.chapter' : 'manga.chapters')}
            </p>
          ) : null}
        </div>
      </article>
    </Link>
  );
});
