import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { deleteFile, extractPathname } from '@/lib/storage';

interface DeleteRequest {
  url: string;
}

interface DeleteResponse {
  success: boolean;
  message?: string;
}

/**
 * DELETE /api/upload/delete
 * Elimina una imagen por URL
 * Requiere autenticación y ser el dueño del recurso asociado
 * Body: { url: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado. Inicia sesión para eliminar archivos.' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Parsear el body
    let body: DeleteRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Body inválido. Se requiere JSON con campo "url"' },
        { status: 400 }
      );
    }

    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Se requiere una URL válida' },
        { status: 400 }
      );
    }

    // Validar que la URL sea de Vercel Blob
    if (!new URL(url).hostname.endsWith('.public.blob.vercel-storage.com') && !new URL(url).hostname.endsWith('.blob.vercel-storage.com')) {
      return NextResponse.json(
        { error: 'URL no válida. Solo se pueden eliminar archivos del sistema.' },
        { status: 400 }
      );
    }

    // Extraer el pathname para verificar ownership
    const pathname = extractPathname(url);
    if (!pathname) {
      return NextResponse.json(
        { error: 'No se pudo procesar la URL' },
        { status: 400 }
      );
    }

    // Verificar ownership basado en el path
    let isOwner = false;
    let resourceType: 'manga' | 'chapter' | 'upload' | 'cover' | null = null;

    // Analizar el path para determinar el tipo de recurso
    if (pathname.startsWith('covers/')) {
      // Portada de manga: covers/{mangaId}/{filename}
      resourceType = 'cover';
      const mangaId = pathname.split('/')[1];
      
      if (mangaId) {
        const manga = await prisma.mangaSeries.findUnique({
          where: { id: mangaId },
          select: { authorId: true },
        });
        isOwner = manga?.authorId === userId;
      }
    } else if (pathname.startsWith('chapters/')) {
      // Páginas de capítulo: chapters/{mangaId}/{chapterNumber}/{filename}
      resourceType = 'chapter';
      const mangaId = pathname.split('/')[1];
      
      if (mangaId) {
        const manga = await prisma.mangaSeries.findUnique({
          where: { id: mangaId },
          select: { authorId: true },
        });
        isOwner = manga?.authorId === userId;
      }
    } else if (pathname.startsWith(`uploads/${userId}/`)) {
      // Subida directa del usuario
      resourceType = 'upload';
      isOwner = true;
    } else if (pathname.startsWith('uploads/')) {
      // Subida de otro usuario - verificar si es admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      isOwner = user?.role === 'ADMIN';
    }

    // Verificar también si la URL está asociada a un manga del usuario
    if (!isOwner) {
      const mangaWithCover = await prisma.mangaSeries.findFirst({
        where: {
          authorId: userId,
          coverUrl: url,
        },
      });
      
      if (mangaWithCover) {
        isOwner = true;
        resourceType = 'cover';
      }
    }

  if (!isOwner) {
    const chapters = await prisma.chapter.findMany({
      where: {
        pageUrls: { contains: url },
      },
      select: {
        mangaId: true,
      },
    });

    if (chapters.length > 0) {
      const uniqueMangaIds = [...new Set(chapters.map((c: any) => c.mangaId))];
      const mangas = await prisma.mangaSeries.findMany({
        where: { id: { in: uniqueMangaIds } },
        select: { id: true, authorId: true },
      });
      const mangaMap = new Map(mangas.map((m: any) => [m.id, m.authorId]));

      for (const chapter of chapters) {
        const authorId = mangaMap.get(chapter.mangaId);
        if (authorId === userId) {
          isOwner = true;
          resourceType = 'chapter';
          break;
        }
      }
    }
  }

    if (!isOwner) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar este archivo' },
        { status: 403 }
      );
    }

    // Eliminar el archivo
    const deleteResult = await deleteFile(url);

    if (!deleteResult.success) {
      return NextResponse.json(
        { error: deleteResult.error || 'Error al eliminar el archivo' },
        { status: 500 }
      );
    }

    // Actualizar referencias en la base de datos según el tipo
    if (resourceType === 'cover') {
      await prisma.mangaSeries.updateMany({
        where: { coverUrl: url },
        data: { coverUrl: null },
      });
    } else if (resourceType === 'chapter') {
      // Buscar capítulos que contengan esta URL
      const chapters = await prisma.chapter.findMany({
        where: {
          pageUrls: { contains: url },
        },
      });

      for (const chapter of chapters) {
        const pageUrls = JSON.parse(chapter.pageUrls || '[]') as string[];
        const filteredUrls = pageUrls.filter((u) => u !== url);
        
        await prisma.chapter.update({
          where: { id: chapter.id },
          data: {
            pageUrls: JSON.stringify(filteredUrls),
            totalPages: filteredUrls.length,
          },
        });
      }
    }

    const response: DeleteResponse = {
      success: true,
      message: 'Archivo eliminado exitosamente',
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error en upload/delete:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al eliminar el archivo' },
      { status: 500 }
    );
  }
}

/**
 * POST alternativo para eliminar (para compatibilidad con formularios)
 */
export async function POST(request: NextRequest) {
  return DELETE(request);
}
