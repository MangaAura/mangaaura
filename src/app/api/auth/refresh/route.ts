import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

const REFRESH_TOKEN_BYTES = 48;
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

function generateRefreshToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
  const hash = bcrypt.hashSync(raw, 8);
  return { raw, hash };
}

export async function POST(request: NextRequest) {
  try {
    const { refreshToken: rawToken } = await request.json();
    if (!rawToken || typeof rawToken !== 'string') {
      return NextResponse.json({ error: 'Refresh token requerido' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rlResult = await rateLimit(getRateLimitKey('refresh-token', ip), 10, 300);
    if (!rlResult.allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 });
    }

    const tokens = await prisma.refreshToken.findMany({
      where: {
        expiresAt: { gt: new Date() },
        revokedAt: null,
      },
    });

    let matchedToken: typeof tokens[0] | null = null;
    for (const token of tokens) {
      if (bcrypt.compareSync(rawToken, token.tokenHash)) {
        matchedToken = token;
        break;
      }
    }

    if (!matchedToken) {
      return NextResponse.json({ error: 'Refresh token inválido o expirado' }, { status: 401 });
    }

    await prisma.refreshToken.update({
      where: { id: matchedToken.id },
      data: { revokedAt: new Date() },
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
    const { raw: newRawToken, hash: newHash } = generateRefreshToken();

    await prisma.refreshToken.create({
      data: {
        tokenHash: newHash,
        userId: matchedToken.userId,
        expiresAt,
      },
    });

    return NextResponse.json({
      refreshToken: newRawToken,
      expiresAt: expiresAt.toISOString(),
    });
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
