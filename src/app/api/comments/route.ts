import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { PostCommentUseCase } from '@/application/use-cases/PostCommentUseCase';
import { AchievementServiceAdapter } from '@/infrastructure/adapters/AchievementServiceAdapter';
import { CommentRepositoryAdapter } from '@/infrastructure/adapters/CommentRepositoryAdapter';
import { EventBusAdapter } from '@/infrastructure/adapters/EventBusAdapter';
import { UserXPRepositoryAdapter } from '@/infrastructure/adapters/UserXPRepositoryAdapter';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { moderateComment, quickFilterSpam } from '@/services/ModerationService';

const postCommentUseCase = new PostCommentUseCase(
  new CommentRepositoryAdapter(),
  new UserXPRepositoryAdapter(),
  new EventBusAdapter(),
  {
    analyzeComment: async (content: string) => {
      const result = await moderateComment(content);
      return {
        spoilerScore: result.spoilerScore,
        sentiment: result.sentiment,
        toxicity: result.toxicity,
        categories: result.categories,
        summary: result.reason,
      };
    },
    detectSpoiler: async (content: string) => {
      const result = await moderateComment(content);
      return result.spoilerScore;
    },
    generateEmbedding: async () => [],
    calculateSimilarity: () => 0,
    summarizeChapter: async () => ({ title: '', hook: '', keyEvents: [], emotionalTone: '' }),
    generateNotificationHook: async () => '',
    classifyGenre: async () => [],
    classifyQuality: async () => ({ score: 0, issues: [], overallQuality: 'fair' }),
  },
  new AchievementServiceAdapter()
);

const createCommentSchema = z.object({
  chapterId: z.string().uuid(),
  content: z.string().min(1).max(2000),
  parentId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const identifier = session.user.id || ip;
    const rlResult = await rateLimit(getRateLimitKey('comments', identifier), 10, 60);
    if (!rlResult.allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' }, {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rlResult.resetAt - Date.now()) / 1000)) },
      });
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

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { id: true, mangaId: true },
    });
    if (!chapter) {
      return NextResponse.json({ error: 'Capítulo no encontrado' }, { status: 404 });
    }

    if (quickFilterSpam(content)) {
      return NextResponse.json({ error: 'Contenido bloqueado por spam' }, { status: 400 });
    }

    const moderation = await moderateComment(content, {
      userId: session.user.id,
      isReply: !!parentId,
    });

    if (moderation.toxicity >= 80) {
      return NextResponse.json(
        { error: 'Contenido bloqueado por toxicidad', reason: moderation.reason },
        { status: 400 }
      );
    }

    const output = await postCommentUseCase.execute({
      userId: session.user.id,
      chapterId,
      content,
      parentId,
      aiAnalysis: {
        spoilerScore: moderation.spoilerScore,
        sentiment: moderation.sentiment,
        toxicity: moderation.toxicity,
        categories: moderation.categories,
        analyzedAt: new Date(),
      },
      requiresReview: moderation.requiresReview,
      isHidden: moderation.isHidden,
      hiddenReason: moderation.isHidden ? (moderation.reason || 'Contenido moderado por IA') : undefined,
      moderatedBy: moderation.isHidden ? 'ai' : undefined,
    });

    return NextResponse.json({
      success: true,
      comment: {
        id: output.id,
        chapterId: output.chapterId,
        userId: output.userId,
        content: output.content,
        aiAnalysis: output.aiAnalysis,
        isHidden: output.isHidden,
        createdAt: output.createdAt,
      },
      xpEarned: output.xpGained,
      warning: output.isHidden ? (output.hiddenReason || 'Tu comentario fue moderado por IA') : undefined,
    }, { status: 201 });
  } catch (error) {
    // console.error('Error creando comentario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const identifier = session.user.id || ip;
    const rlResult = await rateLimit(getRateLimitKey('comments', identifier), 10, 60);
    if (!rlResult.allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' }, {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rlResult.resetAt - Date.now()) / 1000)) },
      });
    }

    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get('chapterId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!chapterId) {
      return NextResponse.json({ error: 'chapterId es requerido' }, { status: 400 });
    }

    await dbConnect();

    const { CommentModel } = await import('@/infrastructure/persistence/mongodb/models/Comment');

    const comments = await CommentModel.find({
      chapterId,
      parentId: { $exists: false },
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

    const total = await CommentModel.countDocuments({
      chapterId,
      parentId: { $exists: false },
    });

    const userIds = [...new Set(comments.map((c: any) => c.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, avatarUrl: true, level: true },
    });

    const userMap = new Map(users.map((u: any) => [u.id, u]));

    const enrichedComments = comments.map((comment: any) => {
      const user = userMap.get(comment.userId);
      return {
        id: comment._id.toString(),
        chapterId: comment.chapterId,
        user: user
          ? { id: user.id, username: user.username, avatarUrl: user.avatarUrl, level: user.level }
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
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    // console.error('Error obteniendo comentarios:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
