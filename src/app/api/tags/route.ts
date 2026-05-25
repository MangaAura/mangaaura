import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type');
  const parentId = searchParams.get('parentId');
  const includeChildren = searchParams.get('includeChildren') === 'true';

  const where: any = {
    isActive: true,
  };

  if (type) {
    where.type = type;
  }

  if (parentId === 'null') {
    where.parentId = null;
  } else if (parentId) {
    where.parentId = parentId;
  }

  const tags = await prisma.tag.findMany({
    where,
    include: includeChildren ? {
      children: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
      },
    } : undefined,
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
  });

  return NextResponse.json({ tags });
}

export async function POST(request: NextRequest) {
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

  try {
    const body = await request.json();
    const { name, description, type, parentId, color, order } = body;

    if (!name) {
      return NextResponse.json({ error: 'name es requerido' }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const existingTag = await prisma.tag.findFirst({
      where: {
        OR: [
          { name },
          { slug },
        ],
      },
    });

    if (existingTag) {
      return NextResponse.json(
        { error: 'Ya existe un tag con ese nombre o slug' },
        { status: 409 }
      );
    }

    if (parentId) {
      const parent = await prisma.tag.findUnique({ where: { id: parentId } });
      if (!parent) {
        return NextResponse.json({ error: 'Parent tag no encontrado' }, { status: 400 });
      }
    }

    const tag = await prisma.tag.create({
      data: {
        name,
        slug,
        description,
        type: type || 'TAG',
        parentId: parentId || null,
        color,
        order: order || 0,
      },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error('Error creating tag:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}