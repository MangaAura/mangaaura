import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getNotificationService } from '@/core/services/NotificationService';
import { MarkNotificationReadUseCase } from '@/application/use-cases/notifications/MarkNotificationReadUseCase';
import { withRateLimit } from '@/lib/rate-limit-middleware';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const rlResponse = await withRateLimit(request, session.user.id, 'notifications');
    if (rlResponse) return rlResponse;

    const markNotificationReadUseCase = new MarkNotificationReadUseCase(await getNotificationService());
    const result = await markNotificationReadUseCase.executeMarkAll({
      userId: session.user.id,
    });

    return NextResponse.json({
      success: result.success,
      markedCount: result.markedCount,
      unreadCount: result.unreadCount,
    });
  } catch (error) {
    console.error('[Notifications MarkAllRead] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
