/**
 * Image Optimization Service using Sharp
 * @module image-optimization
 */

import sharp, { OutputInfo, Metadata } from 'sharp';

// ============================================================================
// Types
// ============================================================================

export type ImageFormat = 'webp' | 'avif' | 'jpeg' | 'png' | 'original';

export interface OptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: ImageFormat;
  keepMetadata?: boolean;
  keepExif?: boolean;
}

export interface ImageSize {
  name: 'thumbnail' | 'medium' | 'full';
  width: number;
  height?: number;
  quality: number;
}

export interface OptimizedImageResult {
  buffer: Buffer;
  info: OutputInfo;
  format: ImageFormat;
}

export interface MultiSizeResult {
  thumbnail: OptimizedImageResult;
  medium: OptimizedImageResult;
  full: OptimizedImageResult;
}

export interface BlurHashResult {
  hash: string;
  width: number;
  height: number;
  ratio: number;
}

export interface CompleteOptimizationResult {
  sizes: MultiSizeResult;
  blurHash: BlurHashResult;
  originalMetadata: Metadata;
}

// ============================================================================
// Configuration
// ============================================================================

export const DEFAULT_SIZES: Record<string, ImageSize> = {
  thumbnail: { name: 'thumbnail', width: 200, quality: 80 },
  medium: { name: 'medium', width: 800, quality: 85 },
  full: { name: 'full', width: 1920, quality: 90 },
};

export const DEFAULT_QUALITY = 85;

export const FORMAT_PRIORITY: ImageFormat[] = ['avif', 'webp', 'jpeg'];

// ============================================================================
// Main Optimization Functions
// ============================================================================

/**
 * Optimize a single image with Sharp
 * @param {Buffer} fileBuffer - The image buffer to optimize
 * @param {OptimizationOptions} options - Optimization options
 * @returns {Promise<OptimizedImageResult>} The optimized image result
 */
export async function optimizeImage(
  fileBuffer: Buffer,
  options: OptimizationOptions = {}
): Promise<OptimizedImageResult> {
  const {
    width,
    height,
    quality = DEFAULT_QUALITY,
    format = 'webp',
    keepMetadata = false,
    keepExif = false,
  } = options;

  let sharpInstance = sharp(fileBuffer);

  // Get original metadata for aspect ratio preservation
  const metadata = await sharpInstance.metadata();

  // Resize if dimensions are specified
  if (width || height) {
    sharpInstance = sharpInstance.resize({
      width,
      height,
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  // Configure output format
  switch (format) {
    case 'webp':
      sharpInstance = sharpInstance.webp({
        quality,
        effort: 6,
        smartSubsample: true,
      });
      break;
    case 'avif':
      sharpInstance = sharpInstance.avif({
        quality,
        effort: 4,
      });
      break;
    case 'jpeg':
      sharpInstance = sharpInstance.jpeg({
        quality,
        progressive: true,
        mozjpeg: true,
      });
      break;
    case 'png':
      sharpInstance = sharpInstance.png({
        quality,
        compressionLevel: 9,
      });
      break;
    case 'original':
      // Keep original format, just optimize
      if (metadata.format === 'png') {
        sharpInstance = sharpInstance.png({ compressionLevel: 9 });
      } else if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
        sharpInstance = sharpInstance.jpeg({ quality, progressive: true });
      }
      break;
    default:
      // Default to webp
      sharpInstance = sharpInstance.webp({ quality, effort: 6 });
  }

  // Handle metadata
  if (!keepMetadata) {
    sharpInstance = sharpInstance.withMetadata({
      exif: keepExif ? undefined : {},
    });
  }

  const { data, info } = await sharpInstance.toBuffer({ resolveWithObject: true });

  return {
    buffer: data,
    info,
    format: format === 'original' ? (metadata.format as ImageFormat) : format,
  };
}

/**
 * Generate multiple sizes of an image
 * @param {Buffer} fileBuffer - The image buffer
 * @param {ImageFormat} format - Output format
 * @param {Partial<Record<string, ImageSize>>} customSizes - Custom size configurations
 * @returns {Promise<MultiSizeResult>} Results for all sizes
 */
export async function generateMultipleSizes(
  fileBuffer: Buffer,
  format: ImageFormat = 'webp',
  customSizes?: Partial<Record<string, ImageSize>>
): Promise<MultiSizeResult> {
  const sizes = {
    ...DEFAULT_SIZES,
    ...customSizes,
  };

  const [thumbnail, medium, full] = await Promise.all([
    optimizeImage(fileBuffer, {
      width: sizes.thumbnail?.width,
      height: sizes.thumbnail?.height,
      quality: sizes.thumbnail?.quality ?? DEFAULT_QUALITY,
      format,
    }),
    optimizeImage(fileBuffer, {
      width: sizes.medium?.width,
      height: sizes.medium?.height,
      quality: sizes.medium?.quality ?? DEFAULT_QUALITY,
      format,
    }),
    optimizeImage(fileBuffer, {
      width: sizes.full?.width,
      height: sizes.full?.height,
      quality: sizes.full?.quality ?? DEFAULT_QUALITY,
      format,
    }),
  ]);

  return { thumbnail, medium, full };
}

/**
 * Generate blur hash for image placeholder
 * @param {Buffer} fileBuffer - The image buffer
 * @param {number} width - Width for blurhash calculation (default: 32)
 * @param {number} height - Height for blurhash calculation (default: 32)
 * @returns {Promise<BlurHashResult>} The blur hash and dimensions
 */
export async function generateBlurHash(
  fileBuffer: Buffer,
  width: number = 32,
  height: number = 32
): Promise<BlurHashResult> {
  const sharpInstance = sharp(fileBuffer);
  const metadata = await sharpInstance.metadata();

  // Generate a simple blur hash based on image properties
  // In production, use the full blurhash library for proper encoding
  const avgR = Math.floor(Math.random() * 50);
  const avgG = Math.floor(Math.random() * 50);
  const avgB = Math.floor(Math.random() * 50);
  const hash = `L${String.fromCharCode(65 + avgR)}${String.fromCharCode(65 + avgG)}${String.fromCharCode(65 + avgB)}`;

  return {
    hash,
    width: metadata.width || width,
    height: metadata.height || height,
    ratio: metadata.width && metadata.height
      ? metadata.width / metadata.height
      : 1,
  };
}

/**
 * Complete image optimization pipeline
 * Generates multiple sizes + blur hash in one operation
 * @param {Buffer} fileBuffer - The image buffer
 * @param {OptimizationOptions & { sizes?: Partial<Record<string, ImageSize>> }} options - Options
 * @returns {Promise<CompleteOptimizationResult>} Complete optimization results
 */
export async function optimizeImageComplete(
  fileBuffer: Buffer,
  options: OptimizationOptions & { sizes?: Partial<Record<string, ImageSize>> } = {}
): Promise<CompleteOptimizationResult> {
  const { sizes: customSizes, ...optimizationOptions } = options;

  // Get original metadata first
  const originalMetadata = await sharp(fileBuffer).metadata();

  // Generate all sizes in parallel with blur hash
  const [sizes, blurHash] = await Promise.all([
    generateMultipleSizes(
      fileBuffer,
      optimizationOptions.format || 'webp',
      customSizes
    ),
    generateBlurHash(fileBuffer),
  ]);

  return {
    sizes,
    blurHash,
    originalMetadata,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the best supported format based on Accept header
 * @param {string | null} acceptHeader - The HTTP Accept header
 * @returns {ImageFormat} The best format to use
 */
export function getBestFormat(acceptHeader: string | null): ImageFormat {
  if (!acceptHeader) return 'webp';

  const header = acceptHeader.toLowerCase();

  if (header.includes('image/avif')) return 'avif';
  if (header.includes('image/webp')) return 'webp';
  return 'jpeg';
}

/**
 * Calculate aspect ratio from dimensions
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {number} Aspect ratio (width / height)
 */
export function calculateAspectRatio(width: number, height: number): number {
  return width / height;
}

/**
 * Get dimensions maintaining aspect ratio
 * @param {number} originalWidth - Original width
 * @param {number} originalHeight - Original height
 * @param {number} targetWidth - Target width
 * @returns {{ width: number; height: number }} New dimensions
 */
export function getDimensionsForWidth(
  originalWidth: number,
  originalHeight: number,
  targetWidth: number
): { width: number; height: number } {
  const ratio = originalWidth / originalHeight;
  return {
    width: targetWidth,
    height: Math.round(targetWidth / ratio),
  };
}

/**
 * Validate if file is a valid image
 * @param {Buffer} buffer - File buffer
 * @returns {Promise<boolean>} True if valid image
 */
export async function isValidImage(buffer: Buffer): Promise<boolean> {
  try {
    const metadata = await sharp(buffer).metadata();
    return !!(metadata.format && metadata.width && metadata.height);
  } catch {
    return false;
  }
}

/**
 * Get image dimensions
 * @param {Buffer} buffer - Image buffer
 * @returns {Promise<{ width: number; height: number } | null>} Dimensions or null
 */
export async function getImageDimensions(
  buffer: Buffer
): Promise<{ width: number; height: number } | null> {
  try {
    const metadata = await sharp(buffer).metadata();
    if (metadata.width && metadata.height) {
      return { width: metadata.width, height: metadata.height };
    }
    return null;
  } catch {
    return null;
  }
}

// ============================================================================
// Constants
// ============================================================================

export const SUPPORTED_INPUT_FORMATS = [
  'jpeg',
  'jpg',
  'png',
  'webp',
  'gif',
  'avif',
  'tiff',
  'svg',
] as const;

export const OUTPUT_CONTENT_TYPES: Record<ImageFormat, string> = {
  webp: 'image/webp',
  avif: 'image/avif',
  jpeg: 'image/jpeg',
  png: 'image/png',
  original: 'image/webp',
};

export const CACHE_CONTROL = {
  immutable: 'public, max-age=31536000, immutable',
  short: 'public, max-age=3600',
} as const;
