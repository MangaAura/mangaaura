'use client';

import { BookOpen, ChevronRight, Clock } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

import { useReadingProgress } from '@/hooks/useReadingProgress';
import { cn } from '@/lib/utils';

interface ContinueReadingBannerProps {
  mangaId: string;
  mangaSlug: string;
  chapters: { id: string; chapterNumber: number; title: string | null }[];
}

export function ContinueReadingBanner({
  mangaId,
  mangaSlug,
  chapters,
}: ContinueReadingBannerProps) {
  const { data: session } = useSession();
  const { progress } = useReadingProgress(mangaId);

  if (!session?.user) return null;

  // Find the latest progress for THIS specific manga
  const mangaProgress = progress
    .filter((p) => p.mangaId === mangaId)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )[0];

  if (!mangaProgress) return null;

  const { percentage, chapter } = mangaProgress;
  const nextChapterNumber = chapter ? chapter.chapterNumber : 1;
  const isComplete = percentage >= 90;

  // Find the target chapter
  const targetChapter = isComplete
    ? chapters.find((c) => c.chapterNumber === nextChapterNumber + 1)
    : chapters.find((c) => c.id === chapter?.id);

  if (!targetChapter && isComplete) return null;

  const linkHref = targetChapter
    ? `/manga/${mangaSlug}/chapter/${targetChapter.chapterNumber}`
    : null;

  if (!linkHref || !targetChapter) return null;

  return (
    <div className="animate-ac-fade-in-up">
      <Link
        href={linkHref}
        className={cn(
          'group relative overflow-hidden rounded-2xl border p-5 flex items-center gap-4 transition-all',
          isComplete
            ? 'bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40'
            : 'bg-gradient-to-r from-indigo-500/10 to-purple-500/5 border-indigo-500/20 hover:border-indigo-500/40',
        )}
      >
        {/* Icon */}
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
            isComplete
              ? 'bg-emerald-500/20 text-emerald-500'
              : 'bg-indigo-500/20 text-indigo-500',
          )}
        >
          <BookOpen className="w-6 h-6" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
            {isComplete
              ? 'Siguiente capítulo disponible'
              : 'Continuar leyendo'}
          </p>
          <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
            Capítulo {targetChapter.chapterNumber}
            {targetChapter.title ? `: ${targetChapter.title}` : ''}
          </p>
          {!isComplete && (
            <div className="w-full max-w-xs h-1.5 bg-[var(--surface-sunken)] rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
          )}
        </div>

        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-[var(--text-tertiary)] group-hover:text-[var(--primary)] group-hover:translate-x-1 transition-all shrink-0" />

        {/* Badge */}
        {!isComplete && (
          <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-indigo-500/10 text-indigo-500 text-xs font-medium rounded-full shrink-0">
            <Clock className="w-3.5 h-3.5" />
            {percentage}%
          </div>
        )}
      </Link>
    </div>
  );
}
