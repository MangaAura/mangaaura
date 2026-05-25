import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;

  const poll = await prisma.poll.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: { id: true, username: true, avatarUrl: true },
      },
      options: {
        orderBy: { order: 'asc' },
        include: {
          _count: {
            select: { votes: true },
          },
        },
      },
    },
  });

  if (!poll) {
    return NextResponse.json({ error: 'Poll no encontrado' }, { status: 404 });
  }

  const totalVotes = poll.options.reduce((sum, opt) => sum + opt._count.votes, 0);

  const userVote = await prisma.pollVote.findUnique({
    where: {
      pollId_userId: {
        pollId: id,
        userId: session.user.id,
      },
    },
    select: { optionId: true },
  });

  const optionsWithPercentage = poll.options.map((opt) => ({
    ...opt,
    voteCount: opt._count.votes,
    percentage: totalVotes > 0 ? (opt._count.votes / totalVotes) * 100 : 0,
  }));

  return NextResponse.json({
    poll: {
      ...poll,
      options: optionsWithPercentage,
      totalVotes,
      userVotedOptionId: userVote?.optionId || null,
    },
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const rlResponse = await withRateLimit(request, session?.user?.id, 'default');
  if (rlResponse) return rlResponse;

  const { id } = await params;

  const poll = await prisma.poll.findUnique({ where: { id } });
  if (!poll) {
    return NextResponse.json({ error: 'Poll no encontrado' }, { status: 404 });
  }

  if (poll.createdById !== session.user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { question, description, status, expiresAt } = body;

    const updated = await prisma.poll.update({
      where: { id },
      data: {
        question: question || poll.question,
        description: description !== undefined ? description : poll.description,
        status: status || poll.status,
        expiresAt: expiresAt !== undefined ? (expiresAt ? new Date(expiresAt) : null) : poll.expiresAt,
      },
      include: {
        options: { orderBy: { order: 'asc' } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating poll:', error);
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

  const { id } = await params;

  const poll = await prisma.poll.findUnique({ where: { id } });
  if (!poll) {
    return NextResponse.json({ error: 'Poll no encontrado' }, { status: 404 });
  }

  if (poll.createdById !== session.user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  await prisma.pollVote.deleteMany({ where: { pollId: id } });
  await prisma.pollOption.deleteMany({ where: { pollId: id } });
  await prisma.poll.delete({ where: { id } });

  return NextResponse.json({ success: true });
}