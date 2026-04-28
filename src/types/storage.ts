/**
 * Storage Types
 * TypeScript strict types for Vercel Blob storage operations
 */

/**
 * Result of a successful upload operation
 */
export interface UploadResult {
  /** The unique URL of the uploaded file */
  url: string;
  /** The pathname used for storage */
  pathname: string;
  /** The content type of the file */
  contentType: string;
  /** The size of the uploaded file in bytes */
  size: number;
  /** Timestamp when the file was uploaded */
  uploadedAt: Date;
}

/**
 * Configuration options for storage operations
 */
export interface StorageConfig {
  /** Maximum size allowed for a single file in bytes */
  maxFileSize: number;
  /** Maximum total size allowed for a chapter upload in bytes */
  chapterMaxSize: number;
  /** Accepted MIME types for upload */
  acceptedFormats: string[];
  /** Base path for storing manga images */
  basePath: string;
  /** Enable/disable image optimization */
  enableOptimization: boolean;
  /** Default cache control header */
  cacheControl: string;
}

/**
 * Custom error class for storage operations
 */
export interface UploadError {
  /** Error code for programmatic handling */
  code:
    | 'FILE_TOO_LARGE'
    | 'INVALID_FORMAT'
    | 'CHAPTER_TOO_LARGE'
    | 'UPLOAD_FAILED'
    | 'DELETE_FAILED'
    | 'EMPTY_FILE'
    | 'NETWORK_ERROR'
    | 'UNAUTHORIZED'
    | 'UNKNOWN_ERROR';
  /** Human-readable error message */
  message: string;
  /** Additional error details */
  details?: Record<string, unknown>;
}

/**
 * Options for batch upload operations
 */
export interface BatchUploadOptions {
  /** Whether to continue on individual file failure */
  continueOnError: boolean;
  /** Maximum number of concurrent uploads */
  maxConcurrency: number;
  /** Optional metadata to attach to all files */
  metadata?: Record<string, string>;
}

/**
 * Result of a batch upload operation
 */
export interface BatchUploadResult {
  /** Successfully uploaded files */
  successful: UploadResult[];
  /** Failed uploads with error details */
  failed: Array<{
    fileName: string;
    error: UploadError;
  }>;
  /** Total size uploaded in bytes */
  totalSize: number;
  /** Time taken for the operation in milliseconds */
  duration: number;
}

/**
 * Validation result for file checks
 */
export interface ValidationResult {
  /** Whether the file is valid */
  valid: boolean;
  /** Error details if invalid */
  error?: UploadError;
}

/**
 * Storage provider type
 */
export type StorageProvider = 'vercel-blob' | 'local' | 's3';
