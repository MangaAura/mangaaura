import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/me/preferences - Get user preferences
export async function GET(request: NextRequest) {
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

    return NextResponse.json({
      preferences: {
        email: emailPrefs,
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

    const body = await request.json();
    const { emailPreferences } = body;

    const updateData: any = {};

    if (emailPreferences) {
      updateData.emailPreferences = JSON.stringify(emailPreferences);
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        emailPreferences: true,
      },
    });

    return NextResponse.json({
      preferences: {
        email: JSON.parse(user.emailPreferences || '{}'),
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
