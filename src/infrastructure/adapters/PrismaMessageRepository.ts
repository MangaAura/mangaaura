import { PrismaClient } from '@/generated/prisma/client';

import type {
  IMessageRepository,
  ConversationRecord,
  MessageRecord,
} from '@/core/services/IMessageRepository';
import { logSecurityEvent, SecurityAction, Severity } from '@/lib/security-audit';

export class PrismaMessageRepository implements IMessageRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findConversationByParticipants(participant1Id: string, participant2Id: string): Promise<ConversationRecord | null> {
    const [user1, user2] = [participant1Id, participant2Id].sort();
    const conversation = await this.prisma.conversation.findUnique({
      where: { participant1Id_participant2Id: { participant1Id: user1, participant2Id: user2 } },
      include: {
        participant1: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        participant2: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        messages: {
          where: { senderId: { not: participant1Id }, isRead: false },
          select: { id: true },
        },
      },
    });
    return conversation as unknown as ConversationRecord | null;
  }

  async createConversation(participant1Id: string, participant2Id: string): Promise<ConversationRecord> {
    const [user1, user2] = [participant1Id, participant2Id].sort();
    const conversation = await this.prisma.conversation.create({
      data: { participant1Id: user1, participant2Id: user2 },
      include: {
        participant1: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        participant2: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        messages: { select: { id: true } },
      },
    });
    return conversation as unknown as ConversationRecord;
  }

  async findConversationForUser(conversationId: string, userId: string): Promise<ConversationRecord | null> {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ participant1Id: userId }, { participant2Id: userId }],
      },
    });
    return conversation as unknown as ConversationRecord | null;
  }

  async createMessage(conversationId: string, senderId: string, content: string): Promise<MessageRecord> {
    const message = await this.prisma.directMessage.create({
      data: { conversationId, senderId, content: content.trim().substring(0, 2000) },
    });
    return message as unknown as MessageRecord;
  }

  async updateConversationLastMessage(conversationId: string): Promise<void> {
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });
  }

  async createNotification(userId: string, type: string, title: string, message: string, data: string): Promise<void> {
    await this.prisma.notification.create({
      data: { userId, type, title, message, data },
    });
  }

  async findMessagesByConversation(conversationId: string, skip: number, limit: number): Promise<[MessageRecord[], number]> {
    const [messages, total] = await Promise.all([
      this.prisma.directMessage.findMany({
        where: { conversationId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        },
      }),
      this.prisma.directMessage.count({ where: { conversationId } }),
    ]);
    return [messages as unknown as MessageRecord[], total];
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    await this.prisma.directMessage.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async findConversationsForUser(userId: string, skip: number, limit: number): Promise<[ConversationRecord[], number]> {
    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where: { OR: [{ participant1Id: userId }, { participant2Id: userId }] },
        skip,
        take: limit,
        orderBy: { lastMessageAt: 'desc' },
        include: {
          participant1: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          participant2: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          messages: {
            where: { senderId: { not: userId }, isRead: false },
            select: { id: true },
          },
        },
      }),
      this.prisma.conversation.count({
        where: { OR: [{ participant1Id: userId }, { participant2Id: userId }] },
      }),
    ]);
    return [conversations as unknown as ConversationRecord[], total];
  }

  async toggleBlockConversation(conversationId: string, isBlocked: boolean, blockedBy: string | null): Promise<void> {
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { isBlocked, blockedBy },
    });
  }

  async countUnreadMessages(userId: string): Promise<number> {
    return this.prisma.directMessage.count({
      where: {
        conversation: {
          OR: [{ participant1Id: userId }, { participant2Id: userId }],
        },
        senderId: { not: userId },
        isRead: false,
      },
    });
  }

  async logSecurityEvent(userId: string, action: string, targetId: string, targetType: string, severity: string): Promise<void> {
    await logSecurityEvent({ userId, action: action as SecurityAction, targetId, targetType: targetType as 'USER' | 'MANGA' | 'CHAPTER' | 'COMMENT' | 'REPORT', severity: severity as Severity });
  }
}
