import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

const verifySchema = z.object({
  token: z.string().min(1, 'Token requerido'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = verifySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Token inválido', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { token } = result.data;

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rlResult = await rateLimit(getRateLimitKey('verify-email', ip), 10, 3600);
    if (!rlResult.allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' }, {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rlResult.resetAt - Date.now()) / 1000)) },
      });
    }

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 400 }
      );
    }

    const now = new Date();
    if (verificationToken.expires < now) {
      await prisma.verificationToken.delete({
        where: { token },
      });
      return NextResponse.json(
        { error: 'El token ha expirado. Por favor solicita un nuevo enlace.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
      select: { id: true, email: true, emailVerified: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      await prisma.verificationToken.delete({
        where: { token },
      });
      return NextResponse.json(
        { message: 'El email ya fue verificado' },
        { status: 200 }
      );
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: now },
      }),
      prisma.verificationToken.delete({
        where: { token },
      }),
    ]);

    console.info('[VerifyEmail] Email verified for user ID:', user.id);

    return NextResponse.json(
      { message: 'Email verificado exitosamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en verify-email:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
