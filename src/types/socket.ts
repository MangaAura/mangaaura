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
  | 'PARTY_STARTED'
  | 'CLAN_INVITE';

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

// ==================== Deprecated Socket Event Stubs (backward compat) ====================

export interface ServerToClientEvents {
  [event: string]: (...args: unknown[]) => void;
}

export interface ClientToServerEvents {
  [event: string]: (...args: unknown[]) => void;
}

export interface InterServerEvents {
  [event: string]: () => void;
}

export interface SocketData {
  [key: string]: unknown;
}

export interface RealtimeAnalytics {
  activeReaders: number;
  activeReadersChange: number;
  activeSessions: Array<{
    userId: string;
    username: string;
    avatarUrl: string | null;
    mangaId?: string;
    mangaTitle?: string;
    chapterNumber?: number;
    currentPage?: number;
    startedAt: Date;
    lastHeartbeat: Date;
  }>;
  popularNow: Array<{
    mangaId: string;
    title: string;
    coverUrl: string | null;
    readers: number;
    slug: string;
  }>;
  readersPerMinute: number;
  peakToday: number;
  peakTime: string;
}
