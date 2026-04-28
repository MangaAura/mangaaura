'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Layout/Navbar';
import { Sparkles, Search, Filter, Hash, BookOpen, Eye, Star, Loader2 } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mangas, setMangas] = useState<MangaItem[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sort, setSort] = useState<string>('popular');
  const [loading, setLoading] = useState(true);
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
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      <div className="max-w-6xl mx-auto space-y-10 p-6">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 mt-4">
          Descubrir <Sparkles className="text-accent-purple" size={24} />
        </h1>

        {/* Search */}
        <section className="bg-gradient-to-r from-[var(--surface)] to-[var(--surface-elevated)] rounded-2xl p-8 border border-[var(--border)] shadow-sm relative overflow-hidden">
          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-2xl font-bold">Búsqueda Semántica con IA</h2>
            <p className="text-[var(--text-secondary)]">Busca por título, autor o describe qué te apetece leer.</p>

            <form onSubmit={handleSearch} className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Sparkles className="text-accent-purple" size={20} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Describe qué te apetece leer hoy..."
                className="w-full pl-12 pr-32 py-4 bg-[var(--background)] border border-[var(--border)] focus:border-accent-purple focus:ring-1 focus:ring-accent-purple rounded-xl shadow-inner outline-none transition-all text-lg"
              />
              <button
                type="submit"
                className="absolute inset-y-2 right-2 bg-accent-purple hover:bg-purple-700 text-white px-6 rounded-lg font-bold transition-colors flex items-center gap-2"
              >
                {isSearching ? 'Buscando...' : 'Buscar'}
              </button>
            </form>
          </div>

          <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-accent-purple/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-[-50px] left-[-50px] w-48 h-48 bg-accent-blue/5 rounded-full blur-2xl pointer-events-none"></div>
        </section>

        {/* Sort buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-[var(--text-secondary)] mr-1">Ordenar:</span>
          {[
            { key: 'popular', label: 'Popular' },
            { key: 'rating', label: 'Mejor valorado' },
            { key: 'newest', label: 'Más reciente' },
            { key: 'title', label: 'A-Z' },
          ].map(s => (
            <button
              key={s.key}
              onClick={() => { setSort(s.key); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                sort === s.key
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {s.label}
            </button>
          ))}
          {selectedTag && (
            <span className="px-3 py-1.5 rounded-lg text-sm font-medium bg-accent-purple/10 text-accent-purple border border-accent-purple/20 flex items-center gap-1">
              <Hash size={14} /> {selectedTag}
              <button onClick={() => setSelectedTag(null)} className="ml-1 hover:text-accent-red">&times;</button>
            </span>
          )}
        </div>

        {/* Manga Grid */}
        <section className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
            </div>
          ) : mangas.length === 0 ? (
            <div className="text-center py-16 bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
              <BookOpen className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-4" />
              <p className="text-[var(--text-secondary)] font-medium">
                {searchQuery || selectedTag ? 'No se encontraron resultados' : 'Aún no hay mangas disponibles'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {mangas.map((manga) => (
                <Link key={manga.id} href={`/manga/${manga.slug}`} className="group cursor-pointer">
                  <div className="relative aspect-[2/3] mb-3 overflow-hidden rounded-xl shadow-sm border border-[var(--border)] group-hover:border-[var(--primary)] transition-colors bg-[var(--surface)]">
                    {manga.coverUrl ? (
                      <img
                        src={manga.coverUrl}
                        alt={manga.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-[var(--text-tertiary)]" />
                      </div>
                    )}
                    {manga.rating && (
                      <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm text-yellow-500 font-bold text-xs px-2 py-1 rounded-md flex items-center gap-1">
                        <Star size={10} fill="currentColor" /> {manga.rating.toFixed(1)}
                      </div>
                    )}
                  </div>
                  <h4 className="font-bold text-sm leading-tight group-hover:text-[var(--primary)] transition-colors line-clamp-1">{manga.title}</h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{manga.authorName}</p>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)] mt-1">
                    <span className="flex items-center gap-0.5"><Eye size={10} /> {manga.totalViews}</span>
                    <span>{manga.chapterCount} caps.</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => { setPage(p => Math.max(1, p - 1)); fetchMangas(searchQuery || undefined, selectedTag, sort, Math.max(1, page - 1)); }}
                disabled={page <= 1}
                className="px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg font-medium disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="px-4 py-2 text-[var(--text-secondary)]">{page} / {totalPages}</span>
              <button
                onClick={() => { setPage(p => Math.min(totalPages, p + 1)); fetchMangas(searchQuery || undefined, selectedTag, sort, Math.min(totalPages, page + 1)); }}
                disabled={page >= totalPages}
                className="px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg font-medium disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          )}
        </section>

        {/* Tag Cloud */}
        {availableTags.length > 0 && (
          <section className="space-y-4">
            <h3 className="text-xl font-bold">Explorar por Género</h3>
            <div className="flex flex-wrap gap-3">
              {availableTags.map((genre) => (
                <button
                  key={genre}
                  onClick={() => handleTagClick(genre)}
                  className={`px-4 py-2 border rounded-xl font-medium text-sm transition-all flex items-center gap-1 ${
                    selectedTag === genre
                      ? 'bg-accent-purple/10 text-accent-purple border-accent-purple/20'
                      : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--surface-elevated)]'
                  }`}
                >
                  <Hash size={14} className="text-[var(--text-secondary)]" /> {genre}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
