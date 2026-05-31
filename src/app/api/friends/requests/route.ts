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
    const direction = searchParams.get('direction') || 'received';

    const userId = session.user.id;

    const where = direction === 'sent'
      ? { senderId: userId, status: 'PENDING' }
      : { receiverId: userId, status: 'PENDING' };

    const requests = await prisma.friendRequest.findMany({
      where,
      include: {
        sender: { select: { id: true, username: true, avatarUrl: true, displayName: true } },
        receiver: { select: { id: true, username: true, avatarUrl: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('[FriendRequests GET] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
