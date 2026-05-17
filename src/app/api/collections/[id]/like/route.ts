import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id: collectionId } = await params;
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rlResult = await rateLimit(getRateLimitKey('like-collection', `${session.user.id}:${ip}`), 20, 60);
    if (!rlResult.allowed) return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 });

    const collection = await prisma.collection.findUnique({ where: { id: collectionId }, select: { id: true } });
    if (!collection) return NextResponse.json({ error: 'Colección no encontrada' }, { status: 404 });

    const existing = await prisma.collectionLike.findUnique({
      where: { collectionId_userId: { userId: session.user.id, collectionId } },
    });

    if (existing) {
      await prisma.collectionLike.delete({ where: { id: existing.id } });
      return NextResponse.json({ liked: false });
    }

    await prisma.collectionLike.create({
      data: { userId: session.user.id, collectionId },
    });

    return NextResponse.json({ liked: true });
  } catch (error) {
    console.error('Error toggling collection like:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
