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
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20'), 1), 100);

    const [campaigns, totalCrowdfunding] = await Promise.all([
      prisma.chapter.findMany({
        where: { isCrowdfunded: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          manga: { select: { id: true, title: true, slug: true, coverUrl: true, authorName: true } },
          _count: { select: { crowdfundingContributions: true } },
        },
      }),
      prisma.chapter.count({ where: { isCrowdfunded: true } }),
    ]);

    const [bids, totalBids] = await Promise.all([
      prisma.sponsorshipBid.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          chapter: { select: { id: true, chapterNumber: true, mangaId: true, manga: { select: { id: true, title: true, slug: true } } } },
          user: { select: { id: true, username: true, displayName: true } },
        },
      }),
      prisma.sponsorshipBid.count(),
    ]);

    const totals = await Promise.all([
      prisma.crowdfundingContribution.aggregate({ _sum: { amount: true } }),
      prisma.sponsorshipBid.aggregate({ _sum: { bidAmount: true } }),
    ]);

    return NextResponse.json({
      crowdfunding: campaigns.map((c) => ({
        id: c.id,
        manga: c.manga,
        chapterNumber: c.chapterNumber,
        title: c.title,
        goal: c.crowdfundingGoal,
        current: c.crowdfundingCurrent,
        contributorsCount: c._count.crowdfundingContributions,
        createdAt: c.createdAt.toISOString(),
      })),
      sponsorshipBids: bids.map((b) => ({
        id: b.id,
        chapter: b.chapter,
        user: b.user,
        bidAmount: b.bidAmount,
        status: b.status,
        isWinning: b.isWinning,
        createdAt: b.createdAt.toISOString(),
      })),
      totals: {
        crowdfundingRaised: totals[0]._sum.amount || 0,
        sponsorshipTotal: totals[1]._sum.bidAmount || 0,
        crowdfundingCount: totalCrowdfunding,
        sponsorshipCount: totalBids,
      },
      pagination: { page, limit, total: totalCrowdfunding, totalPages: Math.ceil(totalCrowdfunding / limit) },
    });
  } catch (error) {
    console.error('Error fetching crowdfunding:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
