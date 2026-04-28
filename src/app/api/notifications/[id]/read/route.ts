/**
 * Notification Read API
 * 
 * POST /api/notifications/[id]/read - Marcar notificación como leída
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { notificationService } from '@/core/services/NotificationService';

// POST /api/notifications/[id]/read - Mark a notification as read
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id: notificationId } = await params;
    if (!notificationId) {
      return NextResponse.json(
        { error: 'ID de notificación requerido' },
        { status: 400 }
      );
    }

    // Marcar como leída
    const notification = await notificationService.markAsRead(notificationId);

    if (!notification) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que la notificación pertenece al usuario
    if (notification.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Obtener conteo actualizado
    const unreadCount = await notificationService.getUnreadCount(session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Notificación marcada como leída',
      notificationId,
      unreadCount,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/notifications/[id]/read - Alternative method (for compatibility)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return POST(request, { params });
}
