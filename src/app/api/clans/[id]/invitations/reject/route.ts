import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/clans/[id]/invitations/reject - Rechazar invitación al clan
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
        { error: 'No tienes permiso para rechazar esta invitación' },
        { status: 403 }
      );
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Esta invitación ya fue procesada' },
        { status: 400 }
      );
    }

    // Reject the invitation
    await prisma.clanInvite.update({
      where: { id: invitationId },
      data: {
        status: 'REJECTED',
        respondedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error rejecting clan invite:', error);
    return NextResponse.json(
      { error: 'Error al rechazar la invitación' },
      { status: 500 }
    );
  }
}
