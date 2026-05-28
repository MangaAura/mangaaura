import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/clans/join-requests - Mis solicitudes de ingreso
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // optional filter: PENDING, APPROVED, REJECTED, CANCELLED

    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const requests = await prisma.clanJoinRequest.findMany({
      where,
      include: {
        clan: {
          select: {
            id: true,
            name: true,
            emblemUrl: true,
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

    return NextResponse.json({ joinRequests: requests });
  } catch (error) {
    console.error('Error fetching my join requests:', error);
    return NextResponse.json(
      { error: 'Error al cargar tus solicitudes' },
      { status: 500 }
    );
  }
}
