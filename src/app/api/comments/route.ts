import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import dbConnect from '@/lib/mongoose';
import { CommentModel } from '@/infrastructure/persistence/mongodb/models/Comment';
import { XP } from '@/core/value-objects/XP';
import { getEventBus } from '@/infrastructure/queue/LocalEventBus';
import { z } from 'zod';

const createCommentSchema = z.object({
  chapterId: z.string().uuid(),
  content: z.string().min(1).max(2000),
  parentId: z.string().uuid().optional(),
});

// POST /api/comments - Crear comentario
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = createCommentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { chapterId, content, parentId } = result.data;

    // Verificar que capítulo existe
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { id: true, mangaId: true },
    });

    if (!chapter) {
      return NextResponse.json(
        { error: 'Capítulo no encontrado' },
        { status: 404 }
      );
    }

    // Conectar a MongoDB
    await dbConnect();

    // Análisis IA (usar InMemory para desarrollo)
    const { InMemoryAIProvider } = await import('@/infrastructure/ai/InMemoryAIProvider');
    const aiProvider = new InMemoryAIProvider();
    const analysis = await aiProvider.analyzeComment(content);

    // Determinar si ocultar por spoiler
    const isHidden = analysis.spoilerScore > 70;

    // Crear comentario en MongoDB
    const comment = await CommentModel.create({
      chapterId,
      userId: session.user.id,
      parentId: parentId || undefined,
      content,
      aiAnalysis: {
        spoilerScore: analysis.spoilerScore,
        sentiment: analysis.sentiment,
        toxicity: analysis.toxicity,
        categories: analysis.categories,
        analyzedAt: new Date(),
      },
      isHidden,
      hiddenReason: isHidden ? 'Possible spoiler detected' : undefined,
      moderatedBy: isHidden ? 'ai' : undefined,
      likes: 0,
      replies: 0,
      likedBy: [],
    });

    // Agregar XP al usuario (solo si no está oculto y no es tóxico)
    let xpEarned = 0;
    if (!isHidden && analysis.toxicity < 50) {
      xpEarned = 5;

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { xpPoints: true, level: true },
      });

      if (user) {
        const currentXP = XP.create(user.xpPoints);
        const newXP = currentXP.add(XP.create(xpEarned));

        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            xpPoints: newXP.amount,
            level: newXP.level,
          },
        });
      }
    }

    // Emitir evento
    const eventBus = getEventBus();
    await eventBus.publish({
      id: crypto.randomUUID(),
      type: 'COMMENT_POSTED',
      payload: {
        userId: session.user.id,
        chapterId,
        commentId: comment._id.toString(),
        xpEarned,
        isHidden,
      },
      occurredAt: new Date(),
    });

    // Si es reply, incrementar contador del parent
    if (parentId) {
      await CommentModel.findByIdAndUpdate(parentId, {
        $inc: { replies: 1 },
      });
    }

    return NextResponse.json({
      success: true,
      comment: {
        id: comment._id.toString(),
        chapterId: comment.chapterId,
        userId: comment.userId,
        content: comment.content,
        aiAnalysis: comment.aiAnalysis,
        isHidden: comment.isHidden,
        createdAt: comment.createdAt,
      },
      xpEarned,
      warning: isHidden ? 'Tu comentario fue marcado como posible spoiler' : undefined,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creando comentario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET /api/comments?chapterId=xxx - Obtener comentarios
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get('chapterId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!chapterId) {
      return NextResponse.json(
        { error: 'chapterId es requerido' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Obtener comentarios con paginación
    const comments = await CommentModel.find({
      chapterId,
      parentId: { $exists: false }, // Solo comentarios raíz
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

    // Contar total
    const total = await CommentModel.countDocuments({
      chapterId,
      parentId: { $exists: false },
    });

    // Obtener info de usuarios desde PostgreSQL
    const userIds = [...new Set(comments.map((c) => c.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, avatarUrl: true, level: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const enrichedComments = comments.map((comment) => {
      const user = userMap.get(comment.userId);
      return {
        id: comment._id.toString(),
        chapterId: comment.chapterId,
        user: user
          ? {
              id: user.id,
              username: user.username,
              avatarUrl: user.avatarUrl,
              level: user.level,
            }
          : { id: comment.userId, username: 'Usuario', level: 1 },
        content: comment.content,
        aiAnalysis: comment.aiAnalysis,
        isHidden: comment.isHidden,
        likes: comment.likes,
        replies: comment.replies,
        createdAt: comment.createdAt,
      };
    });

    return NextResponse.json({
      comments: enrichedComments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error obteniendo comentarios:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
