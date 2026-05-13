import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notificationService } from '@/core/services/NotificationService';
import { z } from 'zod';
import { sanitizeText, validateContent } from '@/lib/sanitize';

// Schema para crear comentario
const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  parentId: z.string().uuid().optional(),
});

// Palabras prohibidas básicas para moderación
const FORBIDDEN_WORDS = [
  'spam', 'estafa', 'virus', 'phishing',
  // Agregar más palabras según necesidad
];

// Verificar rate limiting (1 comentario por minuto)
async function checkRateLimit(userId: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - 60000); // 1 minuto atrás

  // Buscar o crear registro de rate limit
  const identifier = `comment:${userId}`;
  let rateLimit = await prisma.rateLimit.findUnique({
    where: { identifier },
  });

  if (!rateLimit) {
    rateLimit = await prisma.rateLimit.create({
      data: {
        identifier,
        count: 1,
        resetAt: new Date(now.getTime() + 60000),
      },
    });
    return { allowed: true };
  }

  // Reiniciar ventana si ha pasado más de 1 minuto
  if (rateLimit.resetAt < now) {
    await prisma.rateLimit.update({
      where: { identifier },
      data: {
        count: 1,
        resetAt: new Date(now.getTime() + 60000),
      },
    });
    return { allowed: true };
  }

  // Verificar si ya comentó en los últimos 60 segundos
  if (rateLimit.count >= 1) {
    const retryAfter = Math.ceil((rateLimit.resetAt.getTime() - now.getTime()) / 1000);
    return { allowed: false, retryAfter: Math.max(retryAfter, 1) };
  }

  // Actualizar última acción
  await prisma.rateLimit.update({
    where: { identifier },
    data: {
      count: { increment: 1 },
    },
  });

  return { allowed: true };
}

// Verificar contenido contra palabras prohibidas
function checkModeration(content: string): { isClean: boolean; flaggedWords: string[] } {
  const lowerContent = content.toLowerCase();
  const flaggedWords = FORBIDDEN_WORDS.filter(word => 
    lowerContent.includes(word.toLowerCase())
  );
  
  return {
    isClean: flaggedWords.length === 0,
    flaggedWords,
  };
}

// Extraer menciones del contenido (@username)
function extractMentions(content: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const mentions = content.match(mentionRegex) || [];
  return mentions.map((m: any) => m.substring(1)); // Remover el @
}

// GET /api/chapters/[id]/comments - Listar comentarios
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chapterId } = await params;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const sortBy = searchParams.get('sortBy') || 'newest';

    // Verificar que el capítulo existe
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { id: true },
    });

    if (!chapter) {
      return NextResponse.json(
        { error: 'Capítulo no encontrado' },
        { status: 404 }
      );
    }

    // Configurar ordenamiento
    const orderBy: Record<string, 'asc' | 'desc'> | Record<string, 'asc' | 'desc'>[] = sortBy === 'oldest'
      ? { createdAt: 'asc' }
      : sortBy === 'popular'
        ? [{ likesCount: 'desc' }, { createdAt: 'desc' }]
        : { createdAt: 'desc' };

    // Obtener comentarios raíz (sin parentId)
    const comments = await prisma.comment.findMany({
      where: {
        chapterId,
        parentId: null,
        isDeleted: false,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            level: true,
          },
        },
        replies: {
          where: { isDeleted: false },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                level: true,
              },
            },
            _count: {
              select: { likes: true },
            },
          },
          orderBy: { createdAt: 'asc' },
          take: 10, // Limitar replies
        },
        _count: {
          select: { 
            replies: { where: { isDeleted: false } },
            likes: true,
          },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    // Contar total de comentarios raíz
    const total = await prisma.comment.count({
      where: {
        chapterId,
        parentId: null,
        isDeleted: false,
      },
    });

    // Obtener likes del usuario actual si está autenticado
    const session = await auth();
    let userLikes: string[] = [];
    
    if (session?.user?.id) {
      const likes = await prisma.commentLike.findMany({
        where: {
          userId: session.user.id,
          commentId: { in: comments.flatMap((c: any) => [c.id, ...c.replies.map((r: any) => r.id)]) },
        },
        select: { commentId: true },
      });
      userLikes = likes.map((l: any) => l.commentId);
    }

    // Transformar respuesta
    const transformedComments = comments.map((comment: any) => ({
      id: comment.id,
      content: comment.isHidden ? '[Contenido oculto por moderación]' : comment.content,
      isHidden: comment.isHidden,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      likesCount: comment._count.likes,
      repliesCount: comment._count.replies,
      isLikedByUser: userLikes.includes(comment.id),
      user: {
        id: comment.user.id,
        username: comment.user.username,
        displayName: comment.user.displayName,
        avatarUrl: comment.user.avatarUrl,
        level: comment.user.level,
      },
      replies: comment.replies.map((reply: any) => ({
        id: reply.id,
        content: reply.isHidden ? '[Contenido oculto por moderación]' : reply.content,
        isHidden: reply.isHidden,
        createdAt: reply.createdAt,
        updatedAt: reply.updatedAt,
        likesCount: reply._count.likes,
        isLikedByUser: userLikes.includes(reply.id),
        user: {
          id: reply.user.id,
          username: reply.user.username,
          displayName: reply.user.displayName,
          avatarUrl: reply.user.avatarUrl,
          level: reply.user.level,
        },
      })),
    }));

    return NextResponse.json({
      comments: transformedComments,
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

// POST /api/chapters/[id]/comments - Crear comentario
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chapterId } = await params;
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

    const { content, parentId } = result.data;

    // Verificar rate limiting
    const rateLimit = await checkRateLimit(session.user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit excedido. Espera antes de comentar.', retryAfter: rateLimit.retryAfter },
        { status: 429 }
      );
    }

    // Verificar que el capítulo existe
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { id: true },
    });

    if (!chapter) {
      return NextResponse.json(
        { error: 'Capítulo no encontrado' },
        { status: 404 }
      );
    }

    // Si es reply, verificar que el comentario padre existe
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { id: true, chapterId: true },
      });

      if (!parentComment || parentComment.chapterId !== chapterId) {
        return NextResponse.json(
          { error: 'Comentario padre no encontrado' },
          { status: 404 }
        );
      }
    }

  // Sanitización y validación de contenido
  const validation = validateContent(content, {
    allowHtml: false,
    maxLength: 2000,
    minLength: 1,
    checkSpam: true,
    checkProfanity: true,
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: 'Contenido inválido', details: validation.errors },
      { status: 400 }
    );
  }

  const sanitizedContent = validation.sanitized;

  // Moderación básica adicional
  const moderation = checkModeration(sanitizedContent);
  if (!moderation.isClean) {
    return NextResponse.json(
      { error: 'Tu comentario contiene palabras no permitidas', flaggedWords: moderation.flaggedWords },
      { status: 400 }
    );
  }

  // Crear comentario con contenido sanitizado
  const comment = await prisma.comment.create({
    data: {
      chapterId,
      userId: session.user.id,
      content: sanitizedContent,
      parentId,
    },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            level: true,
          },
        },
        _count: {
          select: { likes: true, replies: true },
        },
      },
    });

    // Obtener información del manga para notificaciones
    const chapterInfo = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { manga: true },
    });
    const mangaTitle = chapterInfo?.manga?.title;

    // Si es reply, notificar al autor del comentario padre
    if (parentId) {
      try {
        const parentComment = await prisma.comment.findUnique({
          where: { id: parentId },
          include: { user: true },
        });

        if (parentComment && parentComment.userId !== session.user.id) {
          await notificationService.notifyCommentReply(
            parentComment.userId,
            comment,
            comment.user,
            mangaTitle
          );
        }
      } catch (notifyError) {
        console.error('Error sending comment reply notification:', notifyError);
      }
    }

    // Procesar menciones
    const mentions = extractMentions(content);
    if (mentions.length > 0) {
      const mentionedUsers = await prisma.user.findMany({
        where: { username: { in: mentions } },
        select: { id: true, username: true },
      });

      // Crear registros de mención
      await prisma.commentMention.createMany({
        data: mentionedUsers.map((user: any) => ({
          commentId: comment.id,
          mentionedUserId: user.id,
        })),
      });

      // Notificar a usuarios mencionados en paralelo
      const mentionNotifications = mentionedUsers
        .filter((u: { id: string }) => u.id !== session.user.id)
        .map((mentionedUser: { id: string; username: string }) =>
          notificationService.notifyMention(
            mentionedUser.id,
            comment,
            comment.user,
            mangaTitle
          ).catch((notifyError: unknown) => {
            console.error(`Error notifying ${mentionedUser.username}:`, notifyError);
          })
        );
      await Promise.allSettled(mentionNotifications);
    }

    return NextResponse.json({
      comment: {
        id: comment.id,
        content: comment.content,
        isHidden: comment.isHidden,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        likesCount: 0,
        repliesCount: 0,
        isLikedByUser: false,
        user: {
          id: comment.user.id,
          username: comment.user.username,
          displayName: comment.user.displayName,
          avatarUrl: comment.user.avatarUrl,
          level: comment.user.level,
        },
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creando comentario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/chapters/[id]/comments - Eliminar comentario propio (query param)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chapterId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json(
        { error: 'commentId requerido' },
        { status: 400 }
      );
    }

    // Verificar que el comentario existe y pertenece al usuario
    const comment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        chapterId,
        userId: session.user.id,
      },
      select: { id: true, replies: { select: { id: true } } },
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comentario no encontrado' },
        { status: 404 }
      );
    }

    // Soft delete: marcar como eliminado en lugar de borrar
    await prisma.comment.update({
      where: { id: commentId },
      data: { isDeleted: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando comentario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
