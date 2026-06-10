import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

// Helper para verificar ownership
async function verifyOwnership(
  announcementId: string,
  userId: string,
  role: string,
) {
  const announcement = await prisma.mangaAnnouncement.findUnique({
    where: { id: announcementId },
    include: {
      manga: { select: { authorId: true } },
    },
  });

  if (!announcement) {
    return { error: 'Anuncio no encontrado', status: 404 };
  }

  if (
    announcement.authorId !== userId &&
    announcement.manga.authorId !== userId &&
    !['ADMIN', 'OWNER'].includes(role)
  ) {
    return { error: 'No tienes permisos para modificar este anuncio', status: 403 };
  }

  return { announcement };
}

// PUT /api/creator/announcements/[id] - Actualizar anuncio
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const rlResponse = await withRateLimit(request, session.user.id, 'default');
    if (rlResponse) return rlResponse;

    const { id } = await params;
    const ownership = await verifyOwnership(id, session.user.id, session.user.role as string);

    if ('error' in ownership) {
      return NextResponse.json(
        { error: ownership.error },
        { status: ownership.status },
      );
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.title !== undefined) {
      if (body.title.length > 200) {
        return NextResponse.json(
          { error: 'El título no puede exceder 200 caracteres' },
          { status: 400 },
        );
      }
      updateData.title = body.title;
    }

    if (body.content !== undefined) {
      if (body.content.length > 5000) {
        return NextResponse.json(
          { error: 'El contenido no puede exceder 5000 caracteres' },
          { status: 400 },
        );
      }
      updateData.content = body.content;
    }

    if (body.isPublished !== undefined) {
      updateData.isPublished = body.isPublished;
    }

    const updated = await prisma.mangaAnnouncement.update({
      where: { id },
      data: updateData,
      include: {
        manga: {
          select: { id: true, title: true, slug: true, coverUrl: true },
        },
      },
    });

    // Si se re-publica un anuncio que estaba en borrador, notificar
    if (
      body.isPublished === true &&
      ownership.announcement.isPublished === false
    ) {
      import('../notifyFollowers').then(({ notifyAnnouncement }) => {
        notifyAnnouncement(
          {
            id: updated.manga.id,
            title: updated.manga.title,
            slug: updated.manga.slug,
            coverUrl: updated.manga.coverUrl,
          },
          {
            id: updated.id,
            title: updated.title,
            content: updated.content,
          },
        ).catch((err: unknown) =>
          console.error('[CreatorAnnouncements] Error notifying on re-publish:', err),
        );
      });
    }

    return NextResponse.json({ announcement: updated });
  } catch (error) {
    console.error('[CreatorAnnouncements] Error updating:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

// DELETE /api/creator/announcements/[id] - Eliminar anuncio
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const ownership = await verifyOwnership(id, session.user.id, session.user.role as string);

    if ('error' in ownership) {
      return NextResponse.json(
        { error: ownership.error },
        { status: ownership.status },
      );
    }

    await prisma.mangaAnnouncement.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[CreatorAnnouncements] Error deleting:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
