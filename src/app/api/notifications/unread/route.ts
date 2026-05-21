import { NextResponse } from 'next/server';

import { GetUnreadCountUseCase } from '@/application/use-cases/notifications/GetUnreadCountUseCase';
import { getNotificationService } from '@/core/services/NotificationService';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ unread: 0 });
    }

    const getUnreadCountUseCase = new GetUnreadCountUseCase(await getNotificationService());
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
