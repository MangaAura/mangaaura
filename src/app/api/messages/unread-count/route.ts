import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ count: 0 });
    }

    const count = await prisma.directMessage.count({
      where: {
        isRead: false,
        senderId: { not: session.user.id },
        conversation: {
          OR: [
            { participant1Id: session.user.id },
            { participant2Id: session.user.id },
          ],
        },
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error('[Messages Unread API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unread count' },
      { status: 500 }
    );
  }
}
