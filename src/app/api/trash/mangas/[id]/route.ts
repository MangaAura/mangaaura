import { NextRequest, NextResponse } from 'next/server';

import { invalidateCache } from '@/lib/apiCache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const manga = await prisma.mangaSeries.findUnique({
      where: { id },
      select: { authorId: true, title: true, deletedAt: true },
    });

    if (!manga) {
      return NextResponse.json({ error: 'Manga no encontrado' }, { status: 404 });
    }

    if (!manga.deletedAt) {
      return NextResponse.json({ error: 'El manga no está en la papelera. Usa eliminar primero.' }, { status: 400 });
    }

    if (manga.authorId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No tienes permiso para eliminar este manga permanentemente' }, { status: 403 });
    }

    await prisma.$transaction([
      prisma.chapter.deleteMany({ where: { mangaId: id } }),
      prisma.mangaSeries.delete({ where: { id } }),
    ]);

    await invalidateCache(`manga:${id}`);
    await invalidateCache('manga:list');
    await invalidateCache('user:mangas:list');

    return NextResponse.json({
      message: `Manga "${manga.title}" eliminado permanentemente`,
      deleted: true,
    });
  } catch (error) {
    console.error('Error eliminando manga permanentemente:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
