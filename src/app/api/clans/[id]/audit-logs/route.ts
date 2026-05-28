import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

// GET /api/clans/[id]/audit-logs — Retrieve audit logs for a clan (LEADER/OFFICER only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clanId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const rlResponse = await withRateLimit(request, session.user.id, 'search');
    if (rlResponse) return rlResponse;

    // Verify user is a LEADER or OFFICER of this clan
    const membership = await prisma.clanMembership.findFirst({
      where: {
        clanId,
        userId: session.user.id,
        role: { in: ['LEADER', 'OFFICER'] },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Solo líderes y oficiales pueden ver la auditoría' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const rawPage = parseInt(searchParams.get('page') || '1');
    const page = Math.max(1, isNaN(rawPage) ? 1 : rawPage);
    const rawLimit = parseInt(searchParams.get('limit') || '30');
    const limit = Math.min(100, Math.max(1, isNaN(rawLimit) ? 30 : rawLimit));
    const action = searchParams.get('action') || '';
    const severity = searchParams.get('severity') || '';

    // Build where clause: CLAN or CLAN_CHAT targetType + clanId in metadata
    const where: Record<string, unknown> = {
      targetType: { in: ['CLAN', 'CLAN_CHAT'] },
      metadata: { contains: clanId },
    };
    if (action) where.action = action;
    if (severity) where.severity = severity;

    const [logs, total] = await Promise.all([
      prisma.securityAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          },
        },
      }),
      prisma.securityAuditLog.count({ where }),
    ]);

    // Get unique actions for the filter dropdown
    const uniqueActions = await prisma.securityAuditLog.groupBy({
      by: ['action'],
      where: {
        targetType: { in: ['CLAN', 'CLAN_CHAT'] },
        metadata: { contains: clanId },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    });

    return NextResponse.json({
      logs: logs.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
        metadata: l.metadata
          ? (() => {
              try {
                return JSON.parse(l.metadata);
              } catch {
                return null;
              }
            })()
          : null,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      uniqueActions: uniqueActions.map((a) => ({ action: a.action, count: a._count.id })),
    });
  } catch (error) {
    console.error('Clan audit log error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
