import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaUserRepository } from '@/infrastructure/persistence/postgres/PrismaUserRepository';
import { User } from '@/core/entities/User';
import { Email } from '@/core/value-objects/Email';

// Mock de Prisma para tests sin DB real
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    count: vi.fn(),
    findMany: vi.fn(),
  },
};

describe('PrismaUserRepository Integration', () => {
  let repository: PrismaUserRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaUserRepository();
    // Sustituir prisma por mock
    (repository as any).prisma = mockPrisma;
  });

  describe('findById', () => {
    it('debe retornar usuario si existe', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@test.com',
        username: 'testuser',
        displayName: 'Test User',
        avatarUrl: null,
        passwordHash: 'hashed',
        emailVerified: null,
        role: 'USER',
        xpPoints: 100,
        inkcoinsBalance: 50,
        level: 1,
        readingStreak: 5,
        lastReadAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const user = await repository.findById('user-123');

      expect(user).not.toBeNull();
      expect(user?.email.value).toBe('test@test.com');
      expect(user?.username).toBe('testuser');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });

    it('debe retornar null si usuario no existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const user = await repository.findById('non-existent');

      expect(user).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('debe buscar por email en minúsculas', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await repository.findByEmail('Test@Test.COM');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@test.com' },
      });
    });
  });

  describe('save', () => {
    it('debe crear usuario si no existe', async () => {
      const user = User.create({
        id: 'new-user',
        email: Email.create('new@test.com'),
        username: 'newuser',
        xpPoints: 0,
        inkcoinsBalance: 50,
      });

      mockPrisma.user.upsert.mockResolvedValue({});

      await repository.save(user);

      expect(mockPrisma.user.upsert).toHaveBeenCalled();
      const call = mockPrisma.user.upsert.mock.calls[0][0];
      expect(call.where.id).toBe('new-user');
      expect(call.create.email).toBe('new@test.com');
    });

    it('debe actualizar usuario si existe', async () => {
      const user = User.create({
        id: 'existing-user',
        email: Email.create('update@test.com'),
        username: 'updateuser',
        xpPoints: 500,
        inkcoinsBalance: 100,
      });

      mockPrisma.user.upsert.mockResolvedValue({});

      await repository.save(user);

      const call = mockPrisma.user.upsert.mock.calls[0][0];
      expect(call.update.xpPoints).toBe(500);
      expect(call.update.inkcoinsBalance).toBe(100);
    });
  });

  describe('existsByEmail', () => {
    it('debe retornar true si email existe', async () => {
      mockPrisma.user.count.mockResolvedValue(1);

      const exists = await repository.existsByEmail('exists@test.com');

      expect(exists).toBe(true);
    });

    it('debe retornar false si email no existe', async () => {
      mockPrisma.user.count.mockResolvedValue(0);

      const exists = await repository.existsByEmail('notexists@test.com');

      expect(exists).toBe(false);
    });
  });

  describe('getLeaderboard', () => {
    it('debe retornar usuarios ordenados por XP', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'first@test.com',
          username: 'first',
          displayName: null,
          avatarUrl: null,
          passwordHash: null,
          emailVerified: null,
          role: 'USER',
          xpPoints: 5000,
          inkcoinsBalance: 100,
          level: 6,
          readingStreak: 10,
          lastReadAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'user-2',
          email: 'second@test.com',
          username: 'second',
          displayName: null,
          avatarUrl: null,
          passwordHash: null,
          emailVerified: null,
          role: 'USER',
          xpPoints: 3000,
          inkcoinsBalance: 50,
          level: 4,
          readingStreak: 5,
          lastReadAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const leaderboard = await repository.getLeaderboard(10);

      expect(leaderboard).toHaveLength(2);
      expect(leaderboard[0].xp.amount).toBe(5000);
      expect(leaderboard[1].xp.amount).toBe(3000);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        orderBy: { xpPoints: 'desc' },
        take: 10,
      });
    });
  });

  describe('updateXP', () => {
    it('debe actualizar XP y calcular nivel', async () => {
      mockPrisma.user.update.mockResolvedValue({});

      await repository.updateXP('user-123', 5500);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { xpPoints: 5500, level: 6 },
      });
    });
  });
});
