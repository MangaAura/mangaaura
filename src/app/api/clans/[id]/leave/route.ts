import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

// POST /api/clans/[id]/leave - Salir de un clan
export async function POST(
  _req: NextRequest,
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

    const rlResponse = await withRateLimit(_req, session?.user?.id, 'default');
    if (rlResponse) return rlResponse;

    // Check if user is a member of this clan
    const membership = await prisma.clanMembership.findFirst({
      where: {
        clanId: id,
        userId: session.user.id,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'No eres miembro de este clan' },
        { status: 400 }
      );
    }

    // If user is the leader, check if there are other members to transfer leadership
    if (membership.role === 'LEADER') {
      const memberCount = await prisma.clanMembership.count({
        where: { clanId: id },
      });

      if (memberCount > 1) {
        return NextResponse.json(
          { error: 'Debes transferir el liderazgo antes de salir o nombrar un nuevo líder' },
          { status: 400 }
        );
      }

      // If leader is the only member, delete the clan
      await prisma.clan.delete({
        where: { id },
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Clan eliminado al ser el último miembro' 
      });
    }

    // Remove membership
    await prisma.clanMembership.delete({
      where: { id: membership.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error leaving clan:', error);
    return NextResponse.json(
      { error: 'Error al salir del clan' },
      { status: 500 }
    );
  }
}
