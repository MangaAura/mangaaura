import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const chapter = await prisma.chapter.findUnique({
      where: { id },
      include: {
        manga: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverUrl: true,
            authorName: true,
          },
        },
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: 'Capítulo no encontrado' }, { status: 404 });
    }

    let pageUrls: string[] = [];
    try {
  pageUrls = JSON.parse(chapter.pageUrls || '[]');
  } catch { console.info('[Chapters API] Invalid pageUrls JSON for chapter', chapter.id); }

    return NextResponse.json({
      id: chapter.id,
      mangaId: chapter.mangaId,
      chapterNumber: chapter.chapterNumber,
      title: chapter.title,
      totalPages: chapter.totalPages,
      pageUrls,
      viewCount: chapter.viewCount,
      isCrowdfunded: chapter.isCrowdfunded,
      crowdfundingGoal: chapter.crowdfundingGoal,
      crowdfundingCurrent: chapter.crowdfundingCurrent,
      createdAt: chapter.createdAt,
      manga: chapter.manga,
    });
  } catch (error) {
    console.error('[Chapter GET] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
