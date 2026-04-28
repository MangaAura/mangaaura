/**
 * Storage Configuration
 * Exportable configuration for frontend and backend usage
 * @module storage-config
 */

import { StorageConfig } from '../types/storage';

/**
 * Maximum file size for individual images (10MB in bytes)
 * @constant {number}
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Maximum total size for chapter uploads (100MB in bytes)
 * @constant {number}
 */
export const MAX_CHAPTER_SIZE = 100 * 1024 * 1024; // 100MB

/**
 * Accepted MIME types for image uploads
 * @constant {string[]}
 */
export const ACCEPTED_FORMATS = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

/**
 * Default storage configuration
 * These values can be overridden at runtime
 */
export const defaultStorageConfig: StorageConfig = {
  maxFileSize: MAX_FILE_SIZE,
  chapterMaxSize: MAX_CHAPTER_SIZE,
  acceptedFormats: [...ACCEPTED_FORMATS],
  basePath: 'manga',
  enableOptimization: true,
  cacheControl: 'public, max-age=31536000, immutable',
};

/**
 * Get current storage configuration
 * Merges default config with any environment-specific overrides
 * @returns {StorageConfig} The resolved storage configuration
 */
export function getStorageConfig(): StorageConfig {
  return {
    ...defaultStorageConfig,
    // Allow environment overrides
    maxFileSize:
      parseInt(process.env.STORAGE_MAX_FILE_SIZE || '', 10) || MAX_FILE_SIZE,
    chapterMaxSize:
      parseInt(process.env.STORAGE_CHAPTER_MAX_SIZE || '', 10) ||
      MAX_CHAPTER_SIZE,
    basePath: process.env.STORAGE_BASE_PATH || defaultStorageConfig.basePath,
    enableOptimization:
      process.env.STORAGE_ENABLE_OPTIMIZATION !== 'false',
  };
}

/**
 * Format bytes to human-readable string
 * @param {number} bytes - The size in bytes
 * @returns {string} Human-readable size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Check if a MIME type is accepted
 * @param {string} mimeType - The MIME type to check
 * @returns {boolean} True if the format is accepted
 */
export function isAcceptedFormat(mimeType: string): boolean {
  return ACCEPTED_FORMATS.includes(mimeType as (typeof ACCEPTED_FORMATS)[number]);
}

/**
 * Get file extension from MIME type
 * @param {string} mimeType - The MIME type
 * @returns {string} The file extension (without dot)
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  return mimeToExt[mimeType] || 'bin';
}

/**
 * Client-safe storage configuration
 * Exposed to the frontend for validation before upload
 */
export const clientStorageConfig = {
  MAX_FILE_SIZE,
  MAX_CHAPTER_SIZE,
  ACCEPTED_FORMATS,
  formatFileSize,
  isAcceptedFormat,
  getExtensionFromMimeType,
} as const;

export type ClientStorageConfig = typeof clientStorageConfig;
