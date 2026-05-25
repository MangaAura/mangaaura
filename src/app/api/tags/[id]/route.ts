import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;

  const tag = await prisma.tag.findUnique({
    where: { id },
    include: {
      parent: true,
      children: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!tag) {
    return NextResponse.json({ error: 'Tag no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ tag });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const rlResponse = await withRateLimit(request, session?.user?.id, 'default');
  if (rlResponse) return rlResponse;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== 'ADMIN' && user?.role !== 'MODERATOR') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { name, description, type, parentId, color, order, isActive } = body;

    const existingTag = await prisma.tag.findUnique({ where: { id } });
    if (!existingTag) {
      return NextResponse.json({ error: 'Tag no encontrado' }, { status: 404 });
    }

    if (parentId) {
      if (parentId === id) {
        return NextResponse.json({ error: 'Un tag no puede ser su propio parent' }, { status: 400 });
      }
      const parent = await prisma.tag.findUnique({ where: { id: parentId } });
      if (!parent) {
        return NextResponse.json({ error: 'Parent tag no encontrado' }, { status: 400 });
      }
    }

    const updateData: any = {
      description,
      color,
      order,
      isActive,
    };

    if (name && name !== existingTag.name) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const slugExists = await prisma.tag.findFirst({
        where: { slug, id: { not: id } },
      });

      if (slugExists) {
        return NextResponse.json({ error: 'Ya existe un tag con ese nombre' }, { status: 409 });
      }

      updateData.name = name;
      updateData.slug = slug;
    }

    if (type) updateData.type = type;
    if (parentId !== undefined) updateData.parentId = parentId || null;

    const tag = await prisma.tag.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ tag });
  } catch (error) {
    console.error('Error updating tag:', error);
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

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== 'ADMIN' && user?.role !== 'MODERATOR') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const tag = await prisma.tag.findUnique({
      where: { id },
      include: { children: true, mangaTags: true },
    });

    if (!tag) {
      return NextResponse.json({ error: 'Tag no encontrado' }, { status: 404 });
    }

    if (tag.children.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un tag que tiene hijos. Elimina los hijos primero.' },
        { status: 400 }
      );
    }

    if (tag.mangaTags.length > 0) {
      await prisma.mangaTag.deleteMany({ where: { tagId: id } });
    }

    await prisma.tag.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}