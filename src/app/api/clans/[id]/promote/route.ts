import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/clans/[id]/promote - Ascender/Degradar miembro
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    // Valid roles: MEMBER, OFFICER, LEADER
    if (!['MEMBER', 'OFFICER', 'LEADER'].includes(role)) {
      return NextResponse.json(
        { error: 'Rol inválido' },
        { status: 400 }
      );
    }

    // Check if current user is the clan leader
    const leaderMembership = await prisma.clanMembership.findFirst({
      where: {
        clanId: id,
        userId: session.user.id,
        role: 'LEADER',
      },
    });

    if (!leaderMembership) {
      return NextResponse.json(
        { error: 'Solo el líder puede cambiar roles' },
        { status: 403 }
      );
    }

    // Cannot change own role
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'No puedes cambiar tu propio rol' },
        { status: 400 }
      );
    }

    // Check if target user is a member of this clan
    const targetMembership = await prisma.clanMembership.findFirst({
      where: {
        clanId: id,
        userId,
      },
    });

    if (!targetMembership) {
      return NextResponse.json(
        { error: 'Usuario no es miembro de este clan' },
        { status: 404 }
      );
    }

    // If promoting to LEADER, demote current leader first
    if (role === 'LEADER') {
      await prisma.$transaction(async (tx: any) => {
        // Demote current leader to OFFICER
        await tx.clanMembership.update({
          where: { id: leaderMembership.id },
          data: { role: 'OFFICER' },
        });

        // Promote target user to LEADER
        await tx.clanMembership.update({
          where: { id: targetMembership.id },
          data: { role: 'LEADER' },
        });

        // Update clan leaderId
        await tx.clan.update({
          where: { id },
          data: { leaderId: userId },
        });
      });
    } else {
      // Simple role update
      await prisma.clanMembership.update({
        where: { id: targetMembership.id },
        data: { role },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error promoting member:', error);
    return NextResponse.json(
      { error: 'Error al cambiar el rol del miembro' },
      { status: 500 }
    );
  }
}
