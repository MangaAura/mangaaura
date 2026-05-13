import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
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

    await prisma.$transaction([
      prisma.chapter.update({
        where: { id: chapterId },
        data: { viewCount: { increment: 1 } },
      }),
      prisma.mangaSeries.update({
        where: { id: chapter.mangaId },
        data: { totalViews: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({
      id: chapter.id,
      mangaId: chapter.mangaId,
      chapterNumber: chapter.chapterNumber,
      title: chapter.title,
      totalPages: chapter.totalPages,
      pageUrls: chapter.pageUrls ? JSON.parse(chapter.pageUrls) : [],
      createdAt: chapter.createdAt,
      viewCount: chapter.viewCount + 1,
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
