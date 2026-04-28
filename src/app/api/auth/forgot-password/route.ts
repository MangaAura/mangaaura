import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { getEmailQueue } from '@/infrastructure/queue/EmailQueue';
import crypto from 'crypto';

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

// Tiempo de expiracion del token (1 hora)
const TOKEN_EXPIRY_SECONDS = 3600;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = forgotPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Email invalido' },
        { status: 400 }
      );
    }

    const { email } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, username: true },
    });

    // Generar token de reset (siempre, por seguridad)
    const resetToken = crypto.randomUUID();
    const tokenKey = `password-reset:${resetToken}`;

    if (user) {
      // Guardar token en Redis con expiracion
      await redis.setex(
        tokenKey,
        TOKEN_EXPIRY_SECONDS,
        JSON.stringify({
          userId: user.id,
          email: user.email,
          createdAt: new Date().toISOString(),
        })
      );

      // Construir el link de reset
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const resetLink = `${baseUrl}/auth/reset-password?token=${resetToken}`;

      // Agregar a la cola de emails
      const emailQueue = getEmailQueue();
      await emailQueue.addPasswordResetEmail({
        to: user.email,
        userId: user.id,
        username: user.username,
        resetToken,
        resetLink,
      });

      console.log(`[ForgotPassword] Email de recuperacion agregado a la cola para: ${user.email}`);
    }

    // Por seguridad, siempre retornamos exito
    // No revelamos si el email existe o no
    return NextResponse.json(
      {
        message: 'Si existe una cuenta con ese email, recibiras un enlace para restablecer tu contrasena.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en forgot-password:', error);

    // Incluso en error, retornamos un mensaje generico
    // para no revelar informacion sobre el sistema
    return NextResponse.json(
      {
        message: 'Si existe una cuenta con ese email, recibiras un enlace para restablecer tu contrasena.',
      },
      { status: 200 }
    );
  }
}
