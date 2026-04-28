import { User } from '../entities/User';
import { Email } from '../value-objects/Email';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  save(user: User): Promise<void>;
  createWithPassword(email: Email, username: string, password: string): Promise<User>;
  updatePassword(userId: string, newPassword: string): Promise<void>;
  updateXP(userId: string, xpPoints: number): Promise<void>;
  updateInkCoins(userId: string, balance: number): Promise<void>;
  existsByEmail(email: string): Promise<boolean>;
  existsByUsername(username: string): Promise<boolean>;
  getLeaderboard(limit?: number): Promise<User[]>;
  findByIds(ids: string[]): Promise<User[]>;
  count(): Promise<number>;
}
