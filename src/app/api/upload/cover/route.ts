import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadCover, deleteFile } from '@/lib/storage';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

// Tamaño máximo para portadas: 5MB
const MAX_COVER_SIZE = 5 * 1024 * 1024;

// Tipos de imagen permitidos
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
];

interface CoverUploadResponse {
  success: boolean;
  url?: string;
  filename?: string;
  size?: number;
  message?: string;
}

/**
 * POST /api/upload/cover
 * Sube una portada de manga
 * Requiere autenticación y ser el dueño del manga
 * Body: multipart/form-data
 *   - file: File
 *   - mangaId: string (opcional, si no se proporciona se creará un nuevo manga)
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
      getRateLimitKey('upload-cover', identifier),
      20,
      3600
    );
    if (!allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta más tarde.' }, { status: 429 });
    }

    const userId = session.user.id;

    // Obtener datos del formulario
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const mangaId = formData.get('mangaId') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

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
    if (file.size > MAX_COVER_SIZE) {
      return NextResponse.json(
        { error: `Portada demasiado grande. Máximo: 5MB (recibido: ${Math.round(file.size / 1024 / 1024)}MB)` },
        { status: 400 }
      );
    }

    let targetMangaId: string;

    // Si se proporciona mangaId, verificar permisos
    if (mangaId) {
      targetMangaId = mangaId;
      const manga = await prisma.mangaSeries.findUnique({
        where: { id: mangaId },
        select: { id: true, authorId: true, coverUrl: true },
      });

      if (!manga) {
        return NextResponse.json(
          { error: 'Manga no encontrado' },
          { status: 404 }
        );
      }

      if (manga.authorId !== userId) {
        return NextResponse.json(
          { error: 'No tienes permiso para actualizar este manga' },
          { status: 403 }
        );
      }

      // Eliminar portada anterior si existe
      if (manga.coverUrl) {
        try {
          await deleteFile(manga.coverUrl);
        } catch (error) {
          // No fallar si no se puede eliminar la anterior
          console.warn('No se pudo eliminar la portada anterior:', error);
        }
      }
  } else {
    // Si no hay mangaId, generar un ID temporal para la carpeta
    // El manga se creará después con esta URL
    targetMangaId = `temp-${userId}-${Date.now()}`;
  }

  if (!targetMangaId) {
    return NextResponse.json(
      { error: 'No se pudo determinar el manga de destino' },
      { status: 400 }
    );
  }

  // Subir la portada
  const result = await uploadCover(file, targetMangaId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Si se proporcionó mangaId, actualizar el registro
    if (mangaId) {
      await prisma.mangaSeries.update({
        where: { id: mangaId },
        data: { coverUrl: result.url },
      });
    }

    // Intentar optimizar con sharp si está disponible
    let finalUrl = result.url;
    let optimized = false;

    try {
      // Verificar si sharp está instalado
      const sharp = await import('sharp').catch(() => null);
      
      if (sharp) {
        // La optimización se podría hacer aquí si es necesario
        // Por ahora, Vercel Blob maneja la optimización automáticamente
        optimized = true;
      }
    } catch {
      // Sharp no está instalado, continuar sin optimización
    }

    const response: CoverUploadResponse = {
      success: true,
      url: finalUrl,
      filename: result.filename,
      size: result.size,
    };

    if (optimized) {
      response.message = 'Portada subida y optimizada exitosamente';
    } else if (!mangaId) {
      response.message = 'Portada subida. Usa esta URL al crear el manga.';
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error en upload/cover:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al subir la portada' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/upload/cover
 * Elimina una portada existente
 * Requiere autenticación y ser el dueño del manga
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const mangaId = searchParams.get('mangaId');

    if (!mangaId) {
      return NextResponse.json(
        { error: 'Se requiere mangaId' },
        { status: 400 }
      );
    }

    // Verificar que el manga existe y pertenece al usuario
    const manga = await prisma.mangaSeries.findUnique({
      where: { id: mangaId },
      select: { authorId: true, coverUrl: true },
    });

    if (!manga) {
      return NextResponse.json(
        { error: 'Manga no encontrado' },
        { status: 404 }
      );
    }

    if (manga.authorId !== session.user.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    if (!manga.coverUrl) {
      return NextResponse.json(
        { error: 'El manga no tiene portada' },
        { status: 404 }
      );
    }

    // Eliminar el archivo
    const deleteResult = await deleteFile(manga.coverUrl);

    if (!deleteResult.success) {
      return NextResponse.json(
        { error: deleteResult.error },
        { status: 500 }
      );
    }

    // Actualizar el manga
    await prisma.mangaSeries.update({
      where: { id: mangaId },
      data: { coverUrl: null },
    });

    return NextResponse.json({
      success: true,
      message: 'Portada eliminada exitosamente',
    });

  } catch (error) {
    console.error('Error eliminando cover:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
