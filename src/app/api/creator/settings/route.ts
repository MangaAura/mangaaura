import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        avatarUrl: true,
        bio: true,
        website: true,
        socialLinks: true,
        stripeCustomerId: true,
        auraBalance: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const mangaCount = await prisma.mangaSeries.count({
      where: { authorId: session.user.id },
    });

    const totalViews = await prisma.mangaSeries.aggregate({
      where: { authorId: session.user.id },
      _sum: { totalViews: true },
    });

    const totalTips = await prisma.tip.aggregate({
      where: { toUserId: session.user.id },
      _sum: { amount: true },
    });

    let socialLinks = {};
    try { if (user.socialLinks) socialLinks = JSON.parse(user.socialLinks); } catch {}

    return NextResponse.json({
      profile: {
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        website: user.website,
        socialLinks,
      },
      publishing: {
        defaultLanguage: 'es',
        defaultStatus: 'ONGOING',
        autoSaveDrafts: true,
        notifySubscribers: true,
        aiAssistance: true,
      },
      payments: {
        stripeConnected: !!user.stripeCustomerId,
        auraBalance: user.auraBalance,
        totalTipsReceived: totalTips._sum.amount || 0,
        minimumPayout: 1000,
      },
      stats: {
        mangaCount,
        totalViews: totalViews._sum.totalViews || 0,
        memberSince: user.createdAt,
      },
    });
  } catch (error) {
    console.error('[Creator Settings GET] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const rlResponse = await withRateLimit(request, session?.user?.id, 'default');
    if (rlResponse) return rlResponse;

    const body = await request.json();

    const updates: Record<string, any> = {};

    if (body.displayName !== undefined) {
      updates.displayName = body.displayName;
    }
    if (body.bio !== undefined) {
      updates.bio = body.bio;
    }
    if (body.website !== undefined) {
      updates.website = body.website;
    }
    if (body.socialLinks !== undefined) {
      updates.socialLinks = JSON.stringify(body.socialLinks);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: updates,
    });

    return NextResponse.json({ success: true, updated: Object.keys(updates) });
  } catch (error) {
    console.error('[Creator Settings PATCH] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
