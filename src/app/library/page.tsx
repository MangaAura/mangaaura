/**
 * Library Page
 *
 * Página de biblioteca del usuario con filtros y organización.
 */

'use client';

import {
  BookOpen,
  CheckCircle2,
  PauseCircle,
  XCircle,
  Clock,
  Star,
  Grid3X3,
  List,
  ChevronRight,
  Library,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

import { OptimizedImage } from '@/components/Image/OptimizedImage';
import { Button } from '@/components/ui/Button';
import { EmptyLibrary } from '@/components/ui/EmptyState';
import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer';
import { useLibrary, LibraryStatus } from '@/hooks/useLibrary';
import { cn } from '@/lib/utils';

const STATUS_FILTERS: { value: LibraryStatus | ''; label: string; icon: React.ElementType; color: string }[] = [
  { value: '', label: 'Todos', icon: Library, color: 'text-[var(--text-tertiary)]' },
  { value: 'READING', label: 'Leyendo', icon: BookOpen, color: 'text-[var(--info)]' },
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

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="aspect-[3/4] bg-[var(--surface-sunken)] rounded-xl animate-pulse" />
          <div className="h-4 bg-[var(--surface-sunken)] rounded animate-pulse w-3/4" />
          <div className="h-3 bg-[var(--surface-sunken)] rounded animate-pulse w-1/2" />
        </div>
      ))}
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-[var(--surface)] rounded-xl">
          <div className="w-16 h-20 bg-[var(--surface-sunken)] rounded-lg animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-[var(--surface-sunken)] rounded animate-pulse w-1/3" />
            <div className="h-3 bg-[var(--surface-sunken)] rounded animate-pulse w-1/4" />
            <div className="h-2 bg-[var(--surface-sunken)] rounded animate-pulse w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LibraryPage() {
  const { status } = useSession();
  const [statusFilter, setStatusFilter] = useState<LibraryStatus | ''>('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { entries, isLoading, pagination } = useLibrary({
    status: statusFilter || undefined,
    sort: (sortBy ?? "popular") as "updatedAt" | "title" | "rating" | "progress" | undefined,
    page: 1,
    limit: 24,
  });

if (status === 'loading') {
  return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-center py-20" role="status">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--info)]" />
        </div>
      </div>
    </div>
  );
}

if (status === 'unauthenticated') {
  return (
    <div className="min-h-[60vh] bg-[var(--background)] text-[var(--text-primary)] pt-20 pb-10 flex items-center justify-center">
      <div className="text-center">          <Library className="w-16 h-16 text-[var(--text-tertiary)] mx-auto mb-4 opacity-30" aria-hidden="true" />
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">Tu Biblioteca</h1>
        <p className="text-[var(--text-tertiary)] mb-6">Inicia sesión para ver tu biblioteca</p>
        <Link href="/auth/login">
          <Button className="px-8 py-2.5">Iniciar sesión</Button>
        </Link>
      </div>
    </div>
  );
}

  return (
    <div className="pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
              <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
                <Library className="text-[var(--primary)]" size={30} /> Mi Biblioteca
              </h1>
            <p className="text-[var(--text-tertiary)]">
              {pagination?.total || 0} {pagination?.total === 1 ? 'manga' : 'mangas'} en tu biblioteca
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Leyendo', filter: 'READING' as LibraryStatus, icon: BookOpen, color: 'text-[var(--info)]' },
              { label: 'Completados', filter: 'COMPLETED' as LibraryStatus, icon: CheckCircle2, color: 'text-[var(--success)]' },
              { label: 'En pausa', filter: 'ON_HOLD' as LibraryStatus, icon: PauseCircle, color: 'text-[var(--warning)]' },
              { label: 'Por leer', filter: 'PLAN_TO_READ' as LibraryStatus, icon: Clock, color: 'text-[var(--accent-purple)]' },
            ].map((stat) => {
              const actualCount = !statusFilter || statusFilter === stat.filter
                ? entries.filter(e => e.status === stat.filter).length
                : entries.filter(e => e.status === stat.filter).length;
              return (
          <button
            key={stat.label}
            onClick={() => setStatusFilter(statusFilter === stat.filter ? '' : stat.filter)}
            className={cn(
              'card p-4 rounded-xl border border-[var(--border)] text-left transition-all hover:shadow-md cursor-pointer',
              statusFilter === stat.filter && 'border-[var(--info)] bg-[var(--info)]/5'
            )}
          >
                  <div className="flex items-center gap-3">
                    <stat.icon className={cn('w-5 h-5', stat.color)} aria-hidden="true" />
                    <div>
                      <p className="text-2xl font-bold">{actualCount}</p>
                      <p className="text-sm text-[var(--text-tertiary)]">{stat.label}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-[var(--border)]">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 -mb-2 no-scrollbar">
              {STATUS_FILTERS.map((filter) => {
                const Icon = filter.icon;
                const isActive = statusFilter === filter.value;
                if (!filter.value) return null;
                return (
                  <button
                    key={filter.value}
                    onClick={() => setStatusFilter(filter.value as LibraryStatus)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                      isActive
                        ? 'bg-[var(--info)] text-[var(--text-inverse)] shadow-sm'
                        : 'bg-[var(--surface)] text-[var(--text-tertiary)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)]'
                    )}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    {filter.label}
                  </button>
                );
              })}
              {statusFilter && (
                <button
                  onClick={() => setStatusFilter('')}
                  className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium bg-[var(--surface)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-all"
                >
                  <XCircle className="w-4 h-4" aria-hidden="true" />
                  Limpiar
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Ordenar por"
                className="bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--info)]/30 focus:border-[var(--info)]"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              <div className="flex items-center bg-[var(--surface)] rounded-lg p-1">
        <button
          onClick={() => setViewMode('grid')}
          className={cn(
            'p-2 rounded transition-colors cursor-pointer',
            viewMode === 'grid' ? 'bg-[var(--surface-sunken)] text-[var(--info)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
          )}
          title="Vista de cuadrícula"
          aria-label="Vista de cuadrícula"
        >
          <Grid3X3 className="w-4 h-4" />
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={cn(
            'p-2 rounded transition-colors cursor-pointer',
            viewMode === 'list' ? 'bg-[var(--surface-sunken)] text-[var(--info)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
          )}
          title="Vista de lista"
          aria-label="Vista de lista"
        >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            viewMode === 'grid' ? <SkeletonGrid /> : <SkeletonList />
          )}

          {/* Content */}
          {!isLoading && entries.length > 0 && (
            <>
              {viewMode === 'grid' ? (
                <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4" staggerDelay={0.04}>
                  {entries.map((entry) => (
                    <StaggerItem key={entry.id}>
                      <LibraryCard entry={entry} />
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              ) : (
                <StaggerContainer className="space-y-3" staggerDelay={0.03}>
                  {entries.map((entry) => (
                    <StaggerItem key={entry.id}>
                      <LibraryListItem entry={entry} />
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              )}
            </>
          )}

          {/* Empty State */}
      {!isLoading && entries.length === 0 && (
        statusFilter ? (
          <div className="text-center py-20">
            <Library className="w-16 h-16 text-[var(--text-tertiary)] mx-auto mb-4 opacity-30" aria-hidden="true" />
            <h3 className="text-xl font-bold mb-2">
              Sin resultados
            </h3>
            <p className="text-[var(--text-tertiary)] mb-6">
              No tienes mangas con estado &ldquo;{STATUS_FILTERS.find(f => f.value === statusFilter)?.label}&rdquo;
            </p>
          </div>
        ) : (
          <EmptyLibrary />
        )
      )}
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
      className="group block card rounded-xl overflow-hidden border border-[var(--border)] hover:border-[var(--info)]/50 transition-all hover:shadow-lg"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <OptimizedImage
          src={entry.manga.coverUrl || '/placeholder-manga.svg'}
          alt={entry.manga.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className={cn(
          'absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--surface)]/80 backdrop-blur-sm text-xs font-medium',
          statusConfig?.color || 'text-[var(--text-tertiary)]'
        )}>
          <StatusIcon className="w-3 h-3" />
        </div>
        {entry.progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--surface)]" role="progressbar" aria-valuenow={Math.min(100, entry.progress)} aria-valuemin={0} aria-valuemax={100} aria-label={`Progreso: ${Math.min(100, entry.progress)}%`}>
            <div
              className="h-full bg-gradient-to-r from-[var(--info)] to-[var(--accent-purple)]"
              style={{ width: `${Math.min(100, entry.progress)}%` }}
            />
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-bold text-sm line-clamp-1 group-hover:text-[var(--info)] transition-colors">
          {entry.manga.title}
        </h3>
        <div className="flex justify-between items-center mt-1">
          <p className="text-xs text-[var(--text-tertiary)]">
            Cap. {entry.currentChapter} / {entry.totalChapters || '?'}
          </p>
          {entry.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-[var(--warning)] fill-[var(--warning)]" aria-hidden="true" />
              <span className="text-xs font-bold">{entry.rating}/10</span>
            </div>
          )}
        </div>
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
      className="flex items-center gap-4 p-4 card rounded-xl border border-[var(--border)] hover:border-[var(--info)]/50 transition-all group"
    >
      <OptimizedImage
        src={entry.manga.coverUrl || '/placeholder-manga.svg'}
        alt={entry.manga.title}
        width={64}
        height={80}
        className="rounded-lg flex-shrink-0 bg-[var(--surface-sunken)]"
        objectFit="cover"
        loading="lazy"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-bold group-hover:text-[var(--info)] transition-colors truncate">
            {entry.manga.title}
          </h3>
          <span className={cn(
            'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-[var(--surface-sunken)]',
            statusConfig?.color || 'text-[var(--text-tertiary)]'
          )}>
            <StatusIcon className="w-3 h-3" />
            {statusConfig?.label}
          </span>
        </div>
        <p className="text-sm text-[var(--text-tertiary)]">{entry.manga.authorName}</p>

        <div className="flex items-center gap-4 mt-2">
          <div className="flex-1 max-w-xs">
            <div className="flex justify-between text-xs text-[var(--text-tertiary)] mb-1">
              <span>Progreso</span>
              <span>{entry.progress}%</span>
            </div>
            <div className="h-1.5 bg-[var(--surface-sunken)] rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.min(100, entry.progress)} aria-valuemin={0} aria-valuemax={100} aria-label={`Progreso de lectura: ${Math.min(100, entry.progress)}%`}>
              <div
                className="h-full bg-gradient-to-r from-[var(--info)] to-[var(--accent-purple)] rounded-full"
                style={{ width: `${Math.min(100, entry.progress)}%` }}
              />
            </div>
          </div>
          <span className="text-sm text-[var(--text-tertiary)]">
            Cap. {entry.currentChapter} / {entry.totalChapters || '?'}
          </span>
          {entry.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-[var(--warning)] fill-[var(--warning)]" aria-hidden="true" />
              <span className="text-sm font-bold">{entry.rating}</span>
            </div>
          )}
        </div>
      </div>

      <ChevronRight className="w-5 h-5 text-[var(--text-tertiary)] group-hover:text-[var(--info)] transition-colors flex-shrink-0" />
    </Link>
  );
}
