export type FollowingType = 'USER' | 'MANGA';

export interface FollowRecord {
  followerId: string;
  followingId: string;
  followingType: FollowingType;
  createdAt: Date;
  follower?: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

export interface FollowQuery {
  followerId?: string;
  followingId?: string;
  followingType?: FollowingType;
  skip: number;
  limit: number;
}

export interface IFollowRepository {
  findUnique(followerId: string, followingId: string, followingType: FollowingType): Promise<FollowRecord | null>;
  create(data: { followerId: string; followingId: string; followingType: FollowingType }): Promise<void>;
  delete(followerId: string, followingId: string, followingType: FollowingType): Promise<void>;
  findMany(query: FollowQuery): Promise<[FollowRecord[], number]>;
  findFollowingWithUsers(followerId: string, followingType?: FollowingType, skip?: number, limit?: number): Promise<[FollowRecord[], number]>;
  findUser(userId: string): Promise<{ id: string; username: string; displayName: string | null; avatarUrl: string | null } | null>;
  findManga(mangaId: string): Promise<{ id: string; title: string; coverUrl: string | null } | null>;
  countFollowers(followingId: string, followingType: FollowingType): Promise<number>;
  countFollowing(followerId: string, followingType: FollowingType): Promise<number>;
  findFollowingIds(followerId: string): Promise<string[]>;
  findPopularUsers(excludeUserId: string, limit: number): Promise<Array<{ id: string; username: string; displayName: string | null; avatarUrl: string | null }>>;
  findRecommendedIds(followingIds: string[], excludeIds: string[]): Promise<string[]>;
  findUsersByIds(ids: string[]): Promise<Array<{ id: string; username: string; displayName: string | null; avatarUrl: string | null }>>;
  logSecurityEvent(userId: string, action: string, targetId: string, targetType: string, severity: string): Promise<void>;
}
