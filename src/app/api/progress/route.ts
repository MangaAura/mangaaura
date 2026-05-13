import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateCacheKey, getCache, setCache, deleteCache } from '@/lib/cache';
import { z } from 'zod';

const CACHE_TTL = 60;

const progressSchema = z.object({
  mangaId: z.string().uuid(),
  chapterId: z.string().uuid(),
  currentPage: z.number().int().min(0).default(0),
  percentage: z.number().min(0).max(100).default(0),
});

const getProgressSchema = z.object({
  mangaId: z.string().uuid().optional(),
  chapterId: z.string().uuid().optional(),
});

/**
 * GET /api/progress
 * Get reading progress for current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const result = getProgressSchema.safeParse({
      mangaId: searchParams.get('mangaId') || undefined,
      chapterId: searchParams.get('chapterId') || undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { mangaId, chapterId } = result.data;

    const cacheKey = (generateCacheKey as any)('progress', session.user.id, mangaId || 'all', chapterId || 'all');
    const cached = await getCache(cacheKey);
    if (cached) {
      return NextResponse.json({ progress: cached });
    }

    const where: any = { userId: session.user.id };
    if (mangaId) where.mangaId = mangaId;
    if (chapterId) where.chapterId = chapterId;

    const progress = await prisma.readingProgress.findMany({
      where,
      include: {
        manga: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverUrl: true,
          },
        },
        chapter: {
          select: {
            id: true,
            chapterNumber: true,
            title: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    await setCache(cacheKey, progress, CACHE_TTL);

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}

/**
 * POST /api/progress
 * Update reading progress
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const result = progressSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { mangaId, chapterId, currentPage, percentage } = result.data;

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { manga: true },
    });

    if (!chapter || chapter.mangaId !== mangaId) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    const progress = await prisma.readingProgress.upsert({
      where: {
        userId_mangaId_chapterId: {
          userId: session.user.id,
          mangaId,
          chapterId,
        },
      },
      update: {
        currentPage,
        percentage,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        mangaId,
        chapterId,
        currentPage,
        percentage,
      },
    });

    const currentChapterNum = Math.floor(chapter.chapterNumber);
    await prisma.userLibrary.updateMany({
      where: {
        userId: session.user.id,
        mangaId,
        currentChapter: { lt: currentChapterNum },
      },
      data: {
        currentChapter: currentChapterNum,
        status: percentage >= 90 ? 'COMPLETED' : 'READING',
        updatedAt: new Date(),
      },
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: { lastReadAt: new Date() },
    });

    await deleteCache(`progress:${session.user.id}:*`);

    return NextResponse.json({
      message: 'Progress saved',
      progress: {
        id: progress.id,
        mangaId: progress.mangaId,
        chapterId: progress.chapterId,
        currentPage: progress.currentPage,
        percentage: progress.percentage,
        updatedAt: progress.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}

/**
 * DELETE /api/progress
 * Delete reading progress
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const mangaId = searchParams.get('mangaId');
    const chapterId = searchParams.get('chapterId');

    if (!mangaId && !chapterId) {
      return NextResponse.json(
        { error: 'Must provide mangaId or chapterId' },
        { status: 400 }
      );
    }

    const where: any = { userId: session.user.id };
    if (mangaId) where.mangaId = mangaId;
    if (chapterId) where.chapterId = chapterId;

    await prisma.readingProgress.deleteMany({ where });

    await deleteCache(`progress:${session.user.id}:*`);

    return NextResponse.json({ message: 'Progress deleted' });
  } catch (error) {
    console.error('Error deleting progress:', error);
    return NextResponse.json({ error: 'Failed to delete progress' }, { status: 500 });
  }
}
