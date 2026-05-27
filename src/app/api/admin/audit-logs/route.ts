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
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const action = searchParams.get('action');
    const severity = searchParams.get('severity');
    const userId = searchParams.get('userId');
    const targetType = searchParams.get('targetType');

    const where: Record<string, unknown> = {};
    if (action) where.action = action;
    if (severity) where.severity = severity;
    if (userId) where.userId = userId;
    if (targetType) where.targetType = targetType;

    const [logs, total] = await Promise.all([
      prisma.securityAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, username: true, email: true, avatarUrl: true } },
        },
      }),
      prisma.securityAuditLog.count({ where }),
    ]);

    const uniqueActions = await prisma.securityAuditLog.groupBy({
      by: ['action'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    });

    return NextResponse.json({
      logs: logs.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
        metadata: l.metadata ? (() => { try { return JSON.parse(l.metadata); } catch { return null; } })() : null,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      uniqueActions: uniqueActions.map((a) => ({ action: a.action, count: a._count.id })),
    });
  } catch (error) {
    console.error('Audit log error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}