import { prisma } from '@/lib/prisma';
import { notificationService } from './NotificationService';
import { logSecurityEvent } from '@/lib/security-audit';

interface CreateConversationParams {
  participant1Id: string;
  participant2Id: string;
}

interface SendMessageParams {
  conversationId: string;
  senderId: string;
  content: string;
}

interface GetMessagesParams {
  conversationId: string;
  userId: string;
  page?: number;
  limit?: number;
}

interface GetConversationsParams {
  userId: string;
  page?: number;
  limit?: number;
}

/**
 * Create or get existing conversation between two users
 */
export async function getOrCreateConversation({
  participant1Id,
  participant2Id,
}: CreateConversationParams): Promise<{
  success: boolean;
  conversation?: {
    id: string;
    participant: {
      id: string;
      username: string;
      displayName: string | null;
      avatarUrl: string | null;
    };
    lastMessageAt: Date;
    unreadCount: number;
  };
  error?: string;
}> {
  try {
    // Ensure consistent ordering
    const [user1, user2] = [participant1Id, participant2Id].sort();

    // Check if conversation exists
    let conversation = await prisma.conversation.findUnique({
      where: {
        participant1Id_participant2Id: {
          participant1Id: user1,
          participant2Id: user2,
        },
      },
      include: {
        participant1: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        participant2: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        messages: {
          where: {
            senderId: { not: participant1Id },
            isRead: false,
          },
          select: { id: true },
        },
      },
    });

    if (!conversation) {
      // Create new conversation
      conversation = await prisma.conversation.create({
        data: {
          participant1Id: user1,
          participant2Id: user2,
        },
        include: {
          participant1: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          participant2: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          messages: {
            select: { id: true },
          },
        },
      });
    }

    // Check if blocked
    if (conversation.isBlocked) {
      return {
        success: false,
        error: 'No puedes enviar mensajes a este usuario',
      };
    }

    const otherParticipant =
      conversation.participant1Id === participant1Id
        ? conversation.participant2
        : conversation.participant1;

    return {
      success: true,
      conversation: {
        id: conversation.id,
        participant: otherParticipant,
        lastMessageAt: conversation.lastMessageAt,
        unreadCount: conversation.messages.length,
      },
    };
  } catch (error) {
    console.error('Error creating conversation:', error);
    return { success: false, error: 'Error al crear conversación' };
  }
}

/**
 * Send a message in a conversation
 */
export async function sendMessage({
  conversationId,
  senderId,
  content,
}: SendMessageParams): Promise<{
  success: boolean;
  message?: {
    id: string;
    content: string;
    senderId: string;
    createdAt: Date;
  };
  error?: string;
}> {
  try {
    // Verify conversation exists and user is participant
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ participant1Id: senderId }, { participant2Id: senderId }],
      },
    });

    if (!conversation) {
      return { success: false, error: 'Conversación no encontrada' };
    }

    if (conversation.isBlocked) {
      return { success: false, error: 'Conversación bloqueada' };
    }

    // Create message
    const message = await prisma.directMessage.create({
      data: {
        conversationId,
        senderId,
        content: content.trim().substring(0, 2000),
      },
    });

    // Update conversation lastMessageAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    // Get recipient for notification
    const recipientId =
      conversation.participant1Id === senderId
        ? conversation.participant2Id
        : conversation.participant1Id;

    // Create notification
    await prisma.notification.create({
      data: {
        userId: recipientId,
        type: 'DIRECT_MESSAGE',
        title: 'Nuevo mensaje',
        message: `Tienes un nuevo mensaje privado`,
        data: JSON.stringify({
          conversationId,
          senderId,
        }),
      },
    });

    return {
      success: true,
      message: {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        createdAt: message.createdAt,
      },
    };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error: 'Error al enviar mensaje' };
  }
}

/**
 * Get messages in a conversation
 */
export async function getMessages({
  conversationId,
  userId,
  page = 1,
  limit = 50,
}: GetMessagesParams): Promise<{
  success: boolean;
  messages?: Array<{
    id: string;
    content: string;
    senderId: string;
    sender: {
      id: string;
      username: string;
      displayName: string | null;
      avatarUrl: string | null;
    };
    isRead: boolean;
    createdAt: Date;
  }>;
  total?: number;
  error?: string;
}> {
  try {
    // Verify user is participant
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ participant1Id: userId }, { participant2Id: userId }],
      },
    });

    if (!conversation) {
      return { success: false, error: 'Conversación no encontrada' };
    }

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      prisma.directMessage.findMany({
        where: { conversationId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.directMessage.count({ where: { conversationId } }),
    ]);

    // Mark messages as read
    await prisma.directMessage.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true, readAt: new Date() },
    });

    return {
      success: true,
      messages: messages.reverse(), // Return in chronological order
      total,
    };
  } catch (error) {
    console.error('Error getting messages:', error);
    return { success: false, error: 'Error al obtener mensajes' };
  }
}

/**
 * Get user's conversations
 */
export async function getConversations({
  userId,
  page = 1,
  limit = 20,
}: GetConversationsParams): Promise<{
  success: boolean;
  conversations?: Array<{
    id: string;
    participant: {
      id: string;
      username: string;
      displayName: string | null;
      avatarUrl: string | null;
    };
    lastMessageAt: Date;
    unreadCount: number;
    isBlocked: boolean;
  }>;
  total?: number;
  error?: string;
}> {
  try {
    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where: {
          OR: [{ participant1Id: userId }, { participant2Id: userId }],
        },
        skip,
        take: limit,
        orderBy: { lastMessageAt: 'desc' },
        include: {
          participant1: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          participant2: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          messages: {
            where: {
              senderId: { not: userId },
              isRead: false,
            },
            select: { id: true },
          },
        },
      }),
      prisma.conversation.count({
        where: {
          OR: [{ participant1Id: userId }, { participant2Id: userId }],
        },
      }),
    ]);

    const formatted = conversations.map((conv: any) => {
      const otherParticipant =
        conv.participant1Id === userId ? conv.participant2 : conv.participant1;

      return {
        id: conv.id,
        participant: otherParticipant,
        lastMessageAt: conv.lastMessageAt,
        unreadCount: conv.messages.length,
        isBlocked: conv.isBlocked,
      };
    });

    return {
      success: true,
      conversations: formatted,
      total,
    };
  } catch (error) {
    console.error('Error getting conversations:', error);
    return { success: false, error: 'Error al obtener conversaciones' };
  }
}

/**
 * Block/unblock conversation
 */
export async function toggleBlockConversation({
  conversationId,
  userId,
}: {
  conversationId: string;
  userId: string;
}): Promise<{
  success: boolean;
  isBlocked?: boolean;
  error?: string;
}> {
  try {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ participant1Id: userId }, { participant2Id: userId }],
      },
    });

    if (!conversation) {
      return { success: false, error: 'Conversación no encontrada' };
    }

    const newBlockStatus = !conversation.isBlocked;

    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        isBlocked: newBlockStatus,
        blockedBy: newBlockStatus ? userId : null,
      },
    });

    // Log security event
    await logSecurityEvent({
      userId,
      action: newBlockStatus ? 'BLOCKED_USER' : 'UNBLOCKED_USER',
      targetId: conversationId,
      targetType: 'USER',
      severity: 'INFO',
    });

    return { success: true, isBlocked: newBlockStatus };
  } catch (error) {
    console.error('Error blocking conversation:', error);
    return { success: false, error: 'Error al bloquear conversación' };
  }
}

/**
 * Get unread message count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const count = await prisma.directMessage.count({
      where: {
        conversation: {
          OR: [{ participant1Id: userId }, { participant2Id: userId }],
        },
        senderId: { not: userId },
        isRead: false,
      },
    });

    return count;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}
