import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rlResult = await rateLimit(getRateLimitKey('data-export', `${session.user.id}:${ip}`), 2, 86400);
    if (!rlResult.allowed) {
      return NextResponse.json({ error: 'Ya solicitaste una exportación hoy. Intenta de nuevo mañana.' }, { status: 429 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        accounts: { select: { provider: true, providerAccountId: true } },
        library: { include: { manga: { select: { id: true, title: true, slug: true } } } },
        readingProgress: { select: { mangaId: true, chapterId: true, percentage: true, completed: true, updatedAt: true } },
        comments: { select: { id: true, content: true, chapterId: true, createdAt: true } },
        bookmarks: { include: { manga: { select: { id: true, title: true } } } },
        transactions: { select: { id: true, amount: true, type: true, description: true, timestamp: true } },
        notifications: { select: { id: true, type: true, title: true, message: true, isRead: true, createdAt: true } },
        conversations1: { include: { participant2: { select: { username: true } }, messages: { take: 100, orderBy: { createdAt: 'desc' }, select: { content: true, createdAt: true } } } },
        conversations2: { include: { participant1: { select: { username: true } }, messages: { take: 100, orderBy: { createdAt: 'desc' }, select: { content: true, createdAt: true } } } },
        achievements: { include: { achievement: { select: { name: true, description: true, badgeId: true } } } },
        activities: { take: 500, orderBy: { createdAt: 'desc' } },
        clanMemberships: { include: { clan: { select: { name: true } } } },
        tipsGiven: { take: 100, orderBy: { createdAt: 'desc' } },
        tipsReceived: { take: 100, orderBy: { createdAt: 'desc' } },
        readingSessions: { take: 500, orderBy: { startedAt: 'desc' }, select: { durationSeconds: true, startedAt: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      account: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        emailVerified: user.emailVerified,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        twoFactorEnabled: user.twoFactorEnabled,
      },
      gamification: {
        xpPoints: user.xpPoints,
        level: user.level,
        inkcoinsBalance: user.inkcoinsBalance,
        readingStreak: user.readingStreak,
        streakFreezes: user.streakFreezes,
      },
      connectedAccounts: user.accounts.map(a => ({ provider: a.provider })),
      library: user.library,
      readingProgress: user.readingProgress,
      bookmarks: user.bookmarks,
      comments: user.comments.length,
      transactions: user.transactions,
      notifications: user.notifications.length,
      conversations: [
        ...user.conversations1.map(c => ({ with: c.participant2.username, messages: c.messages.length })),
        ...user.conversations2.map(c => ({ with: c.participant1.username, messages: c.messages.length })),
      ],
      achievements: user.achievements.map(a => ({
        name: a.achievement.name,
        description: a.achievement.description,
        badgeId: a.achievement.badgeId,
        unlockedAt: a.unlockedAt,
      })),
      recentActivity: user.activities.slice(0, 100),
      clans: user.clanMemberships.map(m => ({ name: m.clan.name, role: m.role })),
      tipsGiven: user.tipsGiven.length,
      tipsReceived: user.tipsReceived.length,
      totalReadingSessions: user.readingSessions.length,
      totalReadingTimeSeconds: user.readingSessions.reduce((sum, s) => sum + s.durationSeconds, 0),
    };

    return NextResponse.json(exportData);
  } catch (error) {
    console.error('[DataExport] Error:', error);
    return NextResponse.json({ error: 'Error al exportar datos' }, { status: 500 });
  }
}
