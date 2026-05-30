import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';
import { logSecurityEvent } from '@/lib/security-audit';

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

    // Get clan info for audit
    const clanInfo = await prisma.clan.findUnique({
      where: { id },
      select: { name: true },
    });

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

      const deletedClanName = clanInfo?.name || 'Unknown';

      // If leader is the only member, delete the clan
      await prisma.clan.delete({
        where: { id },
      });

      // Audit log for clan deletion via last member leaving
      await logSecurityEvent({
        userId: session.user.id,
        action: 'CLAN_DELETED',
        targetId: id,
        targetType: 'CLAN',
        metadata: {
          clanName: deletedClanName,
          reason: 'last_member_left',
        },
        severity: 'WARNING',
        ipAddress: _req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || _req.headers.get('x-real-ip') || undefined,
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

    // Audit log
    await logSecurityEvent({
      userId: session.user.id,
      action: 'CLAN_MEMBER_LEFT',
      targetId: id,
      targetType: 'CLAN',
      metadata: {
        clanName: clanInfo?.name || 'Unknown',
        previousRole: membership.role,
      },
      ipAddress: _req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || _req.headers.get('x-real-ip') || undefined,
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
