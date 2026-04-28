'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Layout/Navbar';
import {
  BookOpen,
  Eye,
  Star,
  Library,
  Plus,
  Check,
  ChevronDown,
  Clock,
  User,
  Tag,
} from 'lucide-react';
import { cn, formatDate, formatNumber } from '@/lib/utils';

interface Chapter {
  id: string;
  chapterNumber: number;
  title: string | null;
  totalPages: number;
  viewCount: number;
  createdAt: string;
}

interface MangaData {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverUrl: string | null;
  authorId: string;
  authorName: string;
  status: string;
  tags: string[];
  rating: number | null;
  totalViews: number;
  createdAt: string;
  updatedAt: string;
  chapters: Chapter[];
  libraryCount: number;
}

interface Props {
  manga: MangaData;
  isInLibrary: boolean;
  userId: string | null;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  ONGOING: { label: 'En curso', color: 'bg-green-500' },
  COMPLETED: { label: 'Completado', color: 'bg-blue-500' },
  HIATUS: { label: 'En pausa', color: 'bg-yellow-500' },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-500' },
};

export default function MangaDetailClient({ manga, isInLibrary: initialInLibrary, userId }: Props) {
  const router = useRouter();
  const [isInLibrary, setIsInLibrary] = useState(initialInLibrary);
  const [showAllChapters, setShowAllChapters] = useState(false);
  const [isTogglingLibrary, setIsTogglingLibrary] = useState(false);

  const displayedChapters = showAllChapters
    ? manga.chapters
    : manga.chapters.slice(0, 20);

  const statusInfo = statusLabels[manga.status] || { label: manga.status, color: 'bg-gray-500' };

  const toggleLibrary = async () => {
    if (!userId) {
      router.push('/auth/login');
      return;
    }

    setIsTogglingLibrary(true);
    try {
      const res = await fetch('/api/library', {
        method: isInLibrary ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mangaId: manga.id }),
      });

      if (res.ok) {
        setIsInLibrary(!isInLibrary);
      }
    } catch (err) {
      console.error('Error toggling library:', err);
    } finally {
      setIsTogglingLibrary(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />

      {/* Hero Banner */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/60 to-transparent z-10" />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 blur-sm"
          style={{ backgroundImage: manga.coverUrl ? `url(${manga.coverUrl})` : undefined }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)]/20 to-[#8b5cf6]/20" />
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-40 relative z-20 pb-16">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Cover */}
          <div className="flex-shrink-0">
            <div className="w-48 md:w-56 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border border-[var(--border)] bg-[var(--surface)]">
              {manga.coverUrl ? (
                <img
                  src={manga.coverUrl}
                  alt={manga.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-[var(--text-tertiary)]" />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-bold text-white', statusInfo.color)}>
                {statusInfo.label}
              </span>
              {manga.rating && (
                <span className="flex items-center gap-1 text-sm text-yellow-500 font-medium">
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
            <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-secondary)] mb-6">
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" /> {formatNumber(manga.totalViews)} vistas
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" /> {manga.chapters.length} capítulos
              </span>
              <span className="flex items-center gap-1">
                <Library className="w-4 h-4" /> {formatNumber(manga.libraryCount)} en biblioteca
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> {formatDate(manga.createdAt)}
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 mb-6">
              {manga.chapters.length > 0 && (
                <Link
                  href={`/manga/${manga.slug}/chapter/${manga.chapters[manga.chapters.length - 1]?.chapterNumber || 1}`}
                  className="px-6 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
                >
                  <BookOpen className="w-5 h-5" />
                  Empezar a leer
                </Link>
              )}
              <button
                onClick={toggleLibrary}
                disabled={isTogglingLibrary}
                className={cn(
                  'px-6 py-2.5 font-bold rounded-xl border transition-all flex items-center gap-2',
                  isInLibrary
                    ? 'bg-[var(--success)]/10 border-[var(--success)]/30 text-[var(--success)]'
                    : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]'
                )}
              >
                {isInLibrary ? (
                  <><Check className="w-5 h-5" /> En biblioteca</>
                ) : (
                  <><Plus className="w-5 h-5" /> Agregar a biblioteca</>
                )}
              </button>
            </div>

            {/* Tags */}
            {manga.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {manga.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 rounded-full text-xs font-bold flex items-center gap-1"
                  >
                    <Tag className="w-3 h-3" /> {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            {manga.description && (
              <div className="mb-8">
                <h2 className="text-lg font-bold mb-2">Sinopsis</h2>
                <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                  {manga.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Chapters List */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[var(--primary)]" />
            Capítulos
            <span className="text-sm font-normal text-[var(--text-secondary)]">
              ({manga.chapters.length})
            </span>
          </h2>

          {manga.chapters.length === 0 ? (
            <div className="text-center py-16 bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
              <BookOpen className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-4" />
              <p className="text-[var(--text-secondary)] font-medium">Aún no hay capítulos disponibles</p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayedChapters.map((chapter) => (
                <Link
                  key={chapter.id}
                  href={`/manga/${manga.slug}/chapter/${chapter.chapterNumber}`}
                  className="flex items-center justify-between p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl hover:bg-[var(--surface-elevated)] hover:border-[var(--primary)]/30 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-10 h-10 flex items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] font-bold text-sm">
                      {chapter.chapterNumber}
                    </span>
                    <div>
                      <p className="font-semibold text-sm group-hover:text-[var(--primary)] transition-colors">
                        Capítulo {chapter.chapterNumber}
                        {chapter.title && `: ${chapter.title}`}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)] mt-1">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" /> {formatNumber(chapter.viewCount)}
                        </span>
                        <span>{formatDate(chapter.createdAt)}</span>
                        <span>{chapter.totalPages} págs.</span>
                      </div>
                    </div>
                  </div>
                  <BookOpen className="w-5 h-5 text-[var(--text-tertiary)] group-hover:text-[var(--primary)] transition-colors" />
                </Link>
              ))}
            </div>
          )}

          {manga.chapters.length > 20 && !showAllChapters && (
            <button
              onClick={() => setShowAllChapters(true)}
              className="w-full mt-4 py-3 text-[var(--primary)] hover:bg-[var(--primary)]/5 border border-[var(--border)] rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <ChevronDown className="w-5 h-5" />
              Ver los {manga.chapters.length} capítulos
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
