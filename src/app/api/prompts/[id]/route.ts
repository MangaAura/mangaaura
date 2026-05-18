/**
 * GET /api/prompts/[id]
 * DELETE /api/prompts/[id]
 *
 * API para obtener y eliminar un prompt específico
 */

import { NextRequest, NextResponse } from 'next/server';

import { PromptLibraryModel } from '@/infrastructure/persistence/mongodb/models/PromptLibrary';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import { withRateLimit } from '@/lib/rate-limit-middleware';

// GET /api/prompts/[id] - Obtener un prompt
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere el id del prompt' },
        { status: 400 }
      );
    }

    const session = await auth();
    await dbConnect();

    const prompt = await PromptLibraryModel.findById(id).lean();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt no encontrado' },
        { status: 404 }
      );
    }

    // Si no es público, solo el autor puede verlo
    if (!prompt.isPublic && prompt.authorId !== session?.user?.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para ver este prompt' },
        { status: 403 }
      );
    }

    // Incrementar views
    await PromptLibraryModel.findByIdAndUpdate(id, { $inc: { views: 1 } });

    return NextResponse.json({
      success: true,
      prompt: {
        id: prompt._id.toString(),
        authorId: prompt.authorId,
        name: prompt.name,
        prompt: prompt.prompt,
        style: prompt.style,
        tags: prompt.tags,
        isPublic: prompt.isPublic,
        likes: prompt.likes,
        views: prompt.views + 1,
        forks: prompt.forks,
        chapterId: prompt.chapterId,
        mangaId: prompt.mangaId,
        model: prompt.model,
        negativePrompt: prompt.negativePrompt,
        seed: prompt.seed,
        cfgScale: prompt.cfgScale,
        createdAt: prompt.createdAt,
        updatedAt: prompt.updatedAt,
        hasLiked: session?.user?.id ? prompt.likedBy.includes(session.user.id) : false,
      },
    });
  } catch (error) {
    console.error('Error fetching prompt:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/prompts/[id] - Eliminar un prompt
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere el id del prompt' },
        { status: 400 }
      );
    }

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const rlResponse = await withRateLimit(_request, session?.user?.id, 'default');
    if (rlResponse) return rlResponse;

    await dbConnect();

    // Verificar que el prompt existe y pertenece al usuario
    const prompt = await PromptLibraryModel.findById(id);
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt no encontrado' },
        { status: 404 }
      );
    }

    if (prompt.authorId !== session.user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar este prompt' },
        { status: 403 }
      );
    }

    await PromptLibraryModel.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Prompt eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error deleting prompt:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PATCH /api/prompts/[id] - Actualizar un prompt
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere el id del prompt' },
        { status: 400 }
      );
    }

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const rlResponse = await withRateLimit(request, session?.user?.id, 'default');
    if (rlResponse) return rlResponse;

    await dbConnect();

    // Verificar que el prompt existe y pertenece al usuario
    const prompt = await PromptLibraryModel.findById(id);
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt no encontrado' },
        { status: 404 }
      );
    }

    if (prompt.authorId !== session.user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para editar este prompt' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Campos permitidos para actualizar
    const allowedUpdates = [
      'name',
      'prompt',
      'style',
      'tags',
      'isPublic',
      'negativePrompt',
      'seed',
      'cfgScale',
    ];

    const updates: any = {};
    for (const key of allowedUpdates) {
      if (key in body) {
        updates[key] = body[key];
      }
    }

    const updatedPrompt = await PromptLibraryModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    ).lean();

    return NextResponse.json({
      success: true,
      prompt: {
        id: updatedPrompt!._id.toString(),
        authorId: updatedPrompt!.authorId,
        name: updatedPrompt!.name,
        prompt: updatedPrompt!.prompt,
        style: updatedPrompt!.style,
        tags: updatedPrompt!.tags,
        isPublic: updatedPrompt!.isPublic,
        likes: updatedPrompt!.likes,
        views: updatedPrompt!.views,
        forks: updatedPrompt!.forks,
        createdAt: updatedPrompt!.createdAt,
        updatedAt: updatedPrompt!.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating prompt:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
