/**
 * Reading Progress API
 * 
 * GET: Get current reading progress for user
 * POST: Update reading progress
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateCacheKey, getCache, setCache, deleteCache } from '@/lib/cache';
import { z } from 'zod';

const CACHE_TTL = 60;

const progressSchema = z.object({
  mangaId: z.string(),
  chapterId: z.string(),
  page: z.number().min(0).default(0),
  percentage: z.number().min(0).max(100).default(0),
});

/**
 * GET /api/progress
 * Get all reading progress for current user
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mangaId = searchParams.get('mangaId');

  try {
    const where: any = { userId: session.user.id };
    if (mangaId) where.mangaId = mangaId;

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

    return Response.json({ progress });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return Response.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}

/**
 * POST /api/progress
 * Update reading progress
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { mangaId, chapterId, page, percentage } = progressSchema.parse(body);

    // Get chapter info
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { mangaId: true, chapterNumber: true },
    });

    if (!chapter) {
      return Response.json({ error: 'Chapter not found' }, { status: 404 });
    }

    // Upsert progress
    const progress = await prisma.readingProgress.upsert({
      where: {
        userId_mangaId_chapterId: {
          userId: session.user.id,
          mangaId,
          chapterId,
        },
      },
      update: {
        page,
        percentage,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        mangaId,
        chapterId,
        page,
        percentage,
      },
    });

    // Update library current chapter if exists
    await prisma.userLibrary.updateMany({
      where: {
        userId: session.user.id,
        mangaId,
      },
      data: {
        currentChapter: chapter.chapterNumber,
        updatedAt: new Date(),
      },
    });

    // Update user's last read
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        lastReadAt: new Date(),
      },
    });

    // Invalidate cache
    await deleteCache(`progress:${session.user.id}:*`);

    return Response.json({ success: true, progress });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }
    console.error('Error updating progress:', error);
    return Response.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}
