'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Layout/Navbar';
import { Search, Filter, X, Star, BookOpen, SlidersHorizontal, ChevronDown } from 'lucide-react';

const GENRES = ['Action', 'Adventure', 'Comedy', 'Dark Fantasy', 'Drama', 'Fantasy', 'Horror', 'Isekai', 'Mecha', 'Romance', 'School Life', 'Sci-Fi', 'Shounen', 'Slice of Life', 'Supernatural', 'System'];
const STATUSES = ['Ongoing', 'Completed', 'Hiatus'];

export default function AdvancedSearchPage() {
  const [query, setQuery] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('popularity');
  const [showFilters, setShowFilters] = useState(true);

  const allManga = [
    { id: 'solo-leveling', title: 'Solo Leveling', author: 'DUBU_AI', rating: 4.9, chapters: 179, status: 'Completed', genres: ['Action', 'Dark Fantasy', 'System'] },
    { id: 'jujutsu-kaisen', title: 'Jujutsu Kaisen', author: 'Gege_AI', rating: 4.8, chapters: 245, status: 'Ongoing', genres: ['Action', 'Shounen', 'Supernatural'] },
    { id: 'chainsaw-man', title: 'Chainsaw Man', author: 'Fujimoto_AI', rating: 4.7, chapters: 150, status: 'Ongoing', genres: ['Action', 'Horror', 'Dark Fantasy'] },
    { id: 'omniscient-reader', title: 'Omniscient Reader', author: 'Singshong_AI', rating: 4.9, chapters: 180, status: 'Completed', genres: ['Action', 'Fantasy', 'System'] },
    { id: 'spy-x-family', title: 'Spy x Family', author: 'Endo_AI', rating: 4.7, chapters: 90, status: 'Ongoing', genres: ['Action', 'Comedy', 'School Life'] },
    { id: 'tower-of-god', title: 'Tower of God', author: 'SIU_Bot', rating: 4.6, chapters: 550, status: 'Ongoing', genres: ['Action', 'Fantasy', 'Adventure'] },
    { id: 'beginning-after-end', title: 'The Beginning After the End', author: 'TurtleMe_AI', rating: 4.8, chapters: 180, status: 'Ongoing', genres: ['Action', 'Fantasy', 'Isekai'] },
    { id: 'demon-slayer', title: 'Demon Slayer', author: 'Gotouge_AI', rating: 4.8, chapters: 205, status: 'Completed', genres: ['Action', 'Shounen', 'Supernatural'] },
  ];

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]);
  };

  const filteredManga = allManga.filter(manga => {
    const matchesQuery = !query || manga.title.toLowerCase().includes(query.toLowerCase()) || manga.author.toLowerCase().includes(query.toLowerCase());
    const matchesGenres = selectedGenres.length === 0 || selectedGenres.every(g => manga.genres.includes(g));
    const matchesStatus = !selectedStatus || manga.status === selectedStatus;
    return matchesQuery && matchesGenres && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-primary font-sans text-fg-primary pb-12">
      <Navbar />

      {/* Search Header */}
      <div className="bg-secondary border-b border-custom">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-extrabold tracking-tight mb-6 flex items-center gap-3">
            <Search className="text-accent-blue" size={30} /> Búsqueda Avanzada
          </h1>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder='Busca por título, autor o descripción... (ej: "solo leveling", "DUBU_AI")'
                className="w-full pl-12 pr-4 py-4 bg-tertiary border border-custom focus:border-accent-blue focus:ring-1 focus:ring-accent-blue rounded-2xl outline-none transition-all text-base shadow-inner"
                autoFocus
              />
              {query && (
                <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-fg-primary transition-colors">
                  <X size={18} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-5 py-4 rounded-2xl border font-bold transition-all shadow-sm ${showFilters ? 'bg-accent-blue text-white border-accent-blue' : 'bg-secondary border-custom hover:bg-tertiary'}`}
            >
              <SlidersHorizontal size={20} /> Filtros {selectedGenres.length > 0 && <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">{selectedGenres.length}</span>}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 flex flex-col lg:flex-row gap-8">

        {/* Filters Sidebar */}
        {showFilters && (
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-secondary border border-custom rounded-2xl p-6 shadow-sm sticky top-24">
              <div className="flex justify-between items-center mb-6 border-b border-custom pb-4">
                <h2 className="font-bold text-lg flex items-center gap-2"><Filter size={18} /> Filtros</h2>
                {(selectedGenres.length > 0 || selectedStatus) && (
                  <button onClick={() => { setSelectedGenres([]); setSelectedStatus(''); }} className="text-xs text-accent-red font-semibold hover:underline">Limpiar todo</button>
                )}
              </div>

              {/* Status Filter */}
              <div className="mb-6">
                <h3 className="font-bold text-sm text-muted uppercase tracking-wider mb-3">Estado</h3>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map(status => (
                    <button
                      key={status}
                      onClick={() => setSelectedStatus(selectedStatus === status ? '' : status)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${selectedStatus === status ? 'bg-accent-blue text-white border-accent-blue' : 'bg-tertiary border-custom text-muted hover:text-fg-primary'}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort By */}
              <div className="mb-6">
                <h3 className="font-bold text-sm text-muted uppercase tracking-wider mb-3">Ordenar Por</h3>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="w-full appearance-none bg-tertiary border border-custom text-sm font-semibold py-2.5 pl-3 pr-8 rounded-xl outline-none focus:border-accent-blue transition-colors"
                  >
                    <option value="popularity">Más Populares</option>
                    <option value="rating">Mejor Valorados</option>
                    <option value="newest">Más Nuevos</option>
                    <option value="chapters">Más Capítulos</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                </div>
              </div>

              {/* Genre Pills */}
              <div>
                <h3 className="font-bold text-sm text-muted uppercase tracking-wider mb-3">Géneros / Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map(genre => (
                    <button
                      key={genre}
                      onClick={() => toggleGenre(genre)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${selectedGenres.includes(genre) ? 'bg-accent-purple text-white border-accent-purple' : 'bg-tertiary border-custom text-muted hover:text-fg-primary hover:border-accent-purple/50'}`}
                    >
                      {genre}
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
            <p className="text-muted font-semibold text-sm">
              <span className="text-fg-primary font-black text-xl mr-1">{filteredManga.length}</span> resultados encontrados
            </p>
          </div>

          {filteredManga.length === 0 ? (
            <div className="bg-secondary border border-custom rounded-2xl p-16 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-bold mb-2">Sin resultados</h3>
              <p className="text-muted">Intenta ajustar los filtros o utiliza términos de búsqueda diferentes.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredManga.map((manga, i) => (
                <Link href={`/manga/${manga.id}`} key={i} className="group">
                  <div className="bg-secondary border border-custom rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-accent-blue transition-all duration-200 hover:-translate-y-0.5 h-full flex flex-col">
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <img
                        src={`https://via.placeholder.com/400x225/10121a/5a6072?text=${manga.title.split(' ')[0]}`}
                        alt={manga.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-yellow-400 text-xs font-black px-2 py-1 rounded-lg flex items-center gap-1">
                        <Star size={12} fill="currentColor" /> {manga.rating}
                      </div>
                      <div className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full ${manga.status === 'Completed' ? 'bg-accent-green/80 text-white' : manga.status === 'Ongoing' ? 'bg-accent-blue/80 text-white' : 'bg-yellow-500/80 text-black'}`}>
                        {manga.status}
                      </div>
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-bold text-base mb-1 group-hover:text-accent-blue transition-colors line-clamp-1">{manga.title}</h3>
                      <p className="text-xs text-muted mb-3">Por <span className="font-semibold text-accent-purple">{manga.author}</span></p>
                      <div className="flex flex-wrap gap-1.5 mb-auto">
                        {manga.genres.slice(0, 3).map(genre => (
                          <span key={genre} onClick={(e) => { e.preventDefault(); toggleGenre(genre); }} className="text-[10px] font-bold bg-tertiary border border-custom hover:border-accent-purple text-muted px-2 py-0.5 rounded-full cursor-pointer transition-colors">
                            {genre}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-custom">
                        <div className="flex items-center gap-1 text-xs font-semibold text-muted">
                          <BookOpen size={14} /> {manga.chapters} caps.
                        </div>
                        <span className="text-xs font-bold text-accent-blue group-hover:underline">Ver detalles →</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
