import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';
import { createBan } from '@/core/services/BanService';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
      await requirePermission(session.user.id, 'bans:view');
    } catch {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const banType = searchParams.get('banType');
    const isActive = searchParams.get('isActive');
    const userId = searchParams.get('userId');

    const where: Record<string, unknown> = {};
    if (banType) where.banType = banType;
    if (isActive !== null) where.isActive = isActive === 'true';
    if (userId) where.userId = userId;

    const bans = await prisma.banRecord.findMany({
      where,
      orderBy: { issuedAt: 'desc' },
      include: {
        issuedBy: { select: { id: true, username: true } },
        liftedBy: { select: { id: true, username: true } },
        user: { select: { id: true, username: true, email: true } },
      },
    });

    return NextResponse.json({ bans });
  } catch (error) {
    console.error('Error fetching bans:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
      await requirePermission(session.user.id, 'bans:create');
    } catch {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, banType, reason, reasonDetail, ipAddress, expiresAt } = body;

    if (!banType || !reason) {
      return NextResponse.json(
        { error: 'banType and reason are required' },
        { status: 400 }
      );
    }

    const ban = await createBan({
      userId,
      banType,
      reason,
      reasonDetail,
      ipAddress,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      issuedById: session.user.id,
    });

    return NextResponse.json({ ban }, { status: 201 });
  } catch (error) {
    console.error('Error creating ban:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
