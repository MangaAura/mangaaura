import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';
import { liftBan } from '@/core/services/BanService';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
      await requirePermission(session.user.id, 'bans:view');
    } catch {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const ban = await prisma.banRecord.findUnique({
      where: { id },
      include: {
        issuedBy: { select: { id: true, username: true } },
        liftedBy: { select: { id: true, username: true } },
        user: { select: { id: true, username: true, email: true } },
      },
    });

    if (!ban) {
      return NextResponse.json({ error: 'Ban not found' }, { status: 404 });
    }

    return NextResponse.json({ ban });
  } catch (error) {
    console.error('Error fetching ban:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
      await requirePermission(session.user.id, 'bans:lift');
    } catch {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { liftReason } = body;

    const ban = await liftBan(id, session.user.id, liftReason);

    return NextResponse.json({ ban });
  } catch (error) {
    console.error('Error lifting ban:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
