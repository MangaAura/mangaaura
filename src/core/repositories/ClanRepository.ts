import { Clan } from '../entities/Clan';

export interface ClanFilters {
  name?: string;
  page?: number;
  limit?: number;
  orderBy?: 'totalScore' | 'monthlyScore' | 'createdAt' | 'name';
  orderDirection?: 'asc' | 'desc';
}

export interface ClanRepository {
  findById(id: string): Promise<Clan | null>;
  findByName(name: string): Promise<Clan | null>;
  findAll(filters?: ClanFilters): Promise<Clan[]>;
  save(clan: Clan): Promise<void>;
  delete(id: string): Promise<void>;
  existsByName(name: string): Promise<boolean>;
  getLeaderboard(limit?: number): Promise<Clan[]>;
  findUserClan(userId: string): Promise<Clan | null>;
  resetMonthlyScores(): Promise<void>;
}