/**
 * Socket Types for Party Reading
 */

// ==================== Party Types ====================

export interface PartyMember {
  userId: string;
  username: string;
  avatarUrl?: string;
  currentPage: number;
  isHost: boolean;
  isOnline: boolean;
  socketId?: string;
  joinedAt: Date;
  lastSeen: Date;
}

export interface PartyState {
  partyId: string;
  mangaId: string;
  chapterId: string;
  hostId: string;
  members: PartyMember[];
  currentPage: number;
  isReading: boolean;
  startedAt: Date;
  lastActivity: Date;
  maxMembers: number;
}

export interface PartyMessage {
  id: string;
  partyId: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  content: string;
  type: 'chat' | 'system';
  createdAt: Date;
}

export interface CursorPosition {
  userId: string;
  username: string;
  x: number;
  y: number;
  page: number;
}

export interface Reaction {
  id: string;
  userId: string;
  username: string;
  reaction: string;
  page: number;
  createdAt: Date;
}

// ==================== Socket Events ====================

// Client to Server Events
export interface PartyClientToServerEvents {
  'party:join': (data: { partyId: string; user: JoinPartyUser }) => void;
  'party:leave': (data: { partyId: string }) => void;
  'party:page-change': (data: { partyId: string; page: number }) => void;
  'party:cursor-move': (data: { partyId: string; position: CursorPosition }) => void;
  'party:reaction': (data: { partyId: string; reaction: string; page: number }) => void;
  'party:message': (data: { partyId: string; content: string }) => void;
  'party:typing': (data: { partyId: string; isTyping: boolean }) => void;
  'party:become-host': (data: { partyId: string }) => void;
  'party:follow-host': (data: { partyId: string; follow: boolean }) => void;
}

// Server to Client Events
export interface PartyServerToClientEvents {
  'party:joined': (data: { party: PartyState; member: PartyMember }) => void;
  'party:left': (data: { userId: string; username: string }) => void;
  'party:member-joined': (data: { member: PartyMember }) => void;
  'party:member-left': (data: { userId: string }) => void;
  'party:member-updated': (data: { member: PartyMember }) => void;
  'party:page-sync': (data: { page: number; hostId: string }) => void;
  'party:cursor-update': (data: { userId: string; position: CursorPosition }) => void;
  'party:reaction-received': (data: Reaction) => void;
  'party:message-received': (data: PartyMessage) => void;
  'party:typing-update': (data: { userId: string; username: string; isTyping: boolean }) => void;
  'party:host-changed': (data: { newHostId: string; newHostName: string }) => void;
  'party:error': (data: { message: string }) => void;
  'party:state': (data: PartyState) => void;
  'party:closed': (data: { reason: string }) => void;
}

// Join Party User Data
export interface JoinPartyUser {
  userId: string;
  username: string;
  avatarUrl?: string;
}

// ==================== Notification Types (Existing) ====================

export type NotificationType =
  | 'NEW_CHAPTER'
  | 'NEW_COMMENT'
  | 'NEW_LIKE'
  | 'MENTION'
  | 'SYSTEM'
  | 'FOLLOW'
  | 'PARTY_INVITE'
  | 'PARTY_STARTED';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  metadata?: {
    mangaId?: string;
    chapterId?: string;
    commentId?: string;
    actorId?: string;
    actorName?: string;
    actorAvatar?: string;
    partyId?: string;
  };
  isRead: boolean;
  createdAt: Date;
}

// ==================== Combined Events ====================

export interface ServerToClientEvents extends PartyServerToClientEvents {
  'notification:new': (notification: Notification) => void;
  'notification:read': (notificationId: string) => void;
  'notification:count': (count: number) => void;
  'user:online': (userId: string) => void;
  'user:offline': (userId: string) => void;
}

export interface ClientToServerEvents extends PartyClientToServerEvents {
  'notification:mark-read': (notificationId: string) => void;
  'notification:mark-all-read': () => void;
  'user:join-room': (room: string) => void;
  'user:leave-room': (room: string) => void;
  'ping': () => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId?: string;
  username?: string;
  avatarUrl?: string;
}
