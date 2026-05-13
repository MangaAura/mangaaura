import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (session.user.role !== 'CREATOR' && session.user.role !== 'ADMIN') {
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
        stripeCustomerId: true,
        inkcoinsBalance: true,
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

    return NextResponse.json({
      profile: {
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        bio: null,
        website: null,
        socialLinks: {},
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
        inkcoinsBalance: user.inkcoinsBalance,
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

    if (session.user.role !== 'CREATOR' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();

    const profileFields = ['displayName', 'bio', 'website'];
    const updates: Record<string, any> = {};

    for (const key of profileFields) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    if (body.displayName !== undefined) {
      updates.displayName = body.displayName;
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
