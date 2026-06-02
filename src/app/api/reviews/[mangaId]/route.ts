import { NextRequest, NextResponse } from 'next/server';

import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/reviews/[mangaId]
 * Returns reviews for a manga with rating distribution and aggregate stats.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ mangaId: string }> }
) {
  const t = getT(await detectLocale());
  try {
    const { mangaId } = await params;

    const page = Math.max(1, parseInt(_request.nextUrl.searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(_request.nextUrl.searchParams.get('limit') || '20')));
    const sort = _request.nextUrl.searchParams.get('sort') || 'recent'; // recent | helpful | highest | lowest
    const skip = (page - 1) * limit;

    // Verify manga exists
    const manga = await prisma.mangaSeries.findUnique({
      where: { id: mangaId },
      select: { id: true, title: true, slug: true, coverUrl: true, rating: true },
    });

    if (!manga) {
      return NextResponse.json({ error: t('reviews.errorMangaNotFound') }, { status: 404 });
    }

    // Get rating distribution
    const ratingDistribution = await prisma.review.groupBy({
      by: ['rating'],
      where: { mangaId },
      _count: { rating: true },
      orderBy: { rating: 'desc' },
    });

    // Build distribution map (1-5)
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingDistribution.forEach((d) => {
      distribution[d.rating] = d._count.rating;
    });

    const totalRatings = Object.values(distribution).reduce((a, b) => a + b, 0);

    // Build orderBy
    let orderBy: Record<string, string> = { createdAt: 'desc' };
    if (sort === 'helpful') orderBy = { helpfulCount: 'desc' as string };
    else if (sort === 'highest') orderBy = { rating: 'desc' as string };
    else if (sort === 'lowest') orderBy = { rating: 'asc' as string };

    // Fetch reviews with user info
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { mangaId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              level: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.review.count({ where: { mangaId } }),
    ]);

    // Check if current user has a review
    const session = await auth();
    let userReview = null;
    if (session?.user?.id) {
      userReview = await prisma.review.findUnique({
        where: {
          userId_mangaId: { userId: session.user.id, mangaId },
        },
      });
    }

    return NextResponse.json({
      reviews,
      userReview,
      distribution,
      totalRatings,
      averageRating: manga.rating,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Reviews API] GET error:', error);
    return NextResponse.json({ error: t('reviews.errorServer') }, { status: 500 });
  }
}

/**
 * POST /api/reviews/[mangaId]
 * Creates or updates a review (rating + optional text) for a manga.
 * Also creates a UserActivity and sends notification to creator.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ mangaId: string }> }
) {
  const t = getT(await detectLocale());
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: t('reviews.errorNotAuthenticated') }, { status: 401 });
    }

    const { mangaId } = await params;
    const body = await request.json();
    const rating = Number(body.rating);
    const content = typeof body.content === 'string' ? body.content.trim().slice(0, 2000) : null;

    if (isNaN(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: t('reviews.errorRatingInvalid') }, { status: 400 });
    }

    // Verify manga exists and get creator info
    const manga = await prisma.mangaSeries.findUnique({
      where: { id: mangaId },
      select: {
        id: true,
        title: true,
        slug: true,
        coverUrl: true,
        authorId: true,
        authorName: true,
      },
    });

    if (!manga) {
      return NextResponse.json({ error: t('reviews.errorMangaNotFound') }, { status: 404 });
    }

    // Upsert review
    const review = await prisma.review.upsert({
      where: {
        userId_mangaId: { userId: session.user.id, mangaId },
      },
      create: {
        userId: session.user.id,
        mangaId,
        rating,
        content,
      },
      update: {
        rating,
        content,
      },
    });

    // Also update UserManga.rating for quick display
    await prisma.userManga.upsert({
      where: {
        userId_mangaId: { userId: session.user.id, mangaId },
      },
      create: {
        userId: session.user.id,
        mangaId,
        rating,
        status: 'PLANNED',
      },
      update: {
        rating,
      },
    });

    // Recalculate average rating for the manga
    const aggregate = await prisma.review.aggregate({
      where: { mangaId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const averageRating = aggregate._avg.rating
      ? Math.round(aggregate._avg.rating * 10) / 10
      : null;

    await prisma.mangaSeries.update({
      where: { id: mangaId },
      data: { rating: averageRating },
    });

    // Check if this is a new rating (not an update)
    const isNewRating = review.createdAt.getTime() === review.updatedAt.getTime();

    // Create RATED_MANGA activity (only for new ratings, not updates)
    if (isNewRating) {
      prisma.userActivity.create({
        data: {
          userId: session.user.id,
          activityType: 'RATED_MANGA',
          referenceId: mangaId,
          metadata: JSON.stringify({
            mangaTitle: manga.title,
            mangaSlug: manga.slug,
            rating,
            contentPreview: content?.substring(0, 100) || null,
          }),
        },
      }).catch((err: Error) => console.error('[Reviews API] Failed to create activity:', err));
    }

    // Send notification to manga creator (only if rater is not the creator)
    if (manga.authorId !== session.user.id) {
      try {
        const { getNotificationService } = await import('@/core/services/NotificationService');
        const ns = await getNotificationService();
        await ns.notifyRating(
          manga.authorId,
          {
            id: manga.id,
            title: manga.title,
            slug: manga.slug,
            coverUrl: manga.coverUrl,
          },
          {
            id: session.user.id,
            username: session.user.username || session.user.name || 'unknown',
            displayName: session.user.name || null,
          },
          rating,
          content || undefined,
        );
      } catch (err) {
        console.error('[Reviews API] Failed to send notification:', err);
      }
    }

    return NextResponse.json({
      review,
      averageRating,
      totalRatings: aggregate._count.rating,
    });
  } catch (error) {
    console.error('[Reviews API] POST error:', error);
    return NextResponse.json({ error: t('reviews.errorServer') }, { status: 500 });
  }
}

/**
 * DELETE /api/reviews/[mangaId]
 * Deletes the current user's review for a manga.
 * Recalculates the average rating and clears the UserManga rating.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ mangaId: string }> }
) {
  const t = getT(await detectLocale());
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: t('reviews.errorNotAuthenticated') }, { status: 401 });
    }

    const { mangaId } = await params;

    // Find the review
    const review = await prisma.review.findUnique({
      where: {
        userId_mangaId: { userId: session.user.id, mangaId },
      },
    });

    if (!review) {
      return NextResponse.json({ error: t('reviews.errorNotFound') }, { status: 404 });
    }

    // Delete the review
    await prisma.review.delete({
      where: { id: review.id },
    });

    // Clear the rating in UserManga (keep the library entry, just remove the rating)
    await prisma.userManga.update({
      where: { userId_mangaId: { userId: session.user.id, mangaId } },
      data: { rating: null },
    }).catch(() => {
      // Ignore if UserManga entry doesn't exist
    });

    // Recalculate average rating for the manga
    const aggregate = await prisma.review.aggregate({
      where: { mangaId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const averageRating = aggregate._avg.rating
      ? Math.round(aggregate._avg.rating * 10) / 10
      : null;

    await prisma.mangaSeries.update({
      where: { id: mangaId },
      data: { rating: averageRating },
    });

    return NextResponse.json({
      success: true,
      averageRating,
      totalRatings: aggregate._count.rating,
    });
  } catch (error) {
    console.error('[Reviews API] DELETE error:', error);
    return NextResponse.json({ error: t('reviews.errorServer') }, { status: 500 });
  }
}
