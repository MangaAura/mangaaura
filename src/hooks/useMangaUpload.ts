'use client';

import { useState, useRef, useCallback } from 'react';

import { useErrorHandler } from '@/hooks/useErrorHandler';
import { extractApiError } from '@/lib/extract-api-error';
import { UploadResult, UploadError } from '@/types/storage';

// Tipos exportados
export interface UploadProgress {
  /** Porcentaje de progreso (0-100) */
  percent: number;
  /** Bytes subidos */
  loaded: number;
  /** Total de bytes */
  total: number;
  /** Estado del upload */
  status: 'idle' | 'uploading' | 'success' | 'error' | 'cancelled';
}

export interface ChapterUploadProgress {
  /** Progreso general del capítulo */
  overall: UploadProgress;
  /** Progreso individual de cada archivo */
  files: Map<string, UploadProgress>;
  /** Archivos completados */
  completed: UploadResult[];
  /** Archivos fallidos */
  failed: Array<{ fileName: string; error: UploadError }>;
}

export interface UseMangaUploadReturn {
  /** Estado de carga */
  isUploading: boolean;
  /** Progreso actual de la subida */
  progress: UploadProgress;
  /** Error actual si existe */
  error: UploadError | null;
  /** URLs de las imágenes subidas exitosamente */
  urls: string[];
  /** Subir una imagen individual */
  uploadImage: (file: File, options?: UploadImageOptions) => Promise<UploadResult | null>;
  /** Subir múltiples imágenes como un capítulo */
  uploadChapter: (
    files: File[],
    mangaId: string,
    chapterNumber: number,
    options?: UploadChapterOptions
  ) => Promise<ChapterUploadResult>;
  /** Eliminar una imagen subida */
  deleteImage: (url: string) => Promise<boolean>;
  /** Cancelar la subida actual */
  cancelUpload: () => void;
  /** Resetear el estado */
  reset: () => void;
}

export interface UploadImageOptions {
  /** Nombre de archivo personalizado */
  fileName?: string;
  /** Metadata adicional */
  metadata?: Record<string, string>;
  /** Callback de progreso */
  onProgress?: (progress: UploadProgress) => void;
}

export interface UploadChapterOptions {
  /** Título del capítulo */
  title?: string;
  /** Continuar si un archivo falla */
  continueOnError?: boolean;
  /** Máximo de subidas concurrentes */
  maxConcurrency?: number;
  /** Callback de progreso general */
  onOverallProgress?: (progress: ChapterUploadProgress['overall']) => void;
  /** Callback cuando se completa un archivo */
  onFileComplete?: (result: UploadResult) => void;
  /** Callback cuando falla un archivo */
  onFileError?: (fileName: string, error: UploadError) => void;
}

export interface ChapterUploadResult {
  /** Archivos subidos exitosamente */
  successful: UploadResult[];
  /** Archivos que fallaron */
  failed: Array<{ fileName: string; error: UploadError }>;
  /** ID del capítulo creado */
  chapterId?: string;
  /** Tiempo total en ms */
  duration: number;
}

// Constantes
const MAX_RETRIES = 3;
const DEFAULT_CONCURRENCY = 3;

/**
 * Hook para manejar la subida de imágenes de manga
 * Soporta progreso en tiempo real, cancelación y reintentos
 */
export function useMangaUpload(): UseMangaUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({
    percent: 0,
    loaded: 0,
    total: 0,
    status: 'idle',
  });
  const [error, setError] = useState<UploadError | null>(null);
  const [urls, setUrls] = useState<string[]>([]);

  const { handleError } = useErrorHandler();

  // AbortController para cancelación
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeUploadsRef = useRef<Map<string, AbortController>>(new Map());

  /**
   * Crear un nuevo AbortController
   */
  const createAbortController = useCallback(() => {
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current;
  }, []);

  /**
   * Cancelar todas las subidas activas
   */
  const cancelUpload = useCallback(() => {
    // Cancelar el controlador principal
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Cancelar subidas individuales
    activeUploadsRef.current.forEach((controller) => {
      controller.abort();
    });
    activeUploadsRef.current.clear();

    setProgress((prev) => ({ ...prev, status: 'cancelled' }));
    setIsUploading(false);
  }, []);

  /**
   * Resetear el estado del hook
   */
  const reset = useCallback(() => {
    cancelUpload();
    setProgress({
      percent: 0,
      loaded: 0,
      total: 0,
      status: 'idle',
    });
    setError(null);
    setUrls([]);
  }, [cancelUpload]);

  /**
   * Validar archivo antes de subir
   */
  const validateFile = useCallback((file: File): UploadError | null => {
    // Tamaño máximo: 4MB para imágenes individuales (límite Vercel: 4.5MB)
    const MAX_FILE_SIZE = 4 * 1024 * 1024;
    
    // Formatos aceptados
    const ACCEPTED_FORMATS = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ];

    if (!file || file.size === 0) {
      return {
        code: 'EMPTY_FILE',
        message: 'El archivo está vacío',
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        code: 'FILE_TOO_LARGE',
        message: `El archivo excede el tamaño máximo de ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        details: { maxSize: MAX_FILE_SIZE, actualSize: file.size },
      };
    }

    if (!ACCEPTED_FORMATS.includes(file.type)) {
      return {
        code: 'INVALID_FORMAT',
        message: `Formato no soportado: ${file.type}. Use: ${ACCEPTED_FORMATS.join(', ')}`,
        details: { acceptedFormats: ACCEPTED_FORMATS },
      };
    }

    return null;
  }, []);

  /**
   * Subir una imagen individual
   */
  const uploadImage = useCallback(
    async (
      file: File,
      options: UploadImageOptions = {}
    ): Promise<UploadResult | null> => {
      const { fileName, metadata, onProgress } = options;

      // Validar archivo
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return null;
      }

      setIsUploading(true);
      setError(null);
      
      const controller = createAbortController();
      const uploadId = crypto.randomUUID();
      activeUploadsRef.current.set(uploadId, controller);

      try {
        const formData = new FormData();
        formData.append('file', file);
        
        if (fileName) {
          formData.append('fileName', fileName);
        }
        
        if (metadata) {
          formData.append('metadata', JSON.stringify(metadata));
        }

        // Simular progreso (el fetch API no soporta progreso real nativamente)
        // Para progreso real se necesitaría XMLHttpRequest
        setProgress({
          percent: 0,
          loaded: 0,
          total: file.size,
          status: 'uploading',
        });

        // Simular progreso incremental
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            const newPercent = Math.min(prev.percent + 10, 90);
            const newLoaded = Math.floor((newPercent / 100) * file.size);
            const newProgress = {
              ...prev,
              percent: newPercent,
              loaded: newLoaded,
            };
            onProgress?.(newProgress);
            return newProgress;
          });
        }, 100);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          const extracted = await extractApiError(response);
          throw {
            code: 'UPLOAD_FAILED',
            message: extracted.message,
            details: extracted.details || {},
          } as UploadError;
        }

        const result: UploadResult = await response.json();
        
        setProgress({
          percent: 100,
          loaded: file.size,
          total: file.size,
          status: 'success',
        });
        
        setUrls((prev) => [...prev, result.url]);
        
        return result;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          setProgress((prev) => ({ ...prev, status: 'cancelled' }));
          return null;
        }

        const uploadError: UploadError = err.code
          ? err
          : {
              code: 'NETWORK_ERROR',
              message: err.message || 'Error de red al subir el archivo',
              details: { originalError: err },
            };

        setError(uploadError);
        setProgress((prev) => ({ ...prev, status: 'error' }));
        return null;
      } finally {
        setIsUploading(false);
        activeUploadsRef.current.delete(uploadId);
      }
    },
    [createAbortController, validateFile]
  );

  /**
   * Subir múltiples imágenes como un capítulo (batch upload)
   */
  const uploadChapter = useCallback(
    async (
      files: File[],
      mangaId: string,
      chapterNumber: number,
      options: UploadChapterOptions = {}
    ): Promise<ChapterUploadResult> => {
      const {
        title,
        continueOnError = true,
        maxConcurrency = DEFAULT_CONCURRENCY,
        onOverallProgress,
        onFileComplete,
        onFileError,
      } = options;

      const startTime = Date.now();
      const successful: UploadResult[] = [];
      const failed: Array<{ fileName: string; error: UploadError }> = [];

      setIsUploading(true);
      setError(null);

      // Crear el capítulo primero
      let chapterId: string | undefined;
      try {
        const chapterResponse = await fetch('/api/chapters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mangaId,
            chapterNumber,
            title,
            pageCount: files.length,
          }),
        });

        if (!chapterResponse.ok) {
          const { message } = await extractApiError(chapterResponse);
          throw new Error('Error al crear el capítulo: ' + message);
        }

        const chapterData = await chapterResponse.json();
        chapterId = chapterData.id;
      } catch (err: any) {
        setIsUploading(false);
        setError({
          code: 'UPLOAD_FAILED',
          message: 'Error al crear el capítulo: ' + err.message,
        });
        return {
          successful: [],
          failed: files.map((f) => ({
            fileName: f.name,
            error: {
              code: 'UPLOAD_FAILED',
              message: 'Capítulo no creado',
            },
          })),
          duration: Date.now() - startTime,
        };
      }

      // Subir archivos en lotes con concurrencia controlada
      const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
      let uploadedBytes = 0;

      const uploadFileWithRetry = async (
        file: File,
        pageNumber: number,
        retries = 0
      ): Promise<UploadResult | null> => {
        try {
          const controller = new AbortController();
          const uploadId = `${chapterId}-${pageNumber}`;
          activeUploadsRef.current.set(uploadId, controller);

          const formData = new FormData();
          formData.append('file', file);
          formData.append('chapterId', chapterId!);
          formData.append('pageNumber', pageNumber.toString());
          formData.append('mangaId', mangaId);

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
            signal: controller.signal,
          });

          activeUploadsRef.current.delete(uploadId);

          if (!response.ok) {
            const { message } = await extractApiError(response);
            throw new Error(message);
          }

          const result: UploadResult = await response.json();
          
          uploadedBytes += file.size;
          const overallPercent = Math.round((uploadedBytes / totalBytes) * 100);
          
          const overallProgress: UploadProgress = {
            percent: overallPercent,
            loaded: uploadedBytes,
            total: totalBytes,
            status: 'uploading',
          };
          
          setProgress(overallProgress);
          onOverallProgress?.(overallProgress);
          
          onFileComplete?.(result);
          return result;
        } catch (err: any) {
          if (err.name === 'AbortError') {
            return null;
          }

          // Reintentar si es posible
          if (retries < MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, 1000 * (retries + 1)));
            return uploadFileWithRetry(file, pageNumber, retries + 1);
          }

          const uploadError: UploadError = {
            code: 'UPLOAD_FAILED',
            message: err.message || 'Error al subir archivo',
          };
          
          onFileError?.(file.name, uploadError);
          return null;
        }
      };

      // Procesar archivos en lotes
      const fileEntries = files.map((file, index) => ({
        file,
        pageNumber: index + 1,
      }));

      for (let i = 0; i < fileEntries.length; i += maxConcurrency) {
        const batch = fileEntries.slice(i, i + maxConcurrency);
        
        const results = await Promise.all(
          batch.map(({ file, pageNumber }) => uploadFileWithRetry(file, pageNumber))
        );

        results.forEach((result, index) => {
          const { file } = batch[index];
          if (result) {
            successful.push(result);
          } else {
            failed.push({
              fileName: file.name,
              error: {
                code: 'UPLOAD_FAILED',
                message: 'Fallo después de reintentos',
              },
            });
          }
        });

        // Si hay un error crítico y no debemos continuar
        if (!continueOnError && failed.length > 0) {
          break;
        }
      }

      // Finalizar el capítulo
      try {
        await fetch(`/api/chapters/${chapterId}/finalize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uploadedPages: successful.length,
            failedPages: failed.length,
          }),
        });
      } catch (err) {
        handleError(err);
      }

      setIsUploading(false);
      setProgress({
        percent: 100,
        loaded: totalBytes,
        total: totalBytes,
        status: failed.length === 0 ? 'success' : 'error',
      });

      setUrls((prev) => [...prev, ...successful.map((r) => r.url)]);

      return {
        successful,
        failed,
        chapterId,
        duration: Date.now() - startTime,
      };
    },
    []
  );

  /**
   * Eliminar una imagen subida
   */
  const deleteImage = useCallback(async (url: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/upload/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const { message } = await extractApiError(response);
        throw new Error(message);
      }

      // Remover de la lista local
      setUrls((prev) => prev.filter((u) => u !== url));
      
      return true;
    } catch (err: any) {
      setError({
        code: 'DELETE_FAILED',
        message: err.message || 'Error al eliminar la imagen',
      });
      return false;
    }
  }, []);

  return {
    isUploading,
    progress,
    error,
    urls,
    uploadImage,
    uploadChapter,
    deleteImage,
    cancelUpload,
    reset,
  };
}

export default useMangaUpload;
