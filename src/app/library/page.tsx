/**
 * Library Page
 *
 * Página de biblioteca del usuario con filtros y organización.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLibrary, LibraryStatus } from '@/hooks/useLibrary';
import { useSession } from 'next-auth/react';
import {
  BookOpen,
  CheckCircle2,
  PauseCircle,
  XCircle,
  Clock,
  Star,
  TrendingUp,
  Filter,
  Grid3X3,
  List,
  ChevronRight,
  Library
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Navbar from '@/components/Layout/Navbar';
import { cn } from '@/lib/utils';

const STATUS_FILTERS: { value: LibraryStatus | ''; label: string; icon: React.ElementType; color: string }[] = [
  { value: '', label: 'Todos', icon: Library, color: 'text-[var(--text-secondary)]' },
  { value: 'READING', label: 'Leyendo', icon: BookOpen, color: 'text-[var(--primary)]' },
  { value: 'COMPLETED', label: 'Completado', icon: CheckCircle2, color: 'text-[var(--success)]' },
  { value: 'ON_HOLD', label: 'En pausa', icon: PauseCircle, color: 'text-[var(--warning)]' },
  { value: 'DROPPED', label: 'Abandonado', icon: XCircle, color: 'text-[var(--error)]' },
  { value: 'PLAN_TO_READ', label: 'Por leer', icon: Clock, color: 'text-[var(--accent-purple)]' },
];

const SORT_OPTIONS = [
  { value: 'updatedAt', label: 'Última actualización' },
  { value: 'title', label: 'Título' },
  { value: 'rating', label: 'Valoración' },
  { value: 'progress', label: 'Progreso' },
];

export default function LibraryPage() {
  const { data: session, status } = useSession();
  const [statusFilter, setStatusFilter] = useState<LibraryStatus | ''>('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { entries, isLoading, pagination } = useLibrary({
    status: statusFilter || undefined,
    sort: sortBy as any,
    page: 1,
    limit: 24,
  });

  // Loading state
  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Navbar />
        <div className="pt-20 pb-10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="mb-8">
              <div className="h-8 w-48 bg-[var(--surface)] rounded animate-pulse" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-[var(--surface)] rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not logged in
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Navbar />
        <div className="pt-20 pb-10 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Library className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Tu Biblioteca</h1>
            <p className="text-[var(--text-secondary)] mb-6">Inicia sesión para ver tu biblioteca</p>
            <Link href="/login">
              <Button>Iniciar sesión</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />

      <div className="pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Library className="w-8 h-8 text-[var(--primary)]" />
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">Mi Biblioteca</h1>
            </div>
            <p className="text-[var(--text-secondary)]">
              {pagination?.total || 0} {pagination?.total === 1 ? 'manga' : 'mangas'} en tu biblioteca
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: 'Leyendo',
                count: entries.filter(e => e.status === 'READING').length,
                icon: BookOpen,
                color: 'text-[var(--primary)]'
              },
              {
                label: 'Completados',
                count: entries.filter(e => e.status === 'COMPLETED').length,
                icon: CheckCircle2,
                color: 'text-[var(--success)]'
              },
              {
                label: 'En pausa',
                count: entries.filter(e => e.status === 'ON_HOLD').length,
                icon: PauseCircle,
                color: 'text-[var(--warning)]'
              },
              {
                label: 'Por leer',
                count: entries.filter(e => e.status === 'PLAN_TO_READ').length,
                icon: Clock,
                color: 'text-[var(--accent-purple)]'
              },
            ].map((stat) => (
              <div key={stat.label} className="bg-[var(--surface)]/50 rounded-xl p-4 border border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  <div>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{stat.count}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-[var(--border-strong)]">
            {/* Status Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 -mb-2 scrollbar-hide">
              {STATUS_FILTERS.map((filter) => {
                const Icon = filter.icon;
                const isActive = statusFilter === filter.value;
                return (
                  <button
                    key={filter.value}
                    onClick={() => setStatusFilter(filter.value)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                      isActive
                        ? 'bg-blue-500 text-[var(--text-primary)]'
                        : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)]'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {filter.label}
                  </button>
                );
              })}
            </div>

            {/* Sort & View */}
            <div className="flex items-center gap-2 ml-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              <div className="flex items-center bg-[var(--surface)] rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2 rounded transition-colors',
                    viewMode === 'grid' ? 'bg-[var(--surface-sunken)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                  )}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-2 rounded transition-colors',
                    viewMode === 'list' ? 'bg-[var(--surface-sunken)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          {entries.length > 0 ? (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {entries.map((entry) => (
                    <LibraryCard key={entry.id} entry={entry} />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {entries.map((entry) => (
                    <LibraryListItem key={entry.id} entry={entry} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <Library className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                Tu biblioteca está vacía
              </h3>
              <p className="text-[var(--text-secondary)] mb-6">
                {statusFilter
                  ? `No tienes mangas con estado "${STATUS_FILTERS.find(f => f.value === statusFilter)?.label}"`
                  : 'Agrega mangas a tu biblioteca para empezar a leer'
                }
              </p>
              <Link href="/browse">
                <Button>Explorar mangas</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LibraryCard({ entry }: { entry: import('@/hooks/useLibrary').LibraryEntry }) {
  const statusConfig = STATUS_FILTERS.find(f => f.value === entry.status);
  const StatusIcon = statusConfig?.icon || BookOpen;

  return (
    <Link
      href={`/manga/${entry.manga.slug}`}
      className="group block bg-[var(--surface)]/50 rounded-xl overflow-hidden border border-[var(--border)] hover:border-blue-500/50 transition-all"
    >
      {/* Cover */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={entry.manga.coverUrl || '/placeholder-manga.jpg'}
          alt={entry.manga.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Status Badge */}
        <div className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--background)]/80 backdrop-blur-sm text-xs font-medium ${statusConfig?.color || 'text-[var(--text-secondary)]'}`}>
          <StatusIcon className="w-3 h-3" />
        </div>
        {/* Progress Bar */}
        {entry.progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--surface-sunken)]">
            <div
              className="h-full bg-blue-500"
              style={{ width: `${Math.min(100, entry.progress)}%` }}
            />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-semibold text-[var(--text-primary)] text-sm line-clamp-1 group-hover:text-[var(--primary)] transition-colors">
          {entry.manga.title}
        </h3>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Cap. {entry.currentChapter} / {entry.totalChapters || '?'}
        </p>
        {entry.rating && (
          <div className="flex items-center gap-1 mt-2">
            <Star className="w-3 h-3 text-[var(--warning)] fill-amber-400" />
            <span className="text-xs text-[var(--text-primary)]">{entry.rating}/10</span>
          </div>
        )}
      </div>
    </Link>
  );
}

function LibraryListItem({ entry }: { entry: import('@/hooks/useLibrary').LibraryEntry }) {
  const statusConfig = STATUS_FILTERS.find(f => f.value === entry.status);
  const StatusIcon = statusConfig?.icon || BookOpen;

  return (
    <Link
      href={`/manga/${entry.manga.slug}`}
      className="flex items-center gap-4 p-4 bg-[var(--surface)]/50 rounded-xl border border-[var(--border)] hover:border-blue-500/50 transition-all group"
    >
      {/* Cover */}
      <img
        src={entry.manga.coverUrl || '/placeholder-manga.jpg'}
        alt={entry.manga.title}
        className="w-16 h-20 object-cover rounded-lg"
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors truncate">
            {entry.manga.title}
          </h3>
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${statusConfig?.color || 'text-[var(--text-secondary)]'} bg-[var(--background)]`}>
            <StatusIcon className="w-3 h-3" />
            {statusConfig?.label}
          </span>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">{entry.manga.authorName}</p>

        {/* Progress */}
        <div className="flex items-center gap-4 mt-2">
          <div className="flex-1 max-w-xs">
            <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1">
              <span>Progreso</span>
              <span>{entry.progress}%</span>
            </div>
            <div className="h-1.5 bg-[var(--surface-sunken)] rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${Math.min(100, entry.progress)}%` }}
              />
            </div>
          </div>
          <span className="text-sm text-[var(--text-secondary)]">
            Cap. {entry.currentChapter} / {entry.totalChapters || '?'}
          </span>
          {entry.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-[var(--warning)] fill-amber-400" />
              <span className="text-sm text-[var(--text-primary)]">{entry.rating}</span>
            </div>
          )}
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight className="w-5 h-5 text-[var(--text-tertiary)] group-hover:text-[var(--primary)] transition-colors" />
    </Link>
  );
}
