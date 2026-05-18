import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { XP } from '@/core/value-objects/XP';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

const memeSchema = z.object({
  panelId: z.string().min(1).max(200),
  mangaTitle: z.string().min(1).max(200),
  chapterNumber: z.number().int().positive().optional(),
  texts: z.array(z.string().max(500)).max(10).optional(),
});

// POST /api/memes - Save meme
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const rlResponse = await withRateLimit(request, session?.user?.id, 'default');
    if (rlResponse) return rlResponse;

    const contentType = request.headers.get('content-type') || '';
    let panelId: string;
    let mangaTitle: string;
    let chapterNumber: number | undefined;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      panelId = (formData.get('panelId') as string) || crypto.randomUUID();
      mangaTitle = (formData.get('mangaTitle') as string) || '';
      chapterNumber = formData.get('chapterNumber') ? parseInt(formData.get('chapterNumber') as string) : undefined;
    } else {
      const body = await request.json();
      const parsed = memeSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: parsed.error.issues },
          { status: 400 }
        );
      }
      panelId = parsed.data.panelId;
      mangaTitle = parsed.data.mangaTitle;
      chapterNumber = parsed.data.chapterNumber;
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { xpPoints: true, level: true },
    });

    if (user) {
      const currentXP = XP.create(user.xpPoints);
      const newXP = currentXP.add(XP.create(5));

      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          xpPoints: newXP.amount,
          level: newXP.level,
        },
      });
    }

    return NextResponse.json({
      success: true,
      meme: {
        id: panelId,
        userId: session.user.id,
        mangaTitle,
        chapterNumber,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error saving meme:', error);
    return NextResponse.json(
      { error: 'Error al guardar meme' },
      { status: 500 }
    );
  }
}

// GET /api/memes - Get user memes
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '12'), 1), 100);

    const activities = await prisma.userActivity.findMany({
      where: {
        userId: session.user.id,
        activityType: 'MEME_CREATED',
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.userActivity.count({
      where: {
        userId: session.user.id,
        activityType: 'MEME_CREATED',
      },
    });

    return NextResponse.json({
      memes: activities.map(a => {
        const meta = a.metadata ? JSON.parse(a.metadata) : {};
        return {
          id: a.referenceId || a.id,
          userId: a.userId,
          mangaTitle: meta.mangaTitle || '',
          chapterNumber: meta.chapterNumber,
          createdAt: a.createdAt.toISOString(),
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching memes:', error);
    return NextResponse.json(
      { error: 'Error al obtener memes' },
      { status: 500 }
    );
  }
}
