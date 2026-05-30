import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { Email , InvalidEmailError } from '@/core/value-objects/Email';
import { Password , WeakPasswordError } from '@/core/value-objects/Password';
import { invalidateCache } from '@/lib/apiCache';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30),
  password: z.string().min(8),
  referralCode: z.string().optional(), // Optional referral code from query param
});

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

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

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Cuerpo de solicitud inválido. Se esperaba JSON.' },
        { status: 400 }
      );
    }
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { email: emailStr, username, password: passwordStr, referralCode: referredByCode } = result.data;

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

    // Generate unique referral code
    let userReferralCode = generateReferralCode();
    let codeExists = await prisma.user.findFirst({ where: { referralCode: userReferralCode } });
    while (codeExists) {
      userReferralCode = generateReferralCode();
      codeExists = await prisma.user.findFirst({ where: { referralCode: userReferralCode } });
    }

    // Look up referrer if referral code provided
    let referrerCode = referredByCode || null;
    if (!referrerCode) {
      // Try to get from query param
      const url = new URL(request.url);
      referrerCode = url.searchParams.get('ref');
    }

    let referrer = null;
    if (referrerCode) {
      referrer = await prisma.user.findFirst({
        where: { referralCode: referrerCode.toUpperCase() },
        select: { id: true },
      });
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.value,
        username: username.toLowerCase().trim(),
        passwordHash: hashedPassword,
        xpPoints: 0,
        level: 1,
        readingStreak: 0,
        referralCode: userReferralCode,
        referredBy: referrer ? referrerCode : null,
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
        auraBalance: true,
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

    // Create ReferralClaim for referrer if valid referral code was used
    if (referrer) {
      prisma.referralClaim.create({
        data: {
          referrerId: referrer.id,
          refereeId: user.id,
          status: 'locked',
        },
      }).catch((referralError: unknown) => {
        console.error('[Register] Error creating referral claim:', referralError);
      });
    }

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

    // Invalidar cache de stats (totalReaders cambió)
    await invalidateCache('stats:homepage');

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
