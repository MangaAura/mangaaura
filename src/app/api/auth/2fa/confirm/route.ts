import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { setToken } from '@/lib/auth-store';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
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

    // Store in memory — zero Redis cost. Cleared after 30 min or when consumed by jwt callback.
    setToken(`2fa:confirmed:${session.user.id}`, 'true', 1800);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[2FA Confirm]', error);
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
