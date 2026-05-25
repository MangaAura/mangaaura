'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, Star, BookOpen, SlidersHorizontal, ChevronDown, AlertTriangle, Compass, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useLayoutEffect, useRef } from 'react';


import { OptimizedImage } from '@/components/Image/OptimizedImage';
import { CANONICAL_TAGS, ENGLISH_TO_SLUG, SLUG_TO_ENGLISH, normalizeGenreKey } from '@/constants/genres';
import { EmptySearch } from '@/components/ui/EmptyState';
import { useT } from '@/i18n';

const SORT_MAP: Record<string, string> = {
  popularity: 'popularity',
  rating: 'rating',
  newest: 'date',
  chapters: 'popularity',
};

interface MangaResult {
  id: string;
  slug: string;
  title: string;
  authorName: string | null;
  authorUsername: string | null;
  coverUrl: string | null;
  rating: number;
  status: string;
  tags: string[];
  chapterCount: number;
  totalViews: number;
  description?: string | null;
}

export default function AdvancedSearchPage() {
  const t = useT();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('popularity');
  const [showFilters, setShowFilters] = useState(true);
  const [results, setResults] = useState<MangaResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryRef = useRef(query);
  const genresRef = useRef(selectedGenres);
  const statusRef = useRef(selectedStatus);
  const sortRef = useRef(sortBy);
  const pageRef = useRef(page);

  async function doSearch() {
    setLoading(true);
    setSearchError(null);
    try {
      const q = queryRef.current;
      const genres = genresRef.current;
      const status = statusRef.current;
      const sort = sortRef.current;
      const pg = pageRef.current;

      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (genres.length > 0) genres.forEach(g => params.append('genres[]', g));
      if (status) params.set('status', status.toUpperCase());
      params.set('sort', SORT_MAP[sort] || 'popularity');
      params.set('page', String(pg));
      params.set('limit', '24');

      const res = await fetch(`/api/search?${params}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.mangas || []);
        setTotal(data.pagination?.total || 0);
      } else {
        setResults([]);
        setTotal(0);
        setSearchError('Error al buscar. Int├®ntalo de nuevo.');
      }
    } catch {
      setResults([]);
      setTotal(0);
      setSearchError('Error de conexi├│n al buscar.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    doSearch();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [query, selectedGenres, selectedStatus, sortBy]);

  useLayoutEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLoading(true);
    timerRef.current = setTimeout(doSearch, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [page, query, selectedGenres, selectedStatus, sortBy]);

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

  const toggleGenre = (genre: string) => {
    const normalized = CANONICAL_TAGS.find(g => normalizeGenreKey(g) === normalizeGenreKey(genre)) || genre;
    setSelectedGenres(prev => prev.includes(normalized) ? prev.filter(g => g !== normalized) : [...prev, normalized]);
  };

  // Skeleton loader matching the result card layout
  function SearchResultsSkeleton(props: React.HTMLAttributes<HTMLDivElement>) {
    return (
      <div {...props} className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 ${props.className || ''}`.trim()} aria-hidden="true">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={`skel-${i}`} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden h-full flex flex-col animate-pulse">
            <div className="relative aspect-[16/9] bg-[var(--surface-elevated)]">
              <div className="absolute top-3 left-3 w-16 h-5 bg-[var(--surface-sunken)] rounded-full" />
              <div className="absolute top-3 right-3 w-12 h-5 bg-[var(--surface-sunken)] rounded-lg" />
            </div>
            <div className="p-4 flex flex-col flex-1">
              <div className="h-4 bg-[var(--surface-elevated)] rounded w-3/4 mb-1" />
              <div className="h-3 bg-[var(--surface-elevated)] rounded w-1/2 mb-3" />
              <div className="flex gap-1.5 mb-auto">
                <div className="h-5 w-14 bg-[var(--surface-elevated)] rounded-full" />
                <div className="h-5 w-16 bg-[var(--surface-elevated)] rounded-full" />
                <div className="h-5 w-12 bg-[var(--surface-elevated)] rounded-full" />
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border)]">
                <div className="h-3 w-20 bg-[var(--surface-elevated)] rounded" />
                <div className="h-3 w-16 bg-[var(--surface-elevated)] rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const mangaStatusLabel = (status: string) => {
    switch (status) {
      case 'ONGOING': return t('manga.ongoing');
      case 'COMPLETED': return t('manga.completed');
      case 'HIATUS': return t('search.statusHiatus');
      default: return status;
    }
  };

  return (
    <>
    {/* Search Header */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <Search className="text-[var(--primary)]" size={30} /> {t('search.advancedTitle')}
        </h1>
        {/* Page tabs */}
        <nav aria-label={t('search.searchNavigation')} className="w-fit mt-6 mb-6">
        <div className="flex items-center gap-1 p-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
          <Link href="/explore" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-sunken)] transition-all">
            <Compass size={16} />
            {t('nav.explore')}
          </Link>
          <Link href="/search_ia" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-sunken)] transition-all">
            <Sparkles size={16} />
            {t('search.iaTitle')}
          </Link>
          <Link href="/search_advanced" aria-current="page" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] text-white shadow-sm shadow-[var(--primary)]/20">
            <Search size={16} />
            {t('search.advancedTitle')}
          </Link>
        </div>
        </nav>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={20} />
            <input
                type="text"
                name="search-advanced"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t('search.searchPlaceholder')}
                aria-label={t('search.searchPlaceholder')}
                className="w-full pl-12 pr-4 py-4 bg-[var(--surface-sunken)] border border-[var(--border)] focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)] rounded-2xl outline-none transition-all text-base shadow-inner"
                autoFocus
              />
              {query && (
                <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">
                  <X size={18} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-5 py-4 rounded-2xl border font-bold transition-all shadow-sm cursor-pointer ${showFilters ? 'bg-[var(--accent-blue)] text-[var(--text-inverse)] border-[var(--accent-blue)]' : 'bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--surface-sunken)]'}`}
            >
              <SlidersHorizontal size={20} /> {t('search.filterButton')} {selectedGenres.length > 0 && <span className="bg-[var(--text-inverse)]/20 text-[var(--text-inverse)] text-xs px-1.5 py-0.5 rounded-full">{selectedGenres.length}</span>}
            </button>
          </div>
        </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 flex flex-col lg:flex-row gap-8">

        {/* Filters Sidebar */}
        {showFilters && (
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm sticky top-24">
              <div className="flex justify-between items-center mb-6 border-b border-[var(--border)] pb-4">
                <h2 className="font-bold text-lg flex items-center gap-2"><Filter size={18} /> {t('search.filterButton')}</h2>
                {(selectedGenres.length > 0 || selectedStatus) && (
                  <button onClick={() => { setSelectedGenres([]); setSelectedStatus(''); }} className="text-xs text-[var(--error)] font-semibold hover:underline cursor-pointer">{t('search.clearFilters')}</button>
                )}
              </div>

              {/* Status Filter */}
              <div className="mb-6">
                <h3 className="font-bold text-sm text-[var(--text-muted)] uppercase tracking-wider mb-3">{t('manga.status')}</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'Ongoing', label: t('manga.ongoing') },
                    { value: 'Completed', label: t('manga.completed') },
                    { value: 'Hiatus', label: t('search.statusHiatus') },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedStatus(selectedStatus === opt.value ? '' : opt.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${selectedStatus === opt.value ? 'bg-[var(--accent-blue)] text-[var(--text-inverse)] border-[var(--accent-blue)]' : 'bg-[var(--surface-sunken)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort By */}
              <div className="mb-6">
                <h3 className="font-bold text-sm text-[var(--text-muted)] uppercase tracking-wider mb-3">{t('search.sortByLabel')}</h3>
                <div className="relative">
                  <select
                    name="sort-by"
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="w-full appearance-none bg-[var(--surface-sunken)] border border-[var(--border)] text-sm font-semibold py-2.5 pl-3 pr-8 rounded-xl outline-none focus:border-[var(--accent-blue)] transition-colors"
                    aria-label={t('search.sortByLabel')}
                  >
                    <option value="popularity">{t('search.sortPopularity')}</option>
                    <option value="rating">{t('search.sortRating')}</option>
                    <option value="newest">{t('search.sortDate')}</option>
                    <option value="chapters">{t('search.sortChapters')}</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                </div>
              </div>

              {/* Genre Pills */}
              <div>
                <h3 className="font-bold text-sm text-[var(--text-muted)] uppercase tracking-wider mb-3">{t('search.genresTags')}</h3>
                <div className="flex flex-wrap gap-2">
                  {CANONICAL_TAGS.map(genre => (
                    <button
                      key={genre}
                      onClick={() => toggleGenre(genre)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${selectedGenres.includes(genre) ? 'bg-[var(--accent-purple)] text-[var(--text-inverse)] border-[var(--accent-purple)]' : 'bg-[var(--surface-sunken)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent-purple)]/50'}`}
                    >
                      {displayGenre(genre)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Results Grid */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <p className="text-[var(--text-muted)] font-semibold text-sm min-h-[1.75rem] flex items-center">
              {loading ? null : (query || selectedGenres.length > 0 || selectedStatus) ? (
                <span className="text-[var(--text-primary)] font-black text-xl">{t('search.resultsCount', { count: total })}</span>
              ) : null}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <SearchResultsSkeleton aria-busy="true" />
              </motion.div>
          ) : searchError ? (
              <motion.div key="error"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-16 text-center">
        <AlertTriangle className="w-12 h-12 text-[var(--warning)] mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">{searchError}</h3>
        <button onClick={doSearch} className="text-[var(--accent-blue)] hover:underline font-semibold cursor-pointer">{t('common.retry')}</button>
      </div>
              </motion.div>
    ) : results.length === 0 ? (
        <motion.div key="empty"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <EmptySearch query={query} />
        </motion.div>
          ) : (
              <motion.div key="results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {results.map((manga) => (
                <Link href={`/manga/${manga.slug}`} key={manga.id} className="group">
                  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-[var(--accent-blue)] transition-all duration-200 hover:-translate-y-0.5 h-full flex flex-col">
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <OptimizedImage
                        src={manga.coverUrl || '/placeholder-manga.svg'}
                        alt={manga.title}
                        fill
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-[var(--warning)] text-xs font-black px-2 py-1 rounded-lg flex items-center gap-1">
                        <Star size={12} fill="currentColor" /> {manga.rating?.toFixed(1) ?? 'ÔÇö'}
                      </div>
                      <div className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full ${manga.status === 'COMPLETED' ? 'bg-[var(--success)]/80 text-[var(--text-inverse)]' : manga.status === 'ONGOING' ? 'bg-[var(--accent-blue)]/80 text-[var(--text-inverse)]' : 'bg-[var(--warning)]/80 text-[var(--text-inverse)]'}`}>
                        {mangaStatusLabel(manga.status)}
                      </div>
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-bold text-base mb-1 group-hover:text-[var(--accent-blue)] transition-colors line-clamp-1">{manga.title}</h3>
                      <p className="text-xs text-[var(--text-muted)] mb-3">{t('search.by')}
                        {manga.authorUsername ? (
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/user/${manga.authorUsername}`); }}
                            className="font-semibold text-[var(--accent-purple)] hover:text-[var(--primary)] hover:underline transition-colors cursor-pointer"
                          >
                            {manga.authorName || t('search.unknown')}
                          </button>
                        ) : (
                          <span className="font-semibold text-[var(--accent-purple)]">{manga.authorName || t('search.unknown')}</span>
                        )}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mb-auto">
                        {manga.tags?.slice(0, 3).map((genre: string) => (
                          <span key={genre} onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const normalized = CANONICAL_TAGS.find(g => normalizeGenreKey(g) === normalizeGenreKey(genre)) || genre;
                            setSelectedGenres(prev => {
                              const next = prev.includes(normalized) ? prev.filter(g => g !== normalized) : [...prev, normalized];
                              genresRef.current = next;
                              return next;
                            });
                            if (timerRef.current) clearTimeout(timerRef.current);
                            doSearch();
                          }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleGenre(genre); } }} role="button" tabIndex={0} className="text-[10px] font-bold bg-[var(--surface-sunken)] border border-[var(--border)] hover:border-[var(--accent-purple)] hover:bg-[var(--accent-purple)]/10 text-[var(--text-muted)] hover:text-[var(--accent-purple)] px-2 py-0.5 rounded-full cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1">
                            {displayGenre(genre)}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border)]">
                        <div className="flex items-center gap-1 text-xs font-semibold text-[var(--text-muted)]">
                          <BookOpen size={14} /> {t('search.chapterCount', { count: manga.chapterCount })}
                        </div>
                        <span className="text-xs font-bold text-[var(--accent-blue)] group-hover:underline">{t('search.viewDetails')}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
              </motion.div>
          )}
          </AnimatePresence>

          {/* Pagination */}
          {!loading && total > 24 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm font-bold disabled:opacity-30 cursor-pointer hover:bg-[var(--surface-sunken)] transition-colors"
              >
                {t('common.previous')}
              </button>
              <span className="px-4 py-2 text-sm text-[var(--text-muted)]">{t('search.page', { page })}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={results.length < 24}
                className="px-4 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm font-bold disabled:opacity-30 cursor-pointer hover:bg-[var(--surface-sunken)] transition-colors"
              >
                {t('common.next')}
              </button>
      </div>
    )}
      </div>
    </div>
    </>
  );
}
