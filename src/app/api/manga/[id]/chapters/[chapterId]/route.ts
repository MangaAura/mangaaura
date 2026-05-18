import { NextRequest, NextResponse } from 'next/server';

import { invalidateCache } from '@/lib/apiCache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

// GET /api/manga/[id]/chapters/[chapterId] - Obtener capítulo específico
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    const { id, chapterId } = await params;

    // Verificar que el manga existe
    const manga = await prisma.mangaSeries.findUnique({
      where: { id },
      select: { id: true, title: true, slug: true, coverUrl: true, authorId: true, authorName: true },
    });

    if (!manga) {
      return NextResponse.json(
        { error: 'Manga no encontrado' },
        { status: 404 }
      );
    }

    // Buscar el capítulo
    const chapter = await prisma.chapter.findFirst({
      where: {
        id: chapterId,
        mangaId: id,
      },
    });

    if (!chapter) {
      return NextResponse.json(
        { error: 'Capítulo no encontrado' },
        { status: 404 }
      );
    }

    // Incrementar views del capítulo y del manga
    await prisma.$transaction([
      prisma.chapter.update({
        where: { id: chapterId },
        data: { viewCount: { increment: 1 } },
      }),
      prisma.mangaSeries.update({
        where: { id },
        data: { totalViews: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({
      id: chapter.id,
      mangaId: chapter.mangaId,
      chapterNumber: chapter.chapterNumber,
      title: chapter.title,
      totalPages: chapter.totalPages,
      pageUrls: chapter.pageUrls ? JSON.parse(chapter.pageUrls) : [],
      createdAt: chapter.createdAt,
      viewCount: chapter.viewCount + 1,
      crowdfunding: chapter.crowdfundingGoal
        ? {
            goal: chapter.crowdfundingGoal,
            current: chapter.crowdfundingCurrent,
            isFunded: chapter.isCrowdfunded,
            progress: Math.round((chapter.crowdfundingCurrent / chapter.crowdfundingGoal) * 100),
          }
        : null,
      manga: {
        id: manga.id,
        title: manga.title,
        slug: manga.slug,
        coverUrl: manga.coverUrl,
        authorId: manga.authorId,
        authorName: manga.authorName,
      },
    });
  } catch (error) {
    console.error('Error obteniendo capítulo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/manga/[id]/chapters/[chapterId] - Actualizar capítulo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const rlResponse = await withRateLimit(request, session.user.id, 'default');
    if (rlResponse) return rlResponse;

    const { id, chapterId } = await params;
    const body = await request.json();

    // Verificar que el manga existe
    const manga = await prisma.mangaSeries.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!manga) {
      return NextResponse.json(
        { error: 'Manga no encontrado' },
        { status: 404 }
      );
    }

    // Verificar ownership
    if (manga.authorId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No tienes permisos para editar capítulos de este manga' },
        { status: 403 }
      );
    }

    // Verificar que el capítulo existe
    const chapter = await prisma.chapter.findFirst({
      where: {
        id: chapterId,
        mangaId: id,
      },
    });

    if (!chapter) {
      return NextResponse.json(
        { error: 'Capítulo no encontrado' },
        { status: 404 }
      );
    }

    // Preparar datos de actualización
    const updateData: Record<string, unknown> = {};

    // Actualizar título
    if (body.title !== undefined) {
      updateData.title = body.title ? body.title.trim() : null;
    }

    // Reordenar páginas
    if (body.pageUrls !== undefined) {
      if (!Array.isArray(body.pageUrls) || body.pageUrls.length === 0) {
        return NextResponse.json(
          { error: 'pageUrls debe ser un array no vacío' },
          { status: 400 }
        );
      }

      // Validar que todas las URLs sean strings válidos
      const validUrls = body.pageUrls.filter((url: string) => typeof url === 'string' && url.trim() !== '');
      if (validUrls.length === 0) {
        return NextResponse.json(
          { error: 'Las URLs de páginas deben ser strings válidos' },
          { status: 400 }
        );
      }

      updateData.pageUrls = JSON.stringify(validUrls);
      updateData.totalPages = validUrls.length;
    }

    // Actualizar número de capítulo
    if (body.chapterNumber !== undefined) {
      const newChapterNum = parseInt(body.chapterNumber);
      if (isNaN(newChapterNum) || newChapterNum < 1) {
        return NextResponse.json(
          { error: 'El número de capítulo debe ser un entero positivo' },
          { status: 400 }
        );
      }

      // Verificar que el nuevo número no esté en uso (excluyendo el capítulo actual)
      if (newChapterNum !== chapter.chapterNumber) {
        const existingChapter = await prisma.chapter.findUnique({
          where: {
            mangaId_chapterNumber: {
              mangaId: id,
              chapterNumber: newChapterNum,
            },
          },
        });

        if (existingChapter && existingChapter.id !== chapterId) {
          return NextResponse.json(
            { error: `El capítulo ${newChapterNum} ya existe en este manga` },
            { status: 409 }
          );
        }

        updateData.chapterNumber = newChapterNum;
      }
    }

    // Actualizar metas de crowdfunding si es admin
    if (session.user.role === 'ADMIN') {
      if (body.crowdfundingGoal !== undefined) {
        const goal = parseInt(body.crowdfundingGoal);
        if (isNaN(goal) || goal < 0) {
          return NextResponse.json(
            { error: 'La meta de crowdfunding debe ser un número positivo' },
            { status: 400 }
          );
        }
        updateData.crowdfundingGoal = goal === 0 ? null : goal;
      }
    }

    const updated = await prisma.chapter.update({
      where: { id: chapterId },
      data: updateData,
    });

    // Actualizar fecha de actualización del manga
    await prisma.mangaSeries.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    // Invalidar caches
    await invalidateCache('manga:chapters:list');
    await invalidateCache(`manga:${id}`);
    await invalidateCache(`chapter:${chapterId}`);

    return NextResponse.json({
      message: 'Capítulo actualizado exitosamente',
      chapter: {
        id: updated.id,
        mangaId: updated.mangaId,
        chapterNumber: updated.chapterNumber,
        title: updated.title,
        totalPages: updated.totalPages,
        pageUrls: updated.pageUrls ? JSON.parse(updated.pageUrls) : [],
        createdAt: updated.createdAt,
        viewCount: updated.viewCount,
        crowdfunding: updated.crowdfundingGoal
          ? {
              goal: updated.crowdfundingGoal,
              current: updated.crowdfundingCurrent,
              isFunded: updated.isCrowdfunded,
              progress: Math.round((updated.crowdfundingCurrent / updated.crowdfundingGoal) * 100),
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Error actualizando capítulo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/manga/[id]/chapters/[chapterId] - Eliminar capítulo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const rlResponse = await withRateLimit(request, session.user.id, 'default');
    if (rlResponse) return rlResponse;

    const { id, chapterId } = await params;

    // Verificar que el manga existe
    const manga = await prisma.mangaSeries.findUnique({
      where: { id },
      select: { authorId: true, title: true },
    });

    if (!manga) {
      return NextResponse.json(
        { error: 'Manga no encontrado' },
        { status: 404 }
      );
    }

    // Verificar ownership
    if (manga.authorId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar capítulos de este manga' },
        { status: 403 }
      );
    }

    // Verificar que el capítulo existe
    const chapter = await prisma.chapter.findFirst({
      where: {
        id: chapterId,
        mangaId: id,
      },
      select: { id: true, chapterNumber: true, title: true },
    });

    if (!chapter) {
      return NextResponse.json(
        { error: 'Capítulo no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar el capítulo
    await prisma.chapter.delete({
      where: { id: chapterId },
    });

    // Actualizar fecha de actualización del manga
    await prisma.mangaSeries.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    // Invalidar caches
    await invalidateCache('manga:chapters:list');
    await invalidateCache(`manga:${id}`);
    await invalidateCache(`chapter:${chapterId}`);

    return NextResponse.json({
      message: `Capítulo ${chapter.chapterNumber}${chapter.title ? ` - ${chapter.title}` : ''} eliminado exitosamente`,
      deleted: true,
    });
  } catch (error) {
    console.error('Error eliminando capítulo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
