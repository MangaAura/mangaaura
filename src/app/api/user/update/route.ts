import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

const updateProfileSchema = z.object({
  displayName: z.string().max(50).optional(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
  avatarUrl: z.string().url().optional(),
  emailPreferences: z.string().optional(),
  bio: z.string().max(500).optional(),
  website: z.string().max(200).optional(),
  socialLinks: z.record(z.string(), z.string()).optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rlResult = await rateLimit(getRateLimitKey('update-profile', `${session.user.id}:${ip}`), 5, 60);
    if (!rlResult.allowed) return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 });

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });

    const data = parsed.data;

    if (data.username) {
      const normalizedUsername = data.username.toLowerCase();
      const existing = await prisma.user.findUnique({ where: { username: normalizedUsername } });
      if (existing && existing.id !== session.user.id) {
        return NextResponse.json({ error: 'Este nombre de usuario ya está en uso' }, { status: 409 });
      }
      data.username = normalizedUsername;
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: { id: true, username: true, displayName: true, avatarUrl: true, emailPreferences: true },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
