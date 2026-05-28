import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { logSecurityEvent } from '@/lib/security-audit';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

// POST /api/clans/[id]/promote - Ascender/Degradar miembro
export async function POST(
  request: NextRequest,
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

    const rlResponse = await withRateLimit(request, session?.user?.id, 'default');
    if (rlResponse) return rlResponse;

    const body = await request.json();
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

    // Get clan and target user info for audit
    const [clan, targetUser] = await Promise.all([
      prisma.clan.findUnique({ where: { id }, select: { name: true } }),
      prisma.user.findUnique({ where: { id: userId }, select: { username: true, displayName: true } }),
    ]);

    const targetName = targetUser?.displayName || targetUser?.username || userId;
    const oldRole = targetMembership.role;

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

    // Audit log
    if (role === 'LEADER') {
      await logSecurityEvent({
        userId: session.user.id,
        action: 'CLAN_LEADERSHIP_TRANSFERRED',
        targetId: id,
        targetType: 'CLAN',
        metadata: {
          clanName: clan?.name || 'Unknown',
          previousLeaderId: session.user.id,
          newLeaderId: userId,
          newLeaderName: targetName,
        },
        severity: 'WARNING',
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || undefined,
      });
    } else if (role === 'OFFICER' && oldRole !== 'OFFICER') {
      await logSecurityEvent({
        userId: session.user.id,
        action: 'CLAN_MEMBER_PROMOTED',
        targetId: userId,
        targetType: 'CLAN',
        metadata: {
          clanName: clan?.name || 'Unknown',
          clanId: id,
          memberName: targetName,
          newRole: role,
        },
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || undefined,
      });
    } else if (oldRole === 'OFFICER' && role === 'MEMBER') {
      await logSecurityEvent({
        userId: session.user.id,
        action: 'CLAN_MEMBER_DEMOTED',
        targetId: userId,
        targetType: 'CLAN',
        metadata: {
          clanName: clan?.name || 'Unknown',
          clanId: id,
          memberName: targetName,
          oldRole,
        },
        severity: 'WARNING',
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || undefined,
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
