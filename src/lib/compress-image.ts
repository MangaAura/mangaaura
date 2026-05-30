/**
 * Client-side image compression using Canvas API.
 * Compresses images in the browser before upload to bypass Vercel's 4.5MB serverless body limit.
 *
 * @module compress-image
 */

/**
 * Options for image compression
 */
export interface CompressOptions {
  /** Maximum target size in bytes. Default: 4MB */
  maxByteSize?: number;
  /** Initial JPEG/WebP quality (0–1). Default: 0.85 */
  quality?: number;
  /** Output format. Default: 'image/webp' */
  format?: 'image/webp' | 'image/jpeg' | 'image/png';
  /** Maximum width. Default: 2048 */
  maxWidth?: number;
  /** Maximum height. Default: 2048 */
  maxHeight?: number;
}

/**
 * Compress an image File client-side using Canvas.
 *
 * 1. Draws the image onto a canvas (optionally resizing to fit maxWidth/maxHeight)
 * 2. Exports as WebP/JPEG with the given quality
 * 3. If the result is still larger than maxByteSize, reduces quality stepwise
 * 4. If quality drops below 0.2 and still too large, reduces dimensions by 10%
 *    and repeats the process
 *
 * @param file - The original image File
 * @param options - Compression options
 * @returns A new File (WebP by default) guaranteed to be under maxByteSize
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const {
    maxByteSize = 4 * 1024 * 1024,
    quality: initialQuality = 0.85,
    format = 'image/webp',
    maxWidth = 2048,
    maxHeight = 2048,
  } = options;

  // If the file is already under the limit, return as-is (no unnecessary re-encode)
  if (file.size <= maxByteSize) return file;

  // Validate it's an image
  if (!file.type.startsWith('image/')) return file;

  const originalFileName = file.name.replace(/\.[^.]+$/, '') + '.webp';

  // Load the image into an Image element
  const img = await loadImage(file);

  // Start with the original dimensions
  let { width, height } = fitDimensions(img.naturalWidth, img.naturalHeight, maxWidth, maxHeight);

  // Progressive compression: reduce quality first, then dimensions
  let quality = initialQuality;
  let blob = await encodeImage(img, width, height, format, quality);

  while (blob.size > maxByteSize) {
    if (quality > 0.2) {
      // Reduce quality
      quality = Math.max(quality - 0.1, 0.1);
    } else {
      // Shrink dimensions by 10%
      width = Math.round(width * 0.9);
      height = Math.round(height * 0.9);
      quality = initialQuality; // reset quality
    }
    blob = await encodeImage(img, width, height, format, quality);
  }

  return new File([blob], originalFileName, { type: format });
}

// ─── Internals ────────────────────────────────────────────────────

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image: ${file.name}`));
    };
    img.src = url;
  });
}

function fitDimensions(
  natW: number,
  natH: number,
  maxW: number,
  maxH: number
): { width: number; height: number } {
  let width = natW;
  let height = natH;

  if (width > maxW) {
    height = Math.round(height * (maxW / width));
    width = maxW;
  }
  if (height > maxH) {
    width = Math.round(width * (maxH / height));
    height = maxH;
  }

  return { width, height };
}

function encodeImage(
  img: HTMLImageElement,
  width: number,
  height: number,
  format: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas 2D context not available'));
      return;
    }

    ctx.drawImage(img, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to encode image'));
      },
      format,
      quality,
    );
  });
}

/**
 * Convenience: compress a single file if it exceeds maxByteSize.
 * Returns the compressed (or original) file, and a boolean indicating
 * whether compression was applied.
 */
export async function maybeCompress(
  file: File,
  maxByteSize = 4 * 1024 * 1024,
): Promise<{ file: File; wasCompressed: boolean }> {
  if (file.size <= maxByteSize || !file.type.startsWith('image/')) {
    return { file, wasCompressed: false };
  }
  const compressed = await compressImage(file, { maxByteSize });
  return { file: compressed, wasCompressed: true };
}
