'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  Image as ImageIcon,
  CheckCircle,
  FileText,
  LayoutDashboard,
  GripVertical,
  ChevronLeft,
  Loader2,
  ArrowUp,
  ArrowDown,
  Trash2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import React, { useState, useRef, useEffect, Suspense } from 'react';

import { OptimizedImage } from '@/components/Image/OptimizedImage';
import Navbar from '@/components/Layout/Navbar';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useT } from '@/i18n';
import { MAX_FILE_SIZE, ACCEPTED_FORMATS } from '@/lib/storage-config';
import { cn } from '@/lib/utils';

interface Manga {
  id: string;
  title: string;
  coverUrl?: string;
  chapterCount: number;
}

interface UploadedFile {
  file: File;
  id: string;
  preview: string;
  uploadProgress: number;
  uploadedUrl?: string;
  error?: string;
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[var(--border-strong)] border-t-[var(--accent-blue)] rounded-full animate-spin" />
    </div>
  );
}

function CreatorUploadPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const mangaIdFromUrl = searchParams.get('mangaId');
  const { handleError } = useErrorHandler();
  const t = useT();

  // Estados
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [selectedMangaId, setSelectedMangaId] = useState<string>(mangaIdFromUrl || '');
  const [chapterNumber, setChapterNumber] = useState('');
  const [chapterNumberTouched, setChapterNumberTouched] = useState(false);
  const [chapterTitle, setChapterTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMangas, setIsLoadingMangas] = useState(true);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cargar mangas del creador
  useEffect(() => {
    const fetchMangas = async () => {
      if (status !== 'authenticated') return;

      try {
        const response = await fetch('/api/creator/mangas');
        if (!response.ok) throw new Error('Error al cargar mangas');
        const data = await response.json();
        setMangas(data.mangas || []);
      } catch (err) {
        handleError(err);
      } finally {
        setIsLoadingMangas(false);
      }
    };

    fetchMangas();
  }, [status]);

  // Generar ID único
  const generateId = () => Math.random().toString(36).substring(2, 9);

  // Validar capítulo número
  const validateChapterNumber = (value: string): string | null => {
    if (!value || value.trim() === '') return t('creatorUpload.chapterNumberRequired');
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1 || !Number.isInteger(num)) return t('creatorUpload.chapterNumberInvalid');
    return null;
  };

  const chapterNumberError = chapterNumberTouched ? validateChapterNumber(chapterNumber) : null;
  const chapterNumberValid = chapterNumberTouched && chapterNumber !== '' && !chapterNumberError;

  // Validar archivo
  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_FORMATS.includes(file.type as typeof ACCEPTED_FORMATS[number])) {
      return 'Formato no soportado. Usa JPEG, PNG o WebP.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return `Archivo demasiado grande. Máximo ${MAX_FILE_SIZE / 1024 / 1024}MB.`;
    }
    return null;
  };

  // Crear preview
  const createPreview = (file: File): string => {
    return URL.createObjectURL(file);
  };

  // Agregar archivos
  const addFiles = (newFiles: FileList | File[]) => {
    const filesArray = Array.from(newFiles);
    const validFiles: UploadedFile[] = [];

    filesArray.forEach((file) => {
      const errorMsg = validateFile(file);
      validFiles.push({
        file,
        id: generateId(),
        preview: createPreview(file),
        uploadProgress: 0,
        error: errorMsg || undefined,
      });
    });

    setFiles((prev) => [...prev, ...validFiles]);
  };

  // Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Reordenar páginas
  const moveFile = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= files.length) return;
    setFiles((prev) => {
      const newFiles = [...prev];
      const [moved] = newFiles.splice(fromIndex, 1);
      newFiles.splice(toIndex, 0, moved);
      return newFiles;
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragOverItem = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;
    moveFile(draggedItem, index);
    setDraggedItem(index);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  // Subir capítulo
  const handleUpload = async () => {
    if (files.length === 0 || !chapterNumber || !selectedMangaId) {
      setError('Selecciona un manga, ingresa el número de capítulo y sube al menos una página');
      return;
    }

    const validFiles = files.filter(f => !f.error);
    if (validFiles.length === 0) {
      setError('Ninguna imagen válida para subir');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Crear capítulo
      const chapterResponse = await fetch(`/api/manga/${selectedMangaId}/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterNumber: parseInt(chapterNumber),
          title: chapterTitle,
          pageUrls: [], // Se actualizará después
        }),
      });

      if (!chapterResponse.ok) {
        const data = await chapterResponse.json();
        throw new Error(data.error || 'Error al crear el capítulo');
      }

      const chapterData = await chapterResponse.json();
      const chapterId = chapterData.id;

      // Subir imágenes
      const uploadedUrls: string[] = [];
      const totalFiles = validFiles.length;

      for (let i = 0; i < validFiles.length; i++) {
        const fileData = validFiles[i];
        const formData = new FormData();
        formData.append('file', fileData.file);

        abortControllerRef.current = new AbortController();

        const response = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`Error al subir imagen ${i + 1}`);
        }

        const data = await response.json();
        uploadedUrls.push(data.url);

        // Actualizar progreso
        setUploadProgress(((i + 1) / totalFiles) * 100);
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === files.indexOf(fileData)
              ? { ...f, uploadProgress: 100, uploadedUrl: data.url }
              : f
          )
        );
      }

      // Actualizar capítulo con las URLs
      await fetch(`/api/manga/${selectedMangaId}/chapters/${chapterId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageUrls: uploadedUrls }),
      });

      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el capítulo');
      setIsUploading(false);
    }
  };

  // Cancelar subida
  const handleCancel = () => {
    abortControllerRef.current?.abort();
    setIsUploading(false);
    setUploadProgress(0);
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/creator/upload');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <Navbar />

      <div className="max-w-6xl mx-auto space-y-8 p-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2 border-b border-[var(--border)] pb-6">
          <div>
            <button
              onClick={() => router.push('/creator/dashboard')}
              className="flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-2 transition-colors"
            >
              <ChevronLeft size={16} />
              <span className="text-sm">Volver al Dashboard</span>
            </button>
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">Subir Capítulo</h1>
            <p className="text-[var(--text-secondary)] mt-1">Sigue las páginas de tu manga en el orden correcto.</p>
          </div>
          <button
            onClick={() => router.push('/creator/dashboard')}
            className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] px-4 py-2 rounded-lg font-semibold hover:bg-[var(--surface-sunken)] transition-colors text-sm"
          >
            <LayoutDashboard size={18} /> Mis Obras
          </button>
        </header>

        {/* Error */}
        {error && (
          <ErrorMessage message={error} />
        )}

        {/* Success State */}
        {isSuccess ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 text-center animate-fade-in" role="alert">
            <div className="inline-flex justify-center items-center w-20 h-20 bg-[var(--success)]/10 text-[var(--success)] rounded-full mb-6">
              <CheckCircle size={40} aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">¡Capítulo Publicado!</h2>
            <p className="text-[var(--text-secondary)] mb-8">El capítulo {chapterNumber} ya está disponible para tus lectores.</p>
            <div className="flex justify-center gap-4 flex-wrap">
              <button
                onClick={() => {
                  setIsSuccess(false);
                  setFiles([]);
                  setChapterTitle('');
                  setChapterNumber('');
                  setError(null);
                }}
                className="bg-[var(--primary-hover)] hover:bg-[var(--primary-hover)] text-[var(--text-primary)] font-bold py-2.5 px-6 rounded-xl transition-all"
              >
                Subir Otro Capítulo
              </button>
              <button
                onClick={() => router.push('/creator/dashboard')}
                className="bg-[var(--surface-sunken)] hover:bg-[var(--surface-sunken)] text-[var(--text-primary)] font-bold py-2.5 px-6 rounded-xl transition-all"
              >
                Ir al Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Columna de Metadata */}
            <div className="col-span-1 space-y-6">
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                <h2 className="font-bold mb-4 flex items-center gap-2 border-b border-[var(--border)] pb-3 text-[var(--text-primary)]">
                  <FileText size={18} className="text-[var(--primary)]" />
                  Detalles del Capítulo
                </h2>

                <div className="space-y-4">
                  {/* Selector de Manga */}
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase">
                      Manga *
                    </label>
                    {isLoadingMangas ? (
                      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--background)] rounded-lg text-[var(--text-secondary)]">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-sm">Cargando...</span>
                      </div>
                    ) : mangas.length === 0 ? (
                      <div className="px-3 py-2 bg-[var(--background)] rounded-lg text-[var(--text-secondary)] text-sm">
                        No tienes mangas.{' '}
                        <button
                          onClick={() => router.push('/creator/manga/new')}
                          className="text-[var(--primary)] hover:underline"
                        >
                          Crea uno primero
                        </button>
                      </div>
                    ) : (
                      <select
                        name="manga-id"
                        value={selectedMangaId}
                        onChange={(e) => setSelectedMangaId(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] focus:border-[var(--primary)] rounded-lg outline-none text-sm transition-all text-[var(--text-primary)]"
                        required
                      >
                        <option value="">Selecciona un manga</option>
                        {mangas.map((manga) => (
                          <option key={manga.id} value={manga.id}>
                            {manga.title}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Número de Capítulo */}
                  <div>
                    <label htmlFor="chapter-number" className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase">
                      Número de Cap. *
                    </label>
                    <input
                      id="chapter-number"
                      type="number"
                      value={chapterNumber}
                      onChange={(e) => {
                        setChapterNumber(e.target.value);
                        if (chapterNumberTouched) setChapterNumberTouched(true);
                      }}
                      onBlur={() => setChapterNumberTouched(true)}
                      placeholder="Ej: 15"
                      min="1"
                      className={cn(
                        'w-full px-3 py-2 bg-[var(--background)] border focus:border-[var(--primary)] rounded-lg outline-none text-sm transition-all text-[var(--text-primary)]',
                        chapterNumberTouched && chapterNumberError
                          ? 'border-[var(--error)]'
                          : chapterNumberValid
                          ? 'border-[var(--success)]'
                          : 'border-[var(--border)]'
                      )}
                      required
                    />
                    <AnimatePresence>
                      {chapterNumberTouched && chapterNumber !== '' && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="mt-1"
                        >
                          {chapterNumberError ? (
                            <div className="flex items-start gap-1.5 text-xs text-[var(--error)]" role="alert">
                              <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                              <span>{chapterNumberError}</span>
                            </div>
                          ) : chapterNumberValid ? (
                            <div className="flex items-start gap-1.5 text-xs text-[var(--success)]">
                              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                              <span>{t('creatorUpload.chapterNumberValid')}</span>
                            </div>
                          ) : null}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Título del Capítulo */}
                  <div>
                    <label htmlFor="chapter-title" className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase">
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

              {/* Info de formatos */}
              <div className="bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-[var(--info)] mb-2">Formatos soportados</h3>
                <ul className="text-xs text-[var(--info)] space-y-1">
                  <li>• JPEG, PNG, WebP</li>
                  <li>• Máx: {(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB por imagen</li>
                  <li>• Arrastra para reordenar páginas</li>
                </ul>
              </div>
            </div>

            {/* Columna de Upload */}
            <div className="col-span-2 space-y-4">
              {/* Drop Zone */}
              <label
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                    : 'border-[var(--border-strong)] bg-[var(--surface)] hover:bg-[var(--surface-sunken)]'
                }`}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="sr-only"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  id="page-upload-input"
                />
                <div className={`p-4 rounded-full mb-4 ${isDragging ? 'bg-[var(--primary)] text-[var(--text-primary)]' : 'bg-[var(--surface-sunken)] text-[var(--text-secondary)]'}`}>
                  <UploadCloud size={32} aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold mb-1 text-[var(--text-primary)]">Arrastra tus páginas aquí</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  O haz clic para seleccionar archivos
                </p>
                <button
                  type="button"
                  className="bg-[var(--primary-hover)] hover:bg-[var(--primary-hover)] text-[var(--text-primary)] text-sm font-bold py-2 px-6 rounded-full transition-all cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Seleccionar Archivos
                </button>
              </label>

              {/* Lista de Imágenes */}
              {files.length > 0 && (
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold flex items-center gap-2 text-[var(--text-primary)]">
                      <ImageIcon size={18} />
                      Páginas ({files.length})
                    </h3>
                    <span className="text-xs bg-[var(--surface-sunken)] px-2 py-1 rounded text-[var(--text-secondary)] font-mono">
                      {(files.reduce((acc, f) => acc + f.file.size, 0) / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {files.map((fileData, index) => (
                      <div
                        key={fileData.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOverItem(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center gap-3 bg-[var(--background)] border rounded-lg p-3 group cursor-move transition-all ${
                          fileData.error
                            ? 'border-[var(--error)]/50 bg-[var(--error)]/5'
                            : draggedItem === index
                            ? 'border-[var(--primary)] opacity-50'
                            : 'border-[var(--border)] hover:border-[var(--border-strong)]'
                        }`}
                      >
                        {/* Drag Handle */}
                        <GripVertical
                          size={16}
                          className="text-[var(--text-muted)] flex-shrink-0 cursor-grab active:cursor-grabbing"
                        />

                        {/* Número de página */}
                        <div className="w-8 h-8 bg-[var(--surface)] rounded flex items-center justify-center text-xs font-mono font-bold text-[var(--text-secondary)] border border-[var(--border)] flex-shrink-0">
                          {index + 1}
                        </div>

                        {/* Preview */}
                        {fileData.preview && (
                          <OptimizedImage
                            src={fileData.preview}
                            alt={`Página ${index + 1}`}
                            width={48}
                            height={64}
                            className="w-12 h-16 object-cover rounded border border-[var(--border)] flex-shrink-0"
                          />
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                            {fileData.file.name}
                          </p>
                          <p className="text-xs text-[var(--text-tertiary)]">
                            {(fileData.file.size / 1024).toFixed(1)} KB
                          </p>
                          {fileData.error && (
                            <p className="text-xs text-[var(--error)]">{fileData.error}</p>
                          )}
                        </div>

                        {/* Progreso o botones */}
                        <div className="flex items-center gap-2">
                          {isUploading && fileData.uploadProgress > 0 && !fileData.error ? (
                            <div className="w-16 h-1 bg-[var(--surface-sunken)] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[var(--success)] transition-all"
                                style={{ width: `${fileData.uploadProgress}%` }}
                              />
                            </div>
                          ) : (
                            <>
          <button
            onClick={() => moveFile(index, index - 1)}
            disabled={index === 0}
            className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-30 transition-colors cursor-pointer"
            title="Mover arriba"
            aria-label="Mover arriba"
          >
            <ArrowUp size={14} />
          </button>
          <button
            onClick={() => moveFile(index, index + 1)}
            disabled={index === files.length - 1}
            className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-30 transition-colors cursor-pointer"
            title="Mover abajo"
            aria-label="Mover abajo"
          >
            <ArrowDown size={14} />
          </button>
          <button
            onClick={() => removeFile(index)}
            disabled={isUploading}
            className="p-1 text-[var(--text-tertiary)] hover:text-[var(--error)] disabled:opacity-30 transition-colors cursor-pointer"
            title="Eliminar"
            aria-label="Eliminar archivo"
          >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Barra de progreso total */}
                  {isUploading && (
                    <div className="mt-6 space-y-2" role="progressbar" aria-valuenow={Math.round(uploadProgress)} aria-valuemin={0} aria-valuemax={100} aria-label={`Progreso de subida: ${Math.round(uploadProgress)}%`}>
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--text-secondary)]">Progreso total</span>
                        <span className="text-[var(--text-primary)]">{Math.round(uploadProgress)}%</span>
                      </div>
                      <div className="h-2 bg-[var(--surface-sunken)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--primary)] transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <button
                        onClick={handleCancel}
                        className="w-full mt-2 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        Cancelar subida
                      </button>
                    </div>
                  )}

                  {/* Botón publicar */}
                  {!isUploading && (
                    <button
                      onClick={handleUpload}
                      disabled={files.length === 0 || !chapterNumber || !selectedMangaId}
                      className="w-full mt-6 bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-purple)] hover:opacity-90 text-[var(--text-inverse)] font-bold py-3 rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <UploadCloud size={20} />
                      Publicar Capítulo
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CreatorUploadPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CreatorUploadPageContent />
    </Suspense>
  );
}
