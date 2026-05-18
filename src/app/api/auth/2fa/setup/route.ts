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
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
