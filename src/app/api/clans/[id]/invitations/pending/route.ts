import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/clans/[id]/invitations/pending - Listar invitaciones pendientes del clan
export async function GET(
  req: NextRequest,
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

    // Verify sender is a member (LEADER or OFFICER)
    const membership = await prisma.clanMembership.findFirst({
      where: {
        clanId: id,
        userId: session.user.id,
        role: { in: ['LEADER', 'OFFICER'] },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'No tienes permiso para ver las invitaciones' },
        { status: 403 }
      );
    }

    const invitations = await prisma.clanInvite.findMany({
      where: {
        clanId: id,
        status: 'PENDING',
      },
      include: {
        invitee: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        inviter: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ invitations }, { status: 200 });
  } catch (error) {
    console.error('Error fetching pending clan invites:', error);
    return NextResponse.json(
      { error: 'Error al cargar las invitaciones pendientes' },
      { status: 500 }
    );
  }
}
