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

    // Try to find in DeletedMangaBundle first
    const bundle = await prisma.deletedMangaBundle.findUnique({
      where: { id },
      select: { authorId: true, title: true },
    });

    if (bundle) {
      // Normal case: permanently delete from bundle
      if (bundle.authorId !== session.user.id && session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'No tienes permiso para eliminar este manga permanentemente' }, { status: 403 });
      }

      await prisma.deletedMangaBundle.delete({ where: { id } });

      await invalidateCache(`manga:${id}`);
      await invalidateCache('manga:list');
      await invalidateCache('user:mangas:list');

      return NextResponse.json({
        message: `Manga "${bundle.title}" eliminado permanentemente`,
        deleted: true,
      });
    }

    // Check if manga is soft-deleted (in MangaSeries with deletedAt)
    const softDeletedManga = await prisma.mangaSeries.findUnique({
      where: { id },
      select: { authorId: true, title: true, deletedAt: true },
    });

    if (softDeletedManga?.deletedAt) {
      // Permanently delete soft-deleted manga from MangaSeries
      if (softDeletedManga.authorId !== session.user.id && session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'No tienes permiso para eliminar este manga permanentemente' }, { status: 403 });
      }

      await prisma.mangaSeries.delete({ where: { id } });

      await invalidateCache(`manga:${id}`);
      await invalidateCache('manga:list');
      await invalidateCache('user:mangas:list');

      return NextResponse.json({
        message: `Manga "${softDeletedManga.title}" eliminado permanentemente`,
        deleted: true,
      });
    }

    return NextResponse.json({ error: 'Manga no encontrado en la papelera' }, { status: 404 });
  } catch (error) {
    console.error('Error eliminando manga permanentemente:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
