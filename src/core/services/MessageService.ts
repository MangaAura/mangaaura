import type { IMessageRepository } from './IMessageRepository';

export class MessageService {
  constructor(private readonly repo: IMessageRepository) {}

  async getOrCreateConversation(params: {
    participant1Id: string;
    participant2Id: string;
  }): Promise<{
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
      const [user1, user2] = [params.participant1Id, params.participant2Id].sort();
      let conversation = await this.repo.findConversationByParticipants(user1, user2);

      if (!conversation) {
        conversation = await this.repo.createConversation(user1, user2);
      }

      if (conversation.isBlocked) {
        return { success: false, error: 'No puedes enviar mensajes a este usuario' };
      }

      const otherParticipant =
        conversation.participant1Id === params.participant1Id
          ? conversation.participant2
          : conversation.participant1;

      return {
        success: true,
        conversation: {
          id: conversation.id,
          participant: otherParticipant!,
          lastMessageAt: conversation.lastMessageAt,
          unreadCount: conversation.messages?.length ?? 0,
        },
      };
    } catch (error) {
      console.error('Error creating conversation:', error);
      return { success: false, error: 'Error al crear conversación' };
    }
  }

  async sendMessage(params: {
    conversationId: string;
    senderId: string;
    content: string;
  }): Promise<{
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
      const conversation = await this.repo.findConversationForUser(
        params.conversationId, params.senderId
      );
      if (!conversation) {
        return { success: false, error: 'Conversación no encontrada' };
      }
      if (conversation.isBlocked) {
        return { success: false, error: 'Conversación bloqueada' };
      }

      const message = await this.repo.createMessage(
        params.conversationId, params.senderId, params.content
      );

      await this.repo.updateConversationLastMessage(params.conversationId);

      const recipientId =
        conversation.participant1Id === params.senderId
          ? conversation.participant2Id
          : conversation.participant1Id;

      await this.repo.createNotification(
        recipientId,
        'DIRECT_MESSAGE',
        'Nuevo mensaje',
        'Tienes un nuevo mensaje privado',
        JSON.stringify({ conversationId: params.conversationId, senderId: params.senderId })
      );

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

  async getMessages(params: {
    conversationId: string;
    userId: string;
    page?: number;
    limit?: number;
  }): Promise<{
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
      const conversation = await this.repo.findConversationForUser(
        params.conversationId, params.userId
      );
      if (!conversation) {
        return { success: false, error: 'Conversación no encontrada' };
      }

      const page = params.page ?? 1;
      const limit = params.limit ?? 50;
      const skip = (page - 1) * limit;

      const [messages, total] = await this.repo.findMessagesByConversation(
        params.conversationId, skip, limit
      );

      await this.repo.markMessagesAsRead(params.conversationId, params.userId);

      return {
        success: true,
        messages: messages.reverse() as any,
        total,
      };
    } catch (error) {
      console.error('Error getting messages:', error);
      return { success: false, error: 'Error al obtener mensajes' };
    }
  }

  async getConversations(params: {
    userId: string;
    page?: number;
    limit?: number;
  }): Promise<{
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
      const page = params.page ?? 1;
      const limit = params.limit ?? 20;
      const skip = (page - 1) * limit;

      const [conversations, total] = await this.repo.findConversationsForUser(
        params.userId, skip, limit
      );

      const formatted = conversations.map(conv => {
        const otherParticipant =
          conv.participant1Id === params.userId ? conv.participant2 : conv.participant1;
        return {
          id: conv.id,
          participant: otherParticipant!,
          lastMessageAt: conv.lastMessageAt,
          unreadCount: conv.messages?.length ?? 0,
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

  async toggleBlock(params: {
    conversationId: string;
    userId: string;
  }): Promise<{
    success: boolean;
    isBlocked?: boolean;
    error?: string;
  }> {
    try {
      const conversation = await this.repo.findConversationForUser(
        params.conversationId, params.userId
      );
      if (!conversation) {
        return { success: false, error: 'Conversación no encontrada' };
      }

      const newBlockStatus = !conversation.isBlocked;
      await this.repo.toggleBlockConversation(
        params.conversationId,
        newBlockStatus,
        newBlockStatus ? params.userId : null
      );

      await this.repo.logSecurityEvent(
        params.userId,
        newBlockStatus ? 'BLOCKED_USER' : 'UNBLOCKED_USER',
        params.conversationId,
        'USER',
        'INFO'
      );

      return { success: true, isBlocked: newBlockStatus };
    } catch (error) {
      console.error('Error blocking conversation:', error);
      return { success: false, error: 'Error al bloquear conversación' };
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      return this.repo.countUnreadMessages(userId);
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }
}

export let messageService: MessageService | undefined;

export function initializeMessageService(repo: IMessageRepository): MessageService {
  const service = new MessageService(repo);
  messageService = service;
  return service;
}

function getService(): MessageService {
  if (!messageService) {
    throw new Error('MessageService not initialized. Call initializeMessageService(repo) first.');
  }
  return messageService;
}

export async function getOrCreateConversation(params: {
  participant1Id: string;
  participant2Id: string;
}): Promise<{
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
  return getService().getOrCreateConversation(params);
}

export async function sendMessage(params: {
  conversationId: string;
  senderId: string;
  content: string;
}): Promise<{
  success: boolean;
  message?: {
    id: string;
    content: string;
    senderId: string;
    createdAt: Date;
  };
  error?: string;
}> {
  return getService().sendMessage(params);
}

export async function getMessages(params: {
  conversationId: string;
  userId: string;
  page?: number;
  limit?: number;
}): Promise<{
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
  return getService().getMessages(params);
}

export async function getConversations(params: {
  userId: string;
  page?: number;
  limit?: number;
}): Promise<{
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
  return getService().getConversations(params);
}

export async function toggleBlockConversation(params: {
  conversationId: string;
  userId: string;
}): Promise<{
  success: boolean;
  isBlocked?: boolean;
  error?: string;
}> {
  return getService().toggleBlock(params);
}

export async function getUnreadCount(userId: string): Promise<number> {
  return getService().getUnreadCount(userId);
}

export default MessageService;
