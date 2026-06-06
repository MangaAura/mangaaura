/**
 * POST /api/auth/complete-oauth-registration
 *
 * Completes an OAuth-based registration after the user has provided
 * their displayName, username, and optionally an avatar on the
 * /auth/complete-registration form.
 *
 * Expects a signed JWT token (from the OAuth signIn callback) and
 * the user's chosen displayName, username, and optional avatar URL.
 */
import { NextRequest, NextResponse } from 'next/server';

import { put } from '@vercel/blob';

import {
  optimizeImage,
  isValidImage,
  OUTPUT_CONTENT_TYPES,
} from '@/lib/image-optimization';
import { verifyOAuthRegistrationToken } from '@/lib/oauth-registration';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { invalidateCache } from '@/lib/apiCache';

export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const identifier = request.headers.get('x-forwarded-for') || 'unknown';
    const { allowed } = await rateLimit(
      getRateLimitKey('complete-oauth', identifier),
      5,
      3600
    );
    if (!allowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta más tarde.' },
        { status: 429 }
      );
    }

    let body: { token?: string; displayName?: string; username?: string; avatarDataUrl?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Cuerpo de solicitud inválido.' },
        { status: 400 }
      );
    }

    const { token, displayName, username, avatarDataUrl } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token de registro requerido.' },
        { status: 400 }
      );
    }

    // Verify the OAuth registration token
    const oauthData = await verifyOAuthRegistrationToken(token);
    if (!oauthData) {
      return NextResponse.json(
        { error: 'Token inválido o expirado. Por favor, inicia sesión con Google nuevamente.' },
        { status: 401 }
      );
    }

    // Validate fields
    if (!username || username.trim().length < 3) {
      return NextResponse.json(
        { error: 'El nombre de usuario debe tener al menos 3 caracteres.' },
        { status: 400 }
      );
    }

    if (username.length > 30) {
      return NextResponse.json(
        { error: 'El nombre de usuario no puede exceder 30 caracteres.' },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { error: 'Solo se permiten letras, números y guiones bajos.' },
        { status: 400 }
      );
    }

    if (!displayName || displayName.trim().length === 0) {
      return NextResponse.json(
        { error: 'El nombre para mostrar es requerido.' },
        { status: 400 }
      );
    }

    if (displayName.length > 50) {
      return NextResponse.json(
        { error: 'El nombre para mostrar no puede exceder 50 caracteres.' },
        { status: 400 }
      );
    }

    // Check if email already has an account (race condition guard)
    const emailExists = await prisma.user.findUnique({
      where: { email: oauthData.email },
    });
    if (emailExists) {
      return NextResponse.json(
        { error: 'Este email ya está registrado. Inicia sesión.' },
        { status: 409 }
      );
    }

    // Check if username is available
    const usernameExists = await prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() },
    });
    if (usernameExists) {
      return NextResponse.json(
        { error: 'Este nombre de usuario no está disponible.' },
        { status: 409 }
      );
    }

    // Upload avatar if provided (data URL from canvas/blob)
    let avatarUrl: string | null = null;
    if (avatarDataUrl && avatarDataUrl.startsWith('data:image/')) {
      try {
        const base64Data = avatarDataUrl.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');

        // Validate the image
        const valid = await isValidImage(buffer);
        if (!valid) {
          console.warn('[CompleteOAuth] Invalid image data, skipping avatar');
        } else {
          // Optimize to a square avatar
          const optimized = await optimizeImage(buffer, {
            width: 512,
            height: 512,
            quality: 85,
            format: 'webp',
          });

          const pathname = `avatars/${oauthData.email.split('@')[0]}_${Date.now()}.webp`;
          const blob = await put(pathname, optimized.buffer, {
            access: 'public',
            contentType: OUTPUT_CONTENT_TYPES['webp'],
            cacheControlMaxAge: 31536000,
          });
          avatarUrl = blob.url;
        }
      } catch (uploadError) {
        console.error('[CompleteOAuth] Error uploading avatar:', uploadError);
        // Non-fatal: continue without avatar
      }
    }

    // Generate referral code
    function generateReferralCode(): string {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    }

    let referralCode = generateReferralCode();
    let rcExists = await prisma.user.findFirst({ where: { referralCode } });
    while (rcExists) {
      referralCode = generateReferralCode();
      rcExists = await prisma.user.findFirst({ where: { referralCode } });
    }

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        email: oauthData.email,
        username: username.toLowerCase().trim(),
        displayName: displayName.trim(),
        avatarUrl,
        role: 'USER',
        xpPoints: 0,
        level: 1,
        auraBalance: 50,
        emailVerified: new Date(), // OAuth emails are already verified
        passwordHash: null,
        referralCode,
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

    // Link the OAuth account
    if (oauthData.providerAccountId) {
      await prisma.account.create({
        data: {
          userId: newUser.id,
          type: oauthData.accountType,
          provider: oauthData.provider,
          providerAccountId: oauthData.providerAccountId,
        },
      });
    }

    // Invalidate cache
    await invalidateCache('stats:homepage');

    return NextResponse.json(
      {
        message: 'Cuenta creada exitosamente',
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[CompleteOAuth] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}
