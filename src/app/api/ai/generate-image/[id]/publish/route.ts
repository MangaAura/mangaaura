import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    // Only the owner can publish
    const generation = await prisma.imageGeneration.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true, isPublic: true },
    });

    if (!generation) {
      return NextResponse.json({ error: 'Imagen no encontrada' }, { status: 404 });
    }

    if (!generation.isPublic) {
      // Only COMPLETED images can be published
      const gen = await prisma.imageGeneration.findUnique({
        where: { id },
        select: { status: true },
      });
      if (gen?.status !== 'COMPLETED') {
        return NextResponse.json(
          { error: 'Solo imágenes completadas pueden publicarse' },
          { status: 400 },
        );
      }
    }

    const updated = await prisma.imageGeneration.update({
      where: { id },
      data: { isPublic: !generation.isPublic },
      select: { id: true, isPublic: true },
    });

    return NextResponse.json({ success: true, isPublic: updated.isPublic });
  } catch (error) {
    console.error('[Publish Image] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
