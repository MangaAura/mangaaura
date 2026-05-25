import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

const MAX_RECENT_SEARCHES = 8;

// GET /api/user/recent-searches — Retrieve recent searches for the user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const searches = await prisma.userSearch.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: MAX_RECENT_SEARCHES,
      select: { query: true, createdAt: true },
    });

    return NextResponse.json({ searches });
  } catch (error) {
    console.error('[RecentSearches] GET error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST /api/user/recent-searches — Save a new search query
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rlResult = await rateLimit(getRateLimitKey('recent-search', `${session.user.id}:${ip}`), 20, 60);
    if (!rlResult.allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 });
    }

    const body = (await request.json()) as { query?: string };
    const query = body.query?.trim();

    if (!query || query.length < 2 || query.length > 200) {
      return NextResponse.json({ error: 'Consulta inválida' }, { status: 400 });
    }

    // Upsert: if the query already exists, update createdAt to move it to front
    await prisma.userSearch.upsert({
      where: {
        userId_query: { userId: session.user.id, query },
      },
      create: { userId: session.user.id, query },
      update: { createdAt: new Date() },
    });

    // Trim to max items — delete oldest if over limit
    const count = await prisma.userSearch.count({
      where: { userId: session.user.id },
    });

    if (count > MAX_RECENT_SEARCHES) {
      const oldest = await prisma.userSearch.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'asc' },
        take: count - MAX_RECENT_SEARCHES,
        select: { id: true },
      });
      await prisma.userSearch.deleteMany({
        where: { id: { in: oldest.map((o) => o.id) } },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[RecentSearches] POST error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE /api/user/recent-searches — Remove a specific search or clear all
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query')?.trim();

    if (query) {
      // Remove a specific search
      await prisma.userSearch.deleteMany({
        where: { userId: session.user.id, query },
      });
    } else {
      // Clear all recent searches
      await prisma.userSearch.deleteMany({
        where: { userId: session.user.id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[RecentSearches] DELETE error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
