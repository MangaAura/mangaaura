import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    const userId = session.user.id;

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        user1: { select: { id: true, username: true, avatarUrl: true, displayName: true } },
        user2: { select: { id: true, username: true, avatarUrl: true, displayName: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const friends = friendships.map((f) =>
      f.user1Id === userId ? f.user2 : f.user1
    ) as { id: string; username: string | null; avatarUrl: string | null; displayName: string | null }[];

    const total = await prisma.friendship.count({
      where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
    });

    return NextResponse.json({
      friends,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[Friends API] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
