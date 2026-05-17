import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyTwoFactorLogin } from '@/lib/two-factor';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const { userId, token } = await request.json();
    if (!userId || !token) {
      return NextResponse.json({ error: 'userId y token requeridos' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rlResult = await rateLimit(getRateLimitKey('2fa-challenge', `${userId}:${ip}`), 5, 300);
    if (!rlResult.allowed) {
      return NextResponse.json({ error: 'Demasiados intentos. Intenta de nuevo más tarde.' }, { status: 429 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, twoFactorEnabled: true },
    });

    if (!user || !user.twoFactorEnabled) {
      return NextResponse.json({ error: '2FA no está habilitado' }, { status: 400 });
    }

    const result = await verifyTwoFactorLogin(userId, token);

    if (!result.valid) {
      return NextResponse.json({ error: result.error || 'Código inválido' }, { status: 401 });
    }

    return NextResponse.json({ success: true, userId: user.id, email: user.email });
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
