/**
 * Notifications API
 * 
 * GET: Listar notificaciones del usuario
 * POST: Crear notificación (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { notificationService } from '@/core/services/NotificationService';
import { z } from 'zod';

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

// GET /api/notifications - Listar notificaciones del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type') as any;
    const isRead = searchParams.get('isRead');
    const includeRead = searchParams.get('includeRead') !== 'false';

    // Obtener notificaciones
    const notifications = await notificationService.getUserNotifications(
      session.user.id,
      limit,
      offset
    );

    // Filtrar por tipo si se especifica
    let filteredNotifications = notifications;
    if (type) {
      filteredNotifications = notifications.filter(n => n.type === type);
    }

    // Filtrar por estado de lectura
    if (isRead !== null) {
      const isReadBool = isRead === 'true';
      filteredNotifications = notifications.filter(n => n.isRead === isReadBool);
    } else if (!includeRead) {
      filteredNotifications = notifications.filter(n => !n.isRead);
    }

    // Obtener conteo de no leídas
    const unreadCount = await notificationService.getUnreadCount(session.user.id);

    return NextResponse.json({
      notifications: filteredNotifications,
      total: filteredNotifications.length,
      unreadCount,
      hasMore: filteredNotifications.length === limit,
    });
  } catch (error) {
    console.error('[Notifications API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Crear notificación (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar si es admin
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
