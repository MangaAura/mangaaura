import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

// GET /api/manga/[id]/announcements - Anuncios públicos de un manga
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Buscar manga por id o slug
    const manga = await prisma.mangaSeries.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true },
    });

    if (!manga) {
      return NextResponse.json({ error: 'Manga no encontrado' }, { status: 404 });
    }

    const announcements = await prisma.mangaAnnouncement.findMany({
      where: {
        mangaId: manga.id,
        isPublished: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error('[PublicAnnouncements] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
