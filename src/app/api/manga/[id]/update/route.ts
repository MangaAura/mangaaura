import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

const updateMangaSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  coverUrl: z.string().url().optional(),
  status: z.enum(['ONGOING', 'COMPLETED', 'HIATUS', 'CANCELLED']).optional(),
  tags: z.string().optional(),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rlResult = await rateLimit(getRateLimitKey('update-manga', `${session.user.id}:${ip}`), 10, 60);
    if (!rlResult.allowed) return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 });

    const manga = await prisma.mangaSeries.findUnique({ where: { id }, select: { authorId: true } });
    if (!manga) return NextResponse.json({ error: 'Manga no encontrado' }, { status: 404 });
    if (manga.authorId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No tienes permiso para editar este manga' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateMangaSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });

    const updated = await prisma.mangaSeries.update({ where: { id }, data: parsed.data });

    return NextResponse.json({ success: true, manga: updated });
  } catch (error) {
    console.error('Error updating manga:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rlResult = await rateLimit(getRateLimitKey('delete-manga', `${session.user.id}:${ip}`), 3, 3600);
    if (!rlResult.allowed) return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 });

    const manga = await prisma.mangaSeries.findUnique({ where: { id }, select: { authorId: true, title: true, deletedAt: true } });
    if (!manga) return NextResponse.json({ error: 'Manga no encontrado' }, { status: 404 });
    if (manga.deletedAt) return NextResponse.json({ error: 'El manga ya está en la papelera' }, { status: 400 });
    if (manga.authorId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No tienes permiso para eliminar este manga' }, { status: 403 });
    }

    await prisma.mangaSeries.update({ where: { id }, data: { deletedAt: new Date() } });

    return NextResponse.json({ success: true, message: `"${manga.title}" enviado a la papelera` });
  } catch (error) {
    console.error('Error deleting manga:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
