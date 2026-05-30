import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';
import { logSecurityEvent } from '@/lib/security-audit';

const kickSchema = z.object({
  userId: z.string().min(1),
  reason: z.string().max(500).optional(),
});

// POST /api/clans/[id]/kick — Expulsar a un miembro del clan (solo LEADER/OFFICER)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const rlResponse = await withRateLimit(request, session.user.id, 'default');
    if (rlResponse) return rlResponse;

    // Verify user is LEADER or OFFICER of the clan
    const membership = await prisma.clanMembership.findFirst({
      where: {
        clanId: id,
        userId: session.user.id,
        role: { in: ['LEADER', 'OFFICER'] },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Solo líderes y oficiales pueden expulsar miembros' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = kickSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { userId: targetUserId, reason } = parsed.data;

    // Cannot kick self
    if (targetUserId === session.user.id) {
      return NextResponse.json(
        { error: 'No puedes expulsarte a ti mismo' },
        { status: 400 }
      );
    }

    // Find target membership
    const targetMembership = await prisma.clanMembership.findFirst({
      where: { clanId: id, userId: targetUserId },
    });

    if (!targetMembership) {
      return NextResponse.json(
        { error: 'El usuario no es miembro de este clan' },
        { status: 404 }
      );
    }

    // OFFICER cannot kick other OFFICERs or the LEADER
    if (membership.role === 'OFFICER' && targetMembership.role !== 'MEMBER') {
      return NextResponse.json(
        { error: 'No puedes expulsar a oficiales o al líder' },
        { status: 403 }
      );
    }

    // LEADER cannot be kicked
    if (targetMembership.role === 'LEADER') {
      return NextResponse.json(
        { error: 'No puedes expulsar al líder del clan' },
        { status: 400 }
      );
    }

    // Get target user and clan info for audit
    const [targetUser, clanInfo] = await Promise.all([
      prisma.user.findUnique({
        where: { id: targetUserId },
        select: { username: true, displayName: true },
      }),
      prisma.clan.findUnique({
        where: { id },
        select: { name: true },
      }),
    ]);

    // Remove membership
    await prisma.clanMembership.delete({
      where: { id: targetMembership.id },
    });

    // Audit log
    await logSecurityEvent({
      userId: session.user.id,
      action: 'CLAN_MEMBER_KICKED',
      targetId: targetUserId,
      targetType: 'CLAN',
      metadata: {
        clanId: id,
        clanName: clanInfo?.name || 'Unknown',
        kickedUserName: targetUser?.displayName || targetUser?.username || targetUserId,
        kickedByRole: membership.role,
        reason: reason?.trim() || null,
      },
      severity: 'WARNING',
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error kicking member:', error);
    return NextResponse.json(
      { error: 'Error al expulsar al miembro' },
      { status: 500 }
    );
  }
}
