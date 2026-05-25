import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const rlResponse = await withRateLimit(request, session?.user?.id, 'default');
  if (rlResponse) return rlResponse;

  const { id } = await params;

  const bookmark = await prisma.bookmark.findUnique({
    where: { id },
    select: { userId: true, isPublic: true },
  });

  if (!bookmark) {
    return NextResponse.json({ error: 'Marcador no encontrado' }, { status: 404 });
  }

  if (bookmark.userId !== session.user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { isPublic } = body;

    if (typeof isPublic !== 'boolean') {
      return NextResponse.json({ error: 'isPublic debe ser un booleano' }, { status: 400 });
    }

    const updated = await prisma.bookmark.update({
      where: { id },
      data: { isPublic },
    });

    return NextResponse.json({ bookmark: updated });
  } catch (error) {
    console.error('Error updating bookmark:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const rlResponse = await withRateLimit(request, session?.user?.id, 'default');
  if (rlResponse) return rlResponse;

  const { id } = await params;

  const bookmark = await prisma.bookmark.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!bookmark) {
    return NextResponse.json({ error: 'Marcador no encontrado' }, { status: 404 });
  }

  if (bookmark.userId !== session.user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  await prisma.bookmark.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
