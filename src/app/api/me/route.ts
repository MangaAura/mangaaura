import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = session.user.id;

    const [user, libraryCount, totalChaptersRead, recentActivities, achievements] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
          avatarUrl: true,
          xpPoints: true,
          inkcoinsBalance: true,
          level: true,
          readingStreak: true,
          lastReadAt: true,
          role: true,
          createdAt: true,
        },
      }),
      prisma.userLibrary.count({ where: { userId } }),
      prisma.readingProgress.count({ where: { userId } }),
      prisma.userActivity.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          type: true,
          description: true,
          metadata: true,
          createdAt: true,
        },
      }),
      prisma.userAchievement.findMany({
        where: { userId },
        include: {
          achievement: {
            select: { name: true, description: true, icon: true },
          },
        },
        orderBy: { unlockedAt: 'desc' },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const nextLevelXp = user.level * 2500;

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        xpPoints: user.xpPoints,
        inkcoinsBalance: user.inkcoinsBalance,
        level: user.level,
        readingStreak: user.readingStreak,
        lastReadAt: user.lastReadAt,
        role: user.role,
        joinedAt: user.createdAt,
        libraryCount,
        totalChaptersRead,
        nextLevelXp,
      },
      recentActivities,
      achievements: achievements.map(a => ({
        id: a.id,
        unlockedAt: a.unlockedAt,
        name: a.achievement.name,
        description: a.achievement.description,
        icon: a.achievement.icon,
      })),
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
