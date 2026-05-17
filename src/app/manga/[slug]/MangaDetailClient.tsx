'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { OptimizedImage } from '@/components/Image/OptimizedImage';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen, Clock, Eye, Star, ChevronDown, Plus, Check, User, Library, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '@/i18n';
import { cn, formatNumber, formatDate } from '@/lib/utils';
import { toggleLibrary } from './actions';

interface Props {
  manga: {
    id: string;
    title: string;
    slug: string;
    coverUrl: string | null;
    description: string | null;
    status: string;
    tags: string[];
    totalViews: number;
    libraryCount: number;
    rating: number | null;
    authorName: string | null;
    createdAt: Date | string;
    chapters: { id: string; chapterNumber: number; title: string | null; viewCount: number; totalPages: number; createdAt: Date | string }[];
  };
  isInLibrary: boolean;
  userId: string | null;
}

const STATUS_KEYS: Record<string, string> = {
  ONGOING: 'manga.ongoing',
  COMPLETED: 'manga.completed',
  HIATUS: 'manga.hiatus',
  DROPPED: 'manga.dropped',
};

const STATUS_COLORS: Record<string, string> = {
  ONGOING: 'bg-[var(--success)]/80 text-[var(--text-inverse)] border-[var(--success)]/30',
  COMPLETED: 'bg-[var(--info)]/80 text-[var(--text-inverse)] border-[var(--info)]/30',
  HIATUS: 'bg-[var(--warning)]/80 text-[var(--text-inverse)] border-[var(--warning)]/30',
  DROPPED: 'bg-[var(--error)]/80 text-[var(--text-inverse)] border-[var(--error)]/30',
};

export default function MangaDetailClient({ manga, isInLibrary: initialInLibrary, userId }: Props) {
  const router = useRouter();
  const [isInLibrary, setIsInLibrary] = useState(initialInLibrary);
  const [showAllChapters, setShowAllChapters] = useState(false);
  const [isPending, startTransition] = useTransition();

  const displayedChapters = showAllChapters
    ? manga.chapters
    : manga.chapters.slice(0, 20);

  const t = useT();
  const statusKey = STATUS_KEYS[manga.status] || '';
  const statusInfo = {
    label: statusKey ? t(statusKey) : manga.status,
    color: STATUS_COLORS[manga.status] || 'bg-[var(--text-muted)]',
  };

  const handleToggleLibrary = () => {
    if (!userId) {
      router.push('/auth/login');
      return;
    }

    startTransition(async () => {
      try {
        const result = await toggleLibrary(manga.id);
        setIsInLibrary(result.isInLibrary);
      } catch {
        toast.error('Error al cambiar estado');
      }
    });
  };

  return (
    <motion.div
      className="min-h-screen bg-[var(--background)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >

      {/* Hero Banner */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/60 to-transparent z-10" />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 blur-sm"
          style={{ backgroundImage: manga.coverUrl ? `url(${manga.coverUrl})` : undefined }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)]/20 to-[var(--accent-purple)]/20" />
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-40 relative z-20 pb-16">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Cover */}
          <motion.div
            className="flex-shrink-0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <motion.div
              className="relative w-48 md:w-56 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border border-[var(--border)] bg-[var(--surface)]"
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {manga.coverUrl ? (
                <>
                  <OptimizedImage
                    src={manga.coverUrl}
                    alt={manga.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-[var(--text-tertiary)]" />
                </div>
              )}
            </motion.div>
          </motion.div>

          {/* Info */}
          <motion.div
            className="flex-1 min-w-0"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-bold text-[var(--text-inverse)]', statusInfo.color)}>
                {statusInfo.label}
              </span>
              {manga.rating && (
                <span className="flex items-center gap-1 text-sm text-[var(--warning)] font-medium">
                  <Star className="w-4 h-4 fill-current" /> {manga.rating.toFixed(1)}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
              {manga.title}
            </h1>

            <Link
              href={`/profile`}
              className="text-[var(--primary)] hover:underline font-medium flex items-center gap-1 mb-4"
            >
              <User className="w-4 h-4" /> {manga.authorName}
            </Link>

            {/* Stats */}
            <motion.div
              className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-secondary)] mb-6 p-4 rounded-xl bg-[var(--surface)]/60 backdrop-blur-sm border border-[var(--border)]/50 shadow-sm"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" /> {formatNumber(manga.totalViews)} {t('manga.views')}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" /> {manga.chapters.length} {t('manga.chapters')}
              </span>
              <span className="flex items-center gap-1">
                <Library className="w-4 h-4" /> {formatNumber(manga.libraryCount)} {t('manga.inLibrary')}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> {formatDate(manga.createdAt)}
              </span>
            </motion.div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 mb-6">
              {manga.chapters.length > 0 && (
                <Link
                  href={`/manga/${manga.slug}/chapter/${manga.chapters[manga.chapters.length - 1]?.chapterNumber || 1}`}
                  className="px-6 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--text-inverse)] font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
                >
                  <BookOpen className="w-5 h-5" />
                  {t('manga.startReading')}
                </Link>
              )}
              <button
                onClick={handleToggleLibrary}
                disabled={isPending}
                className={cn(
                  'px-6 py-2.5 font-bold rounded-xl border transition-all flex items-center gap-2',
                  isInLibrary
                    ? 'bg-[var(--success)]/10 border-[var(--success)]/30 text-[var(--success)]'
                    : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]'
                )}
              >
                {isInLibrary ? (
                  <><Check className="w-5 h-5" /> {t('manga.inLibrary')}</>
                ) : (
                  <><Plus className="w-5 h-5" /> {t('manga.addToLibrary')}</>
                )}
              </button>
            </div>

            {/* Tags */}
            {manga.tags.length > 0 && (
              <motion.div
                className="flex flex-wrap gap-2 mb-6"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5 }}
              >
                {manga.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 rounded-full text-xs font-bold flex items-center gap-1"
                  >
                    <Tag className="w-3 h-3" /> {tag}
                  </span>
                ))}
              </motion.div>
            )}

            {/* Description */}
            {manga.description && (
              <motion.div
                className="mb-8"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <h2 className="text-lg font-bold mb-2">{t('manga.synopsis')}</h2>
                <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                  {manga.description}
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Chapters List */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[var(--primary)]" />
            {t('manga.chaptersTitle')}
            <span className="text-sm font-normal text-[var(--text-secondary)]">
              ({manga.chapters.length})
            </span>
          </h2>

          {manga.chapters.length === 0 ? (
            <div className="text-center py-16 bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
              <BookOpen className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-4" />
              <p className="text-[var(--text-secondary)] font-medium">{t('manga.noChapters')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayedChapters.map((chapter, i) => (
                <motion.div
                  key={chapter.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.03, duration: 0.3 }}
                >
                  <Link
                    href={`/manga/${manga.slug}/chapter/${chapter.chapterNumber}`}
                    className="flex items-center justify-between p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl hover:bg-[var(--surface-elevated)] hover:border-[var(--primary)]/30 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-10 h-10 flex items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] font-bold text-sm">
                        {chapter.chapterNumber}
                      </span>
                      <div>
                        <p className="font-semibold text-sm group-hover:text-[var(--primary)] transition-colors">
                          {t('manga.chapter')} {chapter.chapterNumber}
                          {chapter.title && `: ${chapter.title}`}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)] mt-1">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" /> {formatNumber(chapter.viewCount)}
                          </span>
                          <span>{formatDate(chapter.createdAt)}</span>
                          <span>{chapter.totalPages} {t('manga.pagesAbbr')}</span>
                        </div>
                      </div>
                    </div>
                    <BookOpen className="w-5 h-5 text-[var(--text-tertiary)] group-hover:text-[var(--primary)] transition-colors" />
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {manga.chapters.length > 20 && !showAllChapters && (
            <button
              onClick={() => setShowAllChapters(true)}
              className="w-full mt-4 py-3 text-[var(--primary)] hover:bg-[var(--primary)]/5 border border-[var(--border)] rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <ChevronDown className="w-5 h-5" />
              {t('manga.viewAllChapters', { count: manga.chapters.length })}
            </button>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
