import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ mangaId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { mangaId } = await params;

  const manga = await prisma.mangaSeries.findUnique({
    where: { id: mangaId },
    select: { id: true },
  });

  if (!manga) {
    return NextResponse.json({ error: 'Manga no encontrado' }, { status: 404 });
  }

  const mangaTags = await prisma.mangaTag.findMany({
    where: { mangaId },
    include: {
      tag: {
        include: {
          parent: {
            select: { id: true, name: true, slug: true },
          },
        },
      },
    },
    orderBy: { tag: { order: 'asc' } },
  });

  const tags = mangaTags.map((mt) => mt.tag);

  return NextResponse.json({ tags });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ mangaId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const rlResponse = await withRateLimit(request, session?.user?.id, 'default');
  if (rlResponse) return rlResponse;

  const { mangaId } = await params;

  const manga = await prisma.mangaSeries.findUnique({
    where: { id: mangaId },
    select: { authorId: true },
  });

  if (!manga) {
    return NextResponse.json({ error: 'Manga no encontrado' }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (manga.authorId !== session.user.id && user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { tagIds } = body;

    if (!Array.isArray(tagIds)) {
      return NextResponse.json({ error: 'tagIds debe ser un array' }, { status: 400 });
    }

    const existingTags = await prisma.tag.findMany({
      where: { id: { in: tagIds }, isActive: true },
    });

    if (existingTags.length !== tagIds.length) {
      return NextResponse.json({ error: 'Algunos tags no existen o están inactivos' }, { status: 400 });
    }

    await prisma.mangaTag.deleteMany({ where: { mangaId } });

    await prisma.mangaTag.createMany({
      data: tagIds.map((tagId: string) => ({
        mangaId,
        tagId,
      })),
    });

    const mangaTags = await prisma.mangaTag.findMany({
      where: { mangaId },
      include: { tag: true },
    });

    return NextResponse.json({
      tags: mangaTags.map((mt) => mt.tag),
    });
  } catch (error) {
    console.error('Error updating manga tags:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}