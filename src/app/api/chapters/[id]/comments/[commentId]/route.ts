import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema para editar comentario
const updateCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

// Palabras prohibidas básicas para moderación
const FORBIDDEN_WORDS = [
  'spam', 'estafa', 'virus', 'phishing',
];

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
  return mentions.map((m: any) => m.substring(1));
}

// GET /api/chapters/[id]/comments/[commentId] - Obtener un comentario específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id: chapterId, commentId } = await params;

    const comment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        chapterId,
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
        },
        _count: {
          select: { 
            replies: { where: { isDeleted: false } },
            likes: true,
          },
        },
      },
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comentario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si el usuario actual dio like
    const session = await auth();
    let isLikedByUser = false;
    
    if (session?.user?.id) {
      const like = await prisma.commentLike.findUnique({
        where: {
          commentId_userId: {
            commentId: comment.id,
            userId: session.user.id,
          },
        },
      });
      isLikedByUser = !!like;
    }

    const transformedComment = {
      id: comment.id,
      content: comment.isHidden ? '[Contenido oculto por moderación]' : comment.content,
      isHidden: comment.isHidden,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      likesCount: comment._count.likes,
      repliesCount: comment._count.replies,
      isLikedByUser,
      isOwner: session?.user?.id === comment.userId,
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
        isLikedByUser: false, // Simplificado para replies
        user: {
          id: reply.user.id,
          username: reply.user.username,
          displayName: reply.user.displayName,
          avatarUrl: reply.user.avatarUrl,
          level: reply.user.level,
        },
      })),
    };

    return NextResponse.json({ comment: transformedComment });
  } catch (error) {
    console.error('Error obteniendo comentario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/chapters/[id]/comments/[commentId] - Editar comentario
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id: chapterId, commentId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = updateCommentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { content } = result.data;

    // Verificar que el comentario existe y pertenece al usuario
    const existingComment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        chapterId,
        userId: session.user.id,
        isDeleted: false,
      },
    });

    if (!existingComment) {
      return NextResponse.json(
        { error: 'Comentario no encontrado o no tienes permiso para editarlo' },
        { status: 404 }
      );
    }

    // Moderación básica
    const moderation = checkModeration(content);
    if (!moderation.isClean) {
      return NextResponse.json(
        { error: 'Tu comentario contiene palabras no permitidas', flaggedWords: moderation.flaggedWords },
        { status: 400 }
      );
    }

    // Actualizar comentario
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content,
        updatedAt: new Date(),
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

    // Procesar menciones nuevas
    const mentions = extractMentions(content);
    if (mentions.length > 0) {
      const mentionedUsers = await prisma.user.findMany({
        where: { username: { in: mentions } },
        select: { id: true, username: true },
      });

      // Crear registros de mención para usuarios no mencionados previamente
      const existingMentions = await prisma.commentMention.findMany({
        where: { commentId },
        select: { mentionedUserId: true },
      });
      const existingMentionIds = new Set(existingMentions.map((m: any) => m.mentionedUserId));

      const newMentions = mentionedUsers.filter((u: any) => !existingMentionIds.has(u.id));
      
      if (newMentions.length > 0) {
        await prisma.commentMention.createMany({
          data: newMentions.map((user: any) => ({
            commentId: commentId,
            mentionedUserId: user.id,
          })),
        });
      }
    }

    // Verificar si el usuario actual dio like
    const like = await prisma.commentLike.findUnique({
      where: {
        commentId_userId: {
          commentId: updatedComment.id,
          userId: session.user.id,
        },
      },
    });

    return NextResponse.json({
      comment: {
        id: updatedComment.id,
        content: updatedComment.content,
        isHidden: updatedComment.isHidden,
        createdAt: updatedComment.createdAt,
        updatedAt: updatedComment.updatedAt,
        likesCount: updatedComment._count.likes,
        repliesCount: updatedComment._count.replies,
        isLikedByUser: !!like,
        user: {
          id: updatedComment.user.id,
          username: updatedComment.user.username,
          displayName: updatedComment.user.displayName,
          avatarUrl: updatedComment.user.avatarUrl,
          level: updatedComment.user.level,
        },
      },
    });
  } catch (error) {
    console.error('Error editando comentario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/chapters/[id]/comments/[commentId] - Eliminar comentario
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id: chapterId, commentId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
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
        { error: 'Comentario no encontrado o no tienes permiso para eliminarlo' },
        { status: 404 }
      );
    }

    // Soft delete: marcar como eliminado
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
