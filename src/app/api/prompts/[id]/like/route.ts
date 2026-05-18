/**
 * POST /api/prompts/[id]/like
 *
 * API para dar/quitar like a un prompt
 */

import { NextRequest, NextResponse } from 'next/server';

import { PromptLibraryModel } from '@/infrastructure/persistence/mongodb/models/PromptLibrary';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import { withRateLimit } from '@/lib/rate-limit-middleware';

// POST /api/prompts/[id]/like - Dar/quitar like
export async function POST(
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
        { error: 'No autorizado. Inicia sesión para dar like.' },
        { status: 401 }
      );
    }

    const rlResponse = await withRateLimit(request, session?.user?.id, 'default');
    if (rlResponse) return rlResponse;

    const userId = session.user.id;

    await dbConnect();

    // Buscar el prompt
    const prompt = await PromptLibraryModel.findById(id);

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si ya le dio like
    const hasLiked = prompt.likedBy.includes(userId);

    if (hasLiked) {
      // Quitar like
      prompt.likedBy = prompt.likedBy.filter((id: string) => id !== userId);
      prompt.likes = prompt.likedBy.length;
      await prompt.save();

      return NextResponse.json({
        success: true,
        liked: false,
        likes: prompt.likes,
        message: 'Like removido',
      });
    } else {
      // Agregar like
      prompt.likedBy.push(userId);
      prompt.likes = prompt.likedBy.length;
      await prompt.save();

      return NextResponse.json({
        success: true,
        liked: true,
        likes: prompt.likes,
        message: 'Like agregado',
      });
    }
  } catch (error) {
    console.error('Error toggling prompt like:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET /api/prompts/[id]/like - Verificar si el usuario dio like
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

    const hasLiked = session?.user?.id
      ? prompt.likedBy.includes(session.user.id)
      : false;

    return NextResponse.json({
      success: true,
      liked: hasLiked,
      likes: prompt.likes,
    });
  } catch (error) {
    console.error('Error checking prompt like:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
