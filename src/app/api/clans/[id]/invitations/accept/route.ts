import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { logSecurityEvent } from '@/lib/security-audit';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

// POST /api/clans/[id]/invitations/accept - Aceptar invitación al clan
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clanId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const rlResponse = await withRateLimit(req, session.user.id, 'default');
    if (rlResponse) return rlResponse;

    const body = await req.json();
    const { invitationId } = body;

    if (!invitationId) {
      return NextResponse.json(
        { error: 'ID de invitación requerido' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Find the invitation
    const invitation = await prisma.clanInvite.findUnique({
      where: { id: invitationId },
      include: {
        clan: { select: { id: true, name: true } },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitación no encontrada' },
        { status: 404 }
      );
    }

    if (invitation.clanId !== clanId) {
      return NextResponse.json(
        { error: 'La invitación no corresponde a este clan' },
        { status: 400 }
      );
    }

    if (invitation.inviteeId !== userId) {
      return NextResponse.json(
        { error: 'No tienes permiso para aceptar esta invitación' },
        { status: 403 }
      );
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Esta invitación ya fue procesada' },
        { status: 400 }
      );
    }

    // Check if user is already in another clan
    const existingMembership = await prisma.clanMembership.findFirst({
      where: { userId },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: 'Ya eres miembro de un clan. Debes salir antes de aceptar esta invitación.' },
        { status: 400 }
      );
    }

    // Accept invitation — create membership + update invite status in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      const membership = await tx.clanMembership.create({
        data: {
          clanId,
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

      await tx.clanInvite.update({
        where: { id: invitationId },
        data: {
          status: 'ACCEPTED',
          respondedAt: new Date(),
        },
      });

      return membership;
    });

    // Audit log
    await logSecurityEvent({
      userId,
      action: 'CLAN_INVITE_ACCEPTED',
      targetId: clanId,
      targetType: 'CLAN',
      metadata: {
        clanName: invitation.clan.name,
        invitationId,
      },
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || undefined,
    });

    return NextResponse.json({ membership: result }, { status: 200 });
  } catch (error) {
    console.error('Error accepting clan invite:', error);
    return NextResponse.json(
      { error: 'Error al aceptar la invitación' },
      { status: 500 }
    );
  }
}
