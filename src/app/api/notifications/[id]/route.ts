import { NextRequest, NextResponse } from 'next/server';

import { DeleteNotificationUseCase } from '@/application/use-cases/notifications/DeleteNotificationUseCase';
import { getNotificationService } from '@/core/services/NotificationService';
import { auth } from '@/lib/auth';
import { withRateLimit } from '@/lib/rate-limit-middleware';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const rlResponse = await withRateLimit(_request, session?.user?.id, 'notifications');
    if (rlResponse) return rlResponse;

    const { id: notificationId } = await params;
    if (!notificationId) {
      return NextResponse.json(
        { error: 'ID de notificación requerido' },
        { status: 400 }
      );
    }

    const deleteNotificationUseCase = new DeleteNotificationUseCase(await getNotificationService());
    const result = await deleteNotificationUseCase.execute({
      userId: session.user.id,
      notificationId,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    if (error?.code === 'NOTIFICATION_NOT_FOUND') {
      return NextResponse.json({ error: 'Notificación no encontrada' }, { status: 404 });
    }
    if (error?.code === 'UNAUTHORIZED') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error deleting notification:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: notificationId } = await params;

    if (!notificationId) {
      return NextResponse.json(
        { error: 'ID de notificación requerido' },
        { status: 400 }
      );
    }

    const svc = await getNotificationService();
    const notifications = await svc.getUserNotifications(userId, 1, 0);
    const notification = notifications.find(n => n.id === notificationId);

    if (!notification) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ notification });
  } catch (error) {
    console.error('Error fetching notification:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
