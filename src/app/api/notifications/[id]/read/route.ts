import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { notificationService } from '@/core/services/NotificationService';
import { MarkNotificationReadUseCase } from '@/application/use-cases/notifications/MarkNotificationReadUseCase';

const markNotificationReadUseCase = new MarkNotificationReadUseCase(notificationService);

export async function POST(
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

    const result = await markNotificationReadUseCase.execute({
      userId: session.user.id,
      notificationId,
    });

    return NextResponse.json({
      success: result.success,
      message: 'Notificación marcada como leída',
      notificationId: result.notificationId,
      unreadCount: result.unreadCount,
    });
  } catch (error: any) {
    if (error?.code === 'NOTIFICATION_NOT_FOUND') {
      return NextResponse.json({ error: 'Notificación no encontrada' }, { status: 404 });
    }
    if (error?.code === 'UNAUTHORIZED') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error marking notification as read:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return POST(request, { params });
}
