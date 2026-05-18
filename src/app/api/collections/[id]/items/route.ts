import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { AddItemToCollectionUseCase } from '@/application/use-cases/collections/AddItemToCollectionUseCase';
import { RemoveItemFromCollectionUseCase } from '@/application/use-cases/collections/RemoveItemFromCollectionUseCase';
import { auth } from '@/lib/auth';
import { withRateLimit } from '@/lib/rate-limit-middleware';

const addItemSchema = z.object({
  mangaId: z.string(),
});

const addItemUseCase = new AddItemToCollectionUseCase();
const removeItemUseCase = new RemoveItemFromCollectionUseCase();

// POST /api/collections/[id]/items - Add manga to collection
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
    const parsed = addItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { mangaId } = parsed.data;

    await addItemUseCase.execute({
      collectionId: id,
      userId: session.user.id,
      mangaId,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === 'SERVICE_ERROR') {
      const status = error.message.includes('no encontrado') ? 404 : 409;
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error('Error adding item to collection:', error);
    return NextResponse.json(
      { error: 'Error al agregar manga' },
      { status: 500 }
    );
  }
}

// DELETE /api/collections/[id]/items - Remove manga from collection
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
    const mangaId = searchParams.get('mangaId');

    if (!mangaId) {
      return NextResponse.json(
        { error: 'mangaId requerido' },
        { status: 400 }
      );
    }

    await removeItemUseCase.execute({
      collectionId: id,
      userId: session.user.id,
      mangaId,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === 'SERVICE_ERROR') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    console.error('Error removing item from collection:', error);
    return NextResponse.json(
      { error: 'Error al quitar manga' },
      { status: 500 }
    );
  }
}
