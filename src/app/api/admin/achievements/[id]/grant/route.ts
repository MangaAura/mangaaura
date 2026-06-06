import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id || !['ADMIN', 'OWNER'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rlResponse = await withRateLimit(request, session.user.id, 'default');
    if (rlResponse) return rlResponse;

    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const achievement = await prisma.achievementDefinition.findUnique({ where: { id } });
    if (!achievement) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const existing = await prisma.userAchievement.findUnique({
      where: { userId_achievementId: { userId, achievementId: id } },
    });
    if (existing) {
      return NextResponse.json({ error: 'User already has this achievement' }, { status: 409 });
    }

    const [userAchievement] = await prisma.$transaction([
      prisma.userAchievement.create({
        data: {
          userId,
          achievementId: id,
          unlockedAt: new Date(),
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { xpPoints: { increment: achievement.xpReward } },
      }),
    ]);

    await prisma.securityAuditLog.create({
      data: {
        userId: session.user.id,
        action: 'GRANT_ACHIEVEMENT',
        targetId: userId,
        targetType: 'USER',
        metadata: JSON.stringify({ achievementId: id, achievementName: achievement.name, xpReward: achievement.xpReward }),
        severity: 'NORMAL',
      },
    });

    return NextResponse.json({ userAchievement, message: 'Achievement granted successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error granting achievement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
