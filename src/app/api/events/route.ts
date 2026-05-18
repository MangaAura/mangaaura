import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

const createEventSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(1).max(2000),
  type: z.enum(['ART_CHALLENGE', 'SPEEDREADING', 'COMMUNITY']).default('ART_CHALLENGE'),
  basePrompt: z.string().max(5000).optional(),
  prize: z.string().min(1).max(200),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  imageUrl: z.string().url().optional(),
  color: z.string().optional(),
  borderColor: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status') || 'ACTIVE';
    const type = searchParams.get('type');
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const includeVoting = searchParams.get('includeVoting') === 'true';
    const skip = (page - 1) * limit;

    // Support comma-separated statuses for 'PAST' (COMPLETED,CANCELLED)
    const statuses = status.split(',').filter(Boolean);
    const where: any = {};
    if (statuses.length === 1) where.status = statuses[0];
    else if (statuses.length > 1) where.status = { in: statuses };
    if (type) where.type = type;
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const now = new Date();
    if (status === 'ACTIVE') {
      where.startDate = { lte: now };
      where.endDate = { gte: now };
    } else if (status === 'VOTING') {
      where.endDate = { lt: now };
      where.status = 'VOTING';
    } else if (status === 'PAST') {
      where.status = 'COMPLETED';
    }

    const [events, total, votingEvent] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: { endDate: 'asc' },
        skip,
        take: limit,
        include: {
          creator: {
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          },
          _count: { select: { submissions: true } },
        },
      }),
      prisma.event.count({ where }),
      includeVoting
        ? prisma.event.findFirst({
            where: { status: 'VOTING' },
            include: {
              _count: { select: { submissions: true } },
              submissions: {
                include: {
                  user: {
                    select: { id: true, username: true, displayName: true, avatarUrl: true },
                  },
                },
                orderBy: { votes: 'desc' },
              },
            },
          })
        : Promise.resolve(null),
    ]);

    return NextResponse.json({
      events,
      voting: votingEvent
        ? {
            event: votingEvent,
            submissions: votingEvent.submissions,
          }
        : null,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[Events] GET error:', error);
    return NextResponse.json({ error: 'Error al obtener eventos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const rlResponse = await withRateLimit(request, session?.user?.id, 'default');
    if (rlResponse) return rlResponse;

    const role = session.user.role;
    if (role !== 'ADMIN' && role !== 'CREATOR') {
      return NextResponse.json({ error: 'Solo admins o creadores pueden crear eventos' }, { status: 403 });
    }

    const body = await request.json();
    const data = createEventSchema.parse(body);

    const event = await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        basePrompt: data.basePrompt,
        prize: data.prize,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        imageUrl: data.imageUrl,
        color: data.color,
        borderColor: data.borderColor,
        createdBy: session.user.id,
      },
      include: {
        creator: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    console.error('[Events] POST error:', error);
    return NextResponse.json({ error: 'Error al crear evento' }, { status: 500 });
  }
}
