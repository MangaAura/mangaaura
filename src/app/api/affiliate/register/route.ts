import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

const registerSchema = z.object({
  agreeToTerms: z.literal(true, {
    error: 'Debes aceptar los términos del programa de afiliados',
  }),
  promoCode: z.string().min(3).max(20).regex(/^[A-Za-z0-9_-]+$/).optional(),
  howDidYouHear: z.string().max(500).optional(),
  website: z.string().url().optional(),
  socialMedia: z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Rate limit
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               request.headers.get('x-real-ip') ||
               'anonymous';
    const { allowed } = await rateLimit(
      getRateLimitKey('affiliate-register', ip),
      3,
      3600
    );
    if (!allowed) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Intenta de nuevo en una hora.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { promoCode, howDidYouHear, website, socialMedia } = result.data;

    // Check if user is already an affiliate
    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { affiliateStatus: true, referralCode: true },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (existingUser.affiliateStatus === 'active') {
      return NextResponse.json({ error: 'Ya eres un afiliado activo' }, { status: 400 });
    }

    // Get the default Bronze tier
    const bronzeTier = await prisma.affiliateTier.findFirst({
      where: { name: 'Bronze' },
    });

    if (!bronzeTier) {
      return NextResponse.json(
        { error: 'Error de configuración: tiers no encontrados' },
        { status: 500 }
      );
    }

    // Ensure user has a referral code
    let referralCode = existingUser.referralCode;
    if (!referralCode) {
      referralCode = generatePromoCode(session.user.id);
      // Ensure uniqueness
      let attempts = 0;
      while (await prisma.user.findUnique({ where: { referralCode } })) {
        referralCode = generatePromoCode(session.user.id + attempts);
        attempts++;
      }
    }

    // Create the affiliate promo code
    const finalPromoCode = promoCode || `AURA-${referralCode}`;

    // Update user to affiliate
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        affiliateTierId: bronzeTier.id,
        affiliateStatus: 'active',
        affiliateSince: new Date(),
        affiliateTotalEarned: 0,
        referralCode,
        affiliatePromoCode: finalPromoCode,
        affiliateApprovedAt: new Date(),
      },
    });

    // Log affiliate registration
    console.info(`[Affiliate] New affiliate registered: ${session.user.id} (${finalPromoCode})`);

    // Track in analytics metadata
    await prisma.userActivity.create({
      data: {
        userId: session.user.id,
        activityType: 'AFFILIATE_REGISTER',
        metadata: JSON.stringify({
          promoCode: finalPromoCode,
          howDidYouHear,
          website,
          socialMedia,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: '¡Bienvenido al programa de afiliados de MangaAura!',
      affiliate: {
        status: 'active',
        tier: bronzeTier.name,
        commissionRate: bronzeTier.commissionRate,
        referralCode,
        promoCode: finalPromoCode,
      },
    });
  } catch (error) {
    console.error('[Affiliate Register] Error:', error);
    return NextResponse.json({ error: 'Error al registrarse como afiliado' }, { status: 500 });
  }
}

function generatePromoCode(seed: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const hash = simpleHash(seed);
  for (let i = 0; i < 8; i++) {
    result += chars[(hash + i * 7) % chars.length];
  }
  return result;
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}
