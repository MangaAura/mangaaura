/**
 * Vercel Blob Storage Service
 * Centralized storage configuration and operations for MangaAura
 * @module storage
 */

import { put, del, list } from '@vercel/blob';
import { randomUUID } from 'crypto';

import { getStorageConfig } from './storage-config';
import {
  UploadResult,
  StorageConfig,
  UploadError,
  BatchUploadResult,
  BatchUploadOptions,
  ValidationResult,
} from '../types/storage';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Get the current storage configuration
 * This allows for dynamic configuration changes
 */
let currentConfig: StorageConfig = getStorageConfig();

/**
 * Update storage configuration at runtime
 * @param {Partial<StorageConfig>} config - Partial configuration to merge
 * @returns {StorageConfig} The updated configuration
 */
export function updateStorageConfig(
  config: Partial<StorageConfig>
): StorageConfig {
  currentConfig = { ...currentConfig, ...config };
  return currentConfig;
}

/**
 * Get the current storage configuration
 * @returns {StorageConfig} The current configuration
 */
export function getConfig(): StorageConfig {
  return { ...currentConfig };
}

/**
 * Reset configuration to defaults
 * @returns {StorageConfig} The default configuration
 */
export function resetConfig(): StorageConfig {
  currentConfig = getStorageConfig();
  return currentConfig;
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate a single file before upload
 * @param {File} file - The file to validate
 * @param {Partial<StorageConfig>} overrides - Optional validation overrides
 * @returns {ValidationResult} Validation result with error details if invalid
 */
export function validateFile(
  file: File,
  overrides: Partial<StorageConfig> = {}
): ValidationResult {
  const config = { ...currentConfig, ...overrides };

  // Check if file exists
  if (!file || file.size === 0) {
    return {
      valid: false,
      error: {
        code: 'EMPTY_FILE',
        message: 'El archivo está vacío o no existe',
      },
    };
  }

  // Check file size
  if (file.size > config.maxFileSize) {
    return {
      valid: false,
      error: {
        code: 'FILE_TOO_LARGE',
        message: `El archivo excede el tamaño máximo de ${formatBytes(
          config.maxFileSize
        )}`,
        details: {
          maxSize: config.maxFileSize,
          actualSize: file.size,
        },
      },
    };
  }

  // Check file type
  if (!config.acceptedFormats.includes(file.type)) {
    return {
      valid: false,
      error: {
        code: 'INVALID_FORMAT',
        message: `Formato no soportado. Formatos aceptados: ${config.acceptedFormats.join(
          ', '
        )}`,
        details: {
          acceptedFormats: config.acceptedFormats,
          actualFormat: file.type,
        },
      },
    };
  }

  return { valid: true };
}

/**
 * Validate multiple files for chapter upload
 * @param {File[]} files - Array of files to validate
 * @returns {ValidationResult} Validation result
 */
export function validateChapterFiles(files: File[]): ValidationResult {
  if (!files || files.length === 0) {
    return {
      valid: false,
      error: {
        code: 'EMPTY_FILE',
        message: 'No se proporcionaron archivos',
      },
    };
  }

  // Calculate total size
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  if (totalSize > currentConfig.chapterMaxSize) {
    return {
      valid: false,
      error: {
        code: 'CHAPTER_TOO_LARGE',
        message: `El capítulo excede el tamaño máximo de ${formatBytes(
          currentConfig.chapterMaxSize
        )}`,
        details: {
          maxSize: currentConfig.chapterMaxSize,
          actualSize: totalSize,
          fileCount: files.length,
        },
      },
    };
  }

  // Validate each individual file
  for (const file of files) {
    const validation = validateFile(file);
    if (!validation.valid) {
      return {
        valid: false,
        error: {
          ...validation.error!,
          message: `${file.name}: ${validation.error!.message}`,
          details: {
            ...validation.error!.details,
            fileName: file.name,
          },
        },
      };
    }
  }

  return { valid: true };
}

// ============================================================================
// Filename Generation
// ============================================================================

/**
 * Generate a unique filename with timestamp and UUID
 * @param {string} originalName - The original filename
 * @param {string} [prefix] - Optional path prefix
 * @returns {string} A unique filename with extension
 */
export function generateUniqueFilename(
  originalName: string,
  prefix: string = ''
): string {
  const timestamp = Date.now();
  const uuid = randomUUID();
  const extension = getFileExtension(originalName);
  const sanitizedPrefix = prefix ? `${prefix}/` : '';

  return `${sanitizedPrefix}${timestamp}-${uuid}.${extension}`;
}

/**
 * Extract file extension from filename
 * @param {string} filename - The filename to process
 * @returns {string} The file extension (without leading dot)
 */
function getFileExtension(filename: string): string {
  const match = filename.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : 'jpg';
}

/**
 * Format bytes to human-readable string
 * @param {number} bytes - The size in bytes
 * @returns {string} Human-readable size string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// ============================================================================
// Upload Operations
// ============================================================================

/**
 * Upload a single image to Vercel Blob
 * @param {File} file - The file to upload
 * @param {string} path - The storage path (e.g., 'manga/covers')
 * @returns {Promise<UploadResult>} The upload result with URL
 * @throws {UploadError} If validation or upload fails
 */
export async function uploadImage(
  file: File,
  path: string
): Promise<UploadResult> {
  // Validate file
  const validation = validateFile(file);
  if (!validation.valid) {
    throw validation.error;
  }

  // Generate unique filename
  const pathname = generateUniqueFilename(file.name, path);

  try {
    // Upload to Vercel Blob
    const blob = await put(pathname, file, {
      access: 'public',
      contentType: file.type,
      cacheControlMaxAge: 31536000, // 1 year
    });

    return {
      url: blob.url,
      pathname: blob.pathname,
      contentType: file.type,
      size: file.size,
      uploadedAt: new Date(),
    };
  } catch (error) {
    throw handleBlobError(error, 'UPLOAD_FAILED');
  }
}

/**
 * Upload multiple chapter images as a batch
 * @param {File[]} files - Array of image files
 * @param {string} mangaId - The manga identifier
 * @param {number} chapterNumber - The chapter number
 * @param {Partial<BatchUploadOptions>} [options] - Optional batch upload settings
 * @returns {Promise<BatchUploadResult>} Results of all upload operations
 */
export async function uploadChapterImages(
  files: File[],
  mangaId: string,
  chapterNumber: number,
  options: Partial<BatchUploadOptions> = {}
): Promise<BatchUploadResult> {
  const startTime = Date.now();

  // Validate all files first
  const validation = validateChapterFiles(files);
  if (!validation.valid) {
    throw validation.error;
  }

  // Merge with default options
  const batchOptions: BatchUploadOptions = {
    continueOnError: false,
    maxConcurrency: 5,
    ...options,
  };

  const successful: UploadResult[] = [];
  const failed: Array<{ fileName: string; error: UploadError }> = [];
  let totalSize = 0;

  // Sort files by name to maintain page order
  const sortedFiles = [...files].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true })
  );

  // Process uploads with concurrency control
  const path = `${currentConfig.basePath}/${mangaId}/chapter-${chapterNumber}`;

  for (let i = 0; i < sortedFiles.length; i += batchOptions.maxConcurrency) {
    const batch = sortedFiles.slice(i, i + batchOptions.maxConcurrency);

    const uploadPromises = batch.map(async (file, batchIndex) => {
      const pageNumber = i + batchIndex + 1;
      const filePath = `${path}/page-${pageNumber.toString().padStart(3, '0')}`;

      try {
        const result = await uploadImage(file, filePath);
        return { success: true, result, fileName: file.name };
      } catch (error) {
        return {
          success: false,
          error: error as UploadError,
          fileName: file.name,
        };
      }
    });

    const results = await Promise.all(uploadPromises);

    for (const result of results) {
      if (result.success) {
        successful.push(result.result!);
        totalSize += result.result!.size;
      } else {
        failed.push({
          fileName: result.fileName,
          error: result.error!,
        });

        if (!batchOptions.continueOnError) {
          throw {
            code: 'UPLOAD_FAILED',
            message: `Error subiendo ${result.fileName}: ${result.error!.message}`,
            details: {
              failedFiles: failed,
              successfulFiles: successful.length,
            },
          } as UploadError;
        }
      }
    }
  }

  return {
    successful,
    failed,
    totalSize,
    duration: Date.now() - startTime,
  };
}

// ============================================================================
// Delete Operations
// ============================================================================

/**
 * Delete a single image from Vercel Blob
 * @param {string} url - The full URL of the image to delete
 * @returns {Promise<void>}
 * @throws {UploadError} If deletion fails
 */
export async function deleteImage(url: string): Promise<void> {
  if (!url) {
    throw {
      code: 'DELETE_FAILED',
      message: 'URL no proporcionada',
    } as UploadError;
  }

  try {
    await del(url);
  } catch (error) {
    throw handleBlobError(error, 'DELETE_FAILED');
  }
}

/**
 * Delete multiple images from Vercel Blob
 * @param {string[]} urls - Array of image URLs to delete
 * @returns {Promise<{ deleted: number; failed: string[] }>}
 */
export async function deleteMultipleImages(
  urls: string[]
): Promise<{ deleted: number; failed: string[] }> {
  const failed: string[] = [];
  let deleted = 0;

  for (const url of urls) {
    try {
      await deleteImage(url);
      deleted++;
    } catch {
      failed.push(url);
    }
  }

  return { deleted, failed };
}

/**
 * Delete all images in a chapter folder
 * @param {string} mangaId - The manga identifier
 * @param {number} chapterNumber - The chapter number
 * @returns {Promise<{ deleted: number; failed: string[] }>}
 */
export async function deleteChapterImages(
  mangaId: string,
  chapterNumber: number
): Promise<{ deleted: number; failed: string[] }> {
  const prefix = `${currentConfig.basePath}/${mangaId}/chapter-${chapterNumber}/`;

  try {
    const { blobs } = await list({ prefix });
    const urls = blobs.map((blob) => blob.url);

    return await deleteMultipleImages(urls);
  } catch (error) {
    throw handleBlobError(error, 'DELETE_FAILED');
  }
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Handle Vercel Blob errors and convert to UploadError
 * @param {unknown} error - The error to handle
 * @param {UploadError['code']} defaultCode - Default error code
 * @returns {UploadError} Standardized error object
 */
function handleBlobError(
  error: unknown,
  defaultCode: UploadError['code']
): UploadError {
  // Handle known Vercel Blob errors
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('unauthorized') || message.includes('token')) {
      return {
        code: 'UNAUTHORIZED',
        message: 'Error de autenticación con Vercel Blob. Verifica tu token.',
        details: { originalError: error.message },
      };
    }

    if (message.includes('network') || message.includes('fetch')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Error de red al comunicarse con Vercel Blob.',
        details: { originalError: error.message },
      };
    }

    return {
      code: defaultCode,
      message: `Error en operación de storage: ${error.message}`,
      details: { originalError: error.message },
    };
  }

  // Unknown error type
  return {
    code: defaultCode,
    message: 'Error desconocido en operación de storage',
    details: { originalError: String(error) },
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get image URL with optional transformation parameters
 * Note: Vercel Blob doesn't support on-the-fly transformations
 * This is a placeholder for future CDN integration
 * @param {string} url - The original image URL
 * @param {object} _transforms - Transformation parameters (future use)
 * @returns {string} The image URL
 */
export function getImageUrl(
  url: string,
  _transforms?: { width?: number; height?: number; quality?: number }
): string {
  // Currently returns the original URL
  // Future: integrate with imgix or similar for transformations
  return url;
}

/**
 * Check if an image exists in Blob storage
 * @param {string} url - The image URL to check
 * @returns {Promise<boolean>} True if the image exists
 */
export async function imageExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * List all images in a manga folder
 * @param {string} mangaId - The manga identifier
 * @returns {Promise<Array<{ url: string; pathname: string; size: number }>>}
 */
export async function listMangaImages(
  mangaId: string
): Promise<Array<{ url: string; pathname: string; size: number }>> {
  const prefix = `${currentConfig.basePath}/${mangaId}/`;

  try {
    const { blobs } = await list({ prefix });
    return blobs.map((blob) => ({
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
    }));
  } catch (error) {
    throw handleBlobError(error, 'UNKNOWN_ERROR');
  }
}

// Export types for convenience
export type { UploadResult, UploadError, StorageConfig, BatchUploadResult };

// ============================================================================
// Cover Upload Operations
// ============================================================================

interface CoverUploadResult {
  success: boolean;
  url?: string;
  filename?: string;
  size?: number;
  error?: string;
}

/**
 * Upload a cover image for a manga
 * @param {File} file - The cover image file
 * @param {string} mangaId - The manga identifier
 * @returns {Promise<CoverUploadResult>} The upload result
 */
export async function uploadCover(
  file: File,
  mangaId: string
): Promise<CoverUploadResult> {
  try {
    const result = await uploadImage(file, `covers/${mangaId}`);
    return {
      success: true,
      url: result.url,
      filename: result.pathname,
      size: result.size,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

// ============================================================================
// File Delete Operations (Legacy compatibility)
// ============================================================================

interface DeleteFileResult {
  success: boolean;
  error?: string;
}

/**
 * Delete a file by URL (legacy compatibility wrapper)
 * @param {string} url - The file URL to delete
 * @returns {Promise<DeleteFileResult>} The deletion result
 */
export async function deleteFile(url: string): Promise<DeleteFileResult> {
  try {
    await deleteImage(url);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
}

/**
 * Extract pathname from a Vercel Blob URL
 * @param {string} url - The full URL
 * @returns {string | null} The pathname or null if invalid
 */
export function extractPathname(url: string): string | null {
  try {
    // Handle Vercel Blob URLs like:
    // https://xxxxxx.public.blob.vercel-storage.com/path/to/file.jpg
    // https://xxxxxx.blob.vercel-storage.com/path/to/file.jpg
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    // Remove leading slash
    return pathname.startsWith('/') ? pathname.slice(1) : pathname;
  } catch {
    return null;
  }
}
