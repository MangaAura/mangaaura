import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';


export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rlResult = await rateLimit(getRateLimitKey('delete-account', `${session.user.id}:${ip}`), 1, 86400);
    if (!rlResult.allowed) {
      return NextResponse.json({ error: 'Ya solicitaste la eliminación hoy. Intenta de nuevo mañana.' }, { status: 429 });
    }

    const { password } = await request.json();
    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Contraseña requerida' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });

    if (!user?.passwordHash) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 403 });
    }

    const uuid = randomUUID().replace(/-/g, '').slice(0, 12);

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        email: `deleted-${uuid}@deleted.inkverse`,
        username: `deleted-${uuid}`,
        displayName: null,
        avatarUrl: null,
        passwordHash: null,
        twoFactorSecret: null,
        twoFactorEnabled: false,
        twoFactorBackupCodes: null,
        stripeCustomerId: null,
        subscriptionId: null,
        pushSubscription: null,
        emailPreferences: '{}',
      },
    });

    const expired = new Date(0);
    await prisma.session.updateMany({ where: { userId: session.user.id }, data: { expires: expired } });
    await prisma.account.deleteMany({ where: { userId: session.user.id } });
    await prisma.refreshToken.updateMany({ where: { userId: session.user.id }, data: { revokedAt: new Date() } });
    await prisma.securityAuditLog.deleteMany({ where: { userId: session.user.id } });

    try {
      const { redis } = await import('@/lib/redis');
      await redis.del(`session:blacklist:${session.user.id}`);
    } catch {}

    return NextResponse.json({ success: true, message: 'Cuenta eliminada correctamente' });
  } catch (error) {
    console.error('[DeleteAccount] Error:', error);
    return NextResponse.json({ error: 'Error al eliminar la cuenta' }, { status: 500 });
  }
}
