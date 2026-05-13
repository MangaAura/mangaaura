import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/admin/users/[id] - Get specific user details
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

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            createdMangas: true,
            comments: true,
          },
        },
        createdMangas: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get chapter counts for user's mangas
    const mangaIds = user.createdMangas.map((m: any) => m.id);
    const chapterCounts = await prisma.chapter.groupBy({
      by: ['mangaId'],
      where: { mangaId: { in: mangaIds } },
      _count: { id: true },
    });

const chapterCountMap = new Map(chapterCounts.map((c: any) => [c.mangaId, c._count.id]));
const totalChapters = chapterCounts.reduce((sum: any, c: any) => sum + c._count.id, 0);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        xpPoints: user.xpPoints,
        inkcoinsBalance: user.inkcoinsBalance,
        level: user.level,
        readingStreak: user.readingStreak,
        createdAt: user.createdAt.toISOString(),
        lastReadAt: user.lastReadAt?.toISOString() || null,
        mangaCount: user._count.createdMangas,
        chapterCount: totalChapters,
        commentCount: user._count.comments,
        mangas: user.createdMangas.map((m: any) => ({
          id: m.id,
          title: m.title,
          status: m.status,
          chapterCount: chapterCountMap.get(m.id) || 0,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users/[id] - Perform actions on user (ban, unban, delete)
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

    // Prevent self-actions
    if (id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot perform actions on yourself' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'ban':
        // Update user role to BANNED
        await prisma.user.update({
          where: { id },
          data: { role: 'BANNED' },
        });
        break;

      case 'unban':
        // Restore user role to USER
        await prisma.user.update({
          where: { id },
          data: { role: 'USER' },
        });
        break;

      case 'delete':
        // Delete user (cascade will handle related records)
        await prisma.user.delete({
          where: { id },
        });
        break;

      case 'promote':
        // Promote user to ADMIN
        await prisma.user.update({
          where: { id },
          data: { role: 'ADMIN' },
        });
        break;

      case 'demote':
        // Demote user to regular USER
        await prisma.user.update({
          where: { id },
          data: { role: 'USER' },
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error performing user action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users/[id] - Update user details
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
    const { displayName, email, role, xpPoints, inkcoinsBalance, level } = body;

    const updateData: any = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (xpPoints !== undefined) updateData.xpPoints = xpPoints;
    if (inkcoinsBalance !== undefined) updateData.inkcoinsBalance = inkcoinsBalance;
    if (level !== undefined) updateData.level = level;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
