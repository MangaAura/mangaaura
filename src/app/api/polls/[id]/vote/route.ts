import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const rlResponse = await withRateLimit(request, session?.user?.id, 'default');
  if (rlResponse) return rlResponse;

  const { id: pollId } = await params;

  try {
    const body = await request.json();
    const { optionId } = body;

    if (!optionId) {
      return NextResponse.json({ error: 'optionId es requerido' }, { status: 400 });
    }

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { options: true },
    });

    if (!poll) {
      return NextResponse.json({ error: 'Poll no encontrado' }, { status: 404 });
    }

    if (poll.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'El poll no está activo' }, { status: 400 });
    }

    if (poll.expiresAt && new Date() > poll.expiresAt) {
      return NextResponse.json({ error: 'El poll ha expirado' }, { status: 400 });
    }

    const validOptionIds = poll.options.map((o) => o.id);
    if (!validOptionIds.includes(optionId)) {
      return NextResponse.json({ error: 'Opción inválida' }, { status: 400 });
    }

    const existingVote = await prisma.pollVote.findUnique({
      where: {
        pollId_userId: {
          pollId,
          userId: session.user.id,
        },
      },
    });

    if (existingVote) {
      if (poll.type === 'SINGLE') {
        await prisma.pollVote.update({
          where: { id: existingVote.id },
          data: { optionId },
        });
        return NextResponse.json({ message: 'Voto actualizado', optionId });
      } else {
        return NextResponse.json(
          { error: 'Ya has votado en este poll. Los polls de única opción no permiten cambio de voto.' },
          { status: 400 }
        );
      }
    }

    await prisma.pollVote.create({
      data: {
        pollId,
        optionId,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true, optionId }, { status: 201 });
  } catch (error) {
    console.error('Error voting:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const rlResponse = await withRateLimit(request, session?.user?.id, 'default');
  if (rlResponse) return rlResponse;

  const { id: pollId } = await params;

  await prisma.pollVote.delete({
    where: {
      pollId_userId: {
        pollId,
        userId: session.user.id,
      },
    },
  });

  return NextResponse.json({ success: true });
}