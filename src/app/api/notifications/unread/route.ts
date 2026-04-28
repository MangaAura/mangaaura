/**
 * Notifications Unread Count API
 * 
 * GET: Obtener contador de notificaciones no leídas
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { notificationService } from '@/core/services/NotificationService';

// GET /api/notifications/unread - Obtener contador de no leídas
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const unreadCount = await notificationService.getUnreadCount(session.user.id);
    const stats = await notificationService.getNotificationStats(session.user.id);

    return NextResponse.json({
      unread: unreadCount,
      total: stats.total,
      byType: stats.byType,
    });
  } catch (error) {
    console.error('[Notifications Unread API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unread count' },
      { status: 500 }
    );
  }
}
