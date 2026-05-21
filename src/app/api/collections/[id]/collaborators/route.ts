import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  getCollectionCollaborators,
  addCollectionCollaborator,
  removeCollectionCollaborator,
} from '@/core/services/CollectionService';
import { auth } from '@/lib/auth';
import { withRateLimit } from '@/lib/rate-limit-middleware';

const addSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['EDITOR', 'VIEWER']).default('EDITOR'),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const result = await getCollectionCollaborators({
      collectionId: id,
      userId: session.user.id,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ collaborators: result.collaborators });
  } catch (error) {
    console.error('Error fetching collaborators:', error);
    return NextResponse.json(
      { error: 'Error al cargar colaboradores' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const rlResponse = await withRateLimit(request, session.user.id, 'default');
    if (rlResponse) return rlResponse;

    const body = await request.json();
    const parsed = addSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const result = await addCollectionCollaborator({
      collectionId: id,
      userId: session.user.id,
      collaboratorUserId: parsed.data.userId,
      role: parsed.data.role,
    });

    if (!result.success) {
      const status = result.error?.includes('no encontrada') ? 404 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error adding collaborator:', error);
    return NextResponse.json(
      { error: 'Error al agregar colaborador' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const rlResponse = await withRateLimit(request, session.user.id, 'default');
    if (rlResponse) return rlResponse;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Se requiere userId' },
        { status: 400 }
      );
    }

    const result = await removeCollectionCollaborator({
      collectionId: id,
      userId: session.user.id,
      collaboratorUserId: userId,
    });

    if (!result.success) {
      const status = result.error?.includes('no encontrada') ? 404 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing collaborator:', error);
    return NextResponse.json(
      { error: 'Error al eliminar colaborador' },
      { status: 500 }
    );
  }
}
