import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/cron/cleanup-expired-bids - Cleanup expired sponsorship bids
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Find and refund expired bids
    const expiredBids = await prisma.sponsorshipBid.findMany({
      where: {
        status: 'ACTIVE',
        createdAt: {
          lt: oneWeekAgo,
        },
      },
      include: {
        user: true,
      },
    });

    // Refund users and mark bids as lost
    for (const bid of expiredBids) {
      await prisma.$transaction([
        // Refund user
        prisma.user.update({
          where: { id: bid.userId },
          data: {
            inkcoinsBalance: {
              increment: bid.bidAmount,
            },
          },
        }),
        // Mark bid as lost
        prisma.sponsorshipBid.update({
          where: { id: bid.id },
          data: { status: 'LOST' },
        }),
        // Create refund transaction
        prisma.transaction.create({
          data: {
            userId: bid.userId,
            amount: bid.bidAmount,
            type: 'REFUND',
            referenceId: bid.id,
            description: 'Refund for expired sponsorship bid',
          },
        }),
      ]);
    }

    console.log(`[CRON] Cleaned up ${expiredBids.length} expired bids`);

    return NextResponse.json({
      success: true,
      message: 'Expired bids cleaned up',
      bidsProcessed: expiredBids.length,
    });
  } catch (error) {
    console.error('[CRON] Error cleaning up bids:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
