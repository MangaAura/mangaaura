import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

// GET /api/me/preferences - Get user preferences
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        emailPreferences: true,
        appearance: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Parse email preferences
    let emailPrefs = {
      newsletter: true,
      newFollowers: true,
      newComments: true,
      chapterUpdates: true,
      achievements: true,
      marketing: false,
    };

    try {
      if (user.emailPreferences) {
        const parsed = JSON.parse(user.emailPreferences);
        emailPrefs = { ...emailPrefs, ...parsed };
      }
    } catch {
      // Use defaults
    }

    let appearancePrefs = {};
    try {
      if (user.appearance) {
        appearancePrefs = JSON.parse(user.appearance);
      }
    } catch {
      // Use defaults
    }

    return NextResponse.json({
      preferences: {
        email: emailPrefs,
        appearance: appearancePrefs,
      },
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json(
      { error: 'Error al cargar preferencias' },
      { status: 500 }
    );
  }
}

// PATCH /api/me/preferences - Update user preferences
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const rlResponse = await withRateLimit(request, session?.user?.id, 'default');
    if (rlResponse) return rlResponse;

    const body = await request.json();
    const { emailPreferences, appearance } = body;

    const updateData: any = {};

    if (emailPreferences) {
      updateData.emailPreferences = JSON.stringify(emailPreferences);
    }

    if (appearance) {
      const existing = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { appearance: true },
      });
      let currentAppearance = {};
      try {
        if (existing?.appearance) currentAppearance = JSON.parse(existing.appearance);
      } catch {}
      updateData.appearance = JSON.stringify({ ...currentAppearance, ...appearance });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        emailPreferences: true,
        appearance: true,
      },
    });

    let savedAppearance = {};
    try { if (user.appearance) savedAppearance = JSON.parse(user.appearance); } catch {}

    return NextResponse.json({
      preferences: {
        email: JSON.parse(user.emailPreferences || '{}'),
        appearance: savedAppearance,
      },
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json(
      { error: 'Error al actualizar preferencias' },
      { status: 500 }
    );
  }
}
