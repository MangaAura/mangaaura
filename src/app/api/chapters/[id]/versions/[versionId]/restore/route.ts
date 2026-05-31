import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: chapterId, versionId } = await params;

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { manga: { select: { authorId: true } } },
    });

    if (!chapter || chapter.manga.authorId !== session.user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const version = await prisma.chapterVersion.findUnique({
      where: { id: versionId },
    });

    if (!version || version.chapterId !== chapterId) {
      return NextResponse.json({ error: 'Versión no encontrada' }, { status: 404 });
    }

    let restoredPageUrls: string[];
    try {
      restoredPageUrls = JSON.parse(version.pageUrls);
    } catch {
      restoredPageUrls = [];
    }

    await prisma.chapter.update({
      where: { id: chapterId },
      data: {
        title: version.title,
        pageUrls: JSON.stringify(restoredPageUrls),
        totalPages: restoredPageUrls.length,
        coverUrl: version.coverUrl,
      },
    });

    return NextResponse.json({ success: true, message: 'Versión restaurada exitosamente' });
  } catch (error) {
    console.error('[Restore Version] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
