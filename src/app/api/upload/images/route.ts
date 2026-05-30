import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import {
  optimizeImage,
  generateBlurHash,
  getBestFormat,
  isValidImage,
  OUTPUT_CONTENT_TYPES,
  OptimizedImageResult,
  CACHE_CONTROL,
} from '@/lib/image-optimization';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

// Tamaño máximo de archivo: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES_PER_BATCH = 100;

// Tipos de imagen permitidos
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
];

interface BatchImageResult {
  index: number;
  success: boolean;
  url?: string;
  thumbnailUrl?: string;
  filename?: string;
  size?: number;
  originalSize?: number;
  format?: string;
  blurHash?: string;
  width?: number;
  height?: number;
  error?: string;
}

interface BatchUploadResponse {
  success: boolean;
  results: BatchImageResult[];
  totalProcessed: number;
  totalFailed: number;
  message?: string;
}

/**
 * POST /api/upload/images
 * Sube múltiples imágenes en una sola request con optimización automática
 * Requiere autenticación
 * Body: multipart/form-data con campo 'files' (múltiples archivos)
 * Query params:
 *   - format: webp|avif|jpeg (default: webp)
 *   - quality: 1-100 (default: 85)
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado. Inicia sesión para subir archivos.' },
        { status: 401 }
      );
    }

    // Rate limit: 1 batch = 1 request (no por imagen)
    const identifier = session.user.id;
    const { allowed } = await rateLimit(
      getRateLimitKey('upload-images-batch', identifier),
      50,
      3600
    );
    if (!allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta más tarde.' }, { status: 429 });
    }

    const userId = session.user.id;

    // Obtener query params
    const { searchParams } = new URL(request.url);
    const formatParam = searchParams.get('format') || 'webp';
    const quality = parseInt(searchParams.get('quality') || '85', 10);

    // Validar formato
    const validFormats = ['webp', 'avif', 'jpeg'] as const;
    const format = validFormats.includes(formatParam as typeof validFormats[number])
      ? (formatParam as typeof validFormats[number])
      : 'webp';

    // Obtener archivos del formulario
    const formData = await request.formData();
    const files = formData.getAll('files') as (File | string)[];

    // Validar que hay archivos
    if (!files.length) {
      return NextResponse.json(
        { error: 'No se proporcionaron archivos. Usa el campo "files" con múltiples archivos.' },
        { status: 400 }
      );
    }

    if (files.length > MAX_FILES_PER_BATCH) {
      return NextResponse.json(
        { error: `Máximo ${MAX_FILES_PER_BATCH} archivos por lote.` },
        { status: 400 }
      );
    }

    // Validar y procesar cada archivo
    const acceptHeader = request.headers.get('accept');
    const bestFormat = getBestFormat(acceptHeader);
    const targetFormat = format === 'webp' ? bestFormat : format;

    const results: BatchImageResult[] = [];
    let processed = 0;
    let failed = 0;

    // Procesar imágenes en lotes de 5 para no saturar Sharp ni Vercel Blob
    const CONCURRENCY = 5;

    for (let batchStart = 0; batchStart < files.length; batchStart += CONCURRENCY) {
      const batch = files.slice(batchStart, batchStart + CONCURRENCY);

      const batchPromises = batch.map(async (file, batchIndex) => {
        const index = batchStart + batchIndex;

        // Validar que sea un archivo
        if (!(file instanceof File)) {
          return {
            index,
            success: false,
            error: 'Archivo inválido',
          } as BatchImageResult;
        }

        // Validar tipo
        if (!ALLOWED_TYPES.includes(file.type)) {
          return {
            index,
            success: false,
            error: `Tipo no válido: ${file.type}. Permitidos: ${ALLOWED_TYPES.join(', ')}`,
          } as BatchImageResult;
        }

        // Validar tamaño
        if (file.size > MAX_FILE_SIZE) {
          return {
            index,
            success: false,
            error: `Archivo demasiado grande: ${Math.round(file.size / 1024 / 1024)}MB (máx ${MAX_FILE_SIZE / 1024 / 1024}MB)`,
          } as BatchImageResult;
        }

        try {
          // Convertir File a Buffer
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);

          // Validar que sea una imagen válida
          const validImage = await isValidImage(buffer);
          if (!validImage) {
            return {
              index,
              success: false,
              error: 'El archivo no es una imagen válida',
            } as BatchImageResult;
          }

          // Optimizar imagen
          const optimizedImage = await optimizeImage(buffer, {
            quality,
            format: targetFormat,
          });

          // Generar thumbnail
          let thumbnailResult: OptimizedImageResult | undefined;
          thumbnailResult = await optimizeImage(buffer, {
            width: 200,
            quality: 80,
            format: targetFormat,
          });

          // Generar blur hash
          const blurHashResult = await generateBlurHash(buffer);

          // Subir imagen principal a Vercel Blob
          const timestamp = Date.now() + index;
          const filename = `optimized-${timestamp}-${index}.${targetFormat}`;
          const pathname = `uploads/${userId}/${filename}`;

          const blob = await put(pathname, optimizedImage.buffer, {
            access: 'public',
            contentType: OUTPUT_CONTENT_TYPES[targetFormat],
            cacheControlMaxAge: 31536000,
          });

          // Subir thumbnail
          let thumbnailUrl: string | undefined;
          if (thumbnailResult) {
            const thumbFilename = `thumb-${timestamp}-${index}.${targetFormat}`;
            const thumbPathname = `uploads/${userId}/thumbnails/${thumbFilename}`;

            const thumbBlob = await put(thumbPathname, thumbnailResult.buffer, {
              access: 'public',
              contentType: OUTPUT_CONTENT_TYPES[targetFormat],
              cacheControlMaxAge: 31536000,
            });

            thumbnailUrl = thumbBlob.url;
          }

          return {
            index,
            success: true,
            url: blob.url,
            thumbnailUrl,
            filename: blob.pathname,
            size: optimizedImage.info.size,
            originalSize: file.size,
            format: targetFormat,
            blurHash: blurHashResult.hash,
            width: optimizedImage.info.width,
            height: optimizedImage.info.height,
          } as BatchImageResult;

        } catch (err) {
          return {
            index,
            success: false,
            error: err instanceof Error ? err.message : 'Error al procesar imagen',
          } as BatchImageResult;
        }
      });

      const batchResults = await Promise.all(batchPromises);

      for (const result of batchResults) {
        results.push(result);
        if (result.success) {
          processed++;
        } else {
          failed++;
        }
      }
    }

    // Construir respuesta
    const response: BatchUploadResponse = {
      success: failed === 0,
      results,
      totalProcessed: processed,
      totalFailed: failed,
    };

    if (failed > 0 && processed > 0) {
      response.message = `Subida parcial: ${processed} de ${files.length} imágenes subidas exitosamente`;
    }

    // Headers de cache
    const headers: Record<string, string> = {
      'Cache-Control': CACHE_CONTROL.immutable,
    };

    return NextResponse.json(response, { headers });

  } catch (error) {
    console.error('Error en upload/images:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al subir imágenes' },
      { status: 500 }
    );
  }
}
