import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || !['ADMIN', 'OWNER'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const logs = await prisma.securityAuditLog.findMany({
      where: { action: 'IMPERSONATE_USER' },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        userId: true,
        targetId: true,
        metadata: true,
        createdAt: true,
      },
    });

    const adminIds = [...new Set(logs.map((l) => l.userId).filter(Boolean))] as string[];
    const targetIds = [...new Set(logs.filter((l) => l.targetId).map((l) => l.targetId as string))];

    const [admins, targets] = await Promise.all([
      prisma.user.findMany({ where: { id: { in: adminIds } }, select: { id: true, username: true } }),
      prisma.user.findMany({ where: { id: { in: targetIds } }, select: { id: true, username: true } }),
    ]);

    const adminMap = new Map(admins.map((a) => [a.id, a.username]));
    const targetMap = new Map(targets.map((t) => [t.id, t.username]));

    const formatted = logs.map((log) => ({
      id: log.id,
      adminName: adminMap.get(log.userId ?? '') || 'Unknown',
      targetName: targetMap.get(log.targetId as string) || (() => {
        try {
          const meta = JSON.parse(log.metadata || '{}');
          return meta.impersonatedUsername || 'Unknown';
        } catch { return 'Unknown'; }
      })(),
      createdAt: log.createdAt.toISOString(),
    }));

    return NextResponse.json({ logs: formatted });
  } catch (error) {
    console.error('Error fetching impersonation history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
