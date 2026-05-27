import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

export async function POST(
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

    switch (action) {
      case 'approve':
        await prisma.user.update({
          where: { id },
          data: { kycStatus: 'verified', kycVerifiedAt: new Date() },
        });
        break;
      case 'reject':
        await prisma.user.update({
          where: { id },
          data: { kycStatus: 'rejected' },
        });
        break;
      case 'reset':
        await prisma.user.update({
          where: { id },
          data: { kycStatus: 'none', kycVerifiedAt: null },
        });
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating KYC:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
