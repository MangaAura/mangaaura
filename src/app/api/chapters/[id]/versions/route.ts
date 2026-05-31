import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const createVersionSchema = z.object({
  title: z.string().nullable().optional(),
  pageUrls: z.array(z.string()).optional(),
  coverUrl: z.string().nullable().optional(),
  note: z.string().max(500).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: chapterId } = await params;

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { manga: { select: { authorId: true } } },
    });

    if (!chapter || chapter.manga.authorId !== session.user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const versions = await prisma.chapterVersion.findMany({
      where: { chapterId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ versions });
  } catch (error) {
    console.error('[Versions GET] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: chapterId } = await params;

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { manga: { select: { authorId: true } }, title: true, pageUrls: true, coverUrl: true },
    });

    if (!chapter || chapter.manga.authorId !== session.user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const result = createVersionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const { title, pageUrls, coverUrl, note } = result.data;

    const version = await prisma.chapterVersion.create({
      data: {
        chapterId,
        title: title ?? chapter.title,
        pageUrls: JSON.stringify(pageUrls ?? JSON.parse(chapter.pageUrls)),
        coverUrl: coverUrl ?? chapter.coverUrl,
        note: note || null,
      },
    });

    return NextResponse.json({ version }, { status: 201 });
  } catch (error) {
    console.error('[Versions POST] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
