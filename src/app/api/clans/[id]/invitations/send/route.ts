import { NextRequest, NextResponse } from 'next/server';

import { getNotificationService } from '@/core/services/NotificationService';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';
import { logSecurityEvent } from '@/lib/security-audit';

// POST /api/clans/[id]/invitations/send - Invitar a un usuario al clan
export async function POST(
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

    const rlResponse = await withRateLimit(req, session.user.id, 'default');
    if (rlResponse) return rlResponse;

    const body = await req.json();
    const { inviteeId } = body;

    if (!inviteeId) {
      return NextResponse.json(
        { error: 'ID de usuario requerido' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Verify clan exists
    const clan = await prisma.clan.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true, emblemUrl: true, leaderId: true },
    });

    if (!clan) {
      return NextResponse.json(
        { error: 'Clan no encontrado' },
        { status: 404 }
      );
    }

    // Verify sender is a member with permission (LEADER or OFFICER)
    const senderMembership = await prisma.clanMembership.findFirst({
      where: {
        clanId: id,
        userId,
        role: { in: ['LEADER', 'OFFICER'] },
      },
    });

    if (!senderMembership) {
      return NextResponse.json(
        { error: 'Solo el líder y los oficiales pueden invitar miembros' },
        { status: 403 }
      );
    }

    // Verify invitee exists
    const invitee = await prisma.user.findUnique({
      where: { id: inviteeId },
      select: { id: true, username: true, displayName: true, avatarUrl: true },
    });

    if (!invitee) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Check if invitee is already in the clan
    const existingMembership = await prisma.clanMembership.findFirst({
      where: { clanId: id, userId: inviteeId },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: 'El usuario ya es miembro del clan' },
        { status: 400 }
      );
    }

    // Check if invitee already has a pending invitation
    const existingInvite = await prisma.clanInvite.findFirst({
      where: {
        clanId: id,
        inviteeId,
        status: 'PENDING',
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: 'El usuario ya tiene una invitación pendiente a este clan' },
        { status: 400 }
      );
    }

    // Check if invitee is already in another clan
    const inviteeOtherMembership = await prisma.clanMembership.findFirst({
      where: { userId: inviteeId },
    });

    if (inviteeOtherMembership) {
      return NextResponse.json(
        { error: 'El usuario ya es miembro de otro clan' },
        { status: 400 }
      );
    }

    // Create invitation
    const invitation = await prisma.clanInvite.create({
      data: {
        clanId: id,
        inviterId: userId,
        inviteeId,
        status: 'PENDING',
      },
    });

    // Send notification to invitee
    const sender = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, displayName: true, avatarUrl: true },
    });

    if (sender) {
      try {
        const ns = await getNotificationService();
        await ns.notifyClanInvite(
          inviteeId,
          { id: clan.id, name: clan.name, slug: clan.slug, emblemUrl: clan.emblemUrl },
          {
            id: sender.id,
            username: sender.username,
            displayName: sender.displayName,
            avatarUrl: sender.avatarUrl,
          },
          invitation.id
        );
      } catch (notifError) {
        console.error('Error sending clan invite notification:', notifError);
      }
    }

    // Audit log
    await logSecurityEvent({
      userId,
      action: 'CLAN_INVITE_SENT',
      targetId: id,
      targetType: 'CLAN',
      metadata: {
        clanName: clan.name,
        inviteeId,
        inviteeName: invitee.displayName || invitee.username,
      },
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || undefined,
    });

    return NextResponse.json({ invitation }, { status: 201 });
  } catch (error) {
    console.error('Error sending clan invite:', error);
    return NextResponse.json(
      { error: 'Error al enviar la invitación' },
      { status: 500 }
    );
  }
}
