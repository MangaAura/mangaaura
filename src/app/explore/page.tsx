/**
 * Search Page
 *
 * Página de resultados de búsqueda con filtros y vistas grid/list.
 */

'use client';

import { Search, Filter, Grid3X3, List, Loader2, X, BookOpen, ChevronDown, Compass, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, Suspense } from 'react';

import { OptimizedImage } from '@/components/Image/OptimizedImage';
import { MangaCard } from '@/components/MangaCard';
import { SearchBar } from '@/components/Search/SearchBar';
import { Button } from '@/components/ui/Button';
import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer';
import { useT } from '@/i18n/index';
import { CANONICAL_TAGS, ENGLISH_TO_SLUG, SLUG_TO_ENGLISH, KNOWN_GENRE_KEYS, normalizeGenreKey } from '@/constants/genres';
import { cn } from '@/lib/utils';


// SORT_OPTIONS and STATUS_OPTIONS defined inside SearchPageContent using useT()

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
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center" role="status">
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
  const t = useT();
  const displayGenre = (genre: string): string => {
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
        <h3 className="font-bold text-sm group-hover:text-[var(--info)] transition-colors truncate">
          {manga.title}
        </h3>
        {manga.authorName && (
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{manga.authorName}</p>
        )}
        <div className="flex flex-wrap gap-1 mt-2">
          {[...new Set(manga.tags.map(t => normalizeGenreKey(t)))].slice(0, 3).map(tag => (
            <span key={tag} className="px-2.5 py-1 text-xs bg-[var(--surface-sunken)] rounded text-[var(--text-tertiary)]">
              {displayGenre(tag)}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-2">
          {manga.rating && (
            <span className="text-xs text-[var(--warning)] font-bold">
              {'\u2605'} {manga.rating.toFixed(1)}
            </span>
          )}
          <span className="text-xs text-[var(--text-tertiary)]">{t('search.chapterCount', { count: manga.chapterCount })}</span>
          <span className="text-xs text-[var(--text-tertiary)]">{t('search.viewCount', { count: manga.totalViews })}</span>
          <span className={cn(
            'px-1.5 py-0.5 text-[10px] rounded font-bold',
            manga.status === 'ONGOING' ? 'bg-[var(--success)]/20 text-[var(--success)]' :
            manga.status === 'COMPLETED' ? 'bg-[var(--info)]/20 text-[var(--info)]' :
            'bg-[var(--warning)]/20 text-[var(--warning)]'
          )}>
            {manga.status === 'ONGOING' ? t('manga.ongoing') : manga.status === 'COMPLETED' ? t('manga.completed') : t('search.statusHiatus')}
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
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();

  const query = searchParams.get('q') || '';
  const initialGenres = searchParams.getAll('genres[]');
  const initialStatus = searchParams.get('status') || '';
  const initialSort = searchParams.get('sort') || 'popularity';

  const SORT_OPTIONS = [
    { value: 'popularity', label: t('search.sortPopularity') },
    { value: 'date', label: t('search.sortDate') },
    { value: 'rating', label: t('search.sortRating') },
    { value: 'updated', label: t('search.sortUpdated') },
  ];

  const STATUS_OPTIONS = [
    { value: '', label: t('search.statusAll') },
    { value: 'ONGOING', label: t('manga.ongoing') },
    { value: 'COMPLETED', label: t('manga.completed') },
    { value: 'HIATUS', label: t('search.statusHiatus') },
  ];

  const displayGenre = (genre: string): string => {
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

  const [results, setResults] = useState<MangaResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [selectedGenres, setSelectedGenres] = useState<string[]>(initialGenres);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [selectedSort, setSelectedSort] = useState(initialSort);
  const [showFilters, setShowFilters] = useState(initialGenres.length > 0 || !!initialStatus);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [extraTags, setExtraTags] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/browse')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.tags && Array.isArray(data.tags)) {
          const seen = new Set<string>();
          setExtraTags(data.tags.filter((t: string) => {
            const n = normalizeGenreKey(t);
            if (KNOWN_GENRE_KEYS.has(n) || seen.has(n)) return false;
            seen.add(n);
            return true;
          }));
        }
      })
      .catch(() => {});
  }, []);

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

    router.replace(`/explore?${params.toString()}`, { scroll: false });
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

  const hasActiveFilters = selectedGenres.length > 0 || selectedStatus;

  return (
    <>
      <div className="pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <Compass className="text-[var(--primary)]" size={30} />
              {query ? t('search.resultsFor', { query }) : t('search.title')}
            </h1>

            {/* Page tabs */}
            <nav aria-label={t('search.searchNavigation')} className="w-fit mt-6 mb-6">
            <div className="flex items-center gap-1 p-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
              <Link href="/explore" aria-current="page" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] text-white shadow-sm shadow-[var(--primary)]/20">
                <Compass size={16} />
                {t('nav.explore')}
              </Link>
              <Link href="/search_ia" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-sunken)] transition-all">
                <Search size={16} />
                {t('search.iaTitle')}
              </Link>
              <Link href="/search_advanced" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-sunken)] transition-all">
                <SlidersHorizontal size={16} />
                {t('search.advancedTitle')}
              </Link>
            </div>
            </nav>

            <div className="max-w-2xl mb-6">
              <SearchBar
                placeholder={t('search.searchPlaceholder')}
                showSuggestions={false}
              />
            </div>

            {/* Filters Bar */}
            <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-[var(--border)]">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center gap-2 transition-all',
                showFilters && 'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)] shadow-sm'
              )}
            >
              <Filter className="w-4 h-4" />
              {t('search.filterButton')}
              {hasActiveFilters && (
                <span className="ml-2 px-1.5 py-0.5 bg-[var(--primary)] text-[var(--text-inverse)] text-xs rounded-full">
                  {selectedGenres.length + (selectedStatus ? 1 : 0)}
                </span>
              )}
            </Button>

            <div className="relative">
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                aria-label={t('search.sortByLabel')}
                className="appearance-none bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] outline-none cursor-pointer transition-shadow"
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {t('search.sortBy')} {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none" />
            </div>

            <div className="flex items-center bg-[var(--surface)] border border-[var(--border)] rounded-lg p-0.5 ml-auto">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 rounded-md transition-all cursor-pointer',
                  viewMode === 'grid' ? 'bg-[var(--primary)] text-[var(--text-inverse)] shadow-sm' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-sunken)]'
                )}
                title={t('search.gridView')}
                aria-label={t('search.gridView')}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 rounded-md transition-all cursor-pointer',
                  viewMode === 'list' ? 'bg-[var(--primary)] text-[var(--text-inverse)] shadow-sm' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-sunken)]'
                )}
                title={t('search.listView')}
                aria-label={t('search.listView')}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mb-8 p-6 bg-[var(--surface)]/60 backdrop-blur-sm rounded-xl border border-[var(--border)] shadow-sm">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[var(--primary)] to-[var(--accent-purple)]" />
                  <h2 className="text-sm font-bold text-[var(--text-primary)]">{t('manga.genres')}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[...CANONICAL_TAGS, ...extraTags].sort((a, b) => a.localeCompare(b)).map(genre => (
                    <button
                      key={genre}
                      onClick={() => toggleGenre(genre)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
                        selectedGenres.includes(genre)
                          ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] text-white shadow-md shadow-[var(--primary)]/20 scale-105'
                          : 'bg-[var(--surface-sunken)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] hover:border-[var(--primary)]/30 border border-transparent hover:shadow-sm'
                      )}
                    >
                      {displayGenre(genre)}
                    </button>
                  ))}
                  {extraTags.map(genre => (
                    <button
                      key={genre}
                      onClick={() => toggleGenre(genre)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
                        selectedGenres.includes(genre)
                          ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] text-white shadow-md shadow-[var(--primary)]/20 scale-105'
                          : 'bg-[var(--surface-sunken)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] hover:border-[var(--primary)]/30 border border-transparent hover:shadow-sm'
                      )}
                    >
                      {genre.charAt(0).toUpperCase() + genre.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[var(--accent-purple)] to-[var(--accent-blue)]" />
                  <h2 className="text-sm font-bold text-[var(--text-primary)]">{t('manga.status')}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedStatus(option.value)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
                        selectedStatus === option.value
                          ? 'bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-blue)] text-white shadow-md shadow-[var(--accent-purple)]/20 scale-105'
                          : 'bg-[var(--surface-sunken)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] hover:border-[var(--accent-purple)]/30 border border-transparent hover:shadow-sm'
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
                  className="flex items-center gap-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--error)] transition-colors font-medium group"
                >
                  <X className="w-4 h-4 transition-transform group-hover:rotate-90" />
                  {t('search.clearFilters')}
                </button>
              )}
            </div>
          )}

          {/* Results Count */}
          {!isLoading && (hasActiveFilters || query) && (
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px flex-1 bg-gradient-to-r from-[var(--border)] to-transparent" />
              <span className="text-[var(--text-tertiary)] text-sm font-medium px-2">
                {t('search.resultsCount', { count: total })}
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-[var(--border)] to-transparent" />
            </div>
          )}

          {/* Skeleton Loading */}
          {isLoading && results.length === 0 && <SkeletonGrid />}

          {/* Results */}
          {!isLoading && results.length > 0 && (
            <>
              {viewMode === 'grid' ? (
                <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6" staggerDelay={0.04}>
                  {results.map(manga => (
                    <StaggerItem key={manga.id}>
                      <MangaCard
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
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              ) : (
                <StaggerContainer className="flex flex-col gap-3" staggerDelay={0.03}>
                  {results.map(manga => (
                    <StaggerItem key={manga.id}>
                      <MangaListItem manga={manga} />
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              )}

              {/* Load More */}
              {hasMore && (
                <div className="mt-8 text-center">
                  <Button
                    onClick={loadMore}
                    disabled={isLoading}
                    variant="outline"
                    className="min-w-[200px] hover:border-[var(--primary)]/50 transition-all"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        {t('common.loading')}
                      </>
                    ) : (
                      t('search.loadMore')
                    )}
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!isLoading && results.length === 0 && (
            <div className="text-center py-20">
              <div className="relative inline-block mb-6">
                <Search className="w-16 h-16 text-[var(--text-tertiary)] opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/10 to-[var(--accent-purple)]/10 rounded-full blur-xl" />
              </div>
              <h2 className="text-xl font-bold mb-2">
                {t('common.noResults')}
              </h2>
              <p className="text-[var(--text-tertiary)] max-w-md mx-auto">
                {t('search.noResultsDescription')}
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