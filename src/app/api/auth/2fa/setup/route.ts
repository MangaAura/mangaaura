import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { generateTwoFactorSecret } from '@/lib/two-factor';

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const result = await generateTwoFactorSecret(session.user.id, session.user.email);

    return NextResponse.json({
      secret: result.secret,
      otpauthUrl: result.otpauthUrl,
    });
  } catch (error) {
    console.error('[2FA Setup]', error);
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
