import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { getEmailQueue } from '@/infrastructure/queue/EmailQueue';

const resendSchema = z.object({
  email: z.string().email(),
});

const TOKEN_EXPIRY_HOURS = 24;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = resendSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    const { email } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    const rlResult = await rateLimit(getRateLimitKey('verify-resend', normalizedEmail), 3, 3600);
    if (!rlResult.allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' }, {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rlResult.resetAt - Date.now()) / 1000)) },
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, username: true, emailVerified: true },
    });

    if (user && !user.emailVerified) {
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 3600 * 1000);

      await prisma.verificationToken.create({
        data: {
          identifier: user.email,
          token,
          expires,
        },
      });

      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const verificationUrl = `${baseUrl}/auth/verify?token=${token}`;

      const emailQueue = getEmailQueue();
      await emailQueue.addVerificationEmail({
        to: user.email,
        userId: user.id,
        username: user.username,
        verificationUrl,
      });

      console.info('[ResendVerification] Verification email queued for user ID:', user.id);
    }

    return NextResponse.json(
      { message: 'Si existe una cuenta con ese email pendiente de verificación, recibirás un nuevo enlace.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en resend-verification:', error);
    return NextResponse.json(
      { message: 'Si existe una cuenta con ese email pendiente de verificación, recibirás un nuevo enlace.' },
      { status: 200 }
    );
  }
}
