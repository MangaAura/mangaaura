import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [achievements, userAchievements] = await Promise.all([
      prisma.achievementDefinition.findMany({ orderBy: { xpReward: 'desc' } }),
      prisma.userAchievement.groupBy({
        by: ['achievementId'],
        _count: { id: true },
      }),
    ]);

    const unlockCounts = new Map(userAchievements.map((ua) => [ua.achievementId, ua._count.id]));
    const totalUsers = await prisma.user.count();

    const formatted = achievements.map((a) => ({
      id: a.id,
      badgeId: a.badgeId,
      name: a.name,
      description: a.description,
      iconUrl: a.iconUrl,
      xpReward: a.xpReward,
      condition: a.condition,
      category: a.category,
      difficulty: a.difficulty,
      unlockCount: unlockCounts.get(a.id) || 0,
      totalUsers,
      createdAt: a.createdAt.toISOString(),
    }));

    return NextResponse.json({ achievements: formatted });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rlResponse = await withRateLimit(request, session.user.id, 'default');
    if (rlResponse) return rlResponse;

    const body = await request.json();
    const { badgeId, name, description, iconUrl, xpReward, condition, category, difficulty } = body;

    if (!badgeId || !name || !xpReward || !condition) {
      return NextResponse.json({ error: 'badgeId, name, xpReward, and condition are required' }, { status: 400 });
    }

    const existing = await prisma.achievementDefinition.findUnique({ where: { badgeId } });
    if (existing) {
      return NextResponse.json({ error: 'badgeId already exists' }, { status: 409 });
    }

    const achievement = await prisma.achievementDefinition.create({
      data: {
        badgeId,
        name,
        description: description || '',
        iconUrl: iconUrl || null,
        xpReward,
        condition: typeof condition === 'string' ? condition : JSON.stringify(condition),
        category: category || 'general',
        difficulty: difficulty || 'EASY',
      },
    });

    return NextResponse.json({ achievement, message: 'Achievement created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating achievement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
