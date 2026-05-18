export interface ConversationRecord {
  id: string;
  participant1Id: string;
  participant2Id: string;
  isBlocked: boolean;
  blockedBy: string | null;
  lastMessageAt: Date;
  createdAt: Date;
  participant1?: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  participant2?: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  messages?: Array<{ id: string }>;
}

export interface MessageRecord {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
  sender?: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

export interface IMessageRepository {
  findConversationByParticipants(participant1Id: string, participant2Id: string): Promise<ConversationRecord | null>;
  createConversation(participant1Id: string, participant2Id: string): Promise<ConversationRecord>;
  findConversationForUser(conversationId: string, userId: string): Promise<ConversationRecord | null>;
  createMessage(conversationId: string, senderId: string, content: string): Promise<MessageRecord>;
  updateConversationLastMessage(conversationId: string): Promise<void>;
  createNotification(userId: string, type: string, title: string, message: string, data: string): Promise<void>;
  findMessagesByConversation(conversationId: string, skip: number, limit: number): Promise<[MessageRecord[], number]>;
  markMessagesAsRead(conversationId: string, userId: string): Promise<void>;
  findConversationsForUser(userId: string, skip: number, limit: number): Promise<[ConversationRecord[], number]>;
  toggleBlockConversation(conversationId: string, isBlocked: boolean, blockedBy: string | null): Promise<void>;
  countUnreadMessages(userId: string): Promise<number>;
  logSecurityEvent(userId: string, action: string, targetId: string, targetType: string, severity: string): Promise<void>;
}
