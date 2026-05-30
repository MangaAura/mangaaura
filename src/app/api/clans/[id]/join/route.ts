import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';
import { logSecurityEvent } from '@/lib/security-audit';

// POST /api/clans/[id]/join - Unirse a un clan
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const rlResponse = await withRateLimit(_req, session?.user?.id, 'default');
    if (rlResponse) return rlResponse;

    const userId = session.user.id;

    // Check if user is already in a clan
    const existingMembership = await prisma.clanMembership.findFirst({
      where: { userId },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: 'Ya eres miembro de un clan' },
        { status: 400 }
      );
    }

    // Check if clan exists
    const clan = await prisma.clan.findUnique({
      where: { id },
    });

    if (!clan) {
      return NextResponse.json(
        { error: 'Clan no encontrado' },
        { status: 404 }
      );
    }

    // Create membership
    const membership = await prisma.clanMembership.create({
      data: {
        clanId: id,
        userId,
        role: 'MEMBER',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Log activity for feed
    await prisma.userActivity.create({
      data: {
        userId,
        activityType: 'JOINED_CLAN',
        referenceId: id,
        metadata: JSON.stringify({
          clanName: clan.name,
          clanSlug: clan.slug,
        }),
      },
    }).catch(err => console.error('[ClanJoin] Error logging activity:', err));

    // Audit log
    await logSecurityEvent({
      userId,
      action: 'CLAN_MEMBER_JOINED',
      targetId: id,
      targetType: 'CLAN',
      metadata: {
        clanName: clan.name,
      },
      ipAddress: _req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || _req.headers.get('x-real-ip') || undefined,
    });

    return NextResponse.json({ membership }, { status: 201 });
  } catch (error) {
    console.error('Error joining clan:', error);
    return NextResponse.json(
      { error: 'Error al unirse al clan' },
      { status: 500 }
    );
  }
}
