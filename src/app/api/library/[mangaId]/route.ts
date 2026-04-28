/**
 * Library Item API
 * 
 * PATCH: Update library entry status/rating
 * DELETE: Remove from library
 */

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { invalidatePattern } from '@/lib/cache';
import { z } from 'zod';

const updateSchema = z.object({
  status: z.enum(['READING', 'COMPLETED', 'ON_HOLD', 'DROPPED', 'PLAN_TO_READ']).optional(),
  rating: z.number().min(1).max(10).optional(),
  currentChapter: z.number().min(0).optional(),
});

interface RouteParams {
  params: Promise<{ mangaId: string }>;
}

/**
 * GET /api/library/[mangaId]
 * Get specific library entry
 */
export async function GET(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { mangaId } = await params;

  try {
    const entry = await prisma.userLibrary.findUnique({
      where: {
        userId_mangaId: {
          userId: session.user.id,
          mangaId,
        },
      },
      include: {
        manga: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverUrl: true,
            status: true,
            chapters: {
              select: { chapterNumber: true },
              orderBy: { chapterNumber: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!entry) {
      return Response.json({ error: 'Entry not found' }, { status: 404 });
    }

    return Response.json({
      ...entry,
      totalChapters: entry.manga.chapters[0]?.chapterNumber || 0,
    });
  } catch (error) {
    console.error('Error fetching library entry:', error);
    return Response.json({ error: 'Failed to fetch entry' }, { status: 500 });
  }
}

/**
 * PATCH /api/library/[mangaId]
 * Update library entry
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { mangaId } = await params;

  try {
    const body = await request.json();
    const { status, rating, currentChapter } = updateSchema.parse(body);

    // Check if entry exists
    const existing = await prisma.userLibrary.findUnique({
      where: {
        userId_mangaId: {
          userId: session.user.id,
          mangaId,
        },
      },
    });

    if (!existing) {
      return Response.json({ error: 'Entry not found' }, { status: 404 });
    }

    const entry = await prisma.userLibrary.update({
      where: {
        userId_mangaId: {
          userId: session.user.id,
          mangaId,
        },
      },
      data: {
        ...(status && { status }),
        ...(rating !== undefined && { rating }),
        ...(currentChapter !== undefined && { currentChapter }),
      },
      include: {
        manga: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverUrl: true,
          },
        },
      },
    });

    // Invalidate cache
    await invalidatePattern(`library:${session.user.id}:*`);

    return Response.json(entry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }
    console.error('Error updating library entry:', error);
    return Response.json({ error: 'Failed to update entry' }, { status: 500 });
  }
}

/**
 * DELETE /api/library/[mangaId]
 * Remove from library
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { mangaId } = await params;

  try {
    await prisma.userLibrary.delete({
      where: {
        userId_mangaId: {
          userId: session.user.id,
          mangaId,
        },
      },
    });

    // Invalidate cache
    await invalidatePattern(`library:${session.user.id}:*`);

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error removing from library:', error);
    return Response.json({ error: 'Failed to remove from library' }, { status: 500 });
  }
}
