import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending | paid | cancelled
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, unknown> = {
      affiliateId: session.user.id,
    };

    if (status && ['pending', 'paid', 'cancelled'].includes(status)) {
      where.status = status;
    }

    const [commissions, total] = await Promise.all([
      prisma.affiliateCommission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          referee: {
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          },
        },
      }),
      prisma.affiliateCommission.count({ where }),
    ]);

    return NextResponse.json({
      commissions: commissions.map(c => ({
        id: c.id,
        amount: c.amount,
        rate: c.rate,
        purchaseAmount: c.purchaseAmount,
        purchaseType: c.purchaseType,
        status: c.status,
        periodStart: c.periodStart?.toISOString() || null,
        periodEnd: c.periodEnd?.toISOString() || null,
        paidAt: c.paidAt?.toISOString() || null,
        createdAt: c.createdAt.toISOString(),
        referee: c.referee,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('[Affiliate Commissions] Error:', error);
    return NextResponse.json({ error: 'Error al obtener comisiones' }, { status: 500 });
  }
}
