import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { timingSafeEqual } from 'crypto';

// POST /api/cron/reset-monthly-scores - Reset monthly clan scores (runs 1st of month)
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    if (!authHeader || !expectedAuth || authHeader.length !== expectedAuth.length || !timingSafeEqual(Buffer.from(authHeader), Buffer.from(expectedAuth))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Reset all clan monthly scores
    const result = await prisma.clan.updateMany({
      data: {
        monthlyScore: 0,
        currentSeason: {
          increment: 1,
        },
      },
    });

    // Reset user monthly contributions
    await prisma.clanMembership.updateMany({
      data: {
        contributedScore: 0,
      },
    });

    console.log(`[CRON] Reset monthly scores for ${result.count} clans`);

    return NextResponse.json({
      success: true,
      message: 'Monthly scores reset successfully',
      clansUpdated: result.count,
    });
  } catch (error) {
    console.error('[CRON] Error resetting monthly scores:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
