import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        submissions: {
          orderBy: { votes: 'desc' },
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatarUrl: true },
            },
            _count: { select: { eventVotes: true } },
          },
        },
        _count: { select: { submissions: true } },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    const session = await auth();
    let votedSubmissionId: string | null = null;
    if (session?.user?.id) {
      const existingVote = await prisma.eventVote.findFirst({
        where: {
          userId: session.user.id,
          submission: { eventId: id },
        },
        select: { submissionId: true },
      });
      votedSubmissionId = existingVote?.submissionId ?? null;
    }

    return NextResponse.json({ event, votedSubmissionId });
  } catch (error) {
    console.error('[Event Detail] GET error:', error);
    return NextResponse.json({ error: 'Error al obtener evento' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const role = session.user.role;
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo admins pueden editar eventos' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const event = await prisma.event.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error('[Event Detail] PATCH error:', error);
    return NextResponse.json({ error: 'Error al actualizar evento' }, { status: 500 });
  }
}
