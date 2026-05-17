import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CommentModel } from '@/infrastructure/persistence/mongodb/models/Comment';
import { withRateLimit } from '@/lib/rate-limit-middleware';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user || !['ADMIN', 'MODERATOR'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rlResponse = await withRateLimit(request, session?.user?.id, 'default');
    if (rlResponse) return rlResponse;

    const { action } = await request.json();

    if (action === 'approve') {
      await Promise.all([
        CommentModel.findByIdAndUpdate(id, {
          $set: { isHidden: false, moderatedBy: 'human', requiresReview: false },
        }),
        prisma.comment.update({
          where: { id },
          data: { isHidden: false },
        }).catch(err => console.error('[Moderation] Hidden update failed:', err)),
      ]);
    } else if (action === 'keep_hidden') {
      await Promise.all([
        CommentModel.findByIdAndUpdate(id, {
          $set: { moderatedBy: 'human', requiresReview: false },
        }),
        prisma.comment.update({
          where: { id },
          data: { isHidden: true },
        }).catch(err => console.error('[Moderation] Hidden update failed:', err)),
      ]);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error moderating comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
