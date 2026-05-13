import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const categories = await prisma.forumCategory.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: { select: { threads: true } },
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('[Forum Categories] GET error:', error);
    return NextResponse.json({ error: 'Error al obtener categorías' }, { status: 500 });
  }
}
