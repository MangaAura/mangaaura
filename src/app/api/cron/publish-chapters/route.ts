import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

// POST /api/cron/publish-chapters - Publish scheduled chapters
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    if (!authHeader || !expectedAuth || authHeader.length !== expectedAuth.length || !timingSafeEqual(Buffer.from(authHeader), Buffer.from(expectedAuth))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    const chapters = await prisma.chapter.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: now },
      },
    });

    const updated = await prisma.chapter.updateMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: now },
      },
      data: { status: 'PUBLISHED' },
    });

    return NextResponse.json({
      published: updated.count,
      chapters: chapters.map((c: any) => c.id),
    });
  } catch (error) {
    console.error('Publish chapters error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
