'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, Search, Hash, BookOpen, Eye, Star, AlertTriangle, TrendingUp, Award, Clock, ArrowUp, Compass } from 'lucide-react';
import Link from 'next/link';
import React, { useState, useEffect, useCallback } from 'react';

import { OptimizedImage } from '@/components/Image/OptimizedImage';
import { EmptyState } from '@/components/ui/EmptyState';
import { normalizeGenreKey, ENGLISH_TO_SLUG, SLUG_TO_ENGLISH } from '@/constants/genres';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useT } from '@/i18n';

interface MangaItem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverUrl: string | null;
  status: string;
  tags: string[];
  authorName: string;
  rating: number | null;
  totalViews: number;
  chapterCount: number;
  libraryCount: number;
  createdAt: string;
  updatedAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  ONGOING: 'bg-emerald-500/90 text-white border-emerald-400/30 shadow-emerald-500/20',
  COMPLETED: 'bg-sky-500/90 text-white border-sky-400/30 shadow-sky-500/20',
  HIATUS: 'bg-amber-500/90 text-white border-amber-400/30 shadow-amber-500/20',
};

const SORT_ICONS: Record<string, React.ReactNode> = {
  popular: <TrendingUp size={14} />,
  rating: <Award size={14} />,
  newest: <Clock size={14} />,
  title: <ArrowUp size={14} />,
};

export default function BrowseClient() {
  const t = useT();
  const { handleError } = useErrorHandler();
  const shouldReduceMotion = useReducedMotion();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mangas, setMangas] = useState<MangaItem[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sort, setSort] = useState<string>('popular');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchMangas = useCallback(async (q?: string, tag?: string | null, s?: string, p?: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (tag) params.set('tag', tag);
      if (s) params.set('sort', s);
      params.set('page', String(p || 1));
      params.set('limit', '20');

      const res = await fetch(`/api/browse?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMangas(data.mangas);
        setAvailableTags(data.tags || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (err) {
      handleError(err);
      setError(t('browse.error'));
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, []);

   
  useEffect(() => {
    queueMicrotask(() => { void fetchMangas(undefined, selectedTag, sort, 1); });
  }, [selectedTag, sort, fetchMangas]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setPage(1);
    fetchMangas(searchQuery, selectedTag, sort, 1);
  };

  const handleTagClick = (tag: string) => {
    setSelectedTag(prev => prev === tag ? null : tag);
    setPage(1);
  };

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <Sparkles className="text-[var(--primary)]" size={30} />
          {t('browse.title')}
        </h1>

        {/* Page tabs */}
        <nav aria-label={t('search.searchNavigation')} className="w-fit mt-6 mb-6">
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex items-center gap-1 p-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl"
        >
          <Link href="/explore" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-sunken)] transition-all">
            <Compass size={16} />
            {t('nav.explore')}
          </Link>
          <Link href="/search_ia" aria-current="page" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] text-white shadow-sm shadow-[var(--primary)]/20">
            <Sparkles size={16} />
            {t('search.iaTitle')}
          </Link>
          <Link href="/search_advanced" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-sunken)] transition-all">
            <Search size={16} />
            {t('search.advancedTitle')}
          </Link>
        </motion.div>
        </nav>

      {/* Hero Search */}
      <motion.section
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative rounded-2xl p-[2px] overflow-hidden mt-6"
        style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent-purple), var(--primary))' }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)]/20 via-transparent to-[var(--accent-purple)]/20 animate-pulse" />
        <div className="relative bg-[var(--surface)] rounded-2xl p-8 md:p-12">
          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[var(--primary-subtle)] to-[var(--accent-purple)]/10 border border-[var(--primary)]/20 text-xs font-bold uppercase tracking-wider"
            >
              <Sparkles size={14} className="text-[var(--accent-purple)]" />
              <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] bg-clip-text text-transparent">IA</span>
            </motion.div>
            <h2 className="text-2xl md:text-3xl font-bold">{t('browse.semanticSearch')}</h2>
            <p className="text-[var(--text-secondary)] text-base max-w-lg mx-auto leading-relaxed">
              {t('browse.semanticSearchDesc')}
            </p>

            <form onSubmit={handleSearch} className="relative max-w-xl mx-auto">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Search className="text-[var(--text-muted)]" size={20} />
              </div>
              <input
                type="text"
                name="search-ia"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('browse.searchPlaceholder')}
                aria-label={t('browse.searchAriaLabel')}
                className="w-full pl-12 pr-40 py-4 bg-[var(--background)] border-2 border-[var(--border)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/15 rounded-xl outline-none transition-all text-base shadow-inner"
              />
              <button
                type="submit"
                className="absolute inset-y-2 right-2 bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] hover:from-[var(--primary-hover)] hover:to-[var(--accent-purple-hover)] text-[var(--text-inverse)] px-6 rounded-lg font-bold transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg hover:shadow-[var(--primary)]/20"
              >
                {isSearching ? (
                  <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t('browse.searching')}</span>
                ) : t('common.search')}
              </button>
            </form>
          </div>

          <div className="absolute -top-20 -right-20 w-80 h-80 bg-[var(--accent-purple)]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[var(--primary)]/5 rounded-full blur-3xl pointer-events-none" />
        </div>
      </motion.section>

      {/* Sort Bar */}
      <motion.div
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="flex flex-wrap items-center gap-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1.5 shadow-sm mt-6"
      >
        <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider px-3 mr-1">{t('browse.sortBy')}</span>
        <div className="h-5 w-px bg-[var(--border)] mr-1" />
        {[
          { key: 'popular', label: t('browse.popular') },
          { key: 'rating', label: t('browse.bestRated') },
          { key: 'newest', label: t('browse.newest') },
          { key: 'title', label: t('browse.aToZ') },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => { setSort(s.key); setPage(1); }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              sort === s.key
                ? 'bg-[var(--primary)] text-[var(--text-inverse)] shadow-sm shadow-[var(--primary)]/20'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-sunken)]'
            }`}
          >
            {sort === s.key && <span className="flex-shrink-0">{SORT_ICONS[s.key]}</span>}
            {s.label}
          </button>
        ))}
        <div className="flex-1" />
        {selectedTag && (
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--primary-subtle)] text-[var(--primary)] border border-[var(--primary)]/20 flex items-center gap-1.5 shadow-sm"
          >
            <Hash size={14} />
            {displayGenre(selectedTag)}
            <button onClick={() => setSelectedTag(null)} className="ml-0.5 hover:text-[var(--error)] transition-colors cursor-pointer p-0.5 rounded-full hover:bg-[var(--error)]/10" aria-label={t('browse.removeFilter')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </motion.span>
        )}
      </motion.div>

      {/* Manga Grid */}
      <section className="space-y-6 mt-6">
        {error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-[var(--surface)] border border-[var(--border)] rounded-2xl"
          >
            <AlertTriangle className="w-14 h-14 text-[var(--warning)] mx-auto mb-4" />
            <p className="text-[var(--text-secondary)] font-medium mb-4">{error}</p>
            <button onClick={() => fetchMangas(undefined, selectedTag, sort, 1)} className="px-6 py-2.5 bg-[var(--primary)] text-white rounded-xl font-semibold hover:bg-[var(--primary-hover)] transition-colors cursor-pointer shadow-md hover:shadow-lg">{t('common.retry')}</button>
          </motion.div>
        ) : loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[2/3] rounded-xl bg-[var(--surface-sunken)] mb-3" />
                <div className="h-4 bg-[var(--surface-sunken)] rounded w-3/4 mb-2" />
                <div className="h-3 bg-[var(--surface-sunken)] rounded w-1/2" />
              </div>
            ))}
          </div>
) : mangas.length === 0 ? (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    {searchQuery || selectedTag ? (
      <EmptyState
        icon={<Search className="w-8 h-8" />}
        title={t('common.noResults')}
        description={searchQuery ? `No encontramos mangas para "${searchQuery}"` : undefined}
        action={{ label: t('browse.clearFilters'), onClick: () => { setSearchQuery(''); setSelectedTag(null); } }}
      />
    ) : (
      <EmptyState
        icon={<BookOpen className="w-8 h-8" />}
        title={t('browse.noMangas')}
      />
    )}
  </motion.div>
) : (
          <>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
              <span className="text-xs font-semibold text-[var(--text-tertiary)] tracking-wider uppercase px-2">
                {totalPages > 1 ? `${t('browse.title')} — ${t('search.page', { page })}` : t('browse.title')}
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {mangas.map((manga, i) => (
                <motion.div
                  key={manga.id}
                  initial={shouldReduceMotion ? {} : { opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.04, ease: [0.4, 0, 0.2, 1] }}
                  whileHover={shouldReduceMotion ? {} : { y: -6 }}
                  whileTap={shouldReduceMotion ? {} : { y: 0 }}
                >
                  <Link href={`/manga/${manga.slug}`} className="group cursor-pointer block">
                    <div className="relative aspect-[2/3] mb-3 overflow-hidden rounded-xl shadow-sm border border-[var(--border)] group-hover:border-[var(--primary)]/50 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-[var(--primary)]/5 bg-[var(--surface)]">
                      {manga.coverUrl ? (
                        <>
                          <OptimizedImage
                            src={manga.coverUrl}
                            alt={manga.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent-purple)]/20">
                          <BookOpen className="w-12 h-12 text-[var(--text-tertiary)]" />
                        </div>
                      )}
                      {manga.rating ? (
                        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-amber-400 font-bold text-xs px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                          <Star size={10} fill="currentColor" /> {manga.rating.toFixed(1)}
                        </div>
                      ) : null}
                      {manga.status && (
                        <div className="absolute bottom-2 left-2 right-2 flex gap-1.5">
                          {manga.tags && manga.tags.length > 0 && (
                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-black/40 backdrop-blur-sm text-white/80 border border-white/10 shadow-sm truncate max-w-[80px]">
                              {displayGenre(manga.tags[0])}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border shadow-sm backdrop-blur-sm ${STATUS_STYLES[manga.status] || 'bg-gray-500/80 text-white border-gray-400/30'}`}>
                            {manga.status === 'ONGOING' ? t('manga.ongoing') : manga.status === 'COMPLETED' ? t('manga.completed') : t('search.statusHiatus')}
                          </span>
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm leading-tight text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors line-clamp-1">{manga.title}</h3>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1 truncate">{manga.authorName}</p>
                    <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] mt-1.5">
                      <span className="flex items-center gap-1"><Eye size={12} /> {manga.totalViews ?? 0}</span>
                      <span className="flex items-center gap-1"><BookOpen size={12} /> {t('browse.chapterCount', { count: manga.chapterCount ?? 0 })}</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center items-center gap-2 pt-6"
          >
            <button
              onClick={() => { setPage(p => Math.max(1, p - 1)); fetchMangas(searchQuery || undefined, selectedTag, sort, Math.max(1, page - 1)); }}
              disabled={page <= 1}
              className="px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl font-medium text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--surface-sunken)] hover:border-[var(--primary)]/30 transition-all"
            >
              {t('common.previous')}
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const p = start + i;
                return (
                  <button
                    key={p}
                    onClick={() => { setPage(p); fetchMangas(searchQuery || undefined, selectedTag, sort, p); }}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-all duration-200 ${
                      page === p
                        ? 'bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)] text-white shadow-md shadow-[var(--primary)]/20 scale-110'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => { setPage(p => Math.min(totalPages, p + 1)); fetchMangas(searchQuery || undefined, selectedTag, sort, Math.min(totalPages, page + 1)); }}
              disabled={page >= totalPages}
              className="px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl font-medium text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--surface-sunken)] hover:border-[var(--primary)]/30 transition-all"
            >
              {t('common.next')}
            </button>
          </motion.div>
        )}
      </section>

      {/* Tag Cloud */}
      {availableTags.length > 0 && (
        <motion.section
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-5"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Hash className="w-5 h-5 text-[var(--primary)]" />
              <h2 className="text-xl font-bold">{t('browse.exploreByGenre')}</h2>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-[var(--border)] to-transparent" />
          </div>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((genre) => (
              <motion.button
                key={genre}
                whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                onClick={() => handleTagClick(genre)}
                className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-1.5 ${
                  selectedTag === genre
                    ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] text-white shadow-lg shadow-[var(--primary)]/20'
                    : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]/40 hover:text-[var(--text-primary)] hover:shadow-md hover:shadow-[var(--primary)]/5'
                }`}
              >
                <Hash size={14} className={selectedTag === genre ? 'text-white/70' : 'text-[var(--text-tertiary)]'} />
                {displayGenre(genre)}
              </motion.button>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}
