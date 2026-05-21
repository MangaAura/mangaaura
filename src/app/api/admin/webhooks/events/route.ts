import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';

const AVAILABLE_EVENTS = [
  'CHAPTER_PUBLISHED',
  'MANGA_CREATED',
  'MANGA_UPDATED',
  'COMMENT_POSTED',
  'USER_REGISTERED',
  'ACHIEVEMENT_UNLOCKED',
  'NEW_CHAPTER',
  'CROWDFUNDING_GOAL_REACHED',
  'SPONSORSHIP_BID_SUBMITTED',
];

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ events: AVAILABLE_EVENTS });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
