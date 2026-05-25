import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      await requirePermission(session.user.id, 'restore:accounts');
    } catch {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, reason } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role: 'USER' },
    });

    await prisma.banRecord.updateMany({
      where: { userId, isActive: true },
      data: {
        isActive: false,
        liftedById: session.user.id,
        liftedAt: new Date(),
        liftReason: reason || 'Account restored by admin',
      },
    });

    await prisma.securityAuditLog.create({
      data: {
        userId: session.user.id,
        action: 'RESTORE_ACCOUNT',
        targetId: userId,
        targetType: 'USER',
        metadata: JSON.stringify({ reason: reason || 'No reason provided' }),
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        severity: 'WARNING',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Restore error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
