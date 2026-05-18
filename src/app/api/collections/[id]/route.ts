import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { DeleteCollectionUseCase } from '@/application/use-cases/collections/DeleteCollectionUseCase';
import { GetCollectionUseCase } from '@/application/use-cases/collections/GetCollectionUseCase';
import { UpdateCollectionUseCase } from '@/application/use-cases/collections/UpdateCollectionUseCase';
import { auth } from '@/lib/auth';
import { withRateLimit } from '@/lib/rate-limit-middleware';

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
});

const getCollectionUseCase = new GetCollectionUseCase();
const updateCollectionUseCase = new UpdateCollectionUseCase();
const deleteCollectionUseCase = new DeleteCollectionUseCase();

// GET /api/collections/[id] - Get collection details
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    const collection = await getCollectionUseCase.execute({
      collectionId: id,
      userId: session?.user?.id,
    });

    return NextResponse.json({
      collection: {
        id: collection.id,
        name: collection.title,
        description: collection.description,
        coverUrl: collection.coverUrl,
        isPublic: collection.isPublic,
        likesCount: collection.likesCount,
        user: collection.user,
        _count: { mangas: collection.itemCount },
        mangas: collection.items.map((item) => ({
          id: item.mangaId,
          title: item.title,
          cover: item.coverUrl,
          slug: item.slug,
          authorName: item.authorName,
          addedAt: undefined,
        })),
      },
    });
  } catch (error: any) {
    if (error?.code === 'SERVICE_ERROR') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    console.error('Error fetching collection:', error);
    return NextResponse.json(
      { error: 'Error al cargar colección' },
      { status: 500 }
    );
  }
}

// PATCH /api/collections/[id] - Update collection
export async function PATCH(
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
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { name, description, isPublic } = parsed.data;

    const collection = await updateCollectionUseCase.execute({
      collectionId: id,
      userId: session.user.id,
      name,
      description,
      isPublic,
    });

    return NextResponse.json({
      collection: {
        id: collection.id,
        name: collection.title,
        description: collection.description,
        isPublic: collection.isPublic,
        _count: { mangas: collection.itemCount },
      },
    });
  } catch (error: any) {
    if (error?.code === 'SERVICE_ERROR') {
      const status = error.message.includes('no encontrada') ? 404 : 403;
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error('Error updating collection:', error);
    return NextResponse.json(
      { error: 'Error al actualizar colección' },
      { status: 500 }
    );
  }
}

// DELETE /api/collections/[id] - Delete collection
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

    await deleteCollectionUseCase.execute({
      collectionId: id,
      userId: session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === 'SERVICE_ERROR') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    console.error('Error deleting collection:', error);
    return NextResponse.json(
      { error: 'Error al eliminar colección' },
      { status: 500 }
    );
  }
}
