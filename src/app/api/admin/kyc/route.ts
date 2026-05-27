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
    const status = searchParams.get('status') || 'pending';

    const users = await prisma.user.findMany({
      where: { kycStatus: status },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        kycStatus: true,
        kycVerifiedAt: true,
        auraBalance: true,
        auraLifetimePurchased: true,
        auraLifetimeWithdrawn: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const counts = await prisma.user.groupBy({
      by: ['kycStatus'],
      _count: { id: true },
    });

    const statusCounts = { none: 0, pending: 0, verified: 0, rejected: 0 };
    counts.forEach((c) => {
      statusCounts[c.kycStatus as keyof typeof statusCounts] = c._count.id;
    });

    return NextResponse.json({
      users: users.map((u) => ({
        ...u,
        kycVerifiedAt: u.kycVerifiedAt?.toISOString() || null,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      })),
      statusCounts,
    });
  } catch (error) {
    console.error('Error fetching KYC:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
