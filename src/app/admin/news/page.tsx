'use client';

import {
  Newspaper,
  Plus,
  Trash2,
  Edit,
  Loader2,
  AlertTriangle,
  Eye,
  EyeOff,
  Globe,
  Calendar,
  Search,
} from 'lucide-react';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';

interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  titleEn?: string | null;
  excerptEn?: string | null;
  contentEn?: string | null;
  coverUrl: string | null;
  category: string;
  authorId: string;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

const CATEGORIES = [
  { value: 'platform', label: 'Plataforma' },
  { value: 'community', label: 'Comunidad' },
  { value: 'tools', label: 'Herramientas' },
  { value: 'mobile', label: 'Móvil' },
  { value: 'contest', label: 'Concurso' },
];

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminNewsPage() {
  const { data, error, isLoading } = useSWR<{ articles: NewsArticle[] }>(
    '/api/admin/news',
    fetcher,
    { refreshInterval: 30000 }
  );

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<NewsArticle | null>(null);
  const [showDelete, setShowDelete] = useState<NewsArticle | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formExcerpt, setFormExcerpt] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCoverUrl, setFormCoverUrl] = useState('');
  const [formCategory, setFormCategory] = useState('platform');
  const [formTitleEn, setFormTitleEn] = useState('');
  const [formExcerptEn, setFormExcerptEn] = useState('');
  const [formContentEn, setFormContentEn] = useState('');
  const [formIsPublished, setFormIsPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resetForm = () => {
    setFormTitle('');
    setFormSlug('');
    setFormExcerpt('');
    setFormContent('');
    setFormTitleEn('');
    setFormExcerptEn('');
    setFormContentEn('');
    setFormCoverUrl('');
    setFormCategory('platform');
    setFormIsPublished(false);
    setErrorMsg(null);
  };

  const autoGenerateSlug = (title: string, currentSlug: string) => {
    if (!currentSlug) {
      setFormSlug(
        title
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim()
      );
    }
  };

  const handleCreate = async () => {
    if (!formTitle || !formExcerpt || !formContent) {
      setErrorMsg('Título, extracto y contenido son requeridos');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      const body: Record<string, unknown> = {
        title: formTitle,
        slug: formSlug || formTitle.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim(),
        excerpt: formExcerpt,
        content: formContent,
        titleEn: formTitleEn || null,
        excerptEn: formExcerptEn || null,
        contentEn: formContentEn || null,
        category: formCategory,
        isPublished: formIsPublished,
      };
      if (formCoverUrl) body.coverUrl = formCoverUrl;

      const res = await fetch('/api/admin/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al crear noticia');
      }

      resetForm();
      setShowCreate(false);
      mutate('/api/admin/news');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!showEdit) return;
    if (!formTitle || !formExcerpt || !formContent) {
      setErrorMsg('Título, extracto y contenido son requeridos');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      const body: Record<string, unknown> = {
        title: formTitle,
        excerpt: formExcerpt,
        content: formContent,
        titleEn: formTitleEn || null,
        excerptEn: formExcerptEn || null,
        contentEn: formContentEn || null,
        category: formCategory,
        isPublished: formIsPublished,
      };
      if (formSlug) body.slug = formSlug;
      if (formCoverUrl) body.coverUrl = formCoverUrl;
      else body.coverUrl = null;

      const res = await fetch(`/api/admin/news/${showEdit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al actualizar noticia');
      }

      setShowEdit(null);
      resetForm();
      mutate('/api/admin/news');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!showDelete) return;

    try {
      const res = await fetch(`/api/admin/news/${showDelete.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al eliminar noticia');
      }

      setShowDelete(null);
      mutate('/api/admin/news');
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const openEdit = (article: NewsArticle) => {
    setFormTitle(article.title);
    setFormSlug(article.slug);
    setFormExcerpt(article.excerpt);
    setFormContent(article.content);
    setFormTitleEn(article.titleEn || '');
    setFormExcerptEn(article.excerptEn || '');
    setFormContentEn(article.contentEn || '');
    setFormCoverUrl(article.coverUrl || '');
    setFormCategory(article.category);
    setFormIsPublished(article.isPublished);
    setErrorMsg(null);
    setShowEdit(article);
  };

  const togglePublish = async (article: NewsArticle) => {
    try {
      const res = await fetch(`/api/admin/news/${article.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !article.isPublished }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al cambiar estado');
      }

      mutate('/api/admin/news');
    } catch (err: any) {
      console.error('Error toggling publish:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-[var(--surface-sunken)] rounded w-1/4" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-[var(--surface-sunken)] rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-[var(--error)]" />
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Error al cargar noticias</h2>
        <Button onClick={() => mutate('/api/admin/news')} className="mt-4">
          Reintentar
        </Button>
      </div>
    );
  }

  const articles = data?.articles || [];
  const filteredArticles = searchQuery
    ? articles.filter(
        (a) =>
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : articles;

  const categoryBadge = (cat: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }> = {
      platform: { variant: 'default' },
      community: { variant: 'warning' },
      tools: { variant: 'secondary' },
      mobile: { variant: 'success' },
      contest: { variant: 'destructive' },
    };
    return config[cat] || { variant: 'default' as const };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-[var(--primary)]" />
            Noticias
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Gestiona las noticias y novedades de la plataforma.
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowCreate(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Noticia
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <Input
              placeholder="Buscar noticias..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              aria-label="Buscar noticias"
            />
          </div>
        </CardContent>
      </Card>

      {filteredArticles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Newspaper className="w-12 h-12 mx-auto mb-4 text-[var(--text-tertiary)]" />
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
              {searchQuery ? 'Sin resultados' : 'No hay noticias'}
            </h3>
            <p className="text-[var(--text-secondary)] mb-4">
              {searchQuery
                ? 'Intenta con otros términos de búsqueda.'
                : 'Crea la primera noticia para mantener informada a la comunidad.'}
            </p>
            {!searchQuery && (
              <Button onClick={() => { resetForm(); setShowCreate(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Noticia
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredArticles.map((article) => (
            <Card key={article.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant={article.isPublished ? 'success' : 'secondary'}>
                        {article.isPublished ? (
                          <><Globe className="w-3 h-3 mr-1" />Publicada</>
                        ) : (
                          <><EyeOff className="w-3 h-3 mr-1" />Borrador</>
                        )}
                      </Badge>
                      <Badge {...categoryBadge(article.category)} className="capitalize">
                        {CATEGORIES.find((c) => c.value === article.category)?.label || article.category}
                      </Badge>
                      {article.publishedAt && (
                        <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(article.publishedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-[var(--text-primary)] truncate mb-1">
                      {article.title}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-2">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
                      <span>Por: {article.author.displayName || article.author.username}</span>
                      <span>Creado: {new Date(article.createdAt).toLocaleDateString()}</span>
                      {article.coverUrl && <span>📷 Portada</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => togglePublish(article)}
                      title={article.isPublished ? 'Despublicar' : 'Publicar'}
                    >
                      {article.isPublished ? (
                        <EyeOff className="w-4 h-4 text-[var(--warning)]" />
                      ) : (
                        <Eye className="w-4 h-4 text-[var(--success)]" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(article)}
                      title="Editar"
                    >
                      <Edit className="w-4 h-4 text-[var(--primary)]" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { setShowDelete(article); setErrorMsg(null); }}
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4 text-[var(--error)]" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Nueva Noticia
            </DialogTitle>
            <DialogDescription>
              Crea una nueva noticia para informar a la comunidad.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="news-title">Título</Label>
              <Input
                id="news-title"
                placeholder="Título de la noticia"
                value={formTitle}                    onChange={(e) => {
                      const val = e.target.value;
                      setFormTitle(val);
                      autoGenerateSlug(val, formSlug);
                    }}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="news-slug">Slug (URL)</Label>
              <Input
                id="news-slug"
                placeholder="mi-noticia"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                className="mt-1 font-mono text-sm"
              />
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                Solo letras minúsculas, números y guiones. Se genera automáticamente.
              </p>
            </div>
            <div>
              <Label htmlFor="news-excerpt">Extracto</Label>
              <Textarea
                id="news-excerpt"
                placeholder="Breve descripción que aparecerá en la lista de noticias"
                value={formExcerpt}
                onChange={(e) => setFormExcerpt(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="news-content">Contenido</Label>
              <div className="mt-1">
                <RichTextEditor
                  value={formContent}
                  onChange={setFormContent}
                  placeholder="Escribe el contenido de la noticia..."
                  minHeight={300}
                />
              </div>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                Usa el editor para dar formato al contenido. Soporta negritas, listas, enlaces e imágenes.
              </p>
            </div>

            {/* English version */}
            <details className="group">
              <summary className="text-sm font-medium text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none">
                <span className="inline-flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 font-bold">EN</span>
                  Versión en inglés (opcional)
                </span>
              </summary>
              <div className="mt-4 space-y-4 border-l-2 border-blue-500/20 pl-4">
                <div>
                  <Label htmlFor="news-title-en">Título (inglés)</Label>
                  <Input
                    id="news-title-en"
                    placeholder="News title in English"
                    value={formTitleEn}
                    onChange={(e) => setFormTitleEn(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="news-excerpt-en">Extracto (inglés)</Label>
                  <Textarea
                    id="news-excerpt-en"
                    placeholder="Brief description in English"
                    value={formExcerptEn}
                    onChange={(e) => setFormExcerptEn(e.target.value)}
                    className="mt-1"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="news-content-en">Contenido (inglés)</Label>
                  <div className="mt-1">
                    <RichTextEditor
                      value={formContentEn}
                      onChange={setFormContentEn}
                      placeholder="Write the news content in English..."
                      minHeight={200}
                    />
                  </div>
                </div>
              </div>
            </details>

            <div>
              <Label htmlFor="news-cover">URL de Portada (opcional)</Label>
              <Input
                id="news-cover"
                placeholder="https://ejemplo.com/imagen.jpg"
                value={formCoverUrl}
                onChange={(e) => setFormCoverUrl(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="news-category">Categoría</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end pb-2">
                <div className="flex items-center justify-between w-full p-3 bg-[var(--surface-sunken)] rounded-lg border border-[var(--border)]">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Publicar</p>
                    <p className="text-xs text-[var(--text-tertiary)]">Visible para todos los usuarios</p>
                  </div>
                  <Switch checked={formIsPublished} onCheckedChange={setFormIsPublished} />
                </div>
              </div>
            </div>
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg text-sm text-[var(--error)]">
                <AlertTriangle className="w-4 h-4" />
                {errorMsg}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {formIsPublished ? 'Publicar' : 'Guardar Borrador'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!showEdit} onOpenChange={(open) => { if (!open) setShowEdit(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Editar Noticia
            </DialogTitle>
            <DialogDescription>
              Actualiza los detalles de la noticia.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Título</Label>
              <Input
                id="edit-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-slug">Slug (URL)</Label>
              <Input
                id="edit-slug"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                className="mt-1 font-mono text-sm"
              />
            </div>
            <div>
              <Label htmlFor="edit-excerpt">Extracto</Label>
              <Textarea
                id="edit-excerpt"
                value={formExcerpt}
                onChange={(e) => setFormExcerpt(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="edit-content">Contenido</Label>
              <div className="mt-1">
                <RichTextEditor
                  value={formContent}
                  onChange={setFormContent}
                  placeholder="Escribe el contenido de la noticia..."
                  minHeight={300}
                />
              </div>
            </div>

            {/* English version */}
            <details className="group">
              <summary className="text-sm font-medium text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none">
                <span className="inline-flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 font-bold">EN</span>
                  Versión en inglés (opcional)
                </span>
              </summary>
              <div className="mt-4 space-y-4 border-l-2 border-blue-500/20 pl-4">
                <div>
                  <Label htmlFor="edit-title-en">Título (inglés)</Label>
                  <Input
                    id="edit-title-en"
                    placeholder="News title in English"
                    value={formTitleEn}
                    onChange={(e) => setFormTitleEn(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-excerpt-en">Extracto (inglés)</Label>
                  <Textarea
                    id="edit-excerpt-en"
                    placeholder="Brief description in English"
                    value={formExcerptEn}
                    onChange={(e) => setFormExcerptEn(e.target.value)}
                    className="mt-1"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-content-en">Contenido (inglés)</Label>
                  <div className="mt-1">
                    <RichTextEditor
                      value={formContentEn}
                      onChange={setFormContentEn}
                      placeholder="Write the news content in English..."
                      minHeight={200}
                    />
                  </div>
                </div>
              </div>
            </details>

            <div>
              <Label htmlFor="edit-cover">URL de Portada (opcional)</Label>
              <Input
                id="edit-cover"
                placeholder="https://ejemplo.com/imagen.jpg"
                value={formCoverUrl}
                onChange={(e) => setFormCoverUrl(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-category">Categoría</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end pb-2">
                <div className="flex items-center justify-between w-full p-3 bg-[var(--surface-sunken)] rounded-lg border border-[var(--border)]">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Publicada</p>
                    <p className="text-xs text-[var(--text-tertiary)]">Visible para todos</p>
                  </div>
                  <Switch checked={formIsPublished} onCheckedChange={setFormIsPublished} />
                </div>
              </div>
            </div>
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg text-sm text-[var(--error)]">
                <AlertTriangle className="w-4 h-4" />
                {errorMsg}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(null)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!showDelete} onOpenChange={(open) => { if (!open) setShowDelete(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-[var(--error)]" />
              Eliminar Noticia
            </DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. La noticia se eliminará permanentemente.
            </DialogDescription>
          </DialogHeader>
          {showDelete && (
            <div className="bg-[var(--surface-sunken)] p-4 rounded-lg my-4">
              <p className="text-sm font-medium text-[var(--text-primary)]">{showDelete.title}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                /news/{showDelete.publishedAt ? new Date(showDelete.publishedAt).toISOString().split('T')[0].split('-').slice(0, 2).join('/') : 'draft'}/{showDelete.slug}
              </p>
            </div>
          )}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg text-sm text-[var(--error)]">
              <AlertTriangle className="w-4 h-4" />
              {errorMsg}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
