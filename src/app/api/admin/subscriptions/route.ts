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
    const status = searchParams.get('status') || '';

    const where: Record<string, unknown> = {};
    if (status) where.subscriptionStatus = status;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          ...where,
          subscriptionId: { not: null },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          stripeCustomerId: true,
          subscriptionId: true,
          subscriptionStatus: true,
          subscriptionTier: true,
          subscriptionEndsAt: true,
          auraLifetimePurchased: true,
          auraBalance: true,
          createdAt: true,
        },
      }),
      prisma.user.count({
        where: {
          ...where,
          subscriptionId: { not: null },
        },
      }),
    ]);

    const formatted = users.map((u) => ({
      id: u.id,
      email: u.email,
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      stripeCustomerId: u.stripeCustomerId,
      subscriptionId: u.subscriptionId,
      subscriptionStatus: u.subscriptionStatus,
      subscriptionTier: u.subscriptionTier,
      subscriptionEndsAt: u.subscriptionEndsAt?.toISOString() || null,
      auraLifetimePurchased: u.auraLifetimePurchased,
      auraBalance: u.auraBalance,
      createdAt: u.createdAt.toISOString(),
    }));

    return NextResponse.json({
      subscriptions: formatted,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
