import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, username: true, role: true },
      take: 1,
    });

    return NextResponse.json({
      settings: {
        siteName: 'MangaAura',
        siteDescription: 'Plataforma de Manga con IA',
        maintenanceMode: false,
        maxUploadSize: 10 * 1024 * 1024,
        allowedImageTypes: ['image/png', 'image/jpeg', 'image/webp'],
        defaultLanguage: 'es',
        enableRegistrations: true,
        enableAI: true,
        enableCrowdfunding: true,
        enableClans: true,
        auraRewardPerChapter: 10,
        xpRewardPerChapter: 25,
        minimumPayoutAmount: 1000,
      },
      adminCount: users.length,
    });
  } catch (error) {
    console.error('[Admin Settings GET] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const rlResponse = await withRateLimit(request, session?.user?.id, 'default');
    if (rlResponse) return rlResponse;

    const body = await request.json();
    const allowedFields = [
      'siteName', 'siteDescription', 'maintenanceMode', 'maxUploadSize',
      'allowedImageTypes', 'defaultLanguage', 'enableRegistrations',
      'enableAI', 'enableCrowdfunding', 'enableClans',
      'auraRewardPerChapter', 'xpRewardPerChapter', 'minimumPayoutAmount',
    ];

    const updates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      updated: Object.keys(updates),
      settings: updates,
    });
  } catch (error) {
    console.error('[Admin Settings PATCH] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
