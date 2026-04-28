import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { deleteNotification } from '@/lib/notifications';

// DELETE /api/notifications/[id] - Delete a notification
export async function DELETE(
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

    const userId = session.user.id;
    const { id: notificationId } = await params;

    if (!notificationId) {
      return NextResponse.json(
        { error: 'ID de notificación requerido' },
        { status: 400 }
      );
    }

    // Delete notification
    const success = await deleteNotification(userId, notificationId);

    if (!success) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notificación eliminada',
      notificationId,
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET /api/notifications/[id] - Get a specific notification
export async function GET(
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

    const userId = session.user.id;
    const { id: notificationId } = await params;

    if (!notificationId) {
      return NextResponse.json(
        { error: 'ID de notificación requerido' },
        { status: 400 }
      );
    }

    // Import MongoDB model
    const { getUserNotifications } = await import('@/lib/notifications');
    const notifications = await getUserNotifications(userId, {
      limit: 1,
    });

    // Find specific notification
    const notification = notifications.find((n) => n.id === notificationId);

    if (!notification) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ notification });
  } catch (error) {
    console.error('Error fetching notification:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
