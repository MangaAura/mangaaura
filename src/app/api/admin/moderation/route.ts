import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import { CommentModel } from '@/infrastructure/persistence/mongodb/models/Comment';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'MODERATOR'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const url = new URL(request.url);
    const filter: Record<string, unknown> = {};

    const status = url.searchParams.get('status');
    if (status === 'pending_review') {
      filter.requiresReview = true;
    } else if (status === 'hidden') {
      filter.isHidden = true;
    }

    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);

    const [comments, total] = await Promise.all([
      CommentModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      CommentModel.countDocuments(filter),
    ]);

    return NextResponse.json({ comments, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Error fetching moderation comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
