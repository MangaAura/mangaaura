import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Note: Announcement model requires `npx prisma generate` after schema update
const prismaAnn = prisma as any;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const announcement = await prismaAnn.announcement.findUnique({ where: { id } });
    if (!announcement) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({
      announcement: {
        ...announcement,
        createdAt: announcement.createdAt.toISOString(),
        updatedAt: announcement.updatedAt.toISOString(),
        startAt: announcement.startAt.toISOString(),
        expiresAt: announcement.expiresAt?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error('Error fetching announcement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { message, messageEn, type, priority, style, isActive, startAt, expiresAt } = body;

    const updateData: Record<string, unknown> = {};
    if (message !== undefined) updateData.message = message.trim();
    if (messageEn !== undefined) updateData.messageEn = messageEn?.trim() || null;
    if (type !== undefined) updateData.type = type;
    if (priority !== undefined) updateData.priority = priority;
    if (style !== undefined) updateData.style = style;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (startAt !== undefined) updateData.startAt = new Date(startAt);
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;

    const announcement = await prismaAnn.announcement.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      announcement: {
        ...announcement,
        createdAt: announcement.createdAt.toISOString(),
        updatedAt: announcement.updatedAt.toISOString(),
        startAt: announcement.startAt.toISOString(),
        expiresAt: announcement.expiresAt?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await prismaAnn.announcement.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}