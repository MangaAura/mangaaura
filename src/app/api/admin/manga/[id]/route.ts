import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/admin/manga/[id] - Get specific manga details
export async function GET(
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

    const manga = await prisma.mangaSeries.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            email: true,
            avatarUrl: true,
          },
        },
        chapters: {
          orderBy: { chapterNumber: 'asc' },
          select: {
            id: true,
            chapterNumber: true,
            title: true,
            totalPages: true,
            viewCount: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            userMangas: true,
          },
        },
      },
    });

    if (!manga) {
      return NextResponse.json(
        { error: 'Manga not found' },
        { status: 404 }
      );
    }

    // Get comment counts for each chapter
    const chapterIds = manga.chapters.map(c => c.id);
    const commentCounts = await prisma.comment.groupBy({
      by: ['chapterId'],
      where: { chapterId: { in: chapterIds } },
      _count: { id: true },
    });

    const commentCountMap = new Map(commentCounts.map(c => [c.chapterId, c._count.id]));

    return NextResponse.json({
      manga: {
        id: manga.id,
        title: manga.title,
        slug: manga.slug,
        description: manga.description,
        coverUrl: manga.coverUrl,
        status: manga.status,
        tags: manga.tags ? JSON.parse(manga.tags) : [],
        totalViews: manga.totalViews,
        rating: manga.rating,
        authorId: manga.authorId,
        authorName: manga.authorName,
        author: manga.author,
        bookmarkCount: manga._count.userMangas,
        commentCount: commentCounts.reduce((sum, c) => sum + c._count.id, 0),
        chapters: manga.chapters.map((ch) => ({
          id: ch.id,
          chapterNumber: ch.chapterNumber,
          title: ch.title,
          totalPages: ch.totalPages,
          viewCount: ch.viewCount,
          commentCount: commentCountMap.get(ch.id) || 0,
          createdAt: ch.createdAt.toISOString(),
        })),
        createdAt: manga.createdAt.toISOString(),
        updatedAt: manga.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching manga:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/manga/[id] - Update manga
export async function PATCH(
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

    const body = await request.json();
    const { title, description, coverUrl, tags, status, authorId, authorName } = body;

    const updateData: { title?: string; description?: string | null; coverUrl?: string | null; status?: string; authorName?: string; authorId?: string; tags?: string } = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (coverUrl !== undefined) updateData.coverUrl = coverUrl;
    if (status !== undefined) updateData.status = status;
    if (authorName !== undefined) updateData.authorName = authorName;
    if (authorId !== undefined) {
      updateData.authorId = authorId;
      // Get new author name
      const author = await prisma.user.findUnique({
        where: { id: authorId },
        select: { displayName: true, username: true },
      });
      if (author) {
        updateData.authorName = author.displayName || author.username;
      }
    }
    if (tags !== undefined) {
      updateData.tags = Array.isArray(tags) ? JSON.stringify(tags) : '[]';
    }

    const manga = await prisma.mangaSeries.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      message: 'Manga updated successfully',
      manga: {
        id: manga.id,
        title: manga.title,
        slug: manga.slug,
        description: manga.description,
        coverUrl: manga.coverUrl,
        status: manga.status,
        tags: manga.tags ? JSON.parse(manga.tags) : [],
        authorId: manga.authorId,
        authorName: manga.authorName,
        updatedAt: manga.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error updating manga:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/manga/[id] - Delete manga
export async function DELETE(
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

    await prisma.mangaSeries.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Manga deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting manga:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
