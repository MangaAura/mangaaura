import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadChapterImages } from '@/lib/storage';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

// Tamaño máximo por archivo: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 200; // Máximo de páginas por capítulo

// Tipos de imagen permitidos
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

interface ChapterUploadResponse {
  success: boolean;
  urls?: string[];
  failed?: Array<{ filename: string; error: string }>;
  chapterId?: string;
  totalPages?: number;
  message?: string;
}

/**
 * POST /api/upload/chapter
 * Sube múltiples imágenes para un capítulo
 * Requiere autenticación y ser el dueño del manga
 * Body: multipart/form-data
 *   - mangaId: string
 *   - chapterNumber: number
 *   - files: File[]
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
      getRateLimitKey('upload-chapter', identifier),
      10,
      3600
    );
    if (!allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta más tarde.' }, { status: 429 });
    }

    const userId = session.user.id;

    // Obtener datos del formulario
    const formData = await request.formData();
    const mangaId = formData.get('mangaId') as string | null;
    const chapterNumberStr = formData.get('chapterNumber') as string | null;
    const files = formData.getAll('files') as File[];

    // Validar campos requeridos
    if (!mangaId || !chapterNumberStr) {
      return NextResponse.json(
        { error: 'Se requiere mangaId y chapterNumber' },
        { status: 400 }
      );
    }

    const chapterNumber = parseInt(chapterNumberStr, 10);
    if (isNaN(chapterNumber) || chapterNumber < 1) {
      return NextResponse.json(
        { error: 'chapterNumber debe ser un número positivo' },
        { status: 400 }
      );
    }

    // Validar que hay archivos
    if (!files.length) {
      return NextResponse.json(
        { error: 'No se proporcionaron archivos' },
        { status: 400 }
      );
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Máximo ${MAX_FILES} archivos por capítulo` },
        { status: 400 }
      );
    }

    // Verificar que el manga existe
    const manga = await prisma.mangaSeries.findUnique({
      where: { id: mangaId },
      select: { id: true, authorId: true, title: true },
    });

    if (!manga) {
      return NextResponse.json(
        { error: 'Manga no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el usuario es el dueño del manga
    if (manga.authorId !== userId) {
      return NextResponse.json(
        { error: 'No tienes permiso para subir capítulos a este manga' },
        { status: 403 }
      );
    }

    // Validar archivos antes de subir
    const validationErrors: Array<{ filename: string; error: string }> = [];
    const validFiles: File[] = [];

    for (const file of files) {
      if (!(file instanceof File)) {
        validationErrors.push({
          filename: String(file),
          error: 'No es un archivo válido',
        });
        continue;
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        validationErrors.push({
          filename: file.name,
          error: `Tipo no permitido: ${file.type}`,
        });
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        validationErrors.push({
          filename: file.name,
          error: `Archivo demasiado grande: ${Math.round(file.size / 1024 / 1024)}MB`,
        });
        continue;
      }

      validFiles.push(file);
    }

    // Subir archivos en paralelo
    const uploadResults = await uploadChapterImages(validFiles, mangaId, chapterNumber);

    // Procesar resultados
    const successful: string[] = [];
    const failed: Array<{ filename: string; error: string }> = [...validationErrors];

    uploadResults.successful.forEach((result) => {
      successful.push(result.url);
    });

    uploadResults.failed.forEach((failure) => {
      failed.push({
        filename: failure.fileName || 'unknown',
        error: failure.error.message || 'Unknown error',
      });
    });

    // Si no se subió ningún archivo exitosamente
    if (successful.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se pudo subir ningún archivo',
          failed,
        },
        { status: 500 }
      );
    }

    // Buscar o crear el capítulo
    let chapter = await prisma.chapter.findUnique({
      where: {
        mangaId_chapterNumber: {
          mangaId,
          chapterNumber,
        },
      },
    });

    if (chapter) {
      // Actualizar capítulo existente con nuevas URLs
      const existingUrls = JSON.parse(chapter.pageUrls || '[]');
      const allUrls = [...existingUrls, ...successful];
      
      chapter = await prisma.chapter.update({
        where: { id: chapter.id },
        data: {
          pageUrls: JSON.stringify(allUrls),
          totalPages: allUrls.length,
        },
      });
    } else {
      // Crear nuevo capítulo
      chapter = await prisma.chapter.create({
        data: {
          mangaId,
          chapterNumber,
          pageUrls: JSON.stringify(successful),
          totalPages: successful.length,
        },
      });
    }

    // Respuesta
    const response: ChapterUploadResponse = {
      success: true,
      urls: successful,
      chapterId: chapter.id,
      totalPages: chapter.totalPages,
    };

    // Incluir información de fallos si hay algunos
    if (failed.length > 0) {
      response.failed = failed;
      response.message = `Subida parcial: ${successful.length} de ${files.length} archivos subidos exitosamente`;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error en upload/chapter:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al subir el capítulo' },
      { status: 500 }
    );
  }
}
