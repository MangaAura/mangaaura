import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

const voteSchema = z.object({
  targetId: z.string(),
  targetType: z.enum(['COMMENT', 'FORUM_POST']),
  value: z.union([z.literal(1), z.literal(-1)]),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const rlResponse = await withRateLimit(request, session.user.id, 'default');
    if (rlResponse) return rlResponse;

    const body = await request.json();
    const result = voteSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { targetId, targetType, value } = result.data;
    const userId = session.user.id;

    const existing = await prisma.vote.findUnique({
      where: {
        userId_targetId_targetType: { userId, targetId, targetType },
      },
    });

    if (existing) {
      if (existing.value === value) {
        await prisma.vote.delete({
          where: { id: existing.id },
        });
        return NextResponse.json({ voted: false, value: null });
      }
      await prisma.vote.update({
        where: { id: existing.id },
        data: { value },
      });
      return NextResponse.json({ voted: true, value });
    }

    await prisma.vote.create({
      data: { userId, targetId, targetType, value },
    });

    return NextResponse.json({ voted: true, value });
  } catch (error) {
    console.error('[Votes API] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
