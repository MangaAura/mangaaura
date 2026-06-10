import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

// GET /api/creator/announcements?mangaId=xxx - Listar anuncios del creador
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mangaId = searchParams.get('mangaId');

    const where: Record<string, unknown> = {
      authorId: session.user.id,
    };
    if (mangaId) {
      where.mangaId = mangaId;
    }

    const announcements = await prisma.mangaAnnouncement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        manga: {
          select: { id: true, title: true, slug: true, coverUrl: true },
        },
      },
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error('[CreatorAnnouncements] Error listing:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

// POST /api/creator/announcements - Crear nuevo anuncio
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const rlResponse = await withRateLimit(request, session.user.id, 'default');
    if (rlResponse) return rlResponse;

    const body = await request.json();
    const { mangaId, title, content, isPublished } = body;

    if (!mangaId || !title || !content) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: mangaId, title, content' },
        { status: 400 },
      );
    }

    if (title.length > 200) {
      return NextResponse.json(
        { error: 'El título no puede exceder 200 caracteres' },
        { status: 400 },
      );
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: 'El contenido no puede exceder 5000 caracteres' },
        { status: 400 },
      );
    }

    // Verificar que el manga pertenece al creador
    const manga = await prisma.mangaSeries.findUnique({
      where: { id: mangaId },
      select: { id: true, authorId: true, title: true, slug: true, coverUrl: true },
    });

    if (!manga) {
      return NextResponse.json({ error: 'Manga no encontrado' }, { status: 404 });
    }

    if (
      manga.authorId !== session.user.id &&
      !['ADMIN', 'OWNER'].includes(session.user.role as string)
    ) {
      return NextResponse.json(
        { error: 'No tienes permisos para crear anuncios en este manga' },
        { status: 403 },
      );
    }

    const announcement = await prisma.mangaAnnouncement.create({
      data: {
        mangaId,
        authorId: session.user.id,
        title,
        content,
        isPublished: isPublished ?? true,
      },
      include: {
        manga: {
          select: { id: true, title: true, slug: true, coverUrl: true },
        },
      },
    });

    // Si se publica, notificar a seguidores (fire-and-forget)
    if (announcement.isPublished) {
      import('./notifyFollowers').then(({ notifyAnnouncement }) => {
        notifyAnnouncement(
          { id: manga.id, title: manga.title, slug: manga.slug, coverUrl: manga.coverUrl },
          { id: announcement.id, title: announcement.title, content: announcement.content },
        ).catch((err) =>
          console.error('[CreatorAnnouncements] Error notifying followers:', err),
        );
      });
    }

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    console.error('[CreatorAnnouncements] Error creating:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
