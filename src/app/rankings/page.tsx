/**
 * Rankings Page
 *
 * Página de rankings de mangas.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import {
  Trophy,
  TrendingUp,
  Star,
  Eye,
  Calendar,
  Flame,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LoadingSkeleton } from '@/components/Performance/LoadingSkeleton';
import Navbar from '@/components/Layout/Navbar';
import { cn } from '@/lib/utils';

const RANKING_TYPES = [
  { value: 'popularity', label: 'Popularidad', icon: Eye },
  { value: 'rating', label: 'Mejor valorados', icon: Star },
  { value: 'trending', label: 'Tendencias', icon: Flame },
  { value: 'newest', label: 'Nuevos', icon: Calendar },
];

const TIME_RANGES = [
  { value: 'all', label: 'Todos los tiempos' },
  { value: 'month', label: 'Este mes' },
  { value: 'week', label: 'Esta semana' },
  { value: 'day', label: 'Hoy' },
];

const GENRES = [
  '', 'Acción', 'Aventura', 'Comedia', 'Drama', 'Fantasía',
  'Terror', 'Misterio', 'Romance', 'Sci-Fi', 'Slice of Life'
];

interface RankedManga {
  rank: number;
  id: string;
  title: string;
  slug: string;
  coverUrl?: string;
  authorName: string;
  status: string;
  totalViews: number;
  rating?: number;
  chapterCount: number;
  score: number | null;
}

export default function RankingsPage() {
  const [type, setType] = useState('popularity');
  const [timeRange, setTimeRange] = useState('all');
  const [genre, setGenre] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useSWR(
    `/api/rankings?type=${type}&timeRange=${timeRange}&genre=${genre}&page=${page}&limit=20`,
    { revalidateOnFocus: false }
  );

  const mangas = data?.mangas || [];
  const pagination = data?.pagination;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />

      <div className="pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-8 h-8 text-amber-400" />
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">Rankings</h1>
            </div>
            <p className="text-[var(--text-secondary)]">
              Descubre los mangas más populares y mejor valorados
            </p>
          </div>

          {/* Filters */}
          <div className="space-y-4 mb-8">
            {/* Type Tabs */}
            <div className="flex flex-wrap gap-2">
              {RANKING_TYPES.map((t) => {
                const Icon = t.icon;
                const isActive = type === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => { setType(t.value); setPage(1); }}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-[var(--primary)] text-[var(--text-inverse)]'
                        : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)]'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Time Range & Genre */}
            <div className="flex flex-wrap items-center gap-4">
              <select
                value={timeRange}
                onChange={(e) => { setTimeRange(e.target.value); setPage(1); }}
                className="bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--primary-ring)] focus:outline-none"
              >
                {TIME_RANGES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>

              <select
                value={genre}
                onChange={(e) => { setGenre(e.target.value); setPage(1); }}
                className="bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--primary-ring)] focus:outline-none"
              >
                <option value="">Todos los géneros</option>
                {GENRES.filter(g => g).map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <LoadingSkeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-[var(--text-secondary)]">Error al cargar rankings</p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Reintentar
              </Button>
            </div>
          ) : mangas.length > 0 ? (
            <>
              <div className="space-y-3">
                {mangas.map((manga: RankedManga) => (
                  <RankingItem key={manga.id} manga={manga} type={type} />
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={!pagination.hasPrevPage}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-[var(--text-secondary)]">
                    Página {page} de {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => p + 1)}
                    disabled={!pagination.hasNextPage}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <Trophy className="w-16 h-16 text-[var(--text-tertiary)] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                No hay resultados
              </h3>
              <p className="text-[var(--text-secondary)]">
                Intenta con otros filtros
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RankingItem({ manga, type }: { manga: RankedManga; type: string }) {
  const isTop3 = manga.rank <= 3;
  const rankColors = {
    1: 'text-amber-400',
    2: 'text-slate-300',
    3: 'text-amber-600',
  };

  return (
    <Link
      href={`/manga/${manga.slug}`}
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl border transition-all group',
        isTop3
          ? 'bg-gradient-to-r from-amber-500/10 to-transparent border-amber-500/30'
          : 'bg-[var(--surface-elevated)] border-[var(--border)] hover:border-[var(--primary)]'
      )}
    >
      {/* Rank */}
      <div className={cn(
        'w-12 h-12 flex items-center justify-center rounded-lg text-2xl font-bold',
        isTop3 ? rankColors[manga.rank as keyof typeof rankColors] || 'text-[var(--text-tertiary)]' : 'text-[var(--text-tertiary)]',
        isTop3 && 'bg-amber-500/10'
      )}>
        #{manga.rank}
      </div>

      {/* Cover */}
      <img
        src={manga.coverUrl || '/placeholder-manga.jpg'}
        alt={manga.title}
        className="w-16 h-20 object-cover rounded-lg"
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors truncate">
          {manga.title}
        </h3>
        <p className="text-sm text-[var(--text-secondary)]">{manga.authorName}</p>
        <div className="flex items-center gap-4 mt-2 text-sm">
          <span className="text-[var(--text-secondary)]">
            {manga.chapterCount} capítulos
          </span>
          {manga.rating && (
            <span className="flex items-center gap-1 text-amber-400">
              <Star className="w-4 h-4 fill-amber-400" />
              {manga.rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {/* Score */}
      <div className="text-right">
        {type === 'rating' ? (
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <span className="text-2xl font-bold text-[var(--text-primary)]">
              {manga.score?.toFixed(1) || '-'}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-[var(--primary)]" />
            <span className="text-2xl font-bold text-[var(--text-primary)]">
              {formatNumber(manga.score || 0)}
            </span>
          </div>
        )}
        <p className="text-xs text-[var(--text-tertiary)]">
          {type === 'rating' ? 'valoración' : 'vistas'}
        </p>
      </div>
    </Link>
  );
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K';
  }
  return num.toString();
}
