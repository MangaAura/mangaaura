import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { bulkCreateBan } from '@/core/services/BanService';

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
    const { userIds, banType, reason, reasonDetail, expiresAt } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'userIds array is required and must not be empty' },
        { status: 400 }
      );
    }
    if (!banType || !reason) {
      return NextResponse.json(
        { error: 'banType and reason are required' },
        { status: 400 }
      );
    }

    const bans = await bulkCreateBan(
      userIds.map((uid: string) => ({
        userId: uid,
        banType,
        reason,
        reasonDetail,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        issuedById: session.user.id,
      }))
    );

    return NextResponse.json({ bans, count: bans.length }, { status: 201 });
  } catch (error) {
    console.error('Error bulk creating bans:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
