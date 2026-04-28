import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/admin/moderation - Get reported content
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    const where: any = {};
    if (status !== 'all') {
      if (status === 'hidden') {
        where.isHidden = true;
      } else if (status === 'pending') {
        where.isHidden = true;
        where.hiddenReason = 'reported';
      } else {
        where.status = status.toUpperCase();
      }
    }

    const comments = await prisma.comment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            email: true,
          },
        },
        chapter: {
          select: {
            id: true,
            chapterNumber: true,
            manga: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        likes: {
          select: {
            id: true,
            userId: true,
            user: {
              select: {
                username: true,
              },
            },
          },
          take: 5,
        },
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
      },
    });

    // Format reports data
    const reports = comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      userId: comment.userId,
      userName: comment.user.displayName || comment.user.username,
      userEmail: comment.user.email,
      chapterId: comment.chapterId,
      mangaTitle: comment.chapter.manga.title,
      chapterNumber: comment.chapter.chapterNumber,
      reportCount: Math.max(1, comment._count.likes - comment._count.replies), // Simulated report count
      status: comment.isHidden ? 'pending' : 'approved',
      isDeleted: comment.isDeleted,
      createdAt: comment.createdAt.toISOString(),
      likesCount: comment._count.likes,
      repliesCount: comment._count.replies,
      reports: [], // Would be populated from a real reports table
    }));

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Error fetching moderation reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
