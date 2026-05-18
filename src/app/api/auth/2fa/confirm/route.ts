import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { redis } from '@/lib/redis';
import { verifyTwoFactorLogin } from '@/lib/two-factor';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { token } = await request.json();
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Código requerido' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rlResult = await rateLimit(getRateLimitKey('2fa-confirm', `${session.user.id}:${ip}`), 5, 300);
    if (!rlResult.allowed) {
      return NextResponse.json({ error: 'Demasiados intentos' }, { status: 429 });
    }

    const result = await verifyTwoFactorLogin(session.user.id, token);
    if (!result.valid) {
      return NextResponse.json({ error: result.error || 'Código inválido' }, { status: 401 });
    }

    await redis.setex(`2fa:confirmed:${session.user.id}`, 1800, 'true');

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
