import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { notificationService } from '@/core/services/NotificationService';
import { GetUnreadCountUseCase } from '@/application/use-cases/notifications/GetUnreadCountUseCase';

const getUnreadCountUseCase = new GetUnreadCountUseCase(notificationService);

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await getUnreadCountUseCase.execute({
      userId: session.user.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Notifications Unread API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unread count' },
      { status: 500 }
    );
  }
}
