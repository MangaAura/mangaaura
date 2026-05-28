import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { logSecurityEvent } from '@/lib/security-audit';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

// POST /api/clans/[id]/join-requests - Enviar solicitud de ingreso
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

    const userId = session.user.id;

    // Check if user is already in a clan
    const existingMembership = await prisma.clanMembership.findFirst({
      where: { userId },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: 'Ya eres miembro de un clan' },
        { status: 400 }
      );
    }

    // Check if clan exists
    const clan = await prisma.clan.findUnique({
      where: { id },
      select: { id: true, name: true, leaderId: true },
    });

    if (!clan) {
      return NextResponse.json(
        { error: 'Clan no encontrado' },
        { status: 404 }
      );
    }

    // Check if there's already a pending request
    const existingRequest = await prisma.clanJoinRequest.findFirst({
      where: {
        clanId: id,
        userId,
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: 'Ya tienes una solicitud pendiente para este clan' },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { message } = body;

    if (message && message.length > 500) {
      return NextResponse.json(
        { error: 'El mensaje no puede exceder 500 caracteres' },
        { status: 400 }
      );
    }

    // Create join request
    const joinRequest = await prisma.clanJoinRequest.create({
      data: {
        clanId: id,
        userId,
        message: message?.trim() || null,
        status: 'PENDING',
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

    // Audit log
    await logSecurityEvent({
      userId,
      action: 'CLAN_JOIN_REQUESTED',
      targetId: id,
      targetType: 'CLAN',
      metadata: {
        clanName: clan.name,
        requestId: joinRequest.id,
      },
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || undefined,
    });

    return NextResponse.json({ joinRequest }, { status: 201 });
  } catch (error) {
    console.error('Error creating join request:', error);
    return NextResponse.json(
      { error: 'Error al enviar la solicitud' },
      { status: 500 }
    );
  }
}

// GET /api/clans/[id]/join-requests - Listar solicitudes pendientes (líder/officer)
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

    const userId = session.user.id;

    // Check if user is leader or officer of the clan
    const membership = await prisma.clanMembership.findFirst({
      where: {
        clanId: id,
        userId,
        role: { in: ['LEADER', 'OFFICER'] },
      },
    });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'PENDING';
    const includeAll = searchParams.get('all') === '1';

    const where: any = { clanId: id };
    if (!includeAll) {
      where.status = status;
    }

    const requests = await prisma.clanJoinRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            xpPoints: true,
            level: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Non-officers can only see their own requests
    if (!membership) {
      const myRequests = requests.filter((r) => r.userId === userId);
      return NextResponse.json({ joinRequests: myRequests, canReview: false });
    }

    return NextResponse.json({ joinRequests: requests, canReview: true });
  } catch (error) {
    console.error('Error fetching join requests:', error);
    return NextResponse.json(
      { error: 'Error al cargar las solicitudes' },
      { status: 500 }
    );
  }
}
