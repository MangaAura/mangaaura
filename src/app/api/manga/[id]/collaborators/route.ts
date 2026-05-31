import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const addSchema = z.object({
  userId: z.string(),
  role: z.enum(['EDITOR', 'ARTIST', 'TRANSLATOR', 'PROOFREADER']),
});

const updateSchema = z.object({
  role: z.enum(['EDITOR', 'ARTIST', 'TRANSLATOR', 'PROOFREADER']),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: mangaId } = await params;

    const collaborators = await prisma.mangaCollaborator.findMany({
      where: { mangaId },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true, displayName: true } },
      },
      orderBy: { invitedAt: 'desc' },
    });

    return NextResponse.json({ collaborators });
  } catch (error) {
    console.error('[Collaborators GET] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: mangaId } = await params;

    const manga = await prisma.mangaSeries.findUnique({
      where: { id: mangaId },
      select: { authorId: true },
    });

    if (!manga || manga.authorId !== session.user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const result = addSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const { userId, role } = result.data;

    if (userId === session.user.id) {
      return NextResponse.json({ error: 'No puedes agregarte como colaborador' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const existing = await prisma.mangaCollaborator.findUnique({
      where: { mangaId_userId: { mangaId, userId } },
    });

    if (existing) {
      return NextResponse.json({ error: 'Este usuario ya es colaborador' }, { status: 409 });
    }

    const collaborator = await prisma.mangaCollaborator.create({
      data: { mangaId, userId, role },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true, displayName: true } },
      },
    });

    return NextResponse.json({ collaborator }, { status: 201 });
  } catch (error) {
    console.error('[Collaborators POST] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: mangaId } = await params;

    const manga = await prisma.mangaSeries.findUnique({
      where: { id: mangaId },
      select: { authorId: true },
    });

    if (!manga || manga.authorId !== session.user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const result = updateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const { role } = result.data;
    const { searchParams } = new URL(request.url);
    const collaboratorId = searchParams.get('id');

    if (!collaboratorId) {
      return NextResponse.json({ error: 'id requerido' }, { status: 400 });
    }

    const collaborator = await prisma.mangaCollaborator.update({
      where: { id: collaboratorId },
      data: { role },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true, displayName: true } },
      },
    });

    return NextResponse.json({ collaborator });
  } catch (error) {
    console.error('[Collaborators PUT] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: mangaId } = await params;

    const manga = await prisma.mangaSeries.findUnique({
      where: { id: mangaId },
      select: { authorId: true },
    });

    if (!manga || manga.authorId !== session.user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const collaboratorId = searchParams.get('id');

    if (!collaboratorId) {
      return NextResponse.json({ error: 'id requerido' }, { status: 400 });
    }

    await prisma.mangaCollaborator.delete({
      where: { id: collaboratorId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Collaborators DELETE] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
