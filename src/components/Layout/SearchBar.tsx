'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Search, Loader2, BookOpen, Star, Eye, Sparkles, ArrowRight, Clock, X, Trash2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';

import { GENRE_DISPLAY } from '@/constants/genres';
import { useDebounce } from '@/hooks/useDebounce';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { useT } from '@/i18n';
import { extractApiError } from '@/lib/extract-api-error';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
}

interface MangaSuggestion {
  id: string;
  title: string;
  slug: string;
  coverUrl?: string | null;
  authorName?: string | null;
  status: string;
  rating?: number | null;
  chapterCount: number;
  totalViews: number;
}

export function SearchBar({ onSearch, placeholder: placeholderProp, className }: SearchBarProps) {
  const t = useT();
  const router = useRouter();
  const placeholder = placeholderProp ?? t('common.search');
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<MangaSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [, setHasFetched] = useState(false);

  const [isFocused, setIsFocused] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const debouncedQuery = useDebounce(query.trim(), 300);

  const { recentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches } = useRecentSearches();

  // Fetch suggestions when debounced query changes
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      queueMicrotask(() => {
        setSuggestions([]);
        setIsOpen(false);
        setHasFetched(false);
        setSelectedIndex(-1);
      });
      return;
    }

    // Open dropdown immediately when query becomes valid
    queueMicrotask(() => setIsOpen(true));

    // Abort previous request
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setIsFetching(true);
    setHasFetched(true);

    let mounted = true;

    const params = new URLSearchParams({ q: debouncedQuery, limit: '6', sort: 'popularity' });

    fetch(`/api/search?${params.toString()}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          const { message } = await extractApiError(res);
          throw new Error(message);
        }
        return res.json();
      })
      .then((data) => {
        if (!mounted) return;
        const results = (data.results || data.mangas || []) as MangaSuggestion[];
        setSuggestions(results.slice(0, 6));
        setSelectedIndex(-1);
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setSuggestions([]);
        setValidationError(t('search.errorConnection'));
      })
      .finally(() => {
        if (mounted) setIsFetching(false);
      });

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [debouncedQuery]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setIsFocused(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute IA genre suggestions from the current query
  const iaSuggestions = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) return [];
    const q = debouncedQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return Object.keys(GENRE_DISPLAY).filter((slug) => {
      const label = t(`genres.${slug}`);
      const labelMatch = label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q);
      return slug.includes(q) || labelMatch;
    }).slice(0, 4);
  }, [debouncedQuery, t]);

  const showIaSuggestions = iaSuggestions.length > 0;
  const showMangaResults = suggestions.length > 0;
  const showRecentSearches = isFocused && query.length === 0 && recentSearches.length > 0;
  // Dropdown: either recent searches (empty input, focused) or autocomplete results (2+ chars query)
  // Keep dropdown open during debounce gap when user transitions from recent searches to typing
  const showDropdown = showRecentSearches || (isOpen && debouncedQuery.length >= 2) || (isFocused && query.trim().length >= 2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      addRecentSearch(trimmed);
      setIsOpen(false);
      setSuggestions([]);
      setSelectedIndex(-1);
      onSearch?.(trimmed);
    }
  };

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // ── Recent searches navigation (empty input, focused) ──────
      if (showRecentSearches) {
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            setSelectedIndex((prev) => (prev < recentSearches.length - 1 ? prev + 1 : 0));
            break;
          case 'ArrowUp':
            e.preventDefault();
            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : recentSearches.length - 1));
            break;
          case 'Enter':
            e.preventDefault();
            if (selectedIndex >= 0 && selectedIndex < recentSearches.length) {
              const searchQuery = recentSearches[selectedIndex];
              setIsOpen(false);
              setSuggestions([]);
              setQuery('');
              setSelectedIndex(-1);
              onSearch?.(searchQuery);
            }
            break;
          case 'Escape':
            e.preventDefault();
            setIsOpen(false);
            setIsFocused(false);
            setSelectedIndex(-1);
            inputRef.current?.blur();
            break;
        }
        return;
      }

      // ── Standard autocomplete navigation ────────────────────
      if (!isOpen || suggestions.length === 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            const selected = suggestions[selectedIndex];
            setIsOpen(false);
            setQuery('');
            setSuggestions([]);
            router.push(`/manga/${selected.slug}`);
          } else {
            handleSubmit(e as unknown as React.FormEvent);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    },
    [isOpen, suggestions, selectedIndex, router, showRecentSearches, recentSearches, onSearch]
  );

  const handleSuggestionClick = (slug: string) => {
    setIsOpen(false);
    setQuery('');
    setSuggestions([]);
    setSelectedIndex(-1);
    router.push(`/manga/${slug}`);
  };

  // Highlight matching text in title/author
  const highlight = (text: string, queryStr: string) => {
    if (!queryStr) return text;
    const escaped = queryStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === queryStr.toLowerCase() ? (
        <mark key={i} className="bg-[var(--primary)]/20 text-[var(--primary)] rounded-sm px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const statusBadge = (status: string) => {
    const base = 'px-1.5 py-0.5 text-[10px] font-bold rounded-md shrink-0';
    if (status === 'ONGOING') return <span className={`${base} bg-emerald-500/15 text-emerald-400`}>{t('manga.ongoing')}</span>;
    if (status === 'COMPLETED') return <span className={`${base} bg-blue-500/15 text-blue-400`}>{t('manga.completed')}</span>;
    return <span className={`${base} bg-amber-500/15 text-amber-400`}>{t('search.statusHiatus')}</span>;
  };



  // Reset selectedIndex when query changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIndex(-1);
  }, [query]);

  return (
    <div className={'relative ' + (className || '')}>
      <form onSubmit={handleSubmit} role="search">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] pointer-events-none z-10"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          name="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setValidationError(null);
            if (!e.target.value) {
              setSuggestions([]);
              setIsOpen(false);
              setHasFetched(false);
            }
          }}
          onFocus={() => {
            setIsFocused(true);
            setValidationError(null);
            if (debouncedQuery.length >= 2) {
              setIsOpen(true);
            }
          }}
          onBlur={() => {
            // Delay blur so click on dropdown items registers before closing
            setTimeout(() => setIsFocused(false), 150);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={t('common.search')}
          aria-expanded={showDropdown}
          aria-controls="search-suggestions"
          aria-autocomplete="list"
          aria-activedescendant={selectedIndex >= 0 ? (showRecentSearches ? `recent-search-${selectedIndex}` : `suggestion-${selectedIndex}`) : undefined}
          autoComplete="off"
          className="w-full pl-9 pr-10 py-2 bg-[var(--surface)]/50 border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] transition-all"
        />
        {isFetching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--primary)] animate-spin pointer-events-none" />
        )}
      </form>

      {/* Inline validation error */}
      <AnimatePresence>
        {validationError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1.5 mt-1.5 px-1"
            role="alert"
          >
            <AlertCircle className="w-3.5 h-3.5 text-[var(--error)] shrink-0" />
            <span className="text-xs text-[var(--error)]">{validationError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestion dropdown — Recent searches OR Autocomplete results */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          id="search-suggestions"
          className="absolute top-full left-0 right-0 mt-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl shadow-black/15 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* ── Recent searches (empty input, focused) ─────────────── */}
          {showRecentSearches && (
            <>
              <div className="px-3 py-2 text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  {t('search.recentSearches')}
                </span>
                <button
                  type="button"
                  onClick={clearRecentSearches}
                  className="flex items-center gap-1 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--error)] transition-colors"
                  aria-label={t('search.clearRecent')}
                >
                  <Trash2 className="w-3 h-3" />
                  {t('search.clear')}
                </button>
              </div>
              <div className="py-1" role="listbox" aria-label={t('common.searchSuggestions')}>
                <AnimatePresence initial={false}>
                {recentSearches.map((searchQuery, index) => (
                  <motion.div
                    key={searchQuery}
                    layout
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12, transition: { duration: 0.15 } }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="flex items-center group"
                  >
                    <button
                      type="button"
                      id={`recent-search-${index}`}
                      role="option"
                      aria-selected={index === selectedIndex}
                      onClick={() => {
                        setIsOpen(false);
                        setSuggestions([]);
                        setSelectedIndex(-1);
                        onSearch?.(searchQuery);
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={
                        'flex-1 flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-primary)] transition-colors text-left min-w-0' +
                        (index === selectedIndex
                          ? ' bg-[var(--primary)]/10'
                          : ' hover:bg-[var(--surface-sunken)]')
                      }
                    >
                      <Clock className="w-4 h-4 text-[var(--text-tertiary)] shrink-0" />
                      <span className="truncate">{searchQuery}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRecentSearch(searchQuery);
                      }}
                      className="px-2 py-2 opacity-0 group-hover:opacity-100 text-[var(--text-tertiary)] hover:text-[var(--error)] transition-all"
                      aria-label={`${t('search.removeRecent')} ${searchQuery}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}

          {/* ── Autocomplete content (when query has 2+ chars) ─────── */}
          {!showRecentSearches && (
            <>
              {/* Empty state — only when no IA suggestions and no manga results */}
              {!showIaSuggestions && !showMangaResults && (
                <div className="px-4 py-6 text-center">
                  <Search className="w-8 h-8 mx-auto mb-2 text-[var(--text-tertiary)] opacity-40" aria-hidden="true" />
                  <p className="text-sm text-[var(--text-secondary)]">{t('common.noResults')}</p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    {t('search.pressEnterToSearch')}
                  </p>
                </div>
              )}

              {/* IA Genre Suggestions — appear independently of manga results */}
              {showIaSuggestions && (
                <div className="border-b border-[var(--border)]/50">
                  <div className="px-3 py-2 text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-[var(--accent-purple)]" />
                    {t('search.iaTitle')}
                  </div>
                  <div className="flex flex-wrap gap-1.5 px-3 pb-2.5">
                    {iaSuggestions.map((slug) => {
                      const GenreIcon = GENRE_DISPLAY[slug]?.icon || Sparkles;
                      return (
                        <Link
                          key={slug}
                          href={`/search_ia?tag=${encodeURIComponent(slug)}`}
                          onClick={() => {
                            setIsOpen(false);
                            setQuery('');
                            setSuggestions([]);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gradient-to-r from-[var(--accent-purple)]/10 to-[var(--primary)]/10 border border-[var(--accent-purple)]/20 text-[var(--accent-purple)] hover:from-[var(--accent-purple)]/20 hover:to-[var(--primary)]/20 hover:border-[var(--accent-purple)]/40 transition-all duration-200"
                        >
                          <GenreIcon className="w-3 h-3" />
                          {t(`genres.${slug}`)}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Manga suggestions */}
              {showMangaResults && (
                <>
                  <div className="px-3 py-2 text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider border-b border-[var(--border)]/50">
                    {t('common.suggestions')}
                  </div>
                  <div className="max-h-[300px] overflow-y-auto py-1" role="listbox" aria-label={t('common.searchSuggestions')}>
                    {suggestions.map((manga, index) => (
                      <button
                        key={manga.id}
                        id={`suggestion-${index}`}
                        role="option"
                        aria-selected={index === selectedIndex}
                        type="button"
                        onClick={() => handleSuggestionClick(manga.slug)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={
                          'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors duration-100 cursor-pointer border-b border-[var(--border)]/30 last:border-b-0' +
                          (index === selectedIndex
                            ? ' bg-[var(--primary)]/10'
                            : ' hover:bg-[var(--surface-sunken)]')
                        }
                      >
                        {/* Cover thumbnail */}
                        <div className="w-9 h-[54px] flex-shrink-0 bg-[var(--surface-sunken)] rounded-md overflow-hidden relative shadow-xs">
                          {manga.coverUrl ? (
            <img
              src={manga.coverUrl}
              alt={manga.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="w-4 h-4 text-[var(--text-tertiary)]" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
                              {highlight(manga.title, debouncedQuery)}
                            </span>
                            {statusBadge(manga.status)}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            {manga.authorName && (
                              <span className="text-[11px] text-[var(--text-tertiary)] truncate">
                                {highlight(manga.authorName, debouncedQuery)}
                              </span>
                            )}
                            {manga.rating && manga.rating > 0 && (
                              <span className="flex items-center gap-1 text-[11px] text-[var(--warning)] font-semibold shrink-0">
                                <Star className="w-3 h-3 fill-[var(--warning)]" />
                                {manga.rating.toFixed(1)}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-[11px] text-[var(--text-tertiary)] shrink-0">
                              <Eye className="w-3 h-3" />
                              {manga.totalViews >= 1_000_000
                                ? `${(manga.totalViews / 1_000_000).toFixed(1)}M`
                                : manga.totalViews >= 1_000
                                  ? `${(manga.totalViews / 1_000).toFixed(1)}K`
                                  : manga.totalViews}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Footer actions — show when there's any autocomplete content */}
              {(showIaSuggestions || showMangaResults) && (
                <div className="border-t border-[var(--border)]/50 divide-y divide-[var(--border)]/30">
                  {/* Try IA Search */}
                  <Link
                    href={`/search_ia?q=${encodeURIComponent(debouncedQuery)}`}
                    onClick={() => {
                      setIsOpen(false);
                      setQuery('');
                      setSuggestions([]);
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium bg-gradient-to-r from-[var(--accent-purple)]/5 to-[var(--primary)]/5 text-[var(--accent-purple)] hover:from-[var(--accent-purple)]/10 hover:to-[var(--primary)]/10 transition-colors group"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t('browse.semanticSearch')}</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>

                  {/* View all results */}
                  <Link
                    href={`/explore?q=${encodeURIComponent(debouncedQuery)}`}
                    onClick={() => {
                      setIsOpen(false);
                      setQuery('');
                      setSuggestions([]);
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-colors"
                  >
                    <Search className="w-3.5 h-3.5" />
                    {t('search.viewAllResults')}
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
