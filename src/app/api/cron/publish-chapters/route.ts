import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== process.env.CRON_SECRET) {
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
