/**
 * Image Optimizer Service
 * 
 * Optimiza imágenes de capítulos usando Sharp.
 */

import { existsSync } from 'fs';
import { writeFile, readFile, mkdir } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

import { generateCacheKey, getCached, setCache } from './cache';

const IMAGE_CACHE_TTL = 7 * 24 * 60 * 60; // 7 days

interface OptimizationOptions {
  width?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
  progressive?: boolean;
}

interface OptimizedImage {
  buffer: Buffer;
  format: string;
  width: number;
  height: number;
  size: number;
}

/**
 * Optimize an image buffer
 */
export async function optimizeImageBuffer(
  buffer: Buffer,
  options: OptimizationOptions = {}
): Promise<OptimizedImage> {
  const {
    width = 1200,
    quality = 85,
    format = 'webp',
    progressive = true,
  } = options;

  try {
    let pipeline = sharp(buffer);

    // Get metadata
    const metadata = await pipeline.metadata();
    const originalWidth = metadata.width || width;
    const originalHeight = metadata.height || width;

    // Resize maintaining aspect ratio
    if (originalWidth > width) {
      pipeline = pipeline.resize(width, null, {
        withoutEnlargement: true,
        fit: 'inside',
      });
    }

    // Convert format
    switch (format) {
      case 'webp':
        pipeline = pipeline.webp({ 
          quality, 
          effort: 4,
          smartSubsample: true,
        });
        break;
      case 'jpeg':
        pipeline = pipeline.jpeg({ 
          quality, 
          progressive,
          mozjpeg: true,
        });
        break;
      case 'png':
        pipeline = pipeline.png({ 
          quality,
          progressive,
          compressionLevel: 9,
        });
        break;
    }

    const optimizedBuffer = await pipeline.toBuffer();
    const info = await sharp(optimizedBuffer).metadata();

    return {
      buffer: optimizedBuffer,
      format,
      width: info.width || width,
      height: info.height || Math.round(width * (originalHeight / originalWidth)),
      size: optimizedBuffer.length,
    };
  } catch (error) {
    console.error('Error optimizing image:', error);
    throw new Error('Failed to optimize image');
  }
}

/**
 * Generate responsive image variants
 */
export async function generateResponsiveImages(
  buffer: Buffer,
  baseOptions: OptimizationOptions = {}
): Promise<{ [key: string]: OptimizedImage }> {
  const sizes = {
    thumbnail: 150,
    small: 400,
    medium: 800,
    large: 1200,
    original: 0, // No resize
  };

  const results: { [key: string]: OptimizedImage } = {};

  await Promise.all(
    Object.entries(sizes).map(async ([name, width]) => {
      if (width === 0) {
        // Original size, just convert format
        results[name] = await optimizeImageBuffer(buffer, {
          ...baseOptions,
          width: undefined,
        });
      } else {
        results[name] = await optimizeImageBuffer(buffer, {
          ...baseOptions,
          width,
        });
      }
    })
  );

  return results;
}

/**
 * Get optimized image with caching
 */
export async function getOptimizedImage(
  imagePath: string,
  options: OptimizationOptions = {}
): Promise<Buffer> {
  const cacheKey = generateCacheKey('image', `${imagePath}:${JSON.stringify(options)}`);
  
  // Try cache
  const cached = await getCached<Buffer>(cacheKey);
  if (cached) {
    return Buffer.from(cached);
  }

  // Read and optimize
  const buffer = await readFile(imagePath);
  const optimized = await optimizeImageBuffer(buffer, options);

  // Cache result
  await setCache(cacheKey, optimized.buffer, IMAGE_CACHE_TTL);

  return optimized.buffer;
}

/**
 * Process chapter images
 */
export async function processChapterImages(
  files: File[],
  chapterId: string
): Promise<{ urls: string[]; totalSize: number }> {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'chapters', chapterId);
  
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  const urls: string[] = [];
  let totalSize = 0;

  await Promise.all(
    files.map(async (file, index) => {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Generate optimized variants
      const optimized = await generateResponsiveImages(buffer, {
        quality: 85,
        format: 'webp',
      });

      // Save medium quality (default view)
      const fileName = `${(index + 1).toString().padStart(3, '0')}.webp`;
      const filePath = path.join(uploadDir, fileName);
      
      await writeFile(filePath, optimized.medium.buffer);
      totalSize += optimized.medium.size;

      // Also save thumbnail
      const thumbName = `${(index + 1).toString().padStart(3, '0')}_thumb.webp`;
      const thumbPath = path.join(uploadDir, thumbName);
      await writeFile(thumbPath, optimized.thumbnail.buffer);

      urls.push(`/uploads/chapters/${chapterId}/${fileName}`);
    })
  );

  return { urls, totalSize };
}

/**
 * Optimize manga cover
 */
export async function optimizeCover(
  buffer: Buffer,
  mangaId: string
): Promise<string> {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'covers');
  
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  // Generate responsive cover
  const optimized = await generateResponsiveImages(buffer, {
    width: 800,
    quality: 90,
    format: 'webp',
  });

  const fileName = `${mangaId}.webp`;
  const filePath = path.join(uploadDir, fileName);
  
  await writeFile(filePath, optimized.large.buffer);

  // Save thumbnail
  const thumbName = `${mangaId}_thumb.webp`;
  const thumbPath = path.join(uploadDir, thumbName);
  await writeFile(thumbPath, optimized.thumbnail.buffer);

  return `/uploads/covers/${fileName}`;
}

/**
 * Get image dimensions without loading full image
 */
export async function getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
  const metadata = await sharp(buffer).metadata();
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
  };
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File too large. Maximum size is 10MB.' };
  }

  return { valid: true };
}

export default {
  optimizeImageBuffer,
  generateResponsiveImages,
  getOptimizedImage,
  processChapterImages,
  optimizeCover,
  getImageDimensions,
  validateImageFile,
};
