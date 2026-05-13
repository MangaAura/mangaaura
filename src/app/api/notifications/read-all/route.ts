import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { notificationService } from '@/core/services/NotificationService';
import { MarkNotificationReadUseCase } from '@/application/use-cases/notifications/MarkNotificationReadUseCase';

const markNotificationReadUseCase = new MarkNotificationReadUseCase(notificationService);

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const result = await markNotificationReadUseCase.executeMarkAll({
      userId: session.user.id,
    });

    return NextResponse.json({
      success: result.success,
      message: 'Todas las notificaciones marcadas como leídas',
      markedCount: result.markedCount,
      unreadCount: result.unreadCount,
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}
