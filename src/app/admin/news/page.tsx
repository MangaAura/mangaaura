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
  Maximize2,
  Minimize2,
  Upload,
  Clock,
  X,
  CheckCircle2,
  ImageIcon,
  FileText,
  Languages,
  Monitor,
  Star,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
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
import { ImageCropperUploader, type ImageCropperUploaderHandle } from '@/components/ui/ImageCropperUploader';
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
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { fetcher } from '@/lib/swr-config';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Administrar Noticias | MangaAura',
  description: 'Gestiona las noticias y artículos del blog en MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Administrar Noticias | MangaAura',
    description: 'Gestiona las noticias y artículos del blog en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Administrar Noticias | MangaAura',
    description: 'Gestiona las noticias en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/admin/news' },
};

// ─── Constants ────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'platform', label: 'Plataforma' },
  { value: 'community', label: 'Comunidad' },
  { value: 'tools', label: 'Herramientas' },
  { value: 'mobile', label: 'Móvil' },
  { value: 'contest', label: 'Concurso' },
];

const CATEGORY_COLORS: Record<string, string> = {
  platform: 'from-blue-600/40 to-blue-600/10',
  community: 'from-amber-600/40 to-amber-600/10',
  tools: 'from-purple-600/40 to-purple-600/10',
  mobile: 'from-green-600/40 to-green-600/10',
  contest: 'from-red-600/40 to-red-600/10',
};

const CATEGORY_BADGE: Record<string, string> = {
  platform: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  community: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  tools: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  mobile: 'bg-green-500/15 text-green-400 border-green-500/20',
  contest: 'bg-red-500/15 text-red-400 border-red-500/20',
};

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
  isPublished: boolean;
  isFeatured: boolean;
  publishedAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  author: {
    username: string;
    displayName: string | null;
  };
}

// ─── Preview Component ───────────────────────────────────────────────

function ArticlePreview({
  title,
  excerpt,
  content,
  coverUrl,
  category,
  titleEn,
  excerptEn,
  contentEn,
  showEnglish,
}: {
  title: string;
  excerpt: string;
  content: string;
  coverUrl: string | null;
  category: string;
  titleEn?: string | null;
  excerptEn?: string | null;
  contentEn?: string | null;
  showEnglish: boolean;
}) {
  const gradient = CATEGORY_COLORS[category] || CATEGORY_COLORS.platform;
  const badgeColors = CATEGORY_BADGE[category] || CATEGORY_BADGE.platform;

  const displayTitle = showEnglish && titleEn ? titleEn : title;
  const displayExcerpt = showEnglish && excerptEn ? excerptEn : excerpt;
  const displayContent = showEnglish && contentEn ? contentEn : content;

  return (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden">
      {/* Header gradient */}
      <div className={`relative bg-gradient-to-b ${gradient} px-6 py-8`}>
        <div className="flex items-center gap-2 mb-4">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${badgeColors}`}>
            {CATEGORIES.find((c) => c.value === category)?.label || category}
          </span>
          {showEnglish && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 font-bold">EN</span>
          )}
          {!displayTitle && (
            <span className="text-[10px] text-[var(--text-tertiary)]">(sin título)</span>
          )}
        </div>
        <h2 className="text-2xl font-extrabold text-[var(--text-primary)] leading-tight">
          {displayTitle || 'Título de la noticia'}
        </h2>
        <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed max-w-xl">
          {displayExcerpt || 'Extracto de la noticia...'}
        </p>
      </div>

      {/* Cover image */}
      {coverUrl && (
        <div className="relative w-full aspect-video bg-[var(--surface-sunken)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverUrl}
            alt="Cover preview"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="px-6 py-6">
        {displayContent ? (
          <div
            className="prose prose-sm max-w-none text-[var(--text-primary)]
              prose-headings:text-[var(--text-primary)]
              prose-a:text-[var(--primary)] prose-a:no-underline hover:prose-a:underline
              prose-strong:text-[var(--text-primary)]
              prose-code:text-[var(--text-primary)] prose-code:bg-[var(--surface-sunken)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
              prose-pre:bg-[var(--surface-sunken)] prose-pre:border prose-pre:border-[var(--border)]
              prose-blockquote:border-[var(--primary)] prose-blockquote:text-[var(--text-secondary)]
              prose-img:rounded-lg prose-img:my-4
              prose-table:border prose-table:border-[var(--border)]
              prose-th:bg-[var(--surface-sunken)] prose-th:px-3 prose-th:py-2
              prose-td:px-3 prose-td:py-2 prose-td:border-t prose-td:border-[var(--border)]
              [&_.tiptap-image]:rounded-lg [&_.tiptap-image]:my-4"
            dangerouslySetInnerHTML={{ __html: displayContent }}
          />
        ) : (
          <div className="flex items-center justify-center py-12 text-[var(--text-tertiary)]">
            <FileText className="w-8 h-8 mr-3 opacity-40" />
            <p className="text-sm">Escribe el contenido para ver la vista previa</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Cover Image Uploader ────────────────────────────────────────────

function CoverImageUploader({
  coverUrl,
  onChange,
}: {
  coverUrl: string;
  onChange: (url: string) => void;
}) {
  const cropperRef = useRef<ImageCropperUploaderHandle>(null);
  const [mode, setMode] = useState<'url' | 'upload'>('url');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const hasImage = coverUrl || localPreview;
  const displayUrl = localPreview || coverUrl;

  /** Called when the cropper confirms — uploads the cropped blob */
  const handleCropConfirm = async (croppedBlob: Blob) => {
    setUploading(true);
    setUploadError(null);

    try {
      const blobType = croppedBlob.type || 'image/webp';
      const ext = blobType.split('/')[1] || 'webp';
      const croppedFile = new File([croppedBlob], `cover.${ext}`, {
        type: blobType,
      });

      const formData = new FormData();
      formData.append('file', croppedFile);

      const res = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error al subir' }));
        throw new Error(err.error || `Error ${res.status}`);
      }

      const data = await res.json();
      if (data.success && data.url) {
        onChange(data.url);
        if (localPreview) URL.revokeObjectURL(localPreview);
        setLocalPreview(null);
      } else {
        throw new Error(data.error || 'Respuesta inv\u00e1lida');
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange('');
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      cropperRef.current?.processFile(file);
    }
  };

  const handleUrlChange = (url: string) => {
    onChange(url);
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(null);
  };

  return (
    <>
      {/* Cropper fullscreen overlay — handles file select + crop lifecycle */}
      <ImageCropperUploader
        ref={cropperRef}
        aspect={16 / 9}
        cropperTitle="Ajustar portada"
        cropperSubtitle="Arrastra para encuadrar · Ratio 16:9"
        onCropComplete={handleCropConfirm}
        onError={setUploadError}
      />

      <div className="space-y-2">
        <Label>Imagen de portada</Label>

        {hasImage ? (
          <div className="relative rounded-lg overflow-hidden border border-[var(--border)] group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayUrl}
              alt="Cover preview"
              className="w-full h-40 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => cropperRef.current?.open()}
                  className="px-3 py-1.5 text-xs font-medium bg-white/90 text-gray-900 rounded-md hover:bg-white transition-colors flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Cambiar
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="px-3 py-1.5 text-xs font-medium bg-red-500/90 text-white rounded-md hover:bg-red-500 transition-colors flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  Quitar
                </button>
              </div>
            </div>
          </div>
        ) : !uploading ? (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => cropperRef.current?.open()}
            className="relative border-2 border-dashed border-[var(--border)] rounded-lg p-6 text-center cursor-pointer hover:border-[var(--primary)]/40 hover:bg-[var(--surface-sunken)] transition-colors"
          >
            <div className="flex flex-col items-center gap-1.5">
              <ImageIcon className="w-6 h-6 text-[var(--text-tertiary)]" />
              <p className="text-xs text-[var(--text-secondary)] font-medium">
                Arrastra una imagen o haz clic para subir
              </p>
              <p className="text-[10px] text-[var(--text-tertiary)]">
                JPEG, PNG, WebP · Max 10MB · Se recortará a 16:9 automáticamente
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-8 border border-dashed border-[var(--border)] rounded-lg">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
            <p className="text-xs text-[var(--text-secondary)]">Subiendo imagen recortada...</p>
          </div>
        )}

        {/* URL input fallback */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            <Input
              placeholder="o pega una URL..."
              value={coverUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              className="pl-8 text-xs"
            />
          </div>
          {mode === 'url' ? (
            <button
              type="button"
              onClick={() => setMode('upload')}
              className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] whitespace-nowrap"
              title="Cambiar a subir archivo"
            >
              <Upload className="w-3.5 h-3.5 inline" /> Subir
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setMode('url')}
              className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] whitespace-nowrap"
              title="Cambiar a URL"
            >
              <Globe className="w-3.5 h-3.5 inline" /> URL
            </button>
          )}
        </div>

        {uploadError && (
          <p className="text-xs text-red-500">{uploadError}</p>
        )}
      </div>
    </>
  );
}

// ─── Form Component (shared between create & edit) ───────────────────

function NewsForm({
  mode,
  initialData,
  onClose,
  onSave,
}: {
  mode: 'create' | 'edit';
  initialData?: Partial<NewsArticle> | null;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => Promise<void>;
}) {
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [langTab, setLangTab] = useState<'es' | 'en'>('es');
  const [fullscreen, setFullscreen] = useState(false);

  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [titleEn, setTitleEn] = useState(initialData?.titleEn || '');
  const [excerptEn, setExcerptEn] = useState(initialData?.excerptEn || '');
  const [contentEn, setContentEn] = useState(initialData?.contentEn || '');
  const [coverUrl, setCoverUrl] = useState(initialData?.coverUrl || '');
  const [category, setCategory] = useState(initialData?.category || 'platform');
  const [isPublished, setIsPublished] = useState(initialData?.isPublished || false);
  // Convert ISO string from API to datetime-local format for the input
  const toDatetimeLocal = (isoStr: string | null | undefined): string => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return '';
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  };

  const [scheduledAt, setScheduledAt] = useState(toDatetimeLocal(initialData?.scheduledAt));
  const [isFeatured, setIsFeatured] = useState(initialData?.isFeatured || false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const autoGenerateSlug = (val: string, currentSlug: string) => {
    if (!currentSlug && mode === 'create') {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim()
      );
    }
  };

  const handleSave = async () => {
    if (!title || !excerpt || !content) {
      setErrorMsg('Título, extracto y contenido son requeridos');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      const data: Record<string, unknown> = {
        title,
        slug: slug || title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim(),
        excerpt,
        content,
        titleEn: titleEn || null,
        excerptEn: excerptEn || null,
        contentEn: contentEn || null,
        coverUrl: coverUrl || null,
        category,
        isPublished,
        isFeatured,
        scheduledAt: scheduledAt || null,
      };

      await onSave(data);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col',
        fullscreen && 'fixed inset-0 z-[100] bg-[var(--surface)]'
      )}
      onKeyDown={handleKeyDown}
    >
      {/* Header with tabs */}
      <div className={cn(
        'flex items-center justify-between border-b border-[var(--border)]',
        fullscreen ? 'px-6 py-3' : 'px-0 pb-4'
      )}>
        <div className="flex items-center gap-1 bg-[var(--surface-sunken)] rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setTab('edit')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              tab === 'edit'
                ? 'bg-[var(--surface-elevated)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            Editar
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              tab === 'preview'
                ? 'bg-[var(--surface-elevated)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            )}
          >
            <Monitor className="w-3.5 h-3.5" />
            Vista previa
          </button>
        </div>

        <div className="flex items-center gap-2">
          {!fullscreen && tab === 'edit' && (
            <button
              type="button"
              onClick={() => setFullscreen(true)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] rounded transition-colors"
              title="Editor a pantalla completa"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pantalla completa</span>
            </button>
          )}
          {fullscreen && (
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] rounded transition-colors"
              title="Salir de pantalla completa"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className={cn(fullscreen ? 'flex-1 overflow-y-auto p-6' : '')}>
        {tab === 'preview' ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="news-lang-toggle"
                    checked={langTab === 'en'}
                    onChange={(e) => setLangTab(e.target.checked ? 'en' : 'es')}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[var(--surface-sunken)] peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-[var(--primary)] rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                  <span className="ms-2 text-xs font-medium text-[var(--text-secondary)]">
                    <Languages className="w-3 h-3 inline mr-1" />
                    {langTab === 'en' ? 'English' : 'Español'}
                  </span>
                </label>
              </div>
            </div>
            <ArticlePreview
              title={title}
              excerpt={excerpt}
              content={content}
              coverUrl={coverUrl}
              category={category}
              titleEn={titleEn}
              excerptEn={excerptEn}
              contentEn={contentEn}
              showEnglish={langTab === 'en'}
            />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Language tabs for main fields */}
            <div className="flex items-center gap-1 bg-[var(--surface-sunken)] rounded-lg p-0.5 w-fit">
              <button
                type="button"
                onClick={() => setLangTab('es')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                  langTab === 'es'
                    ? 'bg-[var(--surface-elevated)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                )}
              >
                🇪🇸 Español
              </button>
              <button
                type="button"
                onClick={() => setLangTab('en')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                  langTab === 'en'
                    ? 'bg-[var(--surface-elevated)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                )}
              >
                🇬🇧 English
              </button>
            </div>

            {langTab === 'es' ? (
              <>
                <div>
                  <Label htmlFor="news-title" className="text-sm font-medium">Título</Label>
                  <Input
                    id="news-title"
                    placeholder="Título de la noticia"
                    value={title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTitle(val);
                      autoGenerateSlug(val, slug);
                    }}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="news-slug" className="text-sm font-medium">Slug (URL)</Label>
                  <Input
                    id="news-slug"
                    placeholder="mi-noticia"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="mt-1 font-mono text-sm"
                  />
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    Solo letras minúsculas, números y guiones. Se genera automáticamente desde el título.
                  </p>
                </div>
                <div>
                  <Label htmlFor="news-excerpt" className="text-sm font-medium">Extracto</Label>
                  <Textarea
                    id="news-excerpt"
                    placeholder="Breve descripción que aparecerá en la lista de noticias"
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    className="mt-1"
                    rows={2}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="news-content" className="text-sm font-medium">Contenido</Label>
                    <div className="flex items-center gap-1">
                      {!fullscreen && (
                        <button
                          type="button"
                          onClick={() => setFullscreen(true)}
                          className="flex items-center gap-1 px-2 py-1 text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] rounded transition-colors"
                        >
                          <Maximize2 className="w-3 h-3" />
                          Expandir
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-1">
                    <RichTextEditor
                      value={content}
                      onChange={setContent}
                      placeholder="Escribe el contenido de la noticia..."
                      minHeight={fullscreen ? 400 : 300}
                    />
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    Usa el editor para dar formato. Ctrl+S para guardar.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor="news-title-en" className="text-sm font-medium">Title (English)</Label>
                  <Input
                    id="news-title-en"
                    placeholder="News title in English"
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="news-excerpt-en" className="text-sm font-medium">Excerpt (English)</Label>
                  <Textarea
                    id="news-excerpt-en"
                    placeholder="Brief description in English"
                    value={excerptEn}
                    onChange={(e) => setExcerptEn(e.target.value)}
                    className="mt-1"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="news-content-en" className="text-sm font-medium">Content (English)</Label>
                  <div className="mt-1">
                    <RichTextEditor
                      value={contentEn}
                      onChange={setContentEn}
                      placeholder="Write the news content in English..."
                      minHeight={fullscreen ? 300 : 200}
                    />
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    Opcional. Si no se proporciona, se usará la traducción automática.
                  </p>
                </div>
              </>
            )}

            {/* Cover image */}
            <CoverImageUploader coverUrl={coverUrl} onChange={setCoverUrl} />

            {/* Category, Publish, Schedule */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="news-category" className="text-sm font-medium">Categoría</Label>
                <Select value={category} onValueChange={setCategory}>
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

              <div>
                <div className="flex items-center justify-between h-full">
                  <div className="flex-1 p-3 bg-[var(--surface-sunken)] rounded-lg border border-[var(--border)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">Publicar</p>
                        <p className="text-xs text-[var(--text-tertiary)]">
                          {isPublished ? 'Visible para todos' : 'Solo visible en admin'}
                        </p>
                      </div>
                      <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Scheduled publishing */}
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--text-tertiary)]" />
                <Label htmlFor="news-schedule" className="text-sm font-medium">Programar publicación (opcional)</Label>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="news-schedule"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => {
                    setScheduledAt(e.target.value);
                    if (e.target.value) setIsPublished(false);
                  }}
                  className="font-mono text-sm"
                />
                {scheduledAt && (
                  <button
                    type="button"
                    onClick={() => setScheduledAt('')}
                    className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] rounded transition-colors"
                    title="Eliminar programación"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {scheduledAt && (
                <p className="text-xs text-[var(--text-tertiary)] mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[var(--primary)]" />
                  Se publicará automáticamente el{' '}
                  {new Date(scheduledAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
              {isPublished && scheduledAt && (
                <p className="text-xs text-[var(--warning)] mt-1">
                  La publicación programada no se aplicará si está marcada como "Publicada". Desmarca la opción para usar la programación.
                </p>
              )}
            </div>

            {/* Featured toggle */}
            <div className="p-4 bg-amber-500/5 rounded-lg border border-amber-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Star className={cn(
                    'w-5 h-5',
                    isFeatured ? 'fill-amber-400 text-amber-400' : 'text-[var(--text-tertiary)]'
                  )} />
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Destacar en la homepage</p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {isFeatured
                        ? 'Aparecerá destacada en la página principal con un indicador especial'
                        : 'Aparecerá en la sección de noticias normal'}
                    </p>
                  </div>
                </div>
                <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg text-sm text-[var(--error)]">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {!fullscreen && (
        <DialogFooter className={cn(tab === 'preview' ? 'border-t border-[var(--border)] pt-4 mt-2' : 'mt-6')}>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {mode === 'create'
              ? isPublished ? 'Publicar' : 'Guardar Borrador'
              : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      )}

      {/* Fullscreen footer */}
      {fullscreen && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-[var(--border)] bg-[var(--surface)]">
          <div className="text-xs text-[var(--text-tertiary)]">
            {mode === 'create' ? 'Creando nueva noticia' : 'Editando noticia'} · Ctrl+S para guardar
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === 'create'
                ? isPublished ? 'Publicar' : 'Guardar Borrador'
                : 'Guardar Cambios'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────

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
  const [filterPublished, setFilterPublished] = useState<'all' | 'published' | 'draft'>('all');
  const { handleError } = useErrorHandler();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreate = async (data: Record<string, unknown>) => {
    const res = await fetch('/api/admin/news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al crear noticia');
    }

    mutate('/api/admin/news');
  };

  const handleEdit = async (id: string, data: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/news/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al actualizar noticia');
    }

    mutate('/api/admin/news');
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
      handleError(err);
    }
  };

  const toggleFeatured = async (article: NewsArticle) => {
    try {
      const res = await fetch(`/api/admin/news/${article.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !article.isFeatured }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al cambiar destacado');
      }

      mutate('/api/admin/news');
    } catch (err: any) {
      handleError(err);
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
  const filteredArticles = articles.filter((a) => {
    const matchesSearch = searchQuery
      ? a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesFilter =
      filterPublished === 'all' ? true :
      filterPublished === 'published' ? a.isPublished :
      !a.isPublished;
    return matchesSearch && matchesFilter;
  });

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

  const publishedCount = articles.filter((a) => a.isPublished).length;
  const draftCount = articles.filter((a) => !a.isPublished).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-[var(--primary)]" />
            Noticias
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Gestiona las noticias y novedades de la plataforma.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Noticia
        </Button>
      </div>

      {/* Search + Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
              <Input
                placeholder="Buscar noticias..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                aria-label="Buscar noticias"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex bg-[var(--surface-sunken)] rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setFilterPublished('all')}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                    filterPublished === 'all'
                      ? 'bg-[var(--surface-elevated)] text-[var(--text-primary)] shadow-sm'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                  )}
                >
                  Todas ({articles.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterPublished('published')}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                    filterPublished === 'published'
                      ? 'bg-[var(--surface-elevated)] text-[var(--text-primary)] shadow-sm'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                  )}
                >
                  Publicadas ({publishedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterPublished('draft')}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                    filterPublished === 'draft'
                      ? 'bg-[var(--surface-elevated)] text-[var(--text-primary)] shadow-sm'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                  )}
                >
                  Borradores ({draftCount})
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Article list */}
      {filteredArticles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Newspaper className="w-12 h-12 mx-auto mb-4 text-[var(--text-tertiary)]" />
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
              {searchQuery || filterPublished !== 'all' ? 'Sin resultados' : 'No hay noticias'}
            </h3>
            <p className="text-[var(--text-secondary)] mb-4">
              {searchQuery || filterPublished !== 'all'
                ? 'Intenta con otros filtros o términos de búsqueda.'
                : 'Crea la primera noticia para mantener informada a la comunidad.'}
            </p>
            {!searchQuery && filterPublished === 'all' && (
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Noticia
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredArticles.map((article) => {
            const isScheduled = article.scheduledAt && !article.isPublished;
            return (
              <Card key={article.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Badge variant={article.isPublished ? 'success' : isScheduled ? 'warning' : 'secondary'}>
                          {article.isPublished ? (
                            <><Globe className="w-3 h-3 mr-1" />Publicada</>
                          ) : isScheduled ? (
                            <><Clock className="w-3 h-3 mr-1" />Programada</>
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
                        {isScheduled && article.scheduledAt && (
                          <span className="text-xs text-[var(--warning)] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(article.scheduledAt).toLocaleDateString()}
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
                        {article.titleEn && <span>🌐 EN</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleFeatured(article)}
                        title={article.isFeatured ? 'Quitar destacado' : 'Destacar en homepage'}
                      >
                        <Star className={cn(
                          'w-4 h-4',
                          article.isFeatured ? 'fill-[var(--warning)] text-[var(--warning)]' : 'text-[var(--text-tertiary)]'
                        )} />
                      </Button>
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
                        onClick={() => setShowEdit(article)}
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
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className={cn(
          'max-h-[90vh] overflow-y-auto',
          'max-w-3xl'
        )}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-[var(--primary)]" />
              Nueva Noticia
            </DialogTitle>
            <DialogDescription>
              Crea una nueva noticia para informar a la comunidad. Usa el editor visual para dar formato al contenido.
            </DialogDescription>
          </DialogHeader>
          <NewsForm
            mode="create"
            onClose={() => setShowCreate(false)}
            onSave={handleCreate}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!showEdit} onOpenChange={(open) => { if (!open) setShowEdit(null); }}>
        <DialogContent className={cn(
          'max-h-[90vh] overflow-y-auto',
          'max-w-3xl'
        )}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-[var(--primary)]" />
              Editar Noticia
            </DialogTitle>
            <DialogDescription>
              Actualiza los detalles de la noticia. Los cambios se guardarán al hacer clic en "Guardar Cambios".
            </DialogDescription>
          </DialogHeader>
          {showEdit && (
            <NewsForm
              mode="edit"
              initialData={{
                title: showEdit.title,
                slug: showEdit.slug,
                excerpt: showEdit.excerpt,
                content: showEdit.content,
                titleEn: showEdit.titleEn,
                excerptEn: showEdit.excerptEn,
                contentEn: showEdit.contentEn,
                coverUrl: showEdit.coverUrl,
                category: showEdit.category,
                isPublished: showEdit.isPublished,
                isFeatured: showEdit.isFeatured,
                scheduledAt: showEdit.scheduledAt || '',
              }}
              onClose={() => setShowEdit(null)}
              onSave={(data) => handleEdit(showEdit.id, data)}
            />
          )}
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

// Helper for className merging (inline since cn import might not be used throughout)
function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
