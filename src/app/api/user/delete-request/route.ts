import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { markedForDeletionAt: true },
    });

    return NextResponse.json({
      markedForDeletionAt: user?.markedForDeletionAt?.toISOString() || null,
    });
  } catch (error) {
    console.error('Delete request GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 14);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { markedForDeletionAt: deletionDate },
    });

    return NextResponse.json({
      success: true,
      deletionDate: deletionDate.toISOString(),
    });
  } catch (error) {
    console.error('Delete request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { markedForDeletionAt: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancel delete request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
