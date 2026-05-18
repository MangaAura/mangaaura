/**
 * API Routes for Prompt Library
 *
 * GET /api/prompts - Listar prompts públicos
 * POST /api/prompts - Crear nuevo prompt
 * PATCH /api/prompts/[id] - Actualizar prompt
 * DELETE /api/prompts/[id] - Eliminar prompt
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { PromptLibraryModel } from '@/infrastructure/persistence/mongodb/models/PromptLibrary';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import { withRateLimit } from '@/lib/rate-limit-middleware';

// Schemas
const createPromptSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  prompt: z.string().min(1, 'El prompt es requerido').max(2000),
  style: z.string().max(50).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  isPublic: z.boolean().default(true),
  chapterId: z.string().optional(),
  mangaId: z.string().optional(),
  model: z.string().optional(),
  negativePrompt: z.string().max(1000).optional(),
  seed: z.number().optional(),
  cfgScale: z.number().min(1).max(30).optional(),
});

const updatePromptSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  prompt: z.string().min(1).max(2000).optional(),
  style: z.string().max(50).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  isPublic: z.boolean().optional(),
  negativePrompt: z.string().max(1000).optional(),
  seed: z.number().optional(),
  cfgScale: z.number().min(1).max(30).optional(),
});

// GET /api/prompts - Listar prompts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query params
    const query = {
      authorId: searchParams.get('authorId') || undefined,
      mangaId: searchParams.get('mangaId') || undefined,
      chapterId: searchParams.get('chapterId') || undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean) || undefined,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
      myPrompts: searchParams.get('myPrompts') === 'true',
    };

    const session = await auth();
    await dbConnect();

    // Build query
    const mongoQuery: any = {};

    if (query.myPrompts && session?.user?.id) {
      mongoQuery.authorId = session.user.id;
    } else if (query.authorId) {
      mongoQuery.authorId = query.authorId;
    } else {
      // Solo mostrar prompts públicos
      mongoQuery.isPublic = true;
    }

    if (query.mangaId) mongoQuery.mangaId = query.mangaId;
    if (query.chapterId) mongoQuery.chapterId = query.chapterId;
    if (query.tags && query.tags.length > 0) {
      mongoQuery.tags = { $in: query.tags };
    }
    if (query.search) {
      mongoQuery.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { prompt: { $regex: query.search, $options: 'i' } },
      ];
    }

    // Build sort
    const sort: any = {};
    sort[query.sortBy] = query.sortOrder === 'asc' ? 1 : -1;

    // Ejecutar queries
    const [prompts, total] = await Promise.all([
      PromptLibraryModel.find(mongoQuery)
        .sort(sort)
        .skip(query.offset)
        .limit(query.limit)
        .lean(),
      PromptLibraryModel.countDocuments(mongoQuery),
    ]);

    return NextResponse.json({
      success: true,
      prompts: prompts.map((p) => ({
        id: p._id.toString(),
        authorId: p.authorId,
        name: p.name,
        prompt: p.prompt,
        style: p.style,
        tags: p.tags,
        isPublic: p.isPublic,
        likes: p.likes,
        views: p.views,
        forks: p.forks,
        chapterId: p.chapterId,
        mangaId: p.mangaId,
        model: p.model,
        negativePrompt: p.negativePrompt,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        hasLiked: session?.user?.id ? p.likedBy.includes(session.user.id) : false,
      })),
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
        hasMore: query.offset + query.limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching prompts:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/prompts - Crear prompt
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const rlResponse = await withRateLimit(request, session?.user?.id, 'default');
    if (rlResponse) return rlResponse;

    const body = await request.json();
    const result = createPromptSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.flatten() },
        { status: 400 }
      );
    }

    await dbConnect();

    const prompt = await PromptLibraryModel.create({
      ...result.data,
      authorId: session.user.id,
      likes: 0,
      likedBy: [],
      views: 0,
      forks: 0,
      forkedBy: [],
    });

    return NextResponse.json(
      {
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
          views: prompt.views,
          forks: prompt.forks,
          createdAt: prompt.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating prompt:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PATCH /api/prompts - Actualizar prompt (requiere id en body)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere el id del prompt' },
        { status: 400 }
      );
    }

    const result = updatePromptSchema.safeParse(updateData);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.flatten() },
        { status: 400 }
      );
    }

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

    // Actualizar
    const updatedPrompt = await PromptLibraryModel.findByIdAndUpdate(
      id,
      { $set: result.data },
      { new: true }
    ).lean();

    return NextResponse.json({
      success: true,
      prompt: {
        id: updatedPrompt!._id.toString(),
        ...updatedPrompt,
        _id: undefined,
        __v: undefined,
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

// DELETE /api/prompts - Eliminar prompt (requiere id en body)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere el id del prompt' },
        { status: 400 }
      );
    }

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
