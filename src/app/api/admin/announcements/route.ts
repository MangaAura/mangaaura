import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Note: Announcement model requires `npx prisma generate` after schema update
// Cast to any to bypass TypeScript check until generate is run
const prismaAnn = prisma as any;

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const announcements = await prismaAnn.announcement.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({
      announcements: announcements.map((a: any) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
        startAt: a.startAt.toISOString(),
        expiresAt: a.expiresAt?.toISOString() || null,
      })),
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, messageEn, type, priority, style, isActive, startAt, expiresAt } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const announcement = await prismaAnn.announcement.create({
      data: {
        message: message.trim(),
        messageEn: messageEn?.trim() || null,
        type: type || 'info',
        priority: priority || 'normal',
        style: style || 'banner',
        isActive: isActive ?? true,
        startAt: startAt ? new Date(startAt) : new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json({
      announcement: {
        ...announcement,
        createdAt: announcement.createdAt.toISOString(),
        updatedAt: announcement.updatedAt.toISOString(),
        startAt: announcement.startAt.toISOString(),
        expiresAt: announcement.expiresAt?.toISOString() || null,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}