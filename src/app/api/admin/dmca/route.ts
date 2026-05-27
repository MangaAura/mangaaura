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
    const status = searchParams.get('status') || '';
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20'), 1), 100);

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [takedowns, total] = await Promise.all([
      prisma.dMCATakedown.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { submittedAt: 'desc' },
      }),
      prisma.dMCATakedown.count({ where }),
    ]);

    const statusCounts = await prisma.dMCATakedown.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const counts: Record<string, number> = {};
    statusCounts.forEach((s: { status: string; _count: { id: number } }) => { counts[s.status] = s._count.id; });

    return NextResponse.json({
      takedowns: takedowns.map((t: { submittedAt: Date; reviewedAt: Date | null }) => ({
        ...t,
        submittedAt: t.submittedAt.toISOString(),
        reviewedAt: t.reviewedAt?.toISOString() || null,
      })),
      statusCounts: counts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching DMCA takedowns:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
