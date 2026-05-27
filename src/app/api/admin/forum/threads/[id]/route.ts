import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rlResponse = await withRateLimit(request, session.user.id, 'default');
    if (rlResponse) return rlResponse;

    const body = await request.json();
    const { action } = body;

    const thread = await prisma.forumThread.findUnique({ where: { id } });
    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    switch (action) {
      case 'pin':
        await prisma.forumThread.update({ where: { id }, data: { isPinned: true } });
        break;
      case 'unpin':
        await prisma.forumThread.update({ where: { id }, data: { isPinned: false } });
        break;
      case 'lock':
        await prisma.forumThread.update({ where: { id }, data: { isLocked: true } });
        break;
      case 'unlock':
        await prisma.forumThread.update({ where: { id }, data: { isLocked: false } });
        break;
      case 'delete':
        await prisma.forumThread.delete({ where: { id } });
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating thread:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
