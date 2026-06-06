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

    const chapter = await prisma.chapter.findUnique({
      where: { id },
      select: { id: true, isCrowdfunded: true, crowdfundingGoal: true, crowdfundingCurrent: true },
    });

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    if (!chapter.isCrowdfunded) {
      return NextResponse.json({ error: 'Chapter is not a crowdfunded campaign' }, { status: 400 });
    }

    // Reset crowdfunding fields to effectively cancel the campaign
    await prisma.chapter.update({
      where: { id },
      data: {
        isCrowdfunded: false,
        crowdfundingGoal: null,
        crowdfundingCurrent: 0,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cancelling crowdfunding campaign:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
