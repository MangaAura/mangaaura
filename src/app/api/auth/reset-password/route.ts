import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { redis } from '@/lib/redis';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  newPassword: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

// Tiempo de expiración del token (1 hora)
const TOKEN_EXPIRY_SECONDS = 3600;

interface ResetTokenData {
  userId: string;
  email: string;
  createdAt: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = resetPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { token, newPassword } = result.data;

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rlResult = await rateLimit(getRateLimitKey('reset-password', ip), 5, 3600);
    if (!rlResult.allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' }, {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rlResult.resetAt - Date.now()) / 1000)) },
      });
    }

    const tokenKey = `password-reset:${token}`;

    // Buscar el token en Redis
    const tokenData = await redis.get<string>(tokenKey);

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 400 }
      );
    }

    // Parsear datos del token
    let resetData: ResetTokenData;
    try {
      resetData = JSON.parse(tokenData) as ResetTokenData;
    } catch {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 400 }
      );
    }

    // Validar estructura de datos
    if (!resetData.userId || !resetData.email || !resetData.createdAt) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 400 }
      );
    }

    // Verificar que el token no haya expirado (doble validación)
    const tokenCreatedAt = new Date(resetData.createdAt);
    const now = new Date();
    const tokenAgeMs = now.getTime() - tokenCreatedAt.getTime();
    const tokenAgeSeconds = Math.floor(tokenAgeMs / 1000);

    if (tokenAgeSeconds > TOKEN_EXPIRY_SECONDS) {
      // Eliminar token expirado
      await redis.del(tokenKey);
      return NextResponse.json(
        { error: 'El token ha expirado. Por favor solicita un nuevo enlace.' },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: resetData.userId },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el email coincida (seguridad adicional)
    if (user.email.toLowerCase() !== resetData.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 400 }
      );
    }

    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Actualizar la contraseña del usuario
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        updatedAt: new Date(),
      },
    });

    // Invalidar el token (eliminar de Redis)
    await redis.del(tokenKey);

    // Opcional: Invalidar todas las sesiones activas del usuario
    // Esto obliga al usuario a iniciar sesión nuevamente con la nueva contraseña
    await redis.del(`user-sessions:${user.id}`);

 console.info('[ResetPassword] Password reset successful for user ID:', user.id);

    return NextResponse.json(
      {
        message: 'Contraseña restablecida exitosamente',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en reset-password:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
