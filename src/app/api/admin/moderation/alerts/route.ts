import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

interface ModerationAlert {
  id: string;
  type: 'report' | 'abuse' | 'spam';
  message: string;
  count: number;
  severity: 'low' | 'medium' | 'high';
}

// GET /api/admin/moderation/alerts - Get moderation alerts
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const alerts: ModerationAlert[] = [];

    // Get reported comments count (hidden comments)
    const reportedComments = await prisma.comment.count({
      where: {
        isHidden: true,
      },
    });

    if (reportedComments > 0) {
      alerts.push({
        id: 'reported-comments',
        type: 'report',
        message: 'Comments pending review',
        count: reportedComments,
        severity: reportedComments > 5 ? 'high' : reportedComments > 2 ? 'medium' : 'low',
      });
    }

    // Get users with potential spam activity (many comments in short time)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const spamUsers = await prisma.comment.groupBy({
      by: ['userId'],
      where: {
        createdAt: {
          gte: oneHourAgo,
        },
      },
      having: {
        id: {
          _count: {
            gt: 10,
          },
        },
      },
      _count: {
        id: true,
      },
    });

    if (spamUsers.length > 0) {
      alerts.push({
        id: 'potential-spam',
        type: 'spam',
        message: 'Users with suspicious activity',
        count: spamUsers.length,
        severity: spamUsers.length > 3 ? 'high' : 'medium',
      });
    }

    // Get deleted/abusive content
    const deletedComments = await prisma.comment.count({
      where: {
        isDeleted: true,
      },
    });

    if (deletedComments > 0) {
      alerts.push({
        id: 'deleted-content',
        type: 'abuse',
        message: 'Recently deleted content',
        count: deletedComments,
        severity: 'low',
      });
    }

    // Sort alerts by severity
    const severityOrder = { high: 3, medium: 2, low: 1 };
    alerts.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('Error fetching moderation alerts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
