import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status') || 'ACTIVE';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const skip = (page - 1) * limit;

  const polls = await prisma.poll.findMany({
    where: status === 'ALL' ? {} : { status },
    include: {
      createdBy: {
        select: { id: true, username: true, avatarUrl: true },
      },
      options: {
        orderBy: { order: 'asc' },
      },
      _count: {
        select: { votes: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
  });

  const total = await prisma.poll.count({
    where: status === 'ALL' ? {} : { status },
  });

  const pollsWithUserVote = await Promise.all(
    polls.map(async (poll) => {
      const userVote = await prisma.pollVote.findUnique({
        where: {
          pollId_userId: {
            pollId: poll.id,
            userId: session.user.id,
          },
        },
        select: { optionId: true },
      });

      return {
        ...poll,
        userVotedOptionId: userVote?.optionId || null,
      };
    })
  );

  return NextResponse.json({
    polls: pollsWithUserVote,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page < Math.ceil(total / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const rlResponse = await withRateLimit(request, session?.user?.id, 'default');
  if (rlResponse) return rlResponse;

  try {
    const body = await request.json();
    const { question, description, type, options, expiresAt } = body;

    if (!question) {
      return NextResponse.json({ error: 'question es requerido' }, { status: 400 });
    }

    if (!options || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json(
        { error: 'Se requieren al menos 2 opciones' },
        { status: 400 }
      );
    }

    const poll = await prisma.poll.create({
      data: {
        question,
        description,
        type: type || 'SINGLE',
        status: 'ACTIVE',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdById: session.user.id,
        options: {
          create: options.map((text: string, index: number) => ({
            text,
            order: index,
          })),
        },
      },
      include: {
        options: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json(poll, { status: 201 });
  } catch (error) {
    console.error('Error creating poll:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}