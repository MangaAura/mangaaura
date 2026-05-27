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
    const { action, resolutionNotes } = body;

    const takedown = await prisma.dMCATakedown.findUnique({ where: { id } });
    if (!takedown) {
      return NextResponse.json({ error: 'DMCA takedown not found' }, { status: 404 });
    }

    switch (action) {
      case 'review':
        await prisma.dMCATakedown.update({
          where: { id },
          data: { status: 'UNDER_REVIEW', reviewedBy: session.user.id },
        });
        break;
      case 'approve':
        await prisma.dMCATakedown.update({
          where: { id },
          data: {
            status: 'REMOVED',
            reviewedBy: session.user.id,
            reviewedAt: new Date(),
            resolutionNotes: resolutionNotes || null,
          },
        });
        break;
      case 'reject':
        await prisma.dMCATakedown.update({
          where: { id },
          data: {
            status: 'REJECTED',
            reviewedBy: session.user.id,
            reviewedAt: new Date(),
            resolutionNotes: resolutionNotes || null,
          },
        });
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating DMCA takedown:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
