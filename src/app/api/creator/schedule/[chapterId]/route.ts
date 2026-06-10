/**
 * PATCH /api/creator/schedule/[chapterId]
 *
 * Actualiza la fecha de programación de un capítulo.
 * Body: { scheduledAt: string (ISO) | null }
 *   - Si scheduledAt es null, se quita la programación (pasa a DRAFT/PUBLISHED)
 *   - Si scheduledAt es una fecha futura, se programa
 */

import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const rlResponse = await withRateLimit(request, session.user.id, 'default');
    if (rlResponse) return rlResponse;

    const { chapterId } = await params;
    const body = await request.json();
    const { scheduledAt } = body;

    // Verificar que el capítulo existe y pertenece al creador
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        manga: { select: { authorId: true, title: true } },
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: 'Capítulo no encontrado' }, { status: 404 });
    }

    if (chapter.manga.authorId !== session.user.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para modificar este capítulo' },
        { status: 403 },
      );
    }

    // Determinar nuevo status basado en la fecha
    let newStatus = chapter.status;
    let newScheduledAt: Date | null = null;

    if (scheduledAt === null) {
      // Quitar programación: si estaba SCHEDULED, pasa a PUBLISHED si ya tiene páginas
      newScheduledAt = null;
      if (chapter.status === 'SCHEDULED') {
        newStatus = 'PUBLISHED';
      }
    } else {
      const parsedDate = new Date(scheduledAt);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { error: 'Fecha inválida. Usa formato ISO.' },
          { status: 400 },
        );
      }

      newScheduledAt = parsedDate;
      newStatus = parsedDate > new Date() ? 'SCHEDULED' : 'PUBLISHED';
    }

    const updated = await prisma.chapter.update({
      where: { id: chapterId },
      data: {
        scheduledAt: newScheduledAt,
        status: newStatus,
      },
      select: {
        id: true,
        chapterNumber: true,
        title: true,
        status: true,
        scheduledAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      chapter: {
        id: updated.id,
        chapterNumber: updated.chapterNumber,
        title: updated.title,
        status: updated.status,
        scheduledAt: updated.scheduledAt?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error('[RescheduleChapter] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
