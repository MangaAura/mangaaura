import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !['ADMIN', 'OWNER'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, subscriptionId: true, subscriptionStatus: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.subscriptionId || user.subscriptionStatus !== 'active') {
      return NextResponse.json({ error: 'User does not have an active subscription' }, { status: 400 });
    }

    // Mark subscription as cancelled
    await prisma.user.update({
      where: { id },
      data: {
        subscriptionStatus: 'canceled',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
