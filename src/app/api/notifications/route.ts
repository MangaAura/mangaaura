import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { notificationService } from '@/core/services/NotificationService';
import { GetNotificationsUseCase } from '@/application/use-cases/notifications/GetNotificationsUseCase';
import { z } from 'zod';

const getNotificationsUseCase = new GetNotificationsUseCase(notificationService);

const createNotificationSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum([
    'ACHIEVEMENT_UNLOCKED',
    'NEW_CHAPTER',
    'COMMENT_REPLY',
    'SPONSORSHIP_WON',
    'LEVEL_UP',
    'INK_COINS_RECEIVED',
    'SYSTEM',
    'MENTION',
  ]),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  data: z.object({}).passthrough().optional(),
  imageUrl: z.string().url().optional(),
  linkUrl: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || undefined;
    const isReadParam = searchParams.get('isRead');
    const includeRead = searchParams.get('includeRead') !== 'false';

    const result = await getNotificationsUseCase.execute({
      userId: session.user.id,
      limit: Math.min(parseInt(searchParams.get('limit') || '20'), 100),
      offset: parseInt(searchParams.get('offset') || '0'),
      type,
      isRead: isReadParam !== null ? isReadParam === 'true' : undefined,
      includeRead,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Notifications API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin only' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = createNotificationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const notification = await notificationService.createNotification(result.data);

    return NextResponse.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error('[Notifications API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
