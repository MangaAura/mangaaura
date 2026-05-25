import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ mangaId: string; tagId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const rlResponse = await withRateLimit(request, session?.user?.id, 'default');
  if (rlResponse) return rlResponse;

  const { mangaId, tagId } = await params;

  const manga = await prisma.mangaSeries.findUnique({
    where: { id: mangaId },
    select: { authorId: true },
  });

  if (!manga) {
    return NextResponse.json({ error: 'Manga no encontrado' }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (manga.authorId !== session.user.id && user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  await prisma.mangaTag.delete({
    where: {
      mangaId_tagId: {
        mangaId,
        tagId,
      },
    },
  });

  return NextResponse.json({ success: true });
}