import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || !['ADMIN', 'OWNER'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const featured = await prisma.mangaSeries.findFirst({
      where: { isHomepageFeatured: true, deletedAt: null },
      select: {
        id: true,
        title: true,
        slug: true,
        coverUrl: true,
        description: true,
        authorName: true,
      },
    });

    return NextResponse.json({ manga: featured });
  } catch (error) {
    console.error('[FeaturedManga GET] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !['ADMIN', 'OWNER'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { mangaId } = body;

    if (!mangaId) {
      return NextResponse.json({ error: 'mangaId es requerido' }, { status: 400 });
    }

    // Unfeature any currently featured manga
    await prisma.mangaSeries.updateMany({
      where: { isHomepageFeatured: true },
      data: { isHomepageFeatured: false },
    });

    // Set the new featured manga
    const manga = await prisma.mangaSeries.update({
      where: { id: mangaId },
      data: { isHomepageFeatured: true },
      select: {
        id: true,
        title: true,
        slug: true,
        coverUrl: true,
        description: true,
        authorName: true,
      },
    });

    // Invalidate cache so the homepage picks up the change
    try {
      const { invalidateCache } = await import('@/lib/apiCache');
      await invalidateCache('homepage:featured');
    } catch {
      // Cache clear is best-effort
    }

    return NextResponse.json({ manga, success: true });
  } catch (error) {
    console.error('[FeaturedManga POST] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id || !['ADMIN', 'OWNER'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Unfeature the current featured manga
    await prisma.mangaSeries.updateMany({
      where: { isHomepageFeatured: true },
      data: { isHomepageFeatured: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[FeaturedManga DELETE] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
