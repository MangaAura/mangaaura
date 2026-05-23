import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

const querySchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
});

export async function GET(request: NextRequest) {
  try {
    const identifier = request.headers.get('x-forwarded-for') || 'unknown';
    const { allowed } = await rateLimit(
      getRateLimitKey('check-username', identifier),
      30,
      60
    );
    if (!allowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: 'Se requiere el parámetro username' },
        { status: 400 }
      );
    }

    const result = querySchema.safeParse({ username });

    if (!result.success) {
      return NextResponse.json(
        { available: false, reason: 'invalid' },
        { status: 200 }
      );
    }

    const normalized = username.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { username: normalized },
      select: { id: true },
    });

    return NextResponse.json(
      { available: !existing },
      { status: 200 }
    );
  } catch (error) {
    console.error('[CheckUsername] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
