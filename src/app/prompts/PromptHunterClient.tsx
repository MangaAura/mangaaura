'use client';

import { Copy, Terminal, Sparkles, Image as ImageIcon, Search, CheckCircle, Heart, Loader2, HeartIcon, MessageSquare, User, X, ArrowLeft, ArrowRight } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useErrorHandler } from '@/hooks/useErrorHandler';

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

interface GalleryImage {
  id: string;
  prompt: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  width: number;
  height: number;
  provider: string;
  modelId: string;
  style: string | null;
  quality: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  isLikedByUser: boolean;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

type Tab = 'prompts' | 'gallery';

export default function PromptHunterClient() {
  const { handleError } = useErrorHandler();
  const [activeTab, setActiveTab] = useState<Tab>('prompts');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  // Gallery state
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryHasMore, setGalleryHasMore] = useState(false);
  const [galleryPage, setGalleryPage] = useState(1);
  const [gallerySort, setGallerySort] = useState<'latest' | 'popular'>('latest');
  // Modal state
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [modalComments, setModalComments] = useState<Comment[]>([]);
  const [modalCommentsLoading, setModalCommentsLoading] = useState(false);
  const [modalCommentText, setModalCommentText] = useState('');
  const [modalSubmitting, setModalSubmitting] = useState(false);

  interface CommentUser {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    level: number | null;
    isCurrentUser?: boolean;
  }

  interface CommentReply {
    id: string;
    content: string;
    createdAt: string;
    user: CommentUser;
  }

  interface Comment {
    id: string;
    content: string;
    createdAt: string;
    user: CommentUser;
    replies: CommentReply[];
  }

  interface CommentsResponse {
    comments: Comment[];
    pagination: { page: number; total: number; totalPages: number };
  }

  const fetchPrompts = useCallback(async (searchQuery: string, newOffset: number = 0) => {
    try {
      setError(null);
      setIsLoading(true);
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
      handleError(err);
      setError('Error al cargar los prompts');
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const fetchGallery = useCallback(async (pageNum: number = 1, sort: 'latest' | 'popular' = gallerySort) => {
    try {
      setGalleryLoading(true);
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: '24',
        sort,
      });

      const res = await fetch(`/api/ai/generate-image/public?${params}`);
      if (!res.ok) throw new Error('Failed to fetch gallery');
      const data = await res.json();

      if (pageNum === 1) {
        setGalleryImages(data.items || []);
      } else {
        setGalleryImages(prev => [...prev, ...(data.items || [])]);
      }
      const totalPages = data.pagination?.totalPages || 1;
      setGalleryHasMore(pageNum < totalPages);
      setGalleryPage(pageNum);
    } catch (err) {
      handleError(err);
    } finally {
      setGalleryLoading(false);
    }
  }, [gallerySort, handleError]);

  useEffect(() => {
    if (activeTab === 'prompts') {
      queueMicrotask(() => { void fetchPrompts(''); });
    } else {
      fetchGallery(1, gallerySort);
    }
  }, [activeTab, gallerySort, fetchPrompts, fetchGallery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'prompts') {
      fetchPrompts(search, 0);
    }
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
      handleError(err);
    }
  };

  const handleImageLike = async (imageId: string) => {
    try {
      const res = await fetch(`/api/ai/generate-image/${imageId}/like`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setGalleryImages(prev => prev.map(img =>
          img.id === imageId ? { ...img, likeCount: data.likeCount, isLikedByUser: data.isLiked } : img
        ));
      }
    } catch (err) {
      handleError(err);
    }
  };

  // ── Modal handlers ─────────────────────────────────────────────
  const handleOpenModal = useCallback(async (img: GalleryImage) => {
    setSelectedImage(img);
    setModalCommentsLoading(true);
    setModalCommentText('');
    try {
      const res = await fetch(`/api/ai/generate-image/${img.id}/comments?limit=20`);
      if (res.ok) {
        const data: CommentsResponse = await res.json();
        setModalComments(data.comments);
      }
    } catch {
      setModalComments([]);
    } finally {
      setModalCommentsLoading(false);
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedImage(null);
    setModalComments([]);
    setModalCommentText('');
  }, []);

  const handleModalPostComment = async () => {
    if (!selectedImage || !modalCommentText.trim()) return;
    setModalSubmitting(true);
    try {
      const res = await fetch(`/api/ai/generate-image/${selectedImage.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: modalCommentText.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setModalComments(prev => [data.comment, ...prev]);
        setModalCommentText('');
        setGalleryImages(prev => prev.map(img =>
          img.id === selectedImage.id ? { ...img, commentCount: img.commentCount + 1 } : img
        ));
        if (selectedImage) {
          setSelectedImage({ ...selectedImage, commentCount: selectedImage.commentCount + 1 });
        }
      }
    } catch {
      // silent
    } finally {
      setModalSubmitting(false);
    }
  };

  // ── Keyboard: Escape to close, arrows to navigate ──────────────
  useEffect(() => {
    if (!selectedImage) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); handleCloseModal(); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault();
        const idx = galleryImages.findIndex(img => img.id === selectedImage.id);
        if (idx === -1) return;
        const nextIdx = e.key === 'ArrowRight'
          ? (idx + 1) % galleryImages.length
          : (idx - 1 + galleryImages.length) % galleryImages.length;
        const nextImg = galleryImages[nextIdx];
        if (nextImg) handleOpenModal(nextImg);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedImage, galleryImages, handleOpenModal, handleCloseModal]);

  const handleImageUnlike = async (imageId: string) => {
    try {
      const res = await fetch(`/api/ai/generate-image/${imageId}/like`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        setGalleryImages(prev => prev.map(img =>
          img.id === imageId ? { ...img, likeCount: data.likeCount, isLikedByUser: data.isLiked } : img
        ));
      }
    } catch (err) {
      handleError(err);
    }
  };

  const loadMore = () => {
    if (activeTab === 'prompts') {
      fetchPrompts(search, offset + 20);
    } else {
      fetchGallery(galleryPage + 1, gallerySort);
    }
  };

  return (
    <div className="text-[var(--text-primary)] pb-12">
      <div className="bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6 py-12 text-center">
          <div className="inline-flex justify-center items-center bg-[var(--accent-purple)]/10 text-[var(--accent-purple)] p-3 rounded-full mb-4">
            <Terminal size={32} aria-hidden="true" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Prompt <span className="text-[var(--accent-purple)]">Hunter</span>
          </h1>
          <p className="text-[var(--text-tertiary)] text-lg max-w-2xl mx-auto mb-8">
            El código fuente detrás del arte. Descubre, copia y aprende de los prompts y galería de imágenes generadas por la comunidad.
          </p>

          {/* Tabs */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <button
              onClick={() => setActiveTab('prompts')}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'prompts'
                  ? 'bg-[var(--accent-purple)] text-white shadow-lg shadow-[var(--accent-purple)]/20'
                  : 'bg-[var(--surface-sunken)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] border border-[var(--border)]'
              }`}
            >
              <Terminal size={16} className="inline mr-2" />
              Prompts
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'gallery'
                  ? 'bg-[var(--accent-purple)] text-white shadow-lg shadow-[var(--accent-purple)]/20'
                  : 'bg-[var(--surface-sunken)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] border border-[var(--border)]'
              }`}
            >
              <ImageIcon size={16} className="inline mr-2" />
              Galería
            </button>
          </div>

          {/* Search — only on prompts tab */}
          {activeTab === 'prompts' && (
            <form onSubmit={handleSearch} className="max-w-xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[var(--text-tertiary)]" size={20} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por estilo, autor o palabra clave..."
                aria-label="Buscar prompts"
                className="w-full pl-12 pr-4 py-4 bg-[var(--surface-sunken)] border border-[var(--border)] focus:border-[var(--accent-purple)] focus:ring-1 focus:ring-[var(--accent-purple)] rounded-2xl outline-none transition-all shadow-lg"
              />
            </form>
          )}

          {/* Gallery sort toggle */}
          {activeTab === 'gallery' && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setGallerySort('latest')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  gallerySort === 'latest'
                    ? 'bg-[var(--accent-purple)]/20 text-[var(--accent-purple)]'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Más recientes
              </button>
              <button
                onClick={() => setGallerySort('popular')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  gallerySort === 'popular'
                    ? 'bg-[var(--accent-purple)]/20 text-[var(--accent-purple)]'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Más populares
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12">
        {/* ── PROMPTS TAB ── */}
        {activeTab === 'prompts' && (
          <>
            {isLoading && prompts.length === 0 && (
              <div className="flex items-center justify-center py-16" role="status">
                <Loader2 size={32} className="animate-spin text-[var(--accent-purple)]" />
                <span className="ml-3 text-[var(--text-tertiary)]">Cargando prompts...</span>
              </div>
            )}

            {error && (
              <ErrorMessage
                message={error}
                action={{ label: 'Reintentar', onClick: () => fetchPrompts(search, 0) }}
              />
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
                  className="px-6 py-3 bg-[var(--surface-sunken)] border border-[var(--border)] font-bold rounded-xl hover:bg-[var(--surface)] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? <Loader2 size={20} className="animate-spin inline" /> : 'Cargar más prompts'}
                </button>
              </div>
            )}
          </>
        )}

        {/* ── GALLERY TAB ── */}
        {activeTab === 'gallery' && (
          <>
            {galleryLoading && galleryImages.length === 0 && (
              <div className="flex items-center justify-center py-16" role="status">
                <Loader2 size={32} className="animate-spin text-[var(--accent-purple)]" />
                <span className="ml-3 text-[var(--text-tertiary)]">Cargando galería...</span>
              </div>
            )}

            {!galleryLoading && galleryImages.length === 0 && (
              <div className="text-center py-16 text-[var(--text-tertiary)]">
                <ImageIcon size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg font-semibold">Aún no hay imágenes públicas</p>
                <p className="text-sm mt-1">Las imágenes generadas aparecerán aquí cuando los creadores las publiquen.</p>
              </div>
            )}

            <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
              {galleryImages.map((img) => (
                <div
                  key={img.id}
                  className="break-inside-avoid bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-[var(--accent-purple)] transition-all group"
                >
                  {/* Image — clickable to open modal */}
                  <button
                    onClick={() => handleOpenModal(img)}
                    className="relative bg-[var(--surface-sunken)] overflow-hidden w-full block cursor-pointer"
                    aria-label={`Ver detalle de imagen: ${img.prompt}`}
                  >
                    <img
                      src={img.thumbnailUrl || img.imageUrl}
                      alt={img.prompt}
                      className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/50 text-white backdrop-blur-sm">
                        {img.style || img.quality}
                      </span>
                    </div>
                    {/* View details overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span className="px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-white text-xs font-bold">
                        Ver detalles
                      </span>
                    </div>
                  </button>

                  {/* Info */}
                  <div className="p-3 space-y-2">
                    {/* Prompt preview */}
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 font-mono leading-relaxed">
                      {img.prompt}
                    </p>

                    {/* User + Actions */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-[var(--accent-purple)]/20 flex items-center justify-center overflow-hidden">
                          {img.user.avatarUrl ? (
                            <img src={img.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User size={10} className="text-[var(--accent-purple)]" />
                          )}
                        </div>
                        <span className="text-[10px] font-medium text-[var(--text-tertiary)] truncate max-w-[100px]">
                          {img.user.displayName || img.user.username}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Like button */}
                        <button
                          onClick={() => img.isLikedByUser ? handleImageUnlike(img.id) : handleImageLike(img.id)}
                          className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md transition-colors cursor-pointer ${
                            img.isLikedByUser
                              ? 'text-[var(--error)]'
                              : 'text-[var(--text-tertiary)] hover:text-[var(--error)]'
                          }`}
                          aria-label={img.isLikedByUser ? 'Quitar like' : 'Dar like'}
                        >
                          <HeartIcon size={10} className={img.isLikedByUser ? 'fill-current' : ''} />
                          {img.likeCount}
                        </button>

                        {/* Comment count — opens modal */}
                        <button
                          onClick={() => handleOpenModal(img)}
                          className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--accent-purple)] transition-colors cursor-pointer"
                          aria-label="Ver comentarios"
                        >
                          <MessageSquare size={10} />
                          {img.commentCount}
                        </button>
                      </div>
                    </div>

                    {/* Comment count is now shown in the modal */}
                  </div>
                </div>
              ))}
            </div>

            {galleryHasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={galleryLoading}
                  className="px-6 py-3 bg-[var(--surface-sunken)] border border-[var(--border)] font-bold rounded-xl hover:bg-[var(--surface)] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {galleryLoading ? (
                    <Loader2 size={20} className="animate-spin inline" />
                  ) : (
                    'Cargar más imágenes'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
      {/* ── IMAGE DETAIL MODAL ── */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex flex-col md:flex-row bg-black/90" role="dialog" aria-modal="true" aria-label="Detalle de imagen">
          {/* Close button */}
          <button
            onClick={handleCloseModal}
            className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>

          {/* Nav arrows — desktop */}
          {galleryImages.length > 1 && (
            <>
              <button
                onClick={() => {
                  const idx = galleryImages.findIndex(i => i.id === selectedImage.id);
                  if (idx > 0) handleOpenModal(galleryImages[idx - 1]);
                }}
                className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors cursor-pointer"
                aria-label="Imagen anterior"
              >
                <ArrowLeft size={22} />
              </button>
              <button
                onClick={() => {
                  const idx = galleryImages.findIndex(i => i.id === selectedImage.id);
                  if (idx < galleryImages.length - 1) handleOpenModal(galleryImages[idx + 1]);
                }}
                className="hidden md:flex absolute right-[420px] top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors cursor-pointer"
                aria-label="Siguiente imagen"
              >
                <ArrowRight size={22} />
              </button>
            </>
          )}

          {/* ── Left: Full-size image ── */}
          <div className="flex-1 flex items-center justify-center p-4 md:p-8 min-h-[40vh] md:min-h-screen relative">
            <img
              src={selectedImage.imageUrl}
              alt={selectedImage.prompt}
              className="max-w-full max-h-[50vh] md:max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />

            {/* Mobile nav arrows */}
            {galleryImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 md:hidden">
                <button
                  onClick={() => {
                    const idx = galleryImages.findIndex(i => i.id === selectedImage.id);
                    if (idx > 0) handleOpenModal(galleryImages[idx - 1]);
                  }}
                  className="p-2 rounded-full bg-black/50 text-white cursor-pointer"
                  aria-label="Anterior"
                >
                  <ArrowLeft size={18} />
                </button>
                <span className="text-white/60 text-xs font-medium">
                  {galleryImages.findIndex(i => i.id === selectedImage.id) + 1} / {galleryImages.length}
                </span>
                <button
                  onClick={() => {
                    const idx = galleryImages.findIndex(i => i.id === selectedImage.id);
                    if (idx < galleryImages.length - 1) handleOpenModal(galleryImages[idx + 1]);
                  }}
                  className="p-2 rounded-full bg-black/50 text-white cursor-pointer"
                  aria-label="Siguiente"
                >
                  <ArrowRight size={18} />
                </button>
              </div>
            )}
          </div>

          {/* ── Right: Details + Comments ── */}
          <div className="w-full md:w-[400px] bg-[var(--surface)] border-t md:border-t-0 md:border-l border-[var(--border)] flex flex-col max-h-[50vh] md:max-h-screen">
            {/* Image metadata */}
            <div className="p-4 border-b border-[var(--border)] flex-shrink-0">
              {/* User row */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-[var(--accent-purple)]/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {selectedImage.user.avatarUrl ? (
                    <img src={selectedImage.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User size={14} className="text-[var(--accent-purple)]" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                    {selectedImage.user.displayName || selectedImage.user.username}
                  </p>
                  <p className="text-[10px] text-[var(--text-tertiary)]">
                    {new Date(selectedImage.createdAt).toLocaleDateString('es', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                {/* Like button */}
                <button
                  onClick={() => {
                    if (selectedImage.isLikedByUser) {
                      handleImageUnlike(selectedImage.id);
                      setSelectedImage({ ...selectedImage, likeCount: selectedImage.likeCount - 1, isLikedByUser: false });
                    } else {
                      handleImageLike(selectedImage.id);
                      setSelectedImage({ ...selectedImage, likeCount: selectedImage.likeCount + 1, isLikedByUser: true });
                    }
                  }}
                  className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors cursor-pointer ${
                    selectedImage.isLikedByUser
                      ? 'bg-[var(--error)]/10 text-[var(--error)]'
                      : 'bg-[var(--surface-sunken)] text-[var(--text-tertiary)] hover:text-[var(--error)]'
                  }`}
                  aria-label={selectedImage.isLikedByUser ? 'Quitar like' : 'Dar like'}
                >
                  <HeartIcon size={16} className={selectedImage.isLikedByUser ? 'fill-current' : ''} />
                  {selectedImage.likeCount}
                </button>
              </div>

              {/* Prompt */}
              <div className="bg-[var(--surface-sunken)] rounded-xl p-3 mb-2">
                <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                  Prompt
                </p>
                <p className="text-xs font-mono text-[var(--text-secondary)] leading-relaxed">
                  {selectedImage.prompt}
                </p>
              </div>

              {/* Tags row */}
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--accent-purple)]/10 text-[var(--accent-purple)]">
                  {selectedImage.style || selectedImage.quality || 'standard'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400">
                  {selectedImage.provider}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                  {selectedImage.width}×{selectedImage.height}
                </span>
              </div>
            </div>

            {/* Comments section */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* Comments header */}
              <div className="px-4 py-3 border-b border-[var(--border)] flex-shrink-0">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <MessageSquare size={14} />
                  Comentarios ({selectedImage.commentCount})
                </h3>
              </div>

              {/* Comments list */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {modalCommentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={20} className="animate-spin text-[var(--accent-purple)]" />
                    <span className="ml-2 text-sm text-[var(--text-tertiary)]">Cargando comentarios...</span>
                  </div>
                ) : modalComments.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare size={32} className="mx-auto mb-2 text-[var(--text-tertiary)] opacity-40" />
                    <p className="text-sm text-[var(--text-tertiary)]">No hay comentarios aún.</p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1 opacity-70">
                      ¡Sé el primero en comentar!
                    </p>
                  </div>
                ) : (
                  modalComments.map((comment) => (
                    <div key={comment.id} className="bg-[var(--surface-sunken)] rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-full bg-[var(--accent-purple)]/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {comment.user.avatarUrl ? (
                            <img src={comment.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User size={10} className="text-[var(--accent-purple)]" />
                          )}
                        </div>
                        <span className="text-xs font-semibold text-[var(--text-primary)]">
                          {comment.user.displayName || comment.user.username}
                        </span>
                        <span className="text-[10px] text-[var(--text-tertiary)] ml-auto">
                          {new Date(comment.createdAt).toLocaleDateString('es', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                        {comment.content}
                      </p>

                      {/* Replies */}
                      {comment.replies?.length > 0 && (
                        <div className="ml-4 mt-2 space-y-2 border-l-2 border-[var(--border)] pl-3">
                          {comment.replies.map((reply) => (
                            <div key={reply.id}>
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                                  {reply.user.displayName || reply.user.username}
                                </span>
                              </div>
                              <p className="text-xs text-[var(--text-primary)]">
                                {reply.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Comment form */}
              <div className="p-4 border-t border-[var(--border)] flex-shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleModalPostComment();
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={modalCommentText}
                    onChange={(e) => setModalCommentText(e.target.value)}
                    placeholder="Escribe un comentario..."
                    className="flex-1 px-3 py-2 text-sm rounded-xl bg-[var(--surface-sunken)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent-purple)] placeholder:text-[var(--text-tertiary)]"
                    maxLength={500}
                  />
                  <button
                    type="submit"
                    disabled={!modalCommentText.trim() || modalSubmitting}
                    className="px-4 py-2 text-sm font-bold rounded-xl bg-[var(--accent-purple)] text-white hover:bg-[var(--accent-purple)]/80 disabled:opacity-50 transition-colors flex-shrink-0"
                  >
                    {modalSubmitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      'Enviar'
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
