/**
 * MangaTagsDisplay Component
 *
 * Displays tags from the new MangaTag/Tag system on the manga detail page.
 * Fetches tags via the API and renders them as color-coded clickable badges.
 */

'use client';

import { motion } from 'framer-motion';
import { Hash } from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';

import { fetcher } from '@/lib/swr-config';
import { cn } from '@/lib/utils';

interface MangaTag {
  id: string;
  slug: string;
  name: string;
  color?: string;
  description?: string;
}

interface MangaTagsDisplayProps {
  mangaId: string;
  className?: string;
}

export function MangaTagsDisplay({ mangaId, className }: MangaTagsDisplayProps) {
  const { data, error, isLoading } = useSWR<{ tags: MangaTag[] }>(
    `/api/mangas/${mangaId}/tags`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  const tags = data?.tags || [];

  if (isLoading) {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-7 w-20 bg-[var(--surface-sunken)] rounded-full animate-pulse"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    );
  }

  if (error) {
    return null; // Silently fail — don't show errors on the manga detail page
  }

  if (tags.length === 0) {
    return null;
  }

  return (
    <motion.div
      className={cn('flex flex-wrap gap-2', className)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.4 }}
    >
      {tags.map((tag, i) => (
        <motion.span
          key={tag.id}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35 + i * 0.04, duration: 0.25 }}
        >
          <Link
            href={`/explore?tags=${encodeURIComponent(tag.slug)}`}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium',
              'border transition-all duration-200',
              tag.color
                ? 'border-[var(--border)]/40 hover:border-transparent'
                : 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20 hover:bg-[var(--primary)]/20',
            )}
            style={
              tag.color
                ? {
                    backgroundColor: `${tag.color}12`,
                    color: tag.color,
                    borderColor: `${tag.color}30`,
                  }
                : undefined
            }
            onMouseEnter={(e) => {
              if (tag.color) {
                e.currentTarget.style.backgroundColor = `${tag.color}25`;
                e.currentTarget.style.borderColor = `${tag.color}50`;
              }
            }}
            onMouseLeave={(e) => {
              if (tag.color) {
                e.currentTarget.style.backgroundColor = `${tag.color}12`;
                e.currentTarget.style.borderColor = `${tag.color}30`;
              }
            }}
            title={tag.description || tag.name}
          >
            <Hash className="w-3 h-3 flex-shrink-0" />
            <span>{tag.name}</span>
          </Link>
        </motion.span>
      ))}
    </motion.div>
  );
}
