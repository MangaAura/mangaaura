import { NextRequest, NextResponse } from 'next/server';

import { invalidateCache } from '@/lib/apiCache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

// Helper para generar slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 100);
}

// GET /api/manga/[id] - Obtener manga con sus capítulos
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const manga = await prisma.mangaSeries.findUnique({
      where: { id },
    });

    if (!manga) {
      return NextResponse.json(
        { error: 'Manga no encontrado' },
        { status: 404 }
      );
    }

    // Obtener capítulos del manga
    const chapters = await prisma.chapter.findMany({
      where: { mangaId: id },
      orderBy: { chapterNumber: 'asc' },
      select: {
        id: true,
        chapterNumber: true,
        title: true,
        totalPages: true,
        createdAt: true,
        viewCount: true,
        crowdfundingGoal: true,
        crowdfundingCurrent: true,
        isCrowdfunded: true,
      },
    });

    // Incrementar views (fire and forget, no await to not block response)
    prisma.mangaSeries.update({
      where: { id },
      data: { totalViews: { increment: 1 } },
    }).catch(err => console.error('[Manga] View count increment failed:', err));

    // Add cache headers for stale-while-revalidate
    const response = NextResponse.json({
      id: manga.id,
      title: manga.title,
      slug: manga.slug,
      description: manga.description,
      coverUrl: manga.coverUrl,
      status: manga.status,
      tags: manga.tags ? JSON.parse(manga.tags) : [],
      authorId: manga.authorId,
      authorName: manga.authorName,
      rating: manga.rating,
      totalViews: manga.totalViews + 1,
      createdAt: manga.createdAt,
      updatedAt: manga.updatedAt,
      chapters: chapters.map((ch: any) => ({
        id: ch.id,
        chapterNumber: ch.chapterNumber,
        title: ch.title,
        totalPages: ch.totalPages,
        createdAt: ch.createdAt,
        viewCount: ch.viewCount,
        crowdfunding: ch.crowdfundingGoal
          ? {
              goal: ch.crowdfundingGoal,
              current: ch.crowdfundingCurrent,
              isFunded: ch.isCrowdfunded,
              progress: Math.round((ch.crowdfundingCurrent / ch.crowdfundingGoal) * 100),
            }
          : null,
      })),
    });

  // Set cache headers for stale-while-revalidate
  response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  response.headers.set('X-Cache-Tag', 'manga:' + id);

  return response;
  } catch (error) {
    console.error('Error obteniendo manga:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/manga/[id] - Actualizar manga (solo owner)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const body = await request.json();

    // Verificar que el manga existe
    const manga = await prisma.mangaSeries.findUnique({
      where: { id },
      select: { authorId: true, slug: true },
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
        { error: 'No tienes permisos para editar este manga' },
        { status: 403 }
      );
    }

    // Validar campos si están presentes
    if (body.title && (typeof body.title !== 'string' || body.title.trim().length === 0)) {
      return NextResponse.json(
        { error: 'El título no puede estar vacío' },
        { status: 400 }
      );
    }

    // Preparar datos de actualización
    const updateData: Record<string, unknown> = {};

    if (body.title !== undefined) {
      updateData.title = body.title.trim();
      // Regenerar slug si cambia el título
      const baseSlug = generateSlug(body.title);
      let newSlug = baseSlug;
      let counter = 1;

      while (
        await prisma.mangaSeries.findFirst({
          where: { slug: newSlug, id: { not: id } },
        })
      ) {
        newSlug = `${baseSlug}-${counter}`;
        counter++;
      }
      updateData.slug = newSlug;
    }

    if (body.description !== undefined) {
      updateData.description = body.description;
    }

    if (body.coverUrl !== undefined) {
      updateData.coverUrl = body.coverUrl;
    }

    if (body.status !== undefined) {
      const validStatuses = ['ONGOING', 'COMPLETED', 'HIATUS', 'CANCELLED'];
      if (!validStatuses.includes(body.status.toUpperCase())) {
        return NextResponse.json(
          { error: 'Estado inválido. Valores permitidos: ONGOING, COMPLETED, HIATUS, CANCELLED' },
          { status: 400 }
        );
      }
      updateData.status = body.status.toUpperCase();
    }

    if (body.tags !== undefined) {
      if (Array.isArray(body.tags)) {
        updateData.tags = JSON.stringify(body.tags.map((t: string) => t.toLowerCase().trim()));
      } else {
        return NextResponse.json(
          { error: 'Las etiquetas deben ser un array' },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.mangaSeries.update({
      where: { id },
      data: updateData,
    });

    // Invalidar caches
    await invalidateCache(`manga:${id}`);
    await invalidateCache('manga:list');
    await invalidateCache('user:mangas:list');

    return NextResponse.json({
      message: 'Manga actualizado exitosamente',
      manga: {
        id: updated.id,
        title: updated.title,
        slug: updated.slug,
        description: updated.description,
        coverUrl: updated.coverUrl,
        status: updated.status,
        tags: updated.tags ? JSON.parse(updated.tags) : [],
        authorId: updated.authorId,
        authorName: updated.authorName,
        rating: updated.rating,
        totalViews: updated.totalViews,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error actualizando manga:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/manga/[id] - Eliminar manga y todos sus capítulos (solo owner)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;

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
        { error: 'No tienes permisos para eliminar este manga' },
        { status: 403 }
      );
    }

    // Eliminar manga y capítulos en transacción
    await prisma.$transaction([
      prisma.chapter.deleteMany({ where: { mangaId: id } }),
      prisma.mangaSeries.delete({ where: { id } }),
    ]);

    // Invalidar caches
    await invalidateCache(`manga:${id}`);
    await invalidateCache('manga:list');
    await invalidateCache('user:mangas:list');

    return NextResponse.json({
      message: `Manga "${manga.title}" eliminado exitosamente`,
      deleted: true,
    });
  } catch (error) {
    console.error('Error eliminando manga:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
