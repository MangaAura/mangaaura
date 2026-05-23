import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/generated/prisma/client', () => ({
  BanType: { SUSPENSION: 'SUSPENSION', PERMANENT: 'PERMANENT', IP_BAN: 'IP_BAN' },
}));

const mockBanRecordCreate = vi.hoisted(() => vi.fn());
const mockBanRecordUpdate = vi.hoisted(() => vi.fn());
const mockBanRecordFindFirst = vi.hoisted(() => vi.fn());
const mockBanRecordFindMany = vi.hoisted(() => vi.fn());
const mockBanRecordCount = vi.hoisted(() => vi.fn());
const mockUserUpdate = vi.hoisted(() => vi.fn());

vi.mock('@/lib/prisma', () => ({
  prisma: {
    banRecord: {
      create: mockBanRecordCreate,
      update: mockBanRecordUpdate,
      findFirst: mockBanRecordFindFirst,
      findMany: mockBanRecordFindMany,
      count: mockBanRecordCount,
    },
    user: {
      update: mockUserUpdate,
    },
  },
}));

const mockLogSecurityEvent = vi.hoisted(() => vi.fn());
vi.mock('@/lib/security-audit', () => ({
  logSecurityEvent: mockLogSecurityEvent,
}));

import { createBan, liftBan, isUserBanned, bulkCreateBan } from '@/core/services/BanService';

describe('BanService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createBan', () => {
    const baseInput = {
      userId: 'user-1',
      banType: 'PERMANENT' as const,
      reason: 'Spam',
      issuedById: 'admin-1',
    };

    it('creates a PERMANENT BanRecord and updates user role', async () => {
      const now = new Date('2025-01-01T00:00:00Z');
      const createdBan = {
        id: 'ban-1',
        userId: 'user-1',
        banType: 'PERMANENT',
        reason: 'Spam',
        reasonDetail: null,
        ipAddress: null,
        expiresAt: null,
        isActive: true,
        issuedById: 'admin-1',
        issuedAt: now,
        liftedById: null,
        liftedAt: null,
        liftReason: null,
      };
      mockBanRecordCreate.mockResolvedValue(createdBan);
      mockUserUpdate.mockResolvedValue({});

      const result = await createBan(baseInput);

      expect(mockBanRecordCreate).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          banType: 'PERMANENT',
          reason: 'Spam',
          reasonDetail: null,
          ipAddress: null,
          expiresAt: null,
          issuedById: 'admin-1',
        },
      });
      expect(mockUserUpdate).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { role: 'BANNED' },
      });
      expect(result).toEqual(createdBan);
    });

    it('logs security event with CRITICAL severity for PERMANENT ban', async () => {
      const expiresAt = new Date('2025-02-01T00:00:00Z');
      const input = { ...baseInput, banType: 'PERMANENT' as const };
      mockBanRecordCreate.mockResolvedValue({
        id: 'ban-1',
        userId: 'user-1',
        banType: 'PERMANENT',
        reason: 'Spam',
        reasonDetail: null,
        ipAddress: null,
        expiresAt: null,
        isActive: true,
        issuedById: 'admin-1',
        issuedAt: new Date(),
        liftedById: null,
        liftedAt: null,
        liftReason: null,
      });
      mockUserUpdate.mockResolvedValue({});

      await createBan(input);

      expect(mockLogSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_BANNED',
          userId: 'admin-1',
          targetId: 'user-1',
          targetType: 'USER',
          severity: 'CRITICAL',
          metadata: expect.objectContaining({
            banType: 'PERMANENT',
            reason: 'Spam',
          }),
        }),
      );
    });

    it('logs security event with WARNING severity for SUSPENSION ban', async () => {
      const expiresAt = new Date('2025-02-01T00:00:00Z');
      const input = { ...baseInput, banType: 'SUSPENSION' as const, expiresAt };
      mockBanRecordCreate.mockResolvedValue({
        id: 'ban-2',
        userId: 'user-1',
        banType: 'SUSPENSION',
        reason: 'Spam',
        reasonDetail: null,
        ipAddress: null,
        expiresAt,
        isActive: true,
        issuedById: 'admin-1',
        issuedAt: new Date(),
        liftedById: null,
        liftedAt: null,
        liftReason: null,
      });
      mockUserUpdate.mockResolvedValue({});

      await createBan(input);

      expect(mockLogSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'WARNING' }),
      );
    });

    it('throws when SUSPENSION has no expiresAt', async () => {
      const input = { ...baseInput, banType: 'SUSPENSION' as const };

      await expect(createBan(input)).rejects.toThrow('SUSPENSION ban requires an expiry date');

      expect(mockBanRecordCreate).not.toHaveBeenCalled();
      expect(mockUserUpdate).not.toHaveBeenCalled();
    });

    it('creates IP_BAN without userId', async () => {
      const input = {
        banType: 'IP_BAN' as const,
        reason: 'Attack source',
        ipAddress: '192.168.1.1',
        issuedById: 'admin-1',
      };
      mockBanRecordCreate.mockResolvedValue({
        id: 'ban-3',
        userId: null,
        banType: 'IP_BAN',
        reason: 'Attack source',
        reasonDetail: null,
        ipAddress: '192.168.1.1',
        expiresAt: null,
        isActive: true,
        issuedById: 'admin-1',
        issuedAt: new Date(),
        liftedById: null,
        liftedAt: null,
        liftReason: null,
      });

      const result = await createBan(input);

      expect(mockBanRecordCreate).toHaveBeenCalledWith({
        data: {
          userId: null,
          banType: 'IP_BAN',
          reason: 'Attack source',
          reasonDetail: null,
          ipAddress: '192.168.1.1',
          expiresAt: null,
          issuedById: 'admin-1',
        },
      });
      expect(mockUserUpdate).not.toHaveBeenCalled();
      expect(result.banType).toBe('IP_BAN');
    });
  });

  describe('liftBan', () => {
    it('sets isActive to false and restores user role when no other active bans', async () => {
      const liftedBan = {
        id: 'ban-1',
        userId: 'user-1',
        banType: 'PERMANENT',
        reason: 'Spam',
        reasonDetail: null,
        ipAddress: null,
        expiresAt: null,
        isActive: false,
        issuedById: 'admin-1',
        issuedAt: new Date('2025-01-01T00:00:00Z'),
        liftedById: 'admin-2',
        liftedAt: new Date('2025-01-15T00:00:00Z'),
        liftReason: 'Appeal approved',
      };
      mockBanRecordUpdate.mockResolvedValue(liftedBan);
      mockBanRecordCount.mockResolvedValue(0);
      mockUserUpdate.mockResolvedValue({});

      const result = await liftBan('ban-1', 'admin-2', 'Appeal approved');

      expect(mockBanRecordUpdate).toHaveBeenCalledWith({
        where: { id: 'ban-1' },
        data: {
          isActive: false,
          liftedById: 'admin-2',
          liftedAt: expect.any(Date),
          liftReason: 'Appeal approved',
        },
      });
      expect(mockBanRecordCount).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          id: { not: 'ban-1' },
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: expect.any(Date) } },
          ],
        },
      });
      expect(mockUserUpdate).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { role: 'USER' },
      });
      expect(result).toEqual(liftedBan);
    });

    it('does not restore role when other active bans exist', async () => {
      const liftedBan = {
        id: 'ban-1',
        userId: 'user-1',
        banType: 'PERMANENT',
        reason: 'Spam',
        reasonDetail: null,
        ipAddress: null,
        expiresAt: null,
        isActive: false,
        issuedById: 'admin-1',
        issuedAt: new Date('2025-01-01T00:00:00Z'),
        liftedById: 'admin-2',
        liftedAt: new Date('2025-01-15T00:00:00Z'),
        liftReason: null,
      };
      mockBanRecordUpdate.mockResolvedValue(liftedBan);
      mockBanRecordCount.mockResolvedValue(1);

      await liftBan('ban-1', 'admin-2');

      expect(mockUserUpdate).not.toHaveBeenCalled();
    });

    it('logs security event on lift', async () => {
      mockBanRecordUpdate.mockResolvedValue({
        id: 'ban-1',
        userId: 'user-1',
        banType: 'PERMANENT',
        reason: 'Spam',
        reasonDetail: null,
        ipAddress: null,
        expiresAt: null,
        isActive: false,
        issuedById: 'admin-1',
        issuedAt: new Date(),
        liftedById: 'admin-2',
        liftedAt: new Date(),
        liftReason: null,
      });
      mockBanRecordCount.mockResolvedValue(0);
      mockUserUpdate.mockResolvedValue({});

      await liftBan('ban-1', 'admin-2');

      expect(mockLogSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'admin-2',
          action: 'USER_UNBANNED',
          targetId: 'user-1',
          targetType: 'USER',
          severity: 'INFO',
        }),
      );
    });
  });

  describe('isUserBanned', () => {
    it('returns { banned: true, ban } for active bans', async () => {
      const activeBan = {
        id: 'ban-1',
        userId: 'user-1',
        banType: 'PERMANENT',
        reason: 'Spam',
        reasonDetail: null,
        ipAddress: null,
        expiresAt: null,
        isActive: true,
        issuedById: 'admin-1',
        issuedAt: new Date('2025-01-01T00:00:00Z'),
        liftedById: null,
        liftedAt: null,
        liftReason: null,
        issuedBy: { id: 'admin-1', username: 'admin' },
      };
      mockBanRecordFindFirst.mockResolvedValue(activeBan);

      const result = await isUserBanned('user-1');

      expect(result).toEqual({ banned: true, ban: activeBan });
    });

    it('returns { banned: false } when no active ban exists', async () => {
      mockBanRecordFindFirst.mockResolvedValue(null);

      const result = await isUserBanned('user-1');

      expect(result).toEqual({ banned: false });
    });
  });

  describe('bulkCreateBan', () => {
    it('creates multiple bans', async () => {
      const inputs = [
        { userId: 'user-1', banType: 'PERMANENT' as const, reason: 'Spam', issuedById: 'admin-1' },
        { userId: 'user-2', banType: 'SUSPENSION' as const, reason: 'Toxicity', issuedById: 'admin-1', expiresAt: new Date('2025-02-01T00:00:00Z') },
      ];
      mockBanRecordCreate.mockResolvedValueOnce({
        id: 'ban-1', userId: 'user-1', banType: 'PERMANENT', reason: 'Spam',
        reasonDetail: null, ipAddress: null, expiresAt: null, isActive: true,
        issuedById: 'admin-1', issuedAt: new Date(), liftedById: null, liftedAt: null, liftReason: null,
      });
      mockBanRecordCreate.mockResolvedValueOnce({
        id: 'ban-2', userId: 'user-2', banType: 'SUSPENSION', reason: 'Toxicity',
        reasonDetail: null, ipAddress: null, expiresAt: new Date('2025-02-01T00:00:00Z'), isActive: true,
        issuedById: 'admin-1', issuedAt: new Date(), liftedById: null, liftedAt: null, liftReason: null,
      });
      mockUserUpdate.mockResolvedValue({});

      const results = await bulkCreateBan(inputs);

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('ban-1');
      expect(results[1].id).toBe('ban-2');
      expect(mockBanRecordCreate).toHaveBeenCalledTimes(2);
    });
  });
});
