import { NextRequest, NextResponse } from 'next/server';

import { getIPBan } from '@/core/services/BanService';
import { auth } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';

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
    const ip = searchParams.get('ip');

    if (!ip) {
      return NextResponse.json({ error: 'ip query parameter is required' }, { status: 400 });
    }

    const ban = await getIPBan(ip);

    return NextResponse.json({ banned: !!ban, ban });
  } catch (error) {
    console.error('Error checking IP ban:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
