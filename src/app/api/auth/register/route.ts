import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { Email , InvalidEmailError } from '@/core/value-objects/Email';
import { Password , WeakPasswordError } from '@/core/value-objects/Password';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    const identifier = request.headers.get('x-forwarded-for') || 'unknown';
    const { allowed } = await rateLimit(
      getRateLimitKey('register', identifier),
      5,
      3600
    );
    if (!allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta más tarde.' }, { status: 429 });
    }

    const body = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { email: emailStr, username, password: passwordStr } = result.data;

    // Validar email con Value Object
    let email;
    try {
      email = Email.create(emailStr);
    } catch (error) {
      if (error instanceof InvalidEmailError) {
        return NextResponse.json(
          { error: 'Email inválido', message: error.message },
          { status: 400 }
        );
      }
      throw error;
    }

    // Validar contraseña con Value Object
    try {
      Password.createFromPlain(passwordStr);
    } catch (error) {
      if (error instanceof WeakPasswordError) {
        return NextResponse.json(
          { error: 'Contraseña débil', message: error.message },
          { status: 400 }
        );
      }
      throw error;
    }

    // Verificar si email existe
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.value },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email ya registrado' },
        { status: 409 }
      );
    }

    // Verificar si username existe
    const existingUsername = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username no disponible' },
        { status: 409 }
      );
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(passwordStr, 12);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email: email.value,
        username: username.toLowerCase().trim(),
        passwordHash: hashedPassword,
        xpPoints: 0,
        inkcoinsBalance: 50, // Bonus de registro
        level: 1,
        readingStreak: 0,
      emailPreferences: JSON.stringify({
        newChapters: true,
        commentReplies: true,
        tips: true,
        achievements: true,
        marketing: false,
        crowdfundingUpdates: true,
      }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        xpPoints: true,
        level: true,
        inkcoinsBalance: true,
        createdAt: true,
      },
    });

    // Enviar email de bienvenida (fire-and-forget, no bloquea la respuesta)
    const { getEmailQueue } = await import('@/infrastructure/queue/EmailQueue');
    const emailQueue = getEmailQueue();
    emailQueue.addWelcomeEmail({
      to: user.email,
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
    }).catch((emailError: unknown) => {
      console.error('[Register] Error sending welcome email:', emailError);
    });

    // Crear token de verificación (fire-and-forget, no bloquea la respuesta)
    const verifyToken = crypto.randomBytes(32).toString('hex');
    prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token: verifyToken,
        expires: new Date(Date.now() + 24 * 3600 * 1000),
      },
    }).catch((verifyError: unknown) => {
      console.error('[Register] Error creating verification token:', verifyError);
    });

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/auth/verify?token=${verifyToken}`;
    emailQueue.addVerificationEmail({
      to: user.email,
      userId: user.id,
      username: user.username,
      verificationUrl,
    }).catch((verifyError: unknown) => {
      console.error('[Register] Error sending verification email:', verifyError);
    });

    return NextResponse.json(
      {
        message: 'Usuario registrado exitosamente',
        user: {
          ...user,
          rank: 'Novato',
          progressToNextLevel: 0,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error en registro:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
