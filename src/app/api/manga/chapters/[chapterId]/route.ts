import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { safeJsonParse } from '@/lib/utils';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const { chapterId } = await params;

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        manga: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverUrl: true,
            authorId: true,
            authorName: true,
          },
        },
      },
    });

    if (!chapter) {
      return NextResponse.json(
        { error: 'Capítulo no encontrado' },
        { status: 404 }
      );
    }

    // NOTA: Los views NO se incrementan aquí. Se cuentan desde analytics (capítulo leído >5s)
    // vía POST /api/analytics/track con evento chapter_read, que incrementa
    // chapter.viewCount y manga.totalViews en la misma transacción.

    return NextResponse.json({
      id: chapter.id,
      mangaId: chapter.mangaId,
      chapterNumber: chapter.chapterNumber,
      title: chapter.title,
      totalPages: chapter.totalPages,
      pageUrls: safeJsonParse<string[]>(chapter.pageUrls, []),
      createdAt: chapter.createdAt,
      viewCount: chapter.viewCount,
      crowdfunding: chapter.crowdfundingGoal
        ? {
            goal: chapter.crowdfundingGoal,
            current: chapter.crowdfundingCurrent,
            isFunded: chapter.isCrowdfunded,
            progress: Math.round((chapter.crowdfundingCurrent / chapter.crowdfundingGoal) * 100),
          }
        : null,
      manga: {
        id: chapter.manga.id,
        title: chapter.manga.title,
        slug: chapter.manga.slug,
        coverUrl: chapter.manga.coverUrl,
        authorId: chapter.manga.authorId,
        authorName: chapter.manga.authorName,
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
