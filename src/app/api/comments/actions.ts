'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PostCommentUseCase } from '@/application/use-cases/PostCommentUseCase';
import { CommentRepositoryAdapter } from '@/infrastructure/adapters/CommentRepositoryAdapter';
import { UserXPRepositoryAdapter } from '@/infrastructure/adapters/UserXPRepositoryAdapter';
import { EventBusAdapter } from '@/infrastructure/adapters/EventBusAdapter';
import { AchievementServiceAdapter } from '@/infrastructure/adapters/AchievementServiceAdapter';
import { moderateComment, quickFilterSpam } from '@/services/ModerationService';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { z } from 'zod';

const postCommentUseCase = new PostCommentUseCase(
  new CommentRepositoryAdapter(),
  new UserXPRepositoryAdapter(),
  new EventBusAdapter(),
  {
    analyzeComment: async (content: string) => {
      const result = await moderateComment(content);
      return { spoilerScore: result.spoilerScore, sentiment: result.sentiment, toxicity: result.toxicity, categories: result.categories, summary: result.reason };
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

export async function createComment(_prevState: unknown, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'No autorizado' };
    }

    const identifier = session.user.id;
    const rlResult = await rateLimit(getRateLimitKey('comments', identifier), 10, 60);
    if (!rlResult.allowed) {
      return { error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' };
    }

    const parsed = createCommentSchema.safeParse({
      content: formData.get('content'),
      chapterId: formData.get('chapterId'),
      parentId: formData.get('parentId') || undefined,
    });

    if (!parsed.success) {
      return { error: 'Datos inválidos', fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const { chapterId, content, parentId } = parsed.data;

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { id: true, mangaId: true },
    });
    if (!chapter) {
      return { error: 'Capítulo no encontrado' };
    }

    if (quickFilterSpam(content)) {
      return { error: 'Contenido bloqueado por spam' };
    }

    const moderation = await moderateComment(content, {
      userId: session.user.id,
      isReply: !!parentId,
    });

    if (moderation.toxicity >= 80) {
      return { error: 'Contenido bloqueado por toxicidad', reason: moderation.reason };
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

    const mangaSlug = formData.get('mangaSlug') as string;
    if (mangaSlug) revalidatePath(`/manga/${mangaSlug}`);

    return {
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
    };
  } catch (error) {
    return { error: 'Error interno del servidor' };
  }
}
