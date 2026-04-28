/**
 * Search Page
 * 
 * Página de resultados de búsqueda.
 */

'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Filter, Grid3X3, List, Loader2, X } from 'lucide-react';
import { SearchBar } from '@/components/Search/SearchBar';
import { MangaCard } from '@/components/MangaCard';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import Navbar from '@/components/Layout/Navbar';

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
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
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
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  
  const [selectedGenres, setSelectedGenres] = useState<string[]>(initialGenres);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [selectedSort, setSelectedSort] = useState(initialSort);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch results
  const fetchResults = useCallback(async (currentPage: number = 1) => {
    if (!query && selectedGenres.length === 0 && !selectedStatus) {
      setResults([]);
      return;
    }

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
        setResults(data.results);
      } else {
        setResults(prev => [...prev, ...data.results]);
      }
      
      setHasMore(data.pagination.hasNextPage);
      setTotal(data.pagination.total);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsLoading(false);
    }
  }, [query, selectedGenres, selectedStatus, selectedSort]);

  // Fetch on mount and when filters change
  useEffect(() => {
    setPage(1);
    fetchResults(1);
  }, [fetchResults]);

  // Update URL when filters change
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
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      
      <div className="pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4">
              {query ? `Resultados para "${query}"` : 'Explorar mangas'}
            </h1>
            
            {/* Search Bar */}
            <div className="max-w-2xl">
              <SearchBar 
                placeholder="Buscar mangas, autores..." 
                showSuggestions={false}
              />
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-[var(--border-strong)]">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center gap-2',
                showFilters && 'bg-[var(--primary)]/20 border-blue-500'
              )}
            >
              <Filter className="w-4 h-4" />
              Filtros
              {hasActiveFilters && (
                <span className="ml-2 px-1.5 py-0.5 bg-[var(--primary)] text-[var(--text-primary)] text-xs rounded-full">
                  {selectedGenres.length + (selectedStatus ? 1 : 0)}
                </span>
              )}
            </Button>

            {/* Sort Dropdown */}
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  Ordenar por: {option.label}
                </option>
              ))}
            </select>

            {/* View Toggle */}
            <div className="flex items-center bg-[var(--surface)] rounded-lg p-1 ml-auto">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 rounded transition-colors',
                  viewMode === 'grid' ? 'bg-[var(--surface-sunken)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                )}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 rounded transition-colors',
                  viewMode === 'list' ? 'bg-[var(--surface-sunken)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mb-8 p-6 bg-[var(--surface)]/50 rounded-xl border border-[var(--border)]">
              {/* Genres */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">Géneros</h3>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map(genre => (
                    <button
                      key={genre}
                      onClick={() => toggleGenre(genre)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm transition-colors',
                        selectedGenres.includes(genre)
                          ? 'bg-[var(--primary)] text-[var(--text-primary)]'
                          : 'bg-[var(--surface-sunken)] text-[var(--text-primary)] hover:bg-slate-600'
                      )}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">Estado</h3>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedStatus(option.value)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm transition-colors',
                        selectedStatus === option.value
                          ? 'bg-[var(--primary)] text-[var(--text-primary)]'
                          : 'bg-[var(--surface-sunken)] text-[var(--text-primary)] hover:bg-slate-600'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <X className="w-4 h-4" />
                  Limpiar filtros
                </button>
              )}
            </div>
          )}

          {/* Results Count */}
          {!isLoading && (
            <p className="text-[var(--text-secondary)] mb-4">
              {total} {total === 1 ? 'resultado' : 'resultados'} encontrados
            </p>
          )}

          {/* Results Grid */}
          {results.length > 0 ? (
            <>
              <div className={cn(
                'grid gap-6',
                viewMode === 'grid' 
                  ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                  : 'grid-cols-1'
              )}>
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
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Cargar más
                  </Button>
                </div>
              )}
            </>
          ) : (
            /* Empty State */
            <div className="text-center py-16">
              <Search className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                No se encontraron resultados
              </h3>
              <p className="text-[var(--text-secondary)]">
                Intenta con otros términos o ajusta los filtros
              </p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && results.length === 0 && (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
            </div>
          )}
      </div>
    </div>
  </div>
);
}

export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SearchPageContent />
    </Suspense>
  );
}
