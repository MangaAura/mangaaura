import { NextRequest, NextResponse } from 'next/server';

import { getRealtimeAnalytics } from '@/lib/analytics-store';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

async function checkAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role === 'ADMIN';
}

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const { allowed } = await rateLimit(getRateLimitKey('admin-analytics-realtime', ip), 30, 60);
    if (!allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 });
    }

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const isAdmin = await checkAdmin(session.user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const stats = getRealtimeAnalytics();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error obteniendo analiticas en tiempo real:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
