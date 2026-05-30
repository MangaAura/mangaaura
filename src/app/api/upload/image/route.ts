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

// Tipos de imagen permitidos
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
];

interface UploadResponse {
  success: boolean;
  url: string;
  thumbnailUrl?: string;
  filename: string;
  size: number;
  originalSize: number;
  format: string;
  blurHash?: string;
  width?: number;
  height?: number;
  error?: string;
}

/**
 * POST /api/upload/image
 * Sube una imagen individual con optimización automática usando Sharp
 * Requiere autenticación
 * Body: multipart/form-data con campo 'file'
 * Query params:
 *   - format: webp|avif|jpeg (default: webp)
 *   - quality: 1-100 (default: 85)
 *   - generateThumbnail: true|false (default: true)
 *   - preserveMetadata: true|false (default: false)
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

    const identifier = session.user.id;
    const { allowed } = await rateLimit(
      getRateLimitKey('upload-image', identifier),
      200,
      3600
    );
    if (!allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta más tarde.' }, { status: 429 });
    }

    // Obtener query params
    const { searchParams } = new URL(request.url);
    const formatParam = searchParams.get('format') || 'webp';
    const quality = parseInt(searchParams.get('quality') || '85', 10);
    const generateThumbnail = searchParams.get('generateThumbnail') !== 'false';
    const preserveMetadata = searchParams.get('preserveMetadata') === 'true';

    // Validar formato
    const validFormats = ['webp', 'avif', 'jpeg'] as const;
    const format = validFormats.includes(formatParam as typeof validFormats[number])
      ? (formatParam as typeof validFormats[number])
      : 'webp';

    // Obtener el archivo del formulario
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    // Validar que sea un archivo
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'El campo file debe ser un archivo' },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Tipo de archivo no válido. Permitidos: ${ALLOWED_TYPES.join(', ')}`,
          received: file.type
        },
        { status: 400 }
      );
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Archivo demasiado grande. Máximo: 10MB (recibido: ${Math.round(file.size / 1024 / 1024)}MB)` },
        { status: 400 }
      );
    }

    // Convertir File a Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validar que sea una imagen válida
    const validImage = await isValidImage(buffer);
    if (!validImage) {
      return NextResponse.json(
        { error: 'El archivo no es una imagen válida' },
        { status: 400 }
      );
    }

    // Get Accept header for best format
    const acceptHeader = request.headers.get('accept');
    const bestFormat = getBestFormat(acceptHeader);
    const targetFormat = format === 'webp' ? bestFormat : format;

    // Optimizar imagen principal (convertir a WebP por defecto, calidad 85%)
    const optimizedImage = await optimizeImage(buffer, {
      quality,
      format: targetFormat,
      keepMetadata: preserveMetadata,
    });

    // Generar thumbnail si está habilitado (200px width)
    let thumbnailResult: OptimizedImageResult | undefined;
    if (generateThumbnail) {
      thumbnailResult = await optimizeImage(buffer, {
        width: 200,
        quality: 80,
        format: targetFormat,
      });
    }

    // Generar blur hash para placeholder
    const blurHashResult = await generateBlurHash(buffer);

    // Generate unique filename for main image
    const timestamp = Date.now();
    const filename = `optimized-${timestamp}.${targetFormat}`;
    const pathname = `uploads/${session.user.id}/${filename}`;

    // Subir imagen principal a Vercel Blob
    const blob = await put(pathname, optimizedImage.buffer, {
      access: 'public',
      contentType: OUTPUT_CONTENT_TYPES[targetFormat],
      cacheControlMaxAge: 31536000,
    });

    // Subir thumbnail si se generó
    let thumbnailUrl: string | undefined;
    if (thumbnailResult) {
      const thumbFilename = `thumb-${timestamp}.${targetFormat}`;
      const thumbPathname = `uploads/${session.user.id}/thumbnails/${thumbFilename}`;

      const thumbBlob = await put(thumbPathname, thumbnailResult.buffer, {
        access: 'public',
        contentType: OUTPUT_CONTENT_TYPES[targetFormat],
        cacheControlMaxAge: 31536000,
      });

      thumbnailUrl = thumbBlob.url;
    }

    // Preparar respuesta
    const response: UploadResponse = {
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
    };

    // Retornar con headers de cache
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': CACHE_CONTROL.immutable,
      },
    });

  } catch (error) {
    console.error('Error en upload/image:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al subir la imagen' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload/image/optimized
 * Optimiza una imagen existente on-the-fly
 * Query params:
 *   - url: URL de la imagen original
 *   - width: Ancho deseado
 *   - height: Alto deseado
 *   - quality: Calidad (1-100)
 *   - format: webp|avif|jpeg
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'URL de imagen requerida' },
        { status: 400 }
      );
    }

    const width = searchParams.get('width')
      ? parseInt(searchParams.get('width')!, 10)
      : undefined;
    const height = searchParams.get('height')
      ? parseInt(searchParams.get('height')!, 10)
      : undefined;
    const quality = parseInt(searchParams.get('quality') || '85', 10);

    const acceptHeader = request.headers.get('accept');
    const format = getBestFormat(acceptHeader);

    // Descargar imagen original
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: 'No se pudo descargar la imagen' },
        { status: 404 }
      );
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Optimizar
    const optimized = await optimizeImage(imageBuffer, {
      width,
      height,
      quality,
      format,
    });

    // Retornar imagen optimizada con cache headers
    return new NextResponse(new Uint8Array(optimized.buffer), {
      headers: {
        'Content-Type': OUTPUT_CONTENT_TYPES[format],
        'Cache-Control': CACHE_CONTROL.immutable,
        'Content-Length': optimized.buffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error optimizing image:', error);
    return NextResponse.json(
      { error: 'Error al optimizar la imagen' },
      { status: 500 }
    );
  }
}
