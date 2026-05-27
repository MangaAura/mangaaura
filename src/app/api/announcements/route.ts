import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

// Note: Announcement model requires `npx prisma generate` after schema update
const prismaAnn = prisma as any;

export async function GET() {
  try {
    const now = new Date();
    const announcements = await prismaAnn.announcement.findMany({
      where: {
        isActive: true,
        startAt: { lte: now },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({
      announcements: announcements.map((a: any) => ({
        id: a.id,
        message: a.message,
        messageEn: a.messageEn,
        type: a.type,
        priority: a.priority,
        style: a.style,
        startAt: a.startAt.toISOString(),
        expiresAt: a.expiresAt?.toISOString() || null,
      })),
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}