import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'totalScore';
    const order = searchParams.get('order') || 'desc';

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const clans = await prisma.clan.findMany({
      where,
      orderBy: { [sort]: order },
      include: {
        leader: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        _count: { select: { members: true } },
      },
    });

    const formatted = clans.map((clan) => ({
      id: clan.id,
      name: clan.name,
      description: clan.description,
      emblemUrl: clan.emblemUrl,
      totalScore: clan.totalScore,
      monthlyScore: clan.monthlyScore,
      currentSeason: clan.currentSeason,
      seasonStartDate: clan.seasonStartDate.toISOString(),
      seasonEndDate: clan.seasonEndDate?.toISOString() || null,
      leader: clan.leader,
      memberCount: clan._count.members,
      createdAt: clan.createdAt.toISOString(),
    }));

    return NextResponse.json({ clans: formatted });
  } catch (error) {
    console.error('Error fetching clans:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
