import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { z } from 'zod';

const createSchema = z.object({
  originalType: z.enum(['MANGA', 'CHAPTER', 'COMMENT']),
  originalId: z.string().min(1),
  comment: z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rlResult = await rateLimit(getRateLimitKey('repost', `${session.user.id}:${ip}`), 10, 60);
    if (!rlResult.allowed) return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 });

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });

    const { originalType, originalId, comment } = parsed.data;

    const existing = await prisma.repost.findUnique({
      where: { userId_originalType_originalId: { userId: session.user.id, originalType, originalId } },
    });

    if (existing) {
      await prisma.repost.delete({ where: { id: existing.id } });
      return NextResponse.json({ reposted: false, message: 'Repost eliminado' });
    }

    const repost = await prisma.repost.create({
      data: { userId: session.user.id, originalType, originalId, comment },
    });

    return NextResponse.json({ reposted: true, repost, message: 'Repost creado' });
  } catch (error) {
    console.error('Error en repost:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || session.user.id;
    const type = searchParams.get('type') as 'MANGA' | 'CHAPTER' | 'COMMENT' | null;

    const where: any = { userId };
    if (type) where.originalType = type;

    const reposts = await prisma.repost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ reposts });
  } catch (error) {
    console.error('Error obteniendo reposts:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
