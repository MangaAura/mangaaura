'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Copy, Terminal, Sparkles, Image as ImageIcon, Search, CheckCircle, Heart, Loader2 } from 'lucide-react';


interface Prompt {
  id: string;
  authorId: string;
  name: string;
  prompt: string;
  style: string | null;
  tags: string[];
  isPublic: boolean;
  likes: number;
  views: number;
  forks: number;
  model: string | null;
  negativePrompt: string | null;
  hasLiked: boolean;
  mangaId: string | null;
}

export default function PromptHunterPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const fetchPrompts = useCallback(async (searchQuery: string, newOffset: number = 0) => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams({
        limit: '20',
        offset: String(newOffset),
        sortBy: 'likes',
        sortOrder: 'desc',
      });
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/prompts?${params}`);
      if (!res.ok) throw new Error('Failed to fetch prompts');
      const data = await res.json();

      if (newOffset === 0) {
        setPrompts(data.prompts || []);
      } else {
        setPrompts(prev => [...prev, ...(data.prompts || [])]);
      }
      setHasMore(data.pagination?.hasMore || false);
      setOffset(newOffset);
    } catch (err) {
      console.error('Error fetching prompts:', err);
      setError('Error al cargar los prompts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrompts('');
  }, [fetchPrompts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPrompts(search, 0);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLike = async (promptId: string) => {
    try {
      await fetch(`/api/prompts/${promptId}/like`, { method: 'POST' });
      setPrompts(prev => prev.map(p =>
        p.id === promptId ? { ...p, likes: p.likes + 1, hasLiked: true } : p
      ));
    } catch (err) {
      console.error('Error liking prompt:', err);
    }
  };

  const loadMore = () => {
    fetchPrompts(search, offset + 20);
  };

  return (
    <div className="text-[var(--text-primary)] pb-12">

      <div className="bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6 py-12 text-center">
          <div className="inline-flex justify-center items-center bg-[var(--accent-purple)]/10 text-[var(--accent-purple)] p-3 rounded-full mb-4">
            <Terminal size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Prompt <span className="text-[var(--accent-purple)]">Hunter</span></h1>
          <p className="text-[var(--text-tertiary)] text-lg max-w-2xl mx-auto mb-8">
            El código fuente detrás del arte. Descubre, copia y aprende de los prompts exactos que los mejores creadores de la plataforma utilizan para generar sus mangas.
          </p>

          <form onSubmit={handleSearch} className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[var(--text-tertiary)]" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por estilo, autor o palabra clave... (ej. 'cyberpunk', 'niji 6')"
              className="w-full pl-12 pr-4 py-4 bg-[var(--surface-sunken)] border border-[var(--border)] focus:border-[var(--accent-purple)] focus:ring-1 focus:ring-[var(--accent-purple)] rounded-2xl outline-none transition-all shadow-lg"
            />
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12">
        {isLoading && prompts.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-[var(--accent-purple)]" />
            <span className="ml-3 text-[var(--text-tertiary)]">Cargando prompts...</span>
          </div>
        )}

        {error && (
          <div className="bg-[var(--error)]/10 border border-[var(--error)]/30 rounded-xl p-6 text-center">
            <p className="text-[var(--error)]">{error}</p>
            <button onClick={() => fetchPrompts(search, 0)} className="mt-3 px-4 py-2 bg-[var(--error)] text-[var(--text-inverse)] rounded-lg hover:opacity-90 transition-opacity">
              Reintentar
            </button>
          </div>
        )}

        {!isLoading && !error && prompts.length === 0 && (
          <div className="text-center py-16 text-[var(--text-tertiary)]">
            <p>No se encontraron prompts{search ? ` para "${search}"` : ''}</p>
          </div>
        )}

        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {prompts.map((item) => (
            <div key={item.id} className="break-inside-avoid bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-[var(--accent-purple)] transition-all group">
              {item.mangaId && (
                <div className="relative bg-[var(--surface-sunken)] px-4 py-2 border-b border-[var(--border)]">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-tertiary)]">
                    <ImageIcon size={12} /> {item.style || 'General'}
                  </div>
                </div>
              )}

              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm font-bold text-[var(--text-primary)]">{item.name}</p>
                    <p className="text-xs text-[var(--text-tertiary)] flex items-center gap-1 mt-0.5">
                      <Sparkles size={10} className="text-[var(--accent-purple)]" /> {item.model || 'Universal'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
          <button
            onClick={() => handleLike(item.id)}
            disabled={item.hasLiked}
            className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md transition-colors cursor-pointer ${item.hasLiked ? 'bg-[var(--error)]/10 text-[var(--error)]' : 'bg-[var(--surface-sunken)] text-[var(--text-tertiary)] hover:text-[var(--error)]'}`}
            aria-label="Me gusta"
          >
                      <Heart size={12} className={item.hasLiked ? 'fill-current' : ''} /> {item.likes}
                    </button>
                    <span className="text-xs text-[var(--text-tertiary)]">{item.views} vistas</span>
                  </div>
                </div>

                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.tags.slice(0, 5).map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-[var(--accent-purple)]/10 text-[var(--accent-purple)] text-[10px] font-bold rounded-full">{tag}</span>
                    ))}
                  </div>
                )}

                <div className="mb-4">
                  <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Prompt Positivo</p>
                  <div className="relative bg-[var(--background)] border border-[var(--border)] rounded-xl p-3 group/code">
                    <p className="text-sm font-mono text-[var(--text-secondary)] leading-relaxed pr-8">{item.prompt}</p>
          <button
            onClick={() => handleCopy(item.prompt, item.id)}
            className="absolute top-2 right-2 bg-[var(--surface)] hover:bg-[var(--surface-sunken)] border border-[var(--border)] p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors opacity-0 group-hover/code:opacity-100 focus:opacity-100 cursor-pointer"
            title="Copiar Prompt"
            aria-label="Copiar prompt"
          >
                      {copiedId === item.id ? <CheckCircle size={16} className="text-[var(--success)]" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                {item.negativePrompt && (
                  <div>
                    <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Prompt Negativo</p>
                    <div className="bg-[var(--background)]/50 border border-[var(--border)] rounded-xl p-3 border-l-2 border-l-[var(--error)]">
                      <p className="text-xs font-mono text-[var(--text-tertiary)]">{item.negativePrompt}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {hasMore && (
          <div className="text-center mt-8">
            <button
              onClick={loadMore}
              disabled={isLoading}
              className="px-6 py-3 bg-[var(--surface-sunken)] border border-[var(--border)] font-bold rounded-xl hover:bg-[var(--surface)] transition-colors disabled:opacity-50"
            >
              {isLoading ? <Loader2 size={20} className="animate-spin inline" /> : 'Cargar más prompts'}
            </button>
          </div>
        )}
    </div>
    </div>
  );
}
