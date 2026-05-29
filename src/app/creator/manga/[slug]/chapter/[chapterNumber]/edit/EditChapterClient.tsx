'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftIcon,
  SaveIcon,
  UploadCloud,
  Image as ImageIcon,
  GripVertical,
  Trash2,
  ArrowUp,
  ArrowDown,
  Loader2,
  CheckCircle,
  X,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  ZoomIn,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useCallback, useEffect, useRef, useState } from 'react';

import { OptimizedImage } from '@/components/Image/OptimizedImage';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ACCEPTED_FORMATS, MAX_FILE_SIZE } from '@/lib/storage-config';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────

interface ChapterData {
  id: string;
  mangaId: string;
  chapterNumber: number;
  title: string | null;
  totalPages: number;
  pageUrls: string[];
  createdAt: string;
  viewCount: number;
  manga: {
    id: string;
    title: string;
    slug: string;
    coverUrl: string | null;
    authorId: string;
    authorName: string;
  };
}

interface PageItem {
  id: string;
  url: string;
  isNew?: boolean;
  file?: File;
  preview?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function validateFile(file: File): string | null {
  if (!(ACCEPTED_FORMATS as readonly string[]).includes(file.type)) {
    return 'Formato no soportado. Usa JPEG, PNG o WebP.';
  }
  if (file.size > MAX_FILE_SIZE) {
    return `Archivo demasiado grande. Máximo ${MAX_FILE_SIZE / 1024 / 1024}MB.`;
  }
  return null;
}

// ─── Skeleton ────────────────────────────────────────────────────

function SkeletonBar({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-[var(--border)]/60 ${className ?? ''}`}
      aria-hidden="true"
    />
  );
}

function EditPageSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <div className="max-w-5xl mx-auto p-6 pt-4 space-y-6">
        <SkeletonBar className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-4">
            <SkeletonBar className="h-40 rounded-2xl" />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <SkeletonBar className="h-12 rounded-xl" />
            <SkeletonBar className="h-80 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ slug: string; chapterNumber: string }>;
}

export default function EditChapterClient({ params }: PageProps) {
  const { slug, chapterNumber: chapterNumberParam } = use(params);
  const router = useRouter();

  // State
  const [chapter, setChapter] = useState<ChapterData | null>(null);
  const [mangaId, setMangaId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [chapterNumber, setChapterNumber] = useState('');
  const [chapterTitle, setChapterTitle] = useState('');
  const [pages, setPages] = useState<PageItem[]>([]);

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Upload state
  const [isUploadingPage, setIsUploadingPage] = useState(false);
  const [uploadPageError, setUploadPageError] = useState<string | null>(null);

  // Drag state
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  // View & preview state
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const previewSrc = previewIndex !== null ? pages[previewIndex]?.preview || pages[previewIndex]?.url : null;

  // ─── Keyboard navigation for lightbox ──────────────────────

  useEffect(() => {
    if (previewIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewIndex(null);
      if (e.key === 'ArrowLeft') setPreviewIndex((prev) => prev !== null && prev > 0 ? prev - 1 : prev);
      if (e.key === 'ArrowRight') setPreviewIndex((prev) => prev !== null && prev < pages.length - 1 ? prev + 1 : prev);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewIndex, pages.length]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Fetch chapter data ──────────────────────────────────────

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Resolver slug del manga a su ID
        const mangaRes = await fetch(`/api/manga/${slug}`);
        if (!mangaRes.ok) {
          throw new Error('Manga no encontrado');
        }
        const mangaData = await mangaRes.json();
        const resolvedMangaId = mangaData.manga.id;
        setMangaId(resolvedMangaId);

        // 2. Obtener capítulo por número
        const res = await fetch(`/api/manga/${resolvedMangaId}/chapters/${chapterNumberParam}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Error al cargar el capítulo');
        }
        const data: ChapterData = await res.json();

        setChapter(data);
        setChapterNumber(String(data.chapterNumber));
        setChapterTitle(data.title || '');
        setPages(
          (data.pageUrls || []).map((url) => ({
            id: generateId(),
            url,
          }))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [slug, chapterNumberParam]);

  // ─── Cleanup previews on unmount ─────────────────────────────

  useEffect(() => {
    return () => {
      pages.forEach((p) => {
        if (p.preview) URL.revokeObjectURL(p.preview);
      });
    };
  }, []);

  // ─── Page reordering ─────────────────────────────────────────

  const movePage = useCallback((fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= pages.length) return;
    setPages((prev) => {
      const newPages = [...prev];
      const [moved] = newPages.splice(fromIndex, 1);
      newPages.splice(toIndex, 0, moved);
      return newPages;
    });
  }, [pages.length]);

  const removePage = useCallback((index: number) => {
    setPages((prev) => {
      const removed = prev[index];
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleDragStart = (index: number) => setDraggedItem(index);

  const handleDragOverItem = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;
    movePage(draggedItem, index);
    setDraggedItem(index);
  };

  const handleDragEnd = () => setDraggedItem(null);

  // ─── Add new pages ───────────────────────────────────────────

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPages: PageItem[] = [];
    let invalidCount = 0;
    for (const file of Array.from(files)) {
      const fileError = validateFile(file);
      if (fileError) {
        invalidCount++;
        continue;
      }
      newPages.push({
        id: generateId(),
        url: '',
        isNew: true,
        file,
        preview: URL.createObjectURL(file),
      });
    }

    if (invalidCount > 0) {
      setUploadPageError(
        `${invalidCount} archivo(s) ignorado(s): formato no válido o tamaño excedido (máx ${MAX_FILE_SIZE / 1024 / 1024}MB)`
      );
    }

    setPages((prev) => [...prev, ...newPages]);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addNewPages = () => fileInputRef.current?.click();

  // ─── Save ────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!chapter || !mangaId) return;

    const chapterNum = parseInt(chapterNumber);
    if (isNaN(chapterNum) || chapterNum < 1) {
      setSaveError('El número de capítulo debe ser un entero positivo');
      return;
    }

    if (pages.length === 0) {
      setSaveError('El capítulo debe tener al menos una página');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // 1. Upload any new pages first
      const finalUrls: string[] = [];

      for (const page of pages) {
        if (page.isNew && page.file) {
          setIsUploadingPage(true);
          setUploadPageError(null);

          const formData = new FormData();
          formData.append('file', page.file);

          const uploadRes = await fetch('/api/upload/image', {
            method: 'POST',
            body: formData,
          });

          if (!uploadRes.ok) {
            const errData = await uploadRes.json();
            throw new Error(errData.error || 'Error al subir imagen');
          }

          const uploadData = await uploadRes.json();
          finalUrls.push(uploadData.url);
        } else {
          finalUrls.push(page.url);
        }
      }

      setIsUploadingPage(false);

      // 2. Update chapter metadata
      const updateRes = await fetch(`/api/manga/${mangaId}/chapters/${chapter.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterNumber: chapterNum,
          title: chapterTitle.trim() || null,
          pageUrls: finalUrls,
        }),
      });

      if (!updateRes.ok) {
        const errData = await updateRes.json();
        throw new Error(errData.error || 'Error al actualizar el capítulo');
      }

      setIsSuccess(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSaving(false);
      setIsUploadingPage(false);
    }
  };

  // ─── Loading / Error states ──────────────────────────────────

  if (isLoading) return <EditPageSkeleton />;

  if (error || !chapter) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <main className="p-6">
          <div className="max-w-5xl mx-auto">
            <div className="bg-[var(--error)]/10 border border-[var(--error)]/30 rounded-xl p-8 text-center">
              <p className="text-[var(--error)]">{error || 'Capítulo no encontrado'}</p>
              <Link href="/creator/dashboard">
                <Button variant="outline" className="mt-4">
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Volver al Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ─── Success state ───────────────────────────────────────────

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <main className="p-6">
          <div className="max-w-5xl mx-auto">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 text-center">
              <div className="inline-flex justify-center items-center w-20 h-20 bg-[var(--success)]/10 text-[var(--success)] rounded-full mb-6">
                <CheckCircle size={40} aria-hidden="true" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">
                ¡Capítulo actualizado!
              </h2>
              <p className="text-[var(--text-secondary)] mb-8">
                Los cambios se han guardado correctamente.
              </p>
              <div className="flex justify-center gap-4 flex-wrap">
                <Button
                  onClick={() => router.push(`/creator/manga/${slug}`)}
                  variant="outline"
                >
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Volver al manga
                </Button>
                <Button
                  onClick={() => {
                    setIsSuccess(false);
                    setSaveError(null);
                  }}
                >
                  Seguir editando
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ─── Main UI ─────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <div className="max-w-5xl mx-auto space-y-6 p-6 pt-4">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--border)] pb-6">
          <div>
            <Link
              href={`/creator/manga/${slug}`}
              className="flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-2 transition-colors"
            >
              <ArrowLeftIcon size={16} />
              <span className="text-sm">Volver a {chapter.manga.title}</span>
            </Link>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Editar Capítulo {chapter.chapterNumber}
              {chapter.title && (
                <span className="text-[var(--text-tertiary)] font-normal ml-2">
                  — {chapter.title}
                </span>
              )}
            </h1>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <SaveIcon className="w-4 h-4 mr-2" />
            )}
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </header>

        {/* Errors */}
        {saveError && <ErrorMessage message={saveError} />}
        {uploadPageError && <ErrorMessage message={uploadPageError} />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar: Metadata */}
          <div className="col-span-1 space-y-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
              <h2 className="font-bold mb-4 text-[var(--text-primary)]">
                Detalles del Capítulo
              </h2>

              <div className="space-y-4">
                {/* Chapter Number */}
                <div>
                  <label
                    htmlFor="chapter-number"
                    className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase"
                  >
                    Número de Cap.
                  </label>
                  <input
                    id="chapter-number"
                    type="number"
                    value={chapterNumber}
                    onChange={(e) => setChapterNumber(e.target.value)}
                    min="1"
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] focus:border-[var(--primary)] rounded-lg outline-none text-sm transition-all text-[var(--text-primary)]"
                  />
                </div>

                {/* Chapter Title */}
                <div>
                  <label
                    htmlFor="chapter-title"
                    className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase"
                  >
                    Título (Opcional)
                  </label>
                  <input
                    id="chapter-title"
                    type="text"
                    value={chapterTitle}
                    onChange={(e) => setChapterTitle(e.target.value)}
                    placeholder="Ej: El regreso del Rey"
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] focus:border-[var(--primary)] rounded-lg outline-none text-sm transition-all text-[var(--text-primary)]"
                  />
                </div>
              </div>
            </div>

            {/* Info card */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
              <h3 className="font-bold text-sm mb-3 text-[var(--text-primary)]">
                Información
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">Páginas</span>
                  <span className="text-[var(--text-primary)] font-medium">
                    {pages.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">Vistas</span>
                  <span className="text-[var(--text-primary)] font-medium">
                    {chapter.viewCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">Creado</span>
                  <span className="text-[var(--text-primary)] font-medium">
                    {new Date(chapter.createdAt).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main: Pages */}
          <div className="col-span-1 lg:col-span-2 space-y-4">
            {/* Add new pages */}
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                <ImageIcon size={18} />
                Páginas ({pages.length})
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={addNewPages}
                disabled={isUploadingPage}
              >
                <UploadCloud className="w-4 h-4 mr-2" />
                Añadir páginas
              </Button>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                ref={fileInputRef}
                onChange={handleFileSelect}
              />
            </div>

            {/* Uploading indicator */}
            {isUploadingPage && (
              <div className="flex items-center gap-2 p-3 bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-lg text-sm text-[var(--primary)]">
                <Loader2 className="w-4 h-4 animate-spin" />
                Subiendo nuevas páginas...
              </div>
            )}

            {/* View toggle */}
            {pages.length > 0 && (
              <div className="flex items-center gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg p-0.5 w-fit">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                    viewMode === 'grid'
                      ? 'bg-[var(--primary)] text-white shadow-sm'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                  )}
                >
                  <LayoutGrid size={14} />
                  Cuadrícula
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                    viewMode === 'list'
                      ? 'bg-[var(--primary)] text-white shadow-sm'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                  )}
                >
                  <List size={14} />
                  Lista
                </button>
              </div>
            )}

            {/* Page grid */}
            {pages.length === 0 ? (
              <div className="bg-[var(--surface)] border border-dashed border-[var(--border-strong)] rounded-2xl p-12 text-center">
                <ImageIcon className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-3" />
                <p className="text-[var(--text-secondary)] mb-4">
                  Este capítulo no tiene páginas. Añade algunas para continuar.
                </p>
                <Button variant="outline" onClick={addNewPages}>
                  <UploadCloud className="w-4 h-4 mr-2" />
                  Añadir páginas
                </Button>
              </div>
            ) : viewMode === 'list' ? (
              <div className="space-y-2">
                <AnimatePresence>
                  {pages.map((page, index) => (
                    <motion.div
                      key={page.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOverItem(e, index)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        'flex items-center gap-3 bg-[var(--surface)] border rounded-xl p-3 group cursor-move transition-all',
                        page.isNew
                          ? 'border-[var(--primary)]/50 bg-[var(--primary)]/5'
                          : draggedItem === index
                          ? 'border-[var(--primary)] opacity-50'
                          : 'border-[var(--border)] hover:border-[var(--border-strong)]'
                      )}
                    >
                      {/* Drag handle */}
                      <GripVertical
                        size={16}
                        className="text-[var(--text-muted)] flex-shrink-0 cursor-grab active:cursor-grabbing"
                      />

                      {/* Page number */}
                      <div className="w-8 h-8 bg-[var(--surface-sunken)] rounded-lg flex items-center justify-center text-xs font-mono font-bold text-[var(--text-secondary)] border border-[var(--border)] flex-shrink-0">
                        {index + 1}
                      </div>

                      {/* Preview - click to preview */}
                      <button
                        onClick={() => setPreviewIndex(index)}
                        className="flex-shrink-0 rounded-lg overflow-hidden border border-[var(--border)] hover:ring-2 hover:ring-[var(--primary)]/50 transition-all"
                        title="Ver página completa"
                        aria-label={`Ver página ${index + 1}`}
                      >
                        <OptimizedImage
                          src={page.preview || page.url}
                          alt={`Página ${index + 1}`}
                          width={72}
                          height={96}
                          className="w-[72px] h-24 object-cover"
                        />
                      </button>

                      {/* Label */}
                      <button
                        onClick={() => setPreviewIndex(index)}
                        className="flex-1 min-w-0 text-left"
                        title="Ver página completa"
                      >
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate flex items-center gap-1.5">
                          Página {index + 1}
                          <ZoomIn size={12} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </p>
                        {page.isNew && (
                          <span className="text-xs text-[var(--primary)] font-medium">
                            Nueva — se subirá al guardar
                          </span>
                        )}
                      </button>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => movePage(index, index - 1)}
                          disabled={index === 0}
                          className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-sunken)] rounded-lg disabled:opacity-30 transition-colors"
                          title="Mover arriba"
                          aria-label="Mover arriba"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          onClick={() => movePage(index, index + 1)}
                          disabled={index === pages.length - 1}
                          className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-sunken)] rounded-lg disabled:opacity-30 transition-colors"
                          title="Mover abajo"
                          aria-label="Mover abajo"
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          onClick={() => removePage(index)}
                          disabled={isSaving}
                          className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 rounded-lg disabled:opacity-30 transition-colors"
                          title="Eliminar página"
                          aria-label="Eliminar página"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              /* Grid view */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                <AnimatePresence>
                  {pages.map((page, index) => (
                    <motion.button
                      key={page.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => setPreviewIndex(index)}
                      className={cn(
                        'group relative aspect-[3/4] bg-[var(--surface)] border rounded-xl overflow-hidden',
                        page.isNew
                          ? 'border-[var(--primary)]/50 ring-1 ring-[var(--primary)]/20'
                          : 'border-[var(--border)] hover:border-[var(--border-strong)]',
                        'hover:ring-2 hover:ring-[var(--primary)]/30 transition-all'
                      )}
                      title={`Ver página ${index + 1}`}
                    >
                      <OptimizedImage
                        src={page.preview || page.url}
                        alt={`Página ${index + 1}`}
                        fill
                        className="object-cover"
                      />

                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <ZoomIn
                          size={24}
                          className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg"
                        />
                      </div>

                      {/* Page number badge */}
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md">
                        #{index + 1}
                      </div>

                      {/* New badge */}
                      {page.isNew && (
                        <div className="absolute top-2 right-2 bg-[var(--primary)] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                          NUEVA
                        </div>
                      )}
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Bottom save button */}
            {pages.length > 0 && (
              <div className="pt-4">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <SaveIcon className="w-4 h-4 mr-2" />
                  )}
                  {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Lightbox / Full-page preview ──────────────────── */}
      <AnimatePresence>
        {previewIndex !== null && previewSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={() => setPreviewIndex(null)}
          >
            {/* Close button */}
            <button
              onClick={() => setPreviewIndex(null)}
              className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all z-10"
              title="Cerrar"
              aria-label="Cerrar vista previa"
            >
              <X size={24} />
            </button>

            {/* Page counter */}
            <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/50 backdrop-blur-sm text-white text-sm font-medium rounded-full">
              {previewIndex + 1} / {pages.length}
            </div>

            {/* Previous button */}
            {previewIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewIndex(previewIndex - 1);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white bg-black/30 hover:bg-black/50 rounded-full transition-all z-10"
                title="Página anterior"
                aria-label="Página anterior"
              >
                <ChevronLeft size={28} />
              </button>
            )}

            {/* Next button */}
            {previewIndex < pages.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewIndex(previewIndex + 1);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white bg-black/30 hover:bg-black/50 rounded-full transition-all z-10"
                title="Siguiente página"
                aria-label="Siguiente página"
              >
                <ChevronRight size={28} />
              </button>
            )}

            {/* Image */}
            <motion.div
              key={previewIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative w-full h-full max-w-[90vw] max-h-[90vh] flex items-center justify-center p-16"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewSrc}
                alt={`Página ${previewIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            </motion.div>

            {/* Keyboard hint */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/50 backdrop-blur-sm text-white/50 text-xs rounded-full">
              ← → Navegar &nbsp;·&nbsp; ESC Cerrar
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
