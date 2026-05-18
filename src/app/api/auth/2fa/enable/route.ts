import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { enableTwoFactor } from '@/lib/two-factor';

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

    const result = await enableTwoFactor(session.user.id, token);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      backupCodes: result.backupCodes,
    });
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
