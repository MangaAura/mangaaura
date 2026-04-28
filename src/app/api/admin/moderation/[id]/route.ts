import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// POST /api/admin/moderation/[id] - Moderate a comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { action } = await request.json();

    switch (action) {
      case 'approve':
      // Approve comment - remove hidden status
      await prisma.comment.update({
        where: { id },
        data: {
          isDeleted: false,
        },
      });
      break;

      case 'reject':
      // Reject/hide comment
      await prisma.comment.update({
        where: { id },
        data: {
          isDeleted: true,
        },
      });
      break;

      case 'delete':
      // Soft delete comment
      await prisma.comment.update({
        where: { id },
        data: {
          isDeleted: true,
          content: '[Deleted by moderator]',
        },
      });
      break;

      case 'ban': {
        // Ban user who made the comment
        const comment = await prisma.comment.findUnique({
          where: { id },
          select: { userId: true },
        });

        if (comment) {
          await prisma.user.update({
            where: { id: comment.userId },
            data: { role: 'BANNED' },
          });
        }
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
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
