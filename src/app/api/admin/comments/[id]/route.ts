import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rlResponse = await withRateLimit(request, session.user.id, 'default');
    if (rlResponse) return rlResponse;

    const body = await request.json();
    const { action, content, hiddenReason } = body;

    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    switch (action) {
      case 'hide':
        await prisma.comment.update({
          where: { id },
          data: { isHidden: true, hiddenReason: hiddenReason || 'Hidden by moderator' },
        });
        break;
      case 'unhide':
        await prisma.comment.update({
          where: { id },
          data: { isHidden: false, hiddenReason: null },
        });
        break;
      case 'delete':
        await prisma.comment.update({
          where: { id },
          data: { isDeleted: true, content: '[deleted]' },
        });
        break;
      case 'restore':
        await prisma.comment.update({
          where: { id },
          data: { isDeleted: false, content: content || comment.content },
        });
        break;
      case 'edit':
        if (!content) {
          return NextResponse.json({ error: 'Content is required for edit' }, { status: 400 });
        }
        await prisma.comment.update({
          where: { id },
          data: { content },
        });
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rlResponse = await withRateLimit(request, session.user.id, 'default');
    if (rlResponse) return rlResponse;

    await prisma.comment.delete({ where: { id } });

    return NextResponse.json({ message: 'Comment permanently deleted' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
