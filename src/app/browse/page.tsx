'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';

import { useT } from '@/i18n';
import { OptimizedImage } from '@/components/Image/OptimizedImage';
import { Sparkles, Search, Hash, BookOpen, Eye, Star, AlertTriangle } from 'lucide-react';

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

export default function BrowsePage() {
  const t = useT();
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
      console.error('Error fetching manga:', err);
      setError(t('browse.error'));
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    fetchMangas(undefined, selectedTag, sort, 1);
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

  return (
    <div className="max-w-6xl mx-auto space-y-12 p-6">
      <div className="flex items-center justify-between mt-4">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
          <span className="text-[var(--primary)]">{t('browse.title')}</span>
          <Sparkles className="text-[var(--accent-purple)]" size={24} />
        </h1>
      </div>

      {/* Search */}
      <section className="relative rounded-2xl p-1 overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent-purple))' }}>
        <div className="bg-[var(--surface)] dark:bg-[var(--surface)] rounded-xl p-8 md:p-10">
          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary-subtle)] text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-2">
  <Sparkles size={14} /> IA
</div>
            <h2 className="text-2xl md:text-3xl font-bold">{t('browse.semanticSearch')}</h2>
            <p className="text-[var(--text-secondary)] text-base max-w-lg mx-auto">
              {t('browse.semanticSearchDesc')}
            </p>

            <form onSubmit={handleSearch} className="relative max-w-xl mx-auto">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Search className="text-[var(--text-muted)]" size={20} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('browse.searchPlaceholder')}
                aria-label={t('browse.searchAriaLabel')}
                className="w-full pl-12 pr-36 py-4 bg-[var(--background)] border-2 border-[var(--border)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 rounded-xl outline-none transition-all text-base"
              />
              <button
                type="submit"
                className="absolute inset-y-2 right-2 bg-[var(--accent-purple)] hover:bg-[var(--accent-purple-hover)] text-[var(--text-inverse)] px-6 rounded-lg font-bold transition-colors flex items-center gap-2"
              >
                {isSearching ? t('browse.searching') : t('common.search')}
              </button>
            </form>
          </div>

          <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-[var(--accent-purple)]/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-[-50px] left-[-50px] w-48 h-48 bg-[var(--info)]/5 rounded-full blur-2xl pointer-events-none"></div>
          </div>
        </section>

        {/* Sort and Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-2">
          <span className="text-sm font-semibold text-[var(--text-secondary)] px-2">{t('browse.sortBy')}</span>
          {[
            { key: 'popular', label: t('browse.popular') },
            { key: 'rating', label: t('browse.bestRated') },
            { key: 'newest', label: t('browse.newest') },
            { key: 'title', label: t('browse.aToZ') },
          ].map(s => (
            <button
              key={s.key}
              onClick={() => { setSort(s.key); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                sort === s.key
                  ? 'bg-[var(--primary)] text-[var(--text-inverse)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-sunken)]'
              }`}
            >
              {s.label}
            </button>
          ))}
          <div className="flex-1" />
          {selectedTag && (
            <span className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--primary-subtle)] text-[var(--primary)] border border-[var(--primary)]/20 flex items-center gap-1.5">
              <Hash size={14} />
              {selectedTag}
              <button onClick={() => setSelectedTag(null)} className="ml-1 hover:text-[var(--error)] transition-colors cursor-pointer" aria-label={t('browse.removeFilter')}>&times;</button>
            </span>
          )}
        </div>

  {/* Manga Grid */}
  <section className="space-y-6">
    {error ? (
      <div className="text-center py-20 bg-[var(--surface)] border border-[var(--border)] rounded-2xl hover-lift">
        <AlertTriangle className="w-14 h-14 text-[var(--warning)] mx-auto mb-4" />
        <p className="text-[var(--text-secondary)] font-medium mb-4">{error}</p>
        <button onClick={() => fetchMangas(undefined, selectedTag, sort, 1)} className="px-6 py-2.5 bg-[var(--primary)] text-white rounded-xl font-semibold hover:bg-[var(--primary-hover)] transition-colors cursor-pointer">{t('common.retry')}</button>
      </div>
    ) : loading ? (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[2/3] rounded-xl bg-[var(--surface-sunken)] mb-3" />
            <div className="h-4 bg-[var(--surface-sunken)] rounded w-3/4 mb-2" />
            <div className="h-3 bg-[var(--surface-sunken)] rounded w-1/2" />
          </div>
        ))}
      </div>
    ) : mangas.length === 0 ? (
      <div className="text-center py-20 bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
        <BookOpen className="w-14 h-14 text-[var(--text-tertiary)] mx-auto mb-4" />
        <p className="text-[var(--text-secondary)] font-medium text-lg">
          {searchQuery || selectedTag ? t('common.noResults') : t('browse.noMangas')}
        </p>
        {(searchQuery || selectedTag) && (
          <button onClick={() => { setSearchQuery(''); setSelectedTag(null); }} className="mt-4 text-sm text-[var(--primary)] hover:underline font-medium cursor-pointer">
            {t('browse.clearFilters')}
          </button>
        )}
      </div>
    ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {mangas.map((manga, i) => (
          <motion.div
            key={manga.id}
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.04, ease: [0.4, 0, 0.2, 1] }}
            whileHover={shouldReduceMotion ? {} : { y: -4 }}
            whileTap={shouldReduceMotion ? {} : { y: 0 }}
          >
          <Link href={`/manga/${manga.slug}`} className="group cursor-pointer block">
            <div className="relative aspect-[2/3] mb-3 overflow-hidden rounded-xl shadow-sm border border-[var(--border)] group-hover:border-[var(--primary)] transition-all duration-300 group-hover:shadow-md bg-[var(--surface)]">
              {manga.coverUrl ? (
                <OptimizedImage
                  src={manga.coverUrl}
                  alt={manga.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent-purple)]/20">
                  <BookOpen className="w-12 h-12 text-[var(--text-tertiary)]" />
                </div>
              )}
              {manga.rating ? (
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-[var(--warning)] font-bold text-xs px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                  <Star size={10} fill="currentColor" /> {manga.rating.toFixed(1)}
                </div>
              ) : null}
              {manga.status && (
                <div className="absolute bottom-2 left-2">
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border backdrop-blur-sm shadow-sm ${
                    manga.status === 'ONGOING' ? 'bg-[var(--success)]/80 text-[var(--text-inverse)] border-[var(--success)]/30' :
                    manga.status === 'COMPLETED' ? 'bg-[var(--info)]/80 text-[var(--text-inverse)] border-[var(--info)]/30' :
                    'bg-[var(--warning)]/80 text-[var(--text-inverse)] border-[var(--warning)]/30'
                  }`}>
                    {manga.status === 'ONGOING' ? t('manga.ongoing') : manga.status === 'COMPLETED' ? t('manga.completed') : manga.status}
                  </span>
                </div>
              )}
            </div>
            <h3 className="font-semibold text-sm leading-tight group-hover:text-[var(--primary)] transition-colors line-clamp-1">{manga.title}</h3>
            <p className="text-xs text-[var(--text-tertiary)] mt-1 truncate">{manga.authorName}</p>
            <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] mt-1.5">
              <span className="flex items-center gap-1"><Eye size={12} /> {manga.totalViews ?? 0}</span>
              <span>{t('browse.chapterCount', { count: manga.chapterCount ?? 0 })}</span>
            </div>
          </Link>
          </motion.div>
        ))}
      </div>
    )}

    {/* Pagination */}
    {totalPages > 1 && (
      <div className="flex justify-center items-center gap-3 pt-4">
        <button
          onClick={() => { setPage(p => Math.max(1, p - 1)); fetchMangas(searchQuery || undefined, selectedTag, sort, Math.max(1, page - 1)); }}
          disabled={page <= 1}
          className="px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--surface-sunken)] transition-colors"
        >
          {t('common.previous')}
        </button>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const start = Math.max(1, Math.min(page - 2, totalPages - 4));
            const p = start + i;
            return (
              <button
                key={p}
                onClick={() => { setPage(p); fetchMangas(searchQuery || undefined, selectedTag, sort, p); }}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                  page === p
                    ? 'bg-[var(--primary)] text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)]'
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
          className="px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--surface-sunken)] transition-colors"
        >
          {t('common.next')}
        </button>
      </div>
    )}
  </section>

  {/* Tag Cloud */}
  {availableTags.length > 0 && (
    <section className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Hash className="text-[var(--primary)]" size={20} />
        {t('browse.exploreByGenre')}
      </h2>
      <div className="flex flex-wrap gap-2">
        {availableTags.map((genre) => (
          <button
            key={genre}
            onClick={() => handleTagClick(genre)}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-150 flex items-center gap-1.5 ${
              selectedTag === genre
                ? 'bg-[var(--primary)] text-white shadow-sm'
                : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--text-primary)] hover:shadow-sm'
            }`}
          >
            <Hash size={14} />
            {genre}
          </button>
        ))}
      </div>
    </section>
  )}
</div>
  );
}
