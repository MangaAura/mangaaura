/**
 * Notifications Read All API
 * 
 * POST /api/notifications/read-all - Marcar todas las notificaciones como leídas
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { notificationService } from '@/core/services/NotificationService';

// POST /api/notifications/read-all - Mark all notifications as read
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Mark all notifications as read
    const count = await notificationService.markAllAsRead(userId);

    return NextResponse.json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas',
      markedCount: count,
      unreadCount: 0,
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/notifications/read-all - Alternative method (for compatibility)
export async function PUT(request: NextRequest) {
  return POST(request);
}
