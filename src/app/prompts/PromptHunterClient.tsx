'use client';

import { Copy, Terminal, Sparkles, Image as ImageIcon, Search, CheckCircle, Heart, Loader2, HeartIcon, MessageSquare, User } from 'lucide-react';
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
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentsLoading, setCommentsLoading] = useState<string | null>(null);
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<string | null>(null);

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

  const handleToggleComments = async (imageId: string) => {
    if (expandedComments === imageId) {
      setExpandedComments(null);
      return;
    }
    setExpandedComments(imageId);
    if (!comments[imageId]) {
      setCommentsLoading(imageId);
      try {
        const res = await fetch(`/api/ai/generate-image/${imageId}/comments?limit=10`);
        if (res.ok) {
          const data: CommentsResponse = await res.json();
          setComments(prev => ({ ...prev, [imageId]: data.comments }));
        }
      } catch {
        // silent
      } finally {
        setCommentsLoading(null);
      }
    }
  };

  const handlePostComment = async (imageId: string) => {
    const text = commentTexts[imageId]?.trim();
    if (!text) return;
    setSubmittingComment(imageId);
    try {
      const res = await fetch(`/api/ai/generate-image/${imageId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments(prev => ({
          ...prev,
          [imageId]: [data.comment, ...(prev[imageId] || [])],
        }));
        setCommentTexts(prev => ({ ...prev, [imageId]: '' }));
        // Update comment count on the card
        setGalleryImages(prev => prev.map(img =>
          img.id === imageId ? { ...img, commentCount: img.commentCount + 1 } : img
        ));
      }
    } catch {
      // silent
    } finally {
      setSubmittingComment(null);
    }
  };

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
                  {/* Image */}
                  <div className="relative bg-[var(--surface-sunken)] overflow-hidden">
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
                  </div>

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

                        {/* Comment count — clickable to expand */}
                        <button
                          onClick={() => handleToggleComments(img.id)}
                          className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md transition-colors cursor-pointer ${
                            expandedComments === img.id
                              ? 'text-[var(--accent-purple)] bg-[var(--accent-purple)]/10'
                              : 'text-[var(--text-tertiary)] hover:text-[var(--accent-purple)]'
                          }`}
                          aria-label="Ver comentarios"
                        >
                          <MessageSquare size={10} />
                          {img.commentCount}
                        </button>
                      </div>
                    </div>

                    {/* Comment section — expandable */}
                    {expandedComments === img.id && (
                      <div className="border-t border-[var(--border)] mt-2 pt-2 space-y-2">
                        {/* Comment list */}
                        {commentsLoading === img.id ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 size={14} className="animate-spin text-[var(--text-tertiary)]" />
                            <span className="ml-2 text-xs text-[var(--text-tertiary)]">Cargando comentarios...</span>
                          </div>
                        ) : (
                          <>
                            {(!comments[img.id] || comments[img.id].length === 0) ? (
                              <p className="text-xs text-[var(--text-tertiary)] text-center py-3">
                                No hay comentarios aún. ¡Sé el primero!
                              </p>
                            ) : (
                              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                {comments[img.id]?.map((comment) => (
                                  <div key={comment.id} className="bg-[var(--surface-sunken)] rounded-lg p-2">
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <div className="w-4 h-4 rounded-full bg-[var(--accent-purple)]/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {comment.user.avatarUrl ? (
                                          <img src={comment.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                          <User size={8} className="text-[var(--accent-purple)]" />
                                        )}
                                      </div>
                                      <span className="text-[10px] font-medium text-[var(--text-secondary)]">
                                        {comment.user.displayName || comment.user.username}
                                      </span>
                                      <span className="text-[9px] text-[var(--text-tertiary)] ml-auto">
                                        {new Date(comment.createdAt).toLocaleDateString('es', {
                                          month: 'short',
                                          day: 'numeric',
                                        })}
                                      </span>
                                    </div>
                                    <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                                      {comment.content}
                                    </p>
                                    {/* Replies */}
                                    {comment.replies?.length > 0 && (
                                      <div className="ml-3 mt-1.5 space-y-1.5 border-l-2 border-[var(--border)] pl-2">
                                        {comment.replies.map((reply) => (
                                          <div key={reply.id}>
                                            <div className="flex items-center gap-1">
                                              <span className="text-[10px] font-medium text-[var(--text-secondary)]">
                                                {reply.user.displayName || reply.user.username}
                                              </span>
                                            </div>
                                            <p className="text-[11px] text-[var(--text-primary)]">
                                              {reply.content}
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Comment form */}
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                handlePostComment(img.id);
                              }}
                              className="flex gap-2"
                            >
                              <input
                                type="text"
                                value={commentTexts[img.id] || ''}
                                onChange={(e) => setCommentTexts(prev => ({ ...prev, [img.id]: e.target.value }))}
                                placeholder="Escribe un comentario..."
                                className="flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-[var(--surface-sunken)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent-purple)] placeholder:text-[var(--text-tertiary)]"
                                maxLength={500}
                              />
                              <button
                                type="submit"
                                disabled={!commentTexts[img.id]?.trim() || submittingComment === img.id}
                                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[var(--accent-purple)] text-white hover:bg-[var(--accent-purple)]/80 disabled:opacity-50 transition-colors"
                              >
                                {submittingComment === img.id ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  'Enviar'
                                )}
                              </button>
                            </form>
                          </>
                        )}
                      </div>
                    )}
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
    </div>
  );
}
