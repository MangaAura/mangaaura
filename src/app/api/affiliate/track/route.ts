import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

const trackSchema = z.object({
  code: z.string().min(1), // affiliate referral code or promo code
  source: z.string().optional(), // banner | link | promo_code | social
  campaign: z.string().optional(), // UTM campaign
  landingPage: z.string().optional(), // Where they landed
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = trackSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid tracking data' }, { status: 400 });
    }

    const { code, source, campaign, landingPage } = result.data;

    // Find the affiliate by referral code or promo code
    const affiliate = await prisma.user.findFirst({
      where: {
        OR: [
          { referralCode: code },
          { affiliatePromoCode: code },
        ],
        affiliateStatus: 'active',
      },
      select: { id: true },
    });

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
    }

    // Don't allow self-referrals
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               request.headers.get('x-real-ip') ||
               'unknown';

    const userAgent = request.headers.get('user-agent') || undefined;

    // Create tracking record
    const referral = await prisma.affiliateReferral.create({
      data: {
        affiliateId: affiliate.id,
        refereeIp: ip,
        refereeUserAgent: userAgent,
        source: source || null,
        campaign: campaign || null,
        landingPage: landingPage || null,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90-day cookie
      },
    });

    console.info(`[Affiliate Track] Click tracked: ${code} -> referral ${referral.id}`);

    // Return the referral ID to be stored in a cookie on the client
    return NextResponse.json({
      success: true,
      referralId: referral.id,
      expiresAt: referral.expiresAt?.toISOString(),
    });
  } catch (error) {
    console.error('[Affiliate Track] Error:', error);
    return NextResponse.json({ error: 'Tracking error' }, { status: 500 });
  }
}
