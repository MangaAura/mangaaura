import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { notificationService } from '@/core/services/NotificationService';
import { DeleteNotificationUseCase } from '@/application/use-cases/notifications/DeleteNotificationUseCase';

const deleteNotificationUseCase = new DeleteNotificationUseCase(notificationService);

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: notificationId } = await params;
    if (!notificationId) {
      return NextResponse.json(
        { error: 'ID de notificación requerido' },
        { status: 400 }
      );
    }

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
  request: NextRequest,
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

    const notifications = await notificationService.getUserNotifications(userId, 1, 0);
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
