/**
 * Search Page
 *
 * Página de resultados de búsqueda con filtros y vistas grid/list.
 */

'use client';

import { Search, Filter, Grid3X3, List, Loader2, X, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, Suspense } from 'react';

import { OptimizedImage } from '@/components/Image/OptimizedImage';
import { MangaCard } from '@/components/MangaCard';
import { SearchBar } from '@/components/Search/SearchBar';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';


const GENRES = [
  'Acción', 'Aventura', 'Comedia', 'Drama', 'Fantasía',
  'Terror', 'Misterio', 'Romance', 'Sci-Fi', 'Slice of Life'
];

const SORT_OPTIONS = [
  { value: 'popularity', label: 'Popularidad' },
  { value: 'date', label: 'Más reciente' },
  { value: 'rating', label: 'Mejor valorado' },
  { value: 'updated', label: 'Última actualización' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'ONGOING', label: 'En curso' },
  { value: 'COMPLETED', label: 'Completado' },
  { value: 'HIATUS', label: 'Pausado' },
];

interface MangaResult {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverUrl?: string;
  authorName?: string;
  status: string;
  tags: string[];
  totalViews: number;
  rating?: number;
  chapterCount: number;
  highlights?: Array<{ field: string; snippet: string }> | null;
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-[var(--info)]" />
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
      {[...Array(12)].map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="aspect-[3/4] bg-[var(--surface-sunken)] rounded-xl animate-pulse" />
          <div className="h-4 bg-[var(--surface-sunken)] rounded animate-pulse w-3/4" />
          <div className="h-3 bg-[var(--surface-sunken)] rounded animate-pulse w-1/2" />
        </div>
      ))}
    </div>
  );
}

function MangaListItem({ manga }: { manga: MangaResult }) {
  return (
    <Link
      href={`/manga/${manga.slug}`}
      className="flex gap-4 p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)] hover:border-[var(--info)]/30 transition-all group"
    >
      <div className="w-16 h-24 flex-shrink-0 bg-[var(--surface-sunken)] rounded-lg overflow-hidden relative">
        {manga.coverUrl ? (
          <OptimizedImage src={manga.coverUrl} alt={manga.title} fill className="object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-[var(--text-tertiary)]" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
<h2 className="font-bold text-sm group-hover:text-[var(--info)] transition-colors truncate">
  {manga.title}
</h2>
        {manga.authorName && (
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{manga.authorName}</p>
        )}
        <div className="flex flex-wrap gap-1 mt-2">
          {manga.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-2.5 py-1 text-xs bg-[var(--surface-sunken)] rounded text-[var(--text-tertiary)]">
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-2">
          {manga.rating && (
            <span className="text-xs text-[var(--warning)] font-bold">
              {'\u2605'} {manga.rating.toFixed(1)}
            </span>
          )}
          <span className="text-xs text-[var(--text-tertiary)]">{manga.chapterCount} caps</span>
          <span className="text-xs text-[var(--text-tertiary)]">{manga.totalViews.toLocaleString('es')} vistas</span>
          <span className={cn(
            'px-1.5 py-0.5 text-[10px] rounded font-bold',
            manga.status === 'ONGOING' ? 'bg-[var(--success)]/20 text-[var(--success)]' :
            manga.status === 'COMPLETED' ? 'bg-[var(--info)]/20 text-[var(--info)]' :
            'bg-[var(--warning)]/20 text-[var(--warning)]'
          )}>
            {manga.status === 'ONGOING' ? 'En curso' : manga.status === 'COMPLETED' ? 'Completado' : 'Pausado'}
          </span>
        </div>
        {manga.highlights && manga.highlights.length > 0 && (
          <p className="text-xs mt-2 text-[var(--text-tertiary)] line-clamp-1">
            {manga.highlights[0].snippet.replace(/<\/?mark>/g, '')}
          </p>
        )}
      </div>
    </Link>
  );
}

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const query = searchParams.get('q') || '';
  const initialGenres = searchParams.getAll('genres[]');
  const initialStatus = searchParams.get('status') || '';
  const initialSort = searchParams.get('sort') || 'popularity';

  const [results, setResults] = useState<MangaResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [selectedGenres, setSelectedGenres] = useState<string[]>(initialGenres);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [selectedSort, setSelectedSort] = useState(initialSort);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fetchResults = useCallback(async (currentPage: number = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      selectedGenres.forEach(g => params.append('genres[]', g));
      if (selectedStatus) params.set('status', selectedStatus);
      params.set('sort', selectedSort);
      params.set('page', currentPage.toString());
      params.set('limit', '24');

      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();

      if (currentPage === 1) {
        setResults(data.results || []);
      } else {
        setResults(prev => [...prev, ...(data.results || [])]);
      }

      setHasMore(data.pagination?.hasNextPage ?? false);
      setTotal(data.pagination?.total ?? 0);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsLoading(false);
    }
  }, [query, selectedGenres, selectedStatus, selectedSort]);

  useEffect(() => {
    setPage(1);
    fetchResults(1);
  }, [fetchResults]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    selectedGenres.forEach(g => params.append('genres[]', g));
    if (selectedStatus) params.set('status', selectedStatus);
    if (selectedSort !== 'popularity') params.set('sort', selectedSort);

    router.replace(`/search?${params.toString()}`, { scroll: false });
  }, [query, selectedGenres, selectedStatus, selectedSort, router]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
    setPage(1);
  };

  const clearFilters = () => {
    setSelectedGenres([]);
    setSelectedStatus('');
    setSelectedSort('popularity');
    setPage(1);
  };

  const loadMore = () => {
    if (hasMore && !isLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchResults(nextPage);
    }
  };

  const hasActiveFilters = selectedGenres.length > 0 || selectedStatus || selectedSort !== 'popularity';

  return (
    <>
      <div className="pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">
              {query ? `Resultados para "${query}"` : 'Explorar mangas'}
            </h1>

            <div className="max-w-2xl">
              <SearchBar
                placeholder="Buscar mangas, autores..."
                showSuggestions={false}
              />
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-[var(--border)]">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center gap-2',
                showFilters && 'bg-[var(--info)]/10 border-[var(--info)] text-[var(--info)]'
              )}
            >
              <Filter className="w-4 h-4" />
              Filtros
              {hasActiveFilters && (
                <span className="ml-2 px-1.5 py-0.5 bg-[var(--info)] text-[var(--text-inverse)] text-xs rounded-full">
                  {selectedGenres.length + (selectedStatus ? 1 : 0)}
                </span>
              )}
            </Button>

            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              aria-label="Ordenar por"
              className="bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--info)]/30 focus:border-[var(--info)] outline-none"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  Ordenar por: {option.label}
                </option>
              ))}
            </select>

            <div className="flex items-center bg-[var(--surface)] rounded-lg p-1 ml-auto">
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

          {/* Filters Panel */}
          {showFilters && (
            <div className="mb-8 p-6 bg-[var(--surface)]/50 rounded-xl border border-[var(--border)] animate-fade-in-up">
              <div className="mb-6">
                <h2 className="text-sm font-bold text-[var(--text-tertiary)] mb-3">Géneros</h2>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map(genre => (
                    <button
                      key={genre}
                      onClick={() => toggleGenre(genre)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm transition-all font-medium',
                        selectedGenres.includes(genre)
                          ? 'bg-[var(--info)] text-[var(--text-inverse)] shadow-sm'
                          : 'bg-[var(--surface-sunken)] text-[var(--text-primary)] hover:bg-[var(--surface-sunken)]/80'
                      )}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-sm font-bold text-[var(--text-tertiary)] mb-3">Estado</h2>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedStatus(option.value)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm transition-all font-medium',
                        selectedStatus === option.value
                          ? 'bg-[var(--info)] text-[var(--text-inverse)] shadow-sm'
                          : 'bg-[var(--surface-sunken)] text-[var(--text-primary)] hover:bg-[var(--surface-sunken)]/80'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors font-medium"
                >
                  <X className="w-4 h-4" />
                  Limpiar filtros
                </button>
              )}
            </div>
          )}

          {/* Results Count */}
          {!isLoading && (
            <p className="text-[var(--text-tertiary)] text-sm mb-4 font-medium">
              {total} {total === 1 ? 'resultado' : 'resultados'} encontrados
            </p>
          )}

          {/* Skeleton Loading */}
          {isLoading && results.length === 0 && <SkeletonGrid />}

          {/* Results */}
          {!isLoading && results.length > 0 && (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                  {results.map(manga => (
                    <MangaCard
                      key={manga.id}
                      manga={{
                        id: manga.id,
                        title: manga.title,
                        slug: manga.slug,
                        coverUrl: manga.coverUrl,
                        status: manga.status,
                        tags: manga.tags,
                        authorName: manga.authorName,
                        rating: manga.rating,
                        chapterCount: manga.chapterCount,
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {results.map(manga => (
                    <MangaListItem key={manga.id} manga={manga} />
                  ))}
                </div>
              )}

              {/* Load More */}
              {hasMore && (
                <div className="mt-8 text-center">
                  <Button
                    onClick={loadMore}
                    disabled={isLoading}
                    variant="outline"
                    className="min-w-[200px]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Cargando...
                      </>
                    ) : (
                      'Cargar más'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!isLoading && results.length === 0 && (
            <div className="text-center py-20">
              <Search className="w-16 h-16 text-[var(--text-tertiary)] mx-auto mb-4 opacity-30" />
              <h2 className="text-xl font-bold mb-2">
                No se encontraron resultados
              </h2>
              <p className="text-[var(--text-tertiary)]">
                Intenta con otros términos o ajusta los filtros
              </p>
            </div>
          )}
          </div>
    </div>
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SearchPageContent />
    </Suspense>
  );
}