'use client';

import {
  Users,
  Search,
  MessageSquare,
  Pin,
  TrendingUp,
  BookOpen,
  Palette,
  Lightbulb,
  Megaphone,
  Heart,
  Filter,
  Plus,
  ChevronRight,
  Loader2,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

interface ForumAuthor {
  id: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  role: string;
}

interface ApiForumThread {
  id: string;
  title: string;
  slug: string;
  content: string;
  isPinned: boolean;
  isLocked: boolean;
  tags: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  author: ForumAuthor;
  category: { id: string; name: string; slug: string; icon?: string | null };
  _count: { posts: number };
}

interface ForumCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  _count: { threads: number };
}

const categoryIconMap: Record<string, React.ElementType> = {
  general: MessageSquare,
  techniques: Palette,
  prompts: Lightbulb,
  publishing: BookOpen,
  growth: TrendingUp,
  announcements: Megaphone,
};

const FALLBACK_THREADS: ApiForumThread[] = [
  {
    id: '1', title: 'Guía de mejores prácticas para subida de capítulos', slug: 'guia-mejores-practicas',
    content: 'Recomendaciones para optimizar la calidad y tamaño de tus imágenes al subir capítulos...',
    isPinned: true, isLocked: false, tags: '[]', viewCount: 320, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    author: { id: 'a1', username: 'AdminMangaAura', role: 'ADMIN' },
    category: { id: 'c1', name: 'Anuncios', slug: 'announcements' },
    _count: { posts: 24 },
  },
  {
    id: '2', title: 'Compartiendo mis prompts para estilo shōnen', slug: 'prompts-shonen',
    content: 'Después de experimentar mucho, encontré una combinación de prompts que da un estilo shōnen clásico...',
    isPinned: true, isLocked: false, tags: '[]', viewCount: 540, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    author: { id: 'a2', username: 'MangaMaster42', role: 'CREATOR' },
    category: { id: 'c2', name: 'Prompts IA', slug: 'prompts' },
    _count: { posts: 43 },
  },
  {
    id: '3', title: '¿Cómo mejoráis la consistencia de personajes entre capítulos?', slug: 'consistencia-personajes',
    content: 'Tengo problemas para que mis personajes se vean consistentes entre páginas. ¿Qué técnicas usáis?',
    isPinned: false, isLocked: false, tags: '[]', viewCount: 180, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    author: { id: 'a3', username: 'ArtistUX', role: 'CREATOR' },
    category: { id: 'c3', name: 'Técnicas', slug: 'techniques' },
    _count: { posts: 31 },
  },
  {
    id: '4', title: 'Estrategias para conseguir más lectores', slug: 'estrategias-lectores',
    content: 'He notado que ciertos horarios de publicación funcionan mejor. Comparto mi experiencia...',
    isPinned: false, isLocked: false, tags: '[]', viewCount: 210, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    author: { id: 'a4', username: 'RisingStar', role: 'CREATOR' },
    category: { id: 'c5', name: 'Crecimiento', slug: 'growth' },
    _count: { posts: 18 },
  },
  {
    id: '5', title: 'Nuevo sistema de crowdfunding: preguntas y respuestas', slug: 'crowdfunding-faq',
    content: 'Respondemos las preguntas más frecuentes sobre el nuevo sistema de financiamiento colectivo...',
    isPinned: false, isLocked: false, tags: '[]', viewCount: 890, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    author: { id: 'a1', username: 'AdminMangaAura', role: 'ADMIN' },
    category: { id: 'c1', name: 'Anuncios', slug: 'announcements' },
    _count: { posts: 56 },
  },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

export default function CreatorCommunityPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [threads, setThreads] = useState<ApiForumThread[]>(FALLBACK_THREADS);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showNewThread, setShowNewThread] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategorySlug, setNewCategorySlug] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/forum/categories');
      if (res.ok) {
        const data = await res.json();
        if (data.categories?.length > 0) setCategories(data.categories);
      }
    } catch {
      setFetchError('Error al cargar las categorías del foro.');
    }
  }, []);

  const fetchThreads = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams();
      if (activeCategory !== 'all') params.set('category', activeCategory);
      const res = await fetch(`/api/forum/threads?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.threads?.length > 0) setThreads(data.threads);
      }
    } catch {
      setFetchError('Error al cargar los hilos del foro.');
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchThreads(); }, [fetchThreads]);

  const filteredThreads = threads.filter((t) => {
    const matchesSearch = search === '' ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.content.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const pinnedThreads = filteredThreads.filter((t) => t.isPinned);
  const regularThreads = filteredThreads.filter((t) => !t.isPinned);

  const uniqueAuthors = new Set(threads.map((t) => t.author.id)).size;
  const popularThreadCount = threads.filter((t) => t.viewCount >= 100).length;
  const totalInteractions = threads.reduce((sum, t) => sum + t._count.posts + t.viewCount, 0);

  const displayCategories = categories.length > 0
    ? [
        { id: 'all', label: 'Todos', slug: 'all', icon: Filter },
        ...categories.map((c) => ({
          id: c.slug,
          label: c.name,
          slug: c.slug,
          icon: categoryIconMap[c.slug] || MessageSquare,
        })),
      ]
    : [
        { id: 'all', label: 'Todos', slug: 'all', icon: Filter },
        { id: 'general', label: 'General', slug: 'general', icon: MessageSquare },
        { id: 'techniques', label: 'Técnicas', slug: 'techniques', icon: Palette },
        { id: 'prompts', label: 'Prompts IA', slug: 'prompts', icon: Lightbulb },
        { id: 'publishing', label: 'Publicación', slug: 'publishing', icon: BookOpen },
        { id: 'growth', label: 'Crecimiento', slug: 'growth', icon: TrendingUp },
        { id: 'announcements', label: 'Anuncios', slug: 'announcements', icon: Megaphone },
      ];

  const handleNewThread = async () => {
    if (!newTitle.trim() || !newContent.trim() || !newCategorySlug) return;
    setIsSubmitting(true);
    try {
      const catObj = categories.find((c) => c.slug === newCategorySlug);
      if (!catObj) return;
      const res = await fetch('/api/forum/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          content: newContent.trim(),
          categoryId: catObj.id,
        }),
      });
      if (res.ok) {
        setShowNewThread(false);
        setNewTitle('');
        setNewContent('');
        setNewCategorySlug('');
        fetchThreads();
      } else {
        setSubmitError('Error al crear el hilo. Inténtalo de nuevo.');
      }
    } catch {
      setSubmitError('Error de conexión al crear el hilo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Comunidad</h1>
          <p className="text-[var(--text-tertiary)] mt-1">
            Conecta con otros creadores, comparte experiencias y aprende
          </p>
        </div>
        <Button size="lg" className="w-full sm:w-auto cursor-pointer" onClick={() => setShowNewThread(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Hilo
        </Button>
      </div>

      {showNewThread && (
        <Card className="mb-6 border border-[var(--primary)]/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--text-primary)]">Nuevo Hilo</h3>
              <button onClick={() => setShowNewThread(false)} className="cursor-pointer p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <Input
                placeholder="Título del hilo"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <textarea
                className="w-full rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] p-3 text-[var(--text-primary)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                rows={4}
                placeholder="Escribe el contenido..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                {displayCategories.filter((c) => c.id !== 'all').map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.slug}
                      onClick={() => setNewCategorySlug(cat.slug)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        newCategorySlug === cat.slug
                          ? 'bg-[var(--primary)] text-[var(--text-inverse)]'
                          : 'bg-[var(--surface-sunken)] text-[var(--text-secondary)] border border-[var(--border)]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
              <Button
                onClick={handleNewThread}
                disabled={isSubmitting || !newTitle.trim() || !newContent.trim() || !newCategorySlug}
                className="cursor-pointer"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Publicar Hilo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-[var(--primary-subtle)] rounded-lg">
              <Users className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <div>
      <p className="text-2xl font-bold text-[var(--text-primary)]">{uniqueAuthors}</p>
          <p className="text-xs text-[var(--text-tertiary)]">Creadores activos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-[var(--secondary-subtle)] rounded-lg">
              <MessageSquare className="w-5 h-5 text-[var(--accent-purple)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{threads.length}</p>
              <p className="text-xs text-[var(--text-tertiary)]">Hilos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-[var(--success)]/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-[var(--success)]" />
            </div>
            <div>
      <p className="text-2xl font-bold text-[var(--text-primary)]">{popularThreadCount}</p>
          <p className="text-xs text-[var(--text-tertiary)]">Hilos populares</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-[var(--warning)]/10 rounded-lg">
              <Heart className="w-5 h-5 text-[var(--warning)]" />
            </div>
            <div>
      <p className="text-2xl font-bold text-[var(--text-primary)]">{totalInteractions.toLocaleString()}</p>
          <p className="text-xs text-[var(--text-tertiary)]">Interacciones</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <Input
            placeholder="Buscar hilos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {displayCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-[var(--primary)] text-[var(--text-inverse)]'
                    : 'bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {fetchError && (
    <div className="bg-[var(--error)]/10 border border-[var(--error)]/30 text-[var(--error)] rounded-xl p-3 mb-6 text-sm font-medium flex items-center gap-2">
      <AlertTriangle size={16} /> {fetchError}
      <button onClick={fetchThreads} className="ml-auto underline cursor-pointer">Reintentar</button>
    </div>
  )}

  {submitError && (
    <div className="bg-[var(--error)]/10 border border-[var(--error)]/30 text-[var(--error)] rounded-xl p-3 mb-6 text-sm font-medium flex items-center gap-2">
      <AlertTriangle size={16} /> {submitError}
    </div>
  )}

  {isLoading ? (
        <div className="flex justify-center py-12" role="status">
          <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {pinnedThreads.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1">
                <Pin className="w-3.5 h-3.5" /> Fijados
              </h3>
              {pinnedThreads.map((thread) => (
                <ThreadCard key={thread.id} thread={thread} />
              ))}
              {regularThreads.length > 0 && (
                <h3 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wider pt-4">
                  Recientes
                </h3>
              )}
            </>
          )}
          {regularThreads.map((thread) => (
            <ThreadCard key={thread.id} thread={thread} />
          ))}
          {filteredThreads.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-[var(--text-tertiary)]" />
              <p className="text-[var(--text-secondary)] font-medium">No se encontraron hilos</p>
              <p className="text-sm text-[var(--text-tertiary)] mt-1">
                Intenta con otra búsqueda o categoría
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const categoryColorMap: Record<string, string> = {
  general: 'bg-[var(--surface-sunken)] text-[var(--text-secondary)]',
  techniques: 'bg-[var(--accent-purple)]/10 text-[var(--accent-purple)]',
  prompts: 'bg-[var(--warning)]/10 text-[var(--warning)]',
  publishing: 'bg-[var(--info)]/10 text-[var(--info)]',
  growth: 'bg-[var(--success)]/10 text-[var(--success)]',
  announcements: 'bg-[var(--error)]/10 text-[var(--error)]',
};

function ThreadCard({ thread }: { thread: ApiForumThread }) {
  const displayName = thread.author.displayName || thread.author.username;
  const catSlug = thread.category?.slug || 'general';
  const catName = thread.category?.name || 'General';
  const colorClass = categoryColorMap[catSlug] || categoryColorMap.general;

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)] rounded-full flex items-center justify-center text-[var(--text-inverse)] font-bold text-sm shrink-0">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {thread.isPinned && (
                <Pin className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
              )}
              <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors truncate">
                {thread.title}
              </h3>
              {thread.isLocked && (
                <span className="text-xs text-[var(--text-tertiary)]">🔒</span>
              )}
            </div>
            <p className="text-sm text-[var(--text-tertiary)] line-clamp-1 mb-2">
              {thread.content}
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-[var(--text-secondary)]">{displayName}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorClass}`}>
                {catName}
              </span>
              <span className="text-xs text-[var(--text-tertiary)]">{timeAgo(thread.createdAt)}</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-sm text-[var(--text-tertiary)] shrink-0">
            <div className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              {thread._count.posts}
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              {thread.viewCount}
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--primary)] transition-colors" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
