import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const progressSchema = z.object({
  mangaId: z.string().uuid(),
  chapterId: z.string().uuid(),
  page: z.number().int().min(0).default(0),
  percentage: z.number().min(0).max(100).default(0),
});

/**
 * POST /api/library/progress
 * Guardar progreso de lectura
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const result = progressSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { mangaId, chapterId, page, percentage } = result.data;

    // Verificar que el manga y capítulo existen
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { manga: true },
    });

    if (!chapter || chapter.mangaId !== mangaId) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // Guardar o actualizar progreso
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

    // Actualizar currentChapter en library si es mayor
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

    // Actualizar lastReadAt del usuario
    await prisma.user.update({
      where: { id: session.user.id },
      data: { lastReadAt: new Date() },
    });

    return NextResponse.json({
      message: 'Progress saved',
      progress: {
        id: progress.id,
        mangaId: progress.mangaId,
        chapterId: progress.chapterId,
        page: progress.page,
        percentage: progress.percentage,
        updatedAt: progress.updatedAt,
      },
    });
  } catch (error) {
    console.error('[Library Progress API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

const getProgressSchema = z.object({
  mangaId: z.string().uuid().optional(),
  chapterId: z.string().uuid().optional(),
});

/**
 * GET /api/library/progress
 * Obtener progreso de lectura
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
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

    // Construir where clause
    const where: any = { userId: session.user.id };
    if (mangaId) where.mangaId = mangaId;
    if (chapterId) where.chapterId = chapterId;

    const progress = await prisma.readingProgress.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        manga: {
          select: {
            id: true,
            title: true,
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
    });

    return NextResponse.json({
      progress,
    });
  } catch (error) {
    console.error('[Library Progress API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/library/progress
 * Eliminar progreso de lectura
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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

    return NextResponse.json({
      message: 'Progress deleted',
    });
  } catch (error) {
    console.error('[Library Progress API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
