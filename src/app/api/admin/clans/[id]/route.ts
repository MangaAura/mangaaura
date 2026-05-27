import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clan = await prisma.clan.findUnique({
      where: { id },
      include: {
        leader: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        members: {
          include: {
            user: { select: { id: true, username: true, displayName: true, avatarUrl: true, level: true, xpPoints: true } },
          },
          orderBy: { contributedScore: 'desc' },
        },
      },
    });

    if (!clan) {
      return NextResponse.json({ error: 'Clan not found' }, { status: 404 });
    }

    return NextResponse.json({
      clan: {
        ...clan,
        seasonStartDate: clan.seasonStartDate.toISOString(),
        seasonEndDate: clan.seasonEndDate?.toISOString() || null,
        createdAt: clan.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching clan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rlResponse = await withRateLimit(request, session.user.id, 'default');
    if (rlResponse) return rlResponse;

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'resetScore':
        await prisma.clan.update({
          where: { id },
          data: {
            totalScore: 0,
            monthlyScore: 0,
            currentSeason: { increment: 1 },
            seasonStartDate: new Date(),
            seasonEndDate: null,
          },
        });
        await prisma.clanMembership.updateMany({
          where: { clanId: id },
          data: { contributedScore: 0 },
        });
        break;

      case 'delete':
        await prisma.clan.delete({ where: { id } });
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error performing clan action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
