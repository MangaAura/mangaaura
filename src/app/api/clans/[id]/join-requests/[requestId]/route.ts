import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { logSecurityEvent } from '@/lib/security-audit';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

// PATCH /api/clans/[id]/join-requests/[requestId] - Aprobar o rechazar solicitud (líder/officer)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  try {
    const { id, requestId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const rlResponse = await withRateLimit(req, session.user.id, 'default');
    if (rlResponse) return rlResponse;

    const userId = session.user.id;

    // Check if user is leader or officer
    const membership = await prisma.clanMembership.findFirst({
      where: {
        clanId: id,
        userId,
        role: { in: ['LEADER', 'OFFICER'] },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Solo el líder u oficiales pueden revisar solicitudes' },
        { status: 403 }
      );
    }

    // Get the join request
    const joinRequest = await prisma.clanJoinRequest.findFirst({
      where: { id: requestId, clanId: id },
      include: {
        clan: { select: { name: true } },
        user: { select: { id: true, username: true, displayName: true } },
      },
    });

    if (!joinRequest) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      );
    }

    if (joinRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Esta solicitud ya fue procesada' },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { action, reason } = body;

    if (action !== 'APPROVED' && action !== 'REJECTED') {
      return NextResponse.json(
        { error: 'Acción inválida. Use APPROVED o REJECTED' },
        { status: 400 }
      );
    }

    // Process the request in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Update the request
      const updated = await tx.clanJoinRequest.update({
        where: { id: requestId },
        data: {
          status: action,
          reviewedBy: userId,
          reviewedAt: new Date(),
        },
      });

      // If approved, create membership
      if (action === 'APPROVED') {
        // Check if user is already in a clan
        const alreadyMember = await tx.clanMembership.findFirst({
          where: { userId: joinRequest.userId },
        });

        if (!alreadyMember) {
          await tx.clanMembership.create({
            data: {
              clanId: id,
              userId: joinRequest.userId,
              role: 'MEMBER',
            },
          });
        }
      }

      return updated;
    });

    // Audit log
    await logSecurityEvent({
      userId,
      action: action === 'APPROVED' ? 'CLAN_JOIN_APPROVED' : 'CLAN_JOIN_REJECTED',
      targetId: id,
      targetType: 'CLAN',
      metadata: {
        clanName: joinRequest.clan.name,
        requestId,
        targetUserId: joinRequest.userId,
        reason: reason || null,
      },
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || undefined,
    });

    return NextResponse.json({
      joinRequest: result,
      message: action === 'APPROVED'
        ? 'Solicitud aprobada. El usuario ahora es miembro del clan.'
        : 'Solicitud rechazada.',
    });
  } catch (error) {
    console.error('Error reviewing join request:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

// DELETE /api/clans/[id]/join-requests/[requestId] - Cancelar propia solicitud
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  try {
    const { id, requestId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Find the request
    const joinRequest = await prisma.clanJoinRequest.findFirst({
      where: { id: requestId, clanId: id },
    });

    if (!joinRequest) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      );
    }

    // Only the requester can cancel their own request
    if (joinRequest.userId !== userId) {
      return NextResponse.json(
        { error: 'Solo puedes cancelar tus propias solicitudes' },
        { status: 403 }
      );
    }

    if (joinRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Esta solicitud ya fue procesada' },
        { status: 400 }
      );
    }

    await prisma.clanJoinRequest.update({
      where: { id: requestId },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json({ message: 'Solicitud cancelada' });
  } catch (error) {
    console.error('Error cancelling join request:', error);
    return NextResponse.json(
      { error: 'Error al cancelar la solicitud' },
      { status: 500 }
    );
  }
}
