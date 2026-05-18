import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { XP } from '@/core/value-objects/XP';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

const addXPSchema = z.object({
  amount: z.number().int().min(1).max(1000),
  reason: z.string().min(1).max(100),
  referenceId: z.string().optional(),
});

// POST /api/gamification/xp - Agregar XP a usuario
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const identifier = session?.user?.id || ip;
    const rlResult = await rateLimit(getRateLimitKey('gamification-xp', identifier), 30, 60);
    if (!rlResult.allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' }, {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rlResult.resetAt - Date.now()) / 1000)) },
      });
    }

    const body = await request.json();
    const result = addXPSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { amount, reason: _reason, referenceId: _referenceId } = result.data;

    // Obtener usuario actual
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, xpPoints: true, level: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Calcular nuevo XP y nivel
    const currentXP = XP.create(user.xpPoints);
    const addedXP = XP.create(amount);
    const newXP = currentXP.add(addedXP);
    const newLevel = newXP.level;

    // Actualizar usuario
    await prisma.user.update({
      where: { id: user.id },
      data: {
        xpPoints: newXP.amount,
        level: newLevel,
      },
    });

    // Registrar transacción de XP (opcional, para auditoría)
    // Aquí podríamos guardar en MongoDB un log del XP ganado

    return NextResponse.json({
      success: true,
      xpEarned: amount,
      totalXP: newXP.amount,
      oldLevel: user.level,
      newLevel: newLevel,
      levelUp: newLevel > user.level,
      rank: newXP.rank,
      progressToNextLevel: newXP.progressToNextLevel,
      xpToNextLevel: newXP.xpToNextLevel,
    });
  } catch (error) {
    console.error('Error agregando XP:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET /api/gamification/xp - Obtener stats de XP del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const identifier = session?.user?.id || ip;
    const rlResult = await rateLimit(getRateLimitKey('gamification-xp', identifier), 30, 60);
    if (!rlResult.allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' }, {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rlResult.resetAt - Date.now()) / 1000)) },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        username: true,
        xpPoints: true,
        level: true,
        readingStreak: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const xp = XP.create(user.xpPoints);

    // Obtener ranking global (top 10 y posición del usuario)
    const topUsers = await prisma.user.findMany({
      orderBy: { xpPoints: 'desc' },
      take: 10,
      select: {
        id: true,
        username: true,
        xpPoints: true,
        level: true,
      },
    });

    const userRank = await prisma.user.count({
      where: {
        xpPoints: {
          gt: user.xpPoints,
        },
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        xpPoints: user.xpPoints,
        level: user.level,
        rank: xp.rank,
        progressToNextLevel: xp.progressToNextLevel,
        xpToNextLevel: xp.xpToNextLevel,
        readingStreak: user.readingStreak,
        globalRank: userRank + 1,
      },
      leaderboard: topUsers.map((u: any, index: any) => ({
        position: index + 1,
        id: u.id,
        username: u.username,
        xpPoints: u.xpPoints,
        level: u.level,
        isCurrentUser: u.id === user.id,
      })),
    });
  } catch (error) {
    console.error('Error obteniendo XP:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
