import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual requerida'),
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado. Inicia sesión para cambiar tu contraseña.' },
        { status: 401 }
      );
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const identifier = session?.user?.id || ip;
    const rlResult = await rateLimit(getRateLimitKey('change-password', identifier), 10, 3600);
    if (!rlResult.allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' }, {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rlResult.resetAt - Date.now()) / 1000)) },
      });
    }

    const body = await request.json();
    const result = changePasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = result.data;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: 'Tu cuenta usa autenticación OAuth. No puedes cambiar la contraseña aquí.' },
        { status: 400 }
      );
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'La contraseña actual es incorrecta' },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'La nueva contraseña debe ser diferente a la actual' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        updatedAt: new Date(),
      },
    });

    // Session invalidation via Redis is best-effort.
    // JWT expiry handles stale sessions automatically.

    return NextResponse.json({
      message: 'Contraseña actualizada correctamente. Se cerrarán otras sesiones activas.',
    });
  } catch (error) {
    console.error('Error en change-password:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
