import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { User, UserProps } from '@/core/entities/User';
import { UserRepository } from '@/core/repositories/UserRepository';
import { Email } from '@/core/value-objects/Email';
import { Password } from '@/core/value-objects/Password';
import { prisma as defaultPrisma } from '@/lib/prisma';

export class PrismaUserRepository implements UserRepository {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || defaultPrisma;
  }

  async findById(id: string): Promise<User | null> {
    const dbUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!dbUser) return null;

    return this.mapToDomain(dbUser);
  }

  async findByEmail(email: string): Promise<User | null> {
    const dbUser = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!dbUser) return null;

    return this.mapToDomain(dbUser);
  }

  async findByUsername(username: string): Promise<User | null> {
    const dbUser = await this.prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (!dbUser) return null;

    return this.mapToDomain(dbUser);
  }

  async save(user: User): Promise<void> {
    const json = user.toJSON();

    await this.prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: json.email as string,
        username: json.username as string,
        displayName: json.displayName as string | undefined,
        avatarUrl: json.avatarUrl as string | undefined,
        xpPoints: json.xpPoints as number,
        inkcoinsBalance: json.inkcoinsBalance as number,
        level: json.level as number,
        readingStreak: json.readingStreak as number,
        lastReadAt: json.lastReadAt ? new Date(json.lastReadAt as string) : undefined,
        updatedAt: new Date(),
      },
      create: {
        id: user.id,
        email: json.email as string,
        username: json.username as string,
        displayName: json.displayName as string | undefined,
        avatarUrl: json.avatarUrl as string | undefined,
        passwordHash: user.passwordHash,
        emailVerified: json.emailVerified
          ? new Date(json.emailVerified as string)
          : undefined,
        role: json.role as string,
        xpPoints: json.xpPoints as number,
        inkcoinsBalance: json.inkcoinsBalance as number,
        level: json.level as number,
        readingStreak: json.readingStreak as number,
        lastReadAt: json.lastReadAt ? new Date(json.lastReadAt as string) : undefined,
        createdAt: new Date(json.createdAt as string),
        updatedAt: new Date(json.updatedAt as string),
      },
    });
  }

  async createWithPassword(
    email: Email,
    username: string,
    password: string
  ): Promise<User> {
    const passwordObj = Password.createFromPlain(password);
    const { user } = User.registerWithEmail(
      email,
      username,
      passwordObj
    );

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Guardar en DB
    await this.prisma.user.create({
      data: {
        id: user.id,
        email: user.email.value,
        username: user.username,
        passwordHash: hashedPassword,
        xpPoints: 0,
        inkcoinsBalance: 50, // Bonus de registro
        level: 1,
        readingStreak: 0,
      },
    });

    return user;
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });
  }

  async updateXP(userId: string, xpPoints: number): Promise<void> {
    const level = Math.floor(xpPoints / 1000) + 1;

    await this.prisma.user.update({
      where: { id: userId },
      data: { xpPoints, level },
    });
  }

  async updateInkCoins(userId: string, balance: number): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { inkcoinsBalance: balance },
    });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email: email.toLowerCase() },
    });
    return count > 0;
  }

  async existsByUsername(username: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { username: username.toLowerCase() },
    });
    return count > 0;
  }

  async getLeaderboard(limit: number = 10): Promise<User[]> {
    const dbUsers = await this.prisma.user.findMany({
      orderBy: { xpPoints: 'desc' },
      take: limit,
    });

    return dbUsers.map((u: any) => this.mapToDomain(u));
  }

  async findByIds(ids: string[]): Promise<User[]> {
    const dbUsers = await this.prisma.user.findMany({
      where: { id: { in: ids } },
    });

    return dbUsers.map((u: any) => this.mapToDomain(u));
  }

  async count(): Promise<number> {
    return this.prisma.user.count();
  }

  // Método auxiliar para mapear de Prisma a Domain
  private mapToDomain(dbUser: {
    id: string;
    email: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    passwordHash: string | null;
    emailVerified: Date | null;
    role: string;
    xpPoints: number;
    inkcoinsBalance: number;
    level: number;
    readingStreak: number;
    lastReadAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return User.create({
      id: dbUser.id,
      email: Email.create(dbUser.email),
      username: dbUser.username,
      displayName: dbUser.displayName || undefined,
      avatarUrl: dbUser.avatarUrl || undefined,
      passwordHash: dbUser.passwordHash || undefined,
      emailVerified: dbUser.emailVerified || undefined,
      role: dbUser.role as UserProps['role'],
      xpPoints: dbUser.xpPoints,
      inkcoinsBalance: dbUser.inkcoinsBalance,
      readingStreak: dbUser.readingStreak,
      lastReadAt: dbUser.lastReadAt || undefined,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt,
    });
  }
}
